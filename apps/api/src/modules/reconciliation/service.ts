import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { updateReconciliationMetric } from "../../lib/metrics.js";

const ZERO = new Prisma.Decimal(0);

export type ReconciliationCheck = {
  check: string;
  status: "ok" | "warning" | "critical";
  summary: string;
  driftAmount: string;
  details?: unknown;
};

export type ReconciliationReport = {
  generatedAt: Date;
  summary: {
    status: "ok" | "warning" | "critical";
    totalChecks: number;
    warnings: number;
    criticals: number;
  };
  checks: ReconciliationCheck[];
};

export interface ReconciliationServiceContract {
  generateReport(): Promise<ReconciliationReport>;
}

const decimalToFixed = (value: Prisma.Decimal | number | string) =>
  (value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)).toFixed(4);

const getSeverityRank = (status: "ok" | "warning" | "critical") => {
  if (status === "critical") {
    return 2;
  }

  if (status === "warning") {
    return 1;
  }

  return 0;
};

export class ReconciliationService implements ReconciliationServiceContract {
  async generateReport(): Promise<ReconciliationReport> {
    const generatedAt = new Date();
    const checks = await Promise.all([
      this.checkLedgerBalanced(),
      this.checkReservedCollateralCoverage(),
      this.checkOverdueMarkets(generatedAt),
      this.checkAgedPendingPayments(generatedAt),
    ]);

    for (const check of checks) {
      updateReconciliationMetric({
        check: check.check,
        status: check.status,
        driftAmount: Number.parseFloat(check.driftAmount),
      });
    }

    const warnings = checks.filter((check) => check.status === "warning").length;
    const criticals = checks.filter((check) => check.status === "critical").length;
    const overallStatus =
      checks.reduce<"ok" | "warning" | "critical">((current, check) => {
        return getSeverityRank(check.status) > getSeverityRank(current) ? check.status : current;
      }, "ok");

    return {
      generatedAt,
      summary: {
        status: overallStatus,
        totalChecks: checks.length,
        warnings,
        criticals,
      },
      checks,
    };
  }

  private async checkLedgerBalanced(): Promise<ReconciliationCheck> {
    const totals = await prisma.ledgerEntry.groupBy({
      by: ["direction"],
      _sum: {
        amount: true,
      },
    });

    const debitTotal = totals.find((item) => item.direction === "debit")?._sum.amount ?? ZERO;
    const creditTotal = totals.find((item) => item.direction === "credit")?._sum.amount ?? ZERO;
    const drift = creditTotal.minus(debitTotal).abs();
    const isBalanced = drift.equals(ZERO);

    return {
      check: "ledger_global_balance",
      status: isBalanced ? "ok" : "critical",
      summary: isBalanced
        ? "Os totais globais de debito e credito do ledger estao balanceados."
        : "Foi detectado desequilibrio global entre debitos e creditos do ledger.",
      driftAmount: drift.toFixed(4),
      details: {
        debitTotal: decimalToFixed(debitTotal),
        creditTotal: decimalToFixed(creditTotal),
      },
    };
  }

