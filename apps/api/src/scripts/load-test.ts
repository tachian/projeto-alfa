type Sample = {
  durationMs: number;
  ok: boolean;
  statusCode?: number;
  error?: string;
};

const baseUrl = process.env.LOAD_TEST_URL ?? "http://127.0.0.1:4000";
const path = process.env.LOAD_TEST_PATH ?? "/health/ready";
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? "10");
const requests = Number(process.env.LOAD_TEST_REQUESTS ?? "200");
const timeoutMs = Number(process.env.LOAD_TEST_TIMEOUT_MS ?? "5000");

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }
}

function percentile(sorted: number[], ratio: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? 0;
}

async function runRequest(url: string): Promise<Sample> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    return {
      durationMs: performance.now() - startedAt,
      ok: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      durationMs: performance.now() - startedAt,
      ok: false,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main(): Promise<void> {
  assertPositiveInteger(concurrency, "LOAD_TEST_CONCURRENCY");
  assertPositiveInteger(requests, "LOAD_TEST_REQUESTS");
  assertPositiveInteger(timeoutMs, "LOAD_TEST_TIMEOUT_MS");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, baseUrl).toString();
  const samples: Sample[] = [];
  let cursor = 0;
  const startedAt = performance.now();

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= requests) {
        return;
      }

      samples.push(await runRequest(url));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requests) }, () => worker()),
  );

  const totalDurationMs = performance.now() - startedAt;
  const latencies = samples.map((sample) => sample.durationMs).sort((left, right) => left - right);
  const succeeded = samples.filter((sample) => sample.ok).length;
  const failed = samples.length - succeeded;

  const result = {
    target: url,
    requests,
    concurrency,
    timeoutMs,
    totalDurationMs: Number(totalDurationMs.toFixed(2)),
    throughputRps: Number(((samples.length / totalDurationMs) * 1000).toFixed(2)),
    successRate: Number((succeeded / samples.length).toFixed(4)),
    succeeded,
    failed,
    latencyMs: {
      min: Number((latencies[0] ?? 0).toFixed(2)),
      p50: Number(percentile(latencies, 0.5).toFixed(2)),
      p95: Number(percentile(latencies, 0.95).toFixed(2)),
      p99: Number(percentile(latencies, 0.99).toFixed(2)),
      max: Number((latencies.at(-1) ?? 0).toFixed(2)),
      average: Number(
        (
          latencies.reduce((sum, value) => sum + value, 0) /
          Math.max(latencies.length, 1)
        ).toFixed(2),
      ),
    },
    failures: samples
      .filter((sample) => !sample.ok)
      .slice(0, 5)
      .map((sample) => ({
        statusCode: sample.statusCode ?? null,
        error: sample.error ?? null,
        durationMs: Number(sample.durationMs.toFixed(2)),
      })),
  };

  console.log(JSON.stringify(result, null, 2));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : "Falha ao executar load test.",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
