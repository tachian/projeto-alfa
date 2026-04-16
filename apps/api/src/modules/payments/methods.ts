import { appConfig } from "../../config.js";
import { PaymentError } from "./errors.js";
import type { PaymentType } from "./service.js";

export type PaymentMethodKey =
  | "manual_mock"
  | "pix"
  | "provider_checkout"
  | "pix_cashout"
  | "bank_transfer";

export type PaymentExecutionModel = "instant_completion" | "async_confirmation";
export type PaymentMethodAvailability = "enabled" | "planned";

export type PaymentMethodRecord = {
  key: PaymentMethodKey;
  type: PaymentType;
  provider: string;
  availability: PaymentMethodAvailability;
  executionModel: PaymentExecutionModel;
  supportedCurrencies: string[];
  idempotencySupported: boolean;
  asyncSettlement: boolean;
  description: string;
};

const normalizeCsvList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const SUPPORTED_CURRENCIES = normalizeCsvList(appConfig.PAYMENTS_SUPPORTED_CURRENCIES).map((currency) =>
  currency.toUpperCase(),
);

const ENABLED_DEPOSIT_METHODS = new Set(normalizeCsvList(appConfig.PAYMENTS_ENABLED_DEPOSIT_METHODS));
const ENABLED_WITHDRAWAL_METHODS = new Set(normalizeCsvList(appConfig.PAYMENTS_ENABLED_WITHDRAWAL_METHODS));

const PAYMENT_METHODS_BASE: Array<Omit<PaymentMethodRecord, "availability">> = [
  {
    key: "manual_mock",
    type: "deposit",
    provider: "manual",
    executionModel: "instant_completion",
    supportedCurrencies: SUPPORTED_CURRENCIES,
    idempotencySupported: true,
    asyncSettlement: false,
    description: "Metodo local de desenvolvimento que liquida o deposito imediatamente no ledger.",
  },
  {
    key: "pix",
    type: "deposit",
    provider: "pix_mock",
    executionModel: "async_confirmation",
    supportedCurrencies: SUPPORTED_CURRENCIES,
    idempotencySupported: true,
    asyncSettlement: true,
    description: "Fluxo preparado para PIX com confirmacao assincrona por webhook ou conciliacao.",
  },
  {
    key: "provider_checkout",
    type: "deposit",
    provider: "checkout_mock",
    executionModel: "async_confirmation",
    supportedCurrencies: SUPPORTED_CURRENCIES,
    idempotencySupported: true,
    asyncSettlement: true,
    description: "Fluxo preparado para checkout externo de cash-in com callback de confirmacao.",
  },
  {
    key: "manual_mock",
    type: "withdrawal",
    provider: "manual",
    executionModel: "instant_completion",
    supportedCurrencies: SUPPORTED_CURRENCIES,
    idempotencySupported: true,
    asyncSettlement: false,
    description: "Metodo local de desenvolvimento que liquida o saque imediatamente no ledger.",
  },
  {
    key: "pix_cashout",
    type: "withdrawal",
    provider: "pix_mock",
    executionModel: "async_confirmation",
    supportedCurrencies: SUPPORTED_CURRENCIES,
    idempotencySupported: true,
    asyncSettlement: true,
    description: "Fluxo preparado para cash-out por PIX com confirmacao assincrona do provedor.",
  },
  {
    key: "bank_transfer",
    type: "withdrawal",
    provider: "bank_mock",
    executionModel: "async_confirmation",
    supportedCurrencies: SUPPORTED_CURRENCIES,
    idempotencySupported: true,
    asyncSettlement: true,
    description: "Fluxo preparado para transferencia bancaria com conciliacao posterior.",
  },
];

export const listPaymentMethods = (type?: PaymentType): PaymentMethodRecord[] => {
  return PAYMENT_METHODS_BASE.filter((method) => !type || method.type === type).map((method): PaymentMethodRecord => {
    const isDepositType = method.type === "deposit";
    const enabledMethods = isDepositType ? ENABLED_DEPOSIT_METHODS : ENABLED_WITHDRAWAL_METHODS;
    const availability: PaymentMethodAvailability = enabledMethods.has(method.key) ? "enabled" : "planned";

    return {
      ...method,
      availability,
    };
  });
};

export const resolvePaymentMethod = (input: {
  type: PaymentType;
  key?: string | null;
  currency: string;
}): PaymentMethodRecord => {
  const methods = listPaymentMethods(input.type);
  const selectedMethod = input.key?.trim()
    ? methods.find((method) => method.key === input.key)
    : methods.find((method) => method.availability === "enabled");

  if (!selectedMethod) {
    throw new PaymentError(`Nenhum metodo de ${input.type === "deposit" ? "deposito" : "saque"} esta habilitado.`, 503);
  }

  if (selectedMethod.availability !== "enabled") {
    throw new PaymentError("O metodo de pagamento solicitado ainda nao esta disponivel.", 400);
  }

  if (!selectedMethod.supportedCurrencies.includes(input.currency.toUpperCase())) {
    throw new PaymentError("O metodo de pagamento solicitado nao suporta essa moeda.", 400);
  }

  return selectedMethod;
};

export const extractPaymentMethodFromMetadata = (metadata: unknown): string | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const method = (metadata as Record<string, unknown>).paymentMethod;

  return typeof method === "string" ? method : null;
};