  private async checkReservedCollateralCoverage(): Promise<ReconciliationCheck> {
    const [reservedAccounts, reservedEntries, openOrders] = await Promise.all([
      prisma.account.findMany({
        where: {
          accountType: "reserved",
        },
        select: {
          uuid: true,
          userUuid: true,
        },
      }),
      prisma.ledgerEntry.groupBy({
        by: ["accountUuid", "direction"],
        where: {
          account: {
            accountType: "reserved",
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: {
            in: ["open", "partially_filled"],
          },
        },
        select: {
          userUuid: true,
          side: true,
          price: true,
          remainingQuantity: true,
        },
      }),
    ]);

    const reservedBalanceByUser = new Map<string, Prisma.Decimal>();
    const accountUserByUuid = new Map(
      reservedAccounts
        .filter((account) => account.userUuid)
        .map((account) => [account.uuid, account.userUuid as string]),
    );

    for (const aggregate of reservedEntries) {
      const userUuid = accountUserByUuid.get(aggregate.accountUuid);

      if (!userUuid) {
        continue;
      }

      const currentBalance = reservedBalanceByUser.get(userUuid) ?? ZERO;
      const amount = aggregate._sum.amount ?? ZERO;
      const nextBalance = aggregate.direction === "credit" ? currentBalance.plus(amount) : currentBalance.minus(amount);
      reservedBalanceByUser.set(userUuid, nextBalance);
    }

    const expectedReservedByUser = new Map<string, Prisma.Decimal>();

    for (const order of openOrders) {
      const centsPerContract = order.side === "buy" ? order.price : 100 - order.price;
      const reserveAmount = new Prisma.Decimal(centsPerContract).mul(order.remainingQuantity).div(100);
      const currentExpected = expectedReservedByUser.get(order.userUuid) ?? ZERO;
      expectedReservedByUser.set(order.userUuid, currentExpected.plus(reserveAmount));
    }

    const userUuids = new Set([...reservedBalanceByUser.keys(), ...expectedReservedByUser.keys()]);
    let totalDrift = ZERO;
    const mismatches: Array<{ userUuid: string; reservedBalance: string; expectedReserve: string; drift: string }> = [];

    for (const userUuid of userUuids) {
      const reservedBalance = reservedBalanceByUser.get(userUuid) ?? ZERO;
      const expectedReserve = expectedReservedByUser.get(userUuid) ?? ZERO;
      const drift = reservedBalance.minus(expectedReserve).abs();

      if (!drift.equals(ZERO)) {
        totalDrift = totalDrift.plus(drift);
        mismatches.push({
          userUuid,
          reservedBalance: decimalToFixed(reservedBalance),
          expectedReserve: decimalToFixed(expectedReserve),
          drift: decimalToFixed(drift),
        });
      }
    }

    return {
      check: "reserved_collateral_coverage",
      status: mismatches.length === 0 ? "ok" : "critical",
      summary:
        mismatches.length === 0
          ? "O saldo reservado dos usuarios cobre exatamente as ordens abertas."
          : "Ha divergencia entre saldo reservado e colateral esperado das ordens abertas.",
      driftAmount: totalDrift.toFixed(4),
      details: {
        mismatches,
      },
    };
  }

  private async checkOverdueMarkets(now: Date): Promise<ReconciliationCheck> {
    const overdueMarkets = await prisma.market.findMany({
      where: {
        closeAt: {
          lt: now,
        },
        status: {
          in: ["draft", "open", "suspended", "closed"],
        },
      },
      select: {
        uuid: true,
        status: true,
        closeAt: true,
      },
      take: 25,
    });

    return {
      check: "overdue_market_resolution",
      status: overdueMarkets.length === 0 ? "ok" : "warning",
      summary:
        overdueMarkets.length === 0
          ? "Nao ha mercados vencidos aguardando resolucao operacional."
          : "Existem mercados vencidos que ainda nao avancaram para resolucao.",
      driftAmount: new Prisma.Decimal(overdueMarkets.length).toFixed(4),
      details: {
        count: overdueMarkets.length,
        items: overdueMarkets.map((market) => ({
          uuid: market.uuid,
          status: market.status,
          closeAt: market.closeAt.toISOString(),
        })),
      },
    };
  }

  private async checkAgedPendingPayments(now: Date): Promise<ReconciliationCheck> {
    const threshold = new Date(now.getTime() - 60 * 60 * 1000);
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "pending",
        createdAt: {
          lt: threshold,
        },
      },
      select: {
        uuid: true,
        type: true,
        amount: true,
        currency: true,
        createdAt: true,
      },
      take: 25,
    });

    return {
      check: "aged_pending_payments",
      status: pendingPayments.length === 0 ? "ok" : "warning",
      summary:
        pendingPayments.length === 0
          ? "Nao ha pagamentos pendentes envelhecidos."
          : "Existem pagamentos pendentes ha mais de 60 minutos e precisam de revisao.",
      driftAmount: new Prisma.Decimal(pendingPayments.length).toFixed(4),
      details: {
        count: pendingPayments.length,
        items: pendingPayments.map((payment) => ({
          uuid: payment.uuid,
          type: payment.type,
          amount: payment.amount.toFixed(4),
          currency: payment.currency,
          createdAt: payment.createdAt.toISOString(),
        })),
      },
    };
  }
}
