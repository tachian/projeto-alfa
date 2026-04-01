type Labels = Record<string, string | number>;

type CounterMetric = {
  type: "counter";
  name: string;
  help: string;
  values: Map<string, { labels: Labels; value: number }>;
};

type GaugeMetric = {
  type: "gauge";
  name: string;
  help: string;
  values: Map<string, { labels: Labels; value: number }>;
};

type Metric = CounterMetric | GaugeMetric;

const metrics = new Map<string, Metric>();

const normalizeLabels = (labels: Labels) =>
  Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(",");

const escapeLabelValue = (value: string | number) => String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const getOrCreateCounter = (name: string, help: string): CounterMetric => {
  const existing = metrics.get(name);

  if (existing && existing.type === "counter") {
    return existing;
  }

  const metric: CounterMetric = {
    type: "counter",
    name,
    help,
    values: new Map(),
  };
  metrics.set(name, metric);

  return metric;
};

const getOrCreateGauge = (name: string, help: string): GaugeMetric => {
  const existing = metrics.get(name);

  if (existing && existing.type === "gauge") {
    return existing;
  }

  const metric: GaugeMetric = {
    type: "gauge",
    name,
    help,
    values: new Map(),
  };
  metrics.set(name, metric);

  return metric;
};

export const incrementCounter = (name: string, help: string, labels: Labels = {}, value = 1) => {
  const metric = getOrCreateCounter(name, help);
  const key = normalizeLabels(labels);
  const current = metric.values.get(key);

  metric.values.set(key, {
    labels,
    value: (current?.value ?? 0) + value,
  });
};

export const setGauge = (name: string, help: string, labels: Labels = {}, value: number) => {
  const metric = getOrCreateGauge(name, help);
  const key = normalizeLabels(labels);

  metric.values.set(key, {
    labels,
    value,
  });
};

export const recordHttpResponseMetric = (input: {
  method: string;
  path: string;
  statusCode: number;
}) => {
  incrementCounter(
    "projeto_alfa_http_requests_total",
    "Total HTTP requests processed by the API",
    {
      method: input.method,
      path: input.path,
      status_code: input.statusCode,
    },
  );
};

export const recordBusinessOperationMetric = (input: {
  operation: string;
  status: "success" | "failure";
}) => {
  incrementCounter(
    "projeto_alfa_business_operations_total",
    "Business operations executed by the platform",
    {
      operation: input.operation,
      status: input.status,
    },
  );
};

export const updateReconciliationMetric = (input: {
  check: string;
  status: "ok" | "warning" | "critical";
  driftAmount?: number;
}) => {
  setGauge(
    "projeto_alfa_reconciliation_check_status",
    "Status of reconciliation checks where ok=0 warning=1 critical=2",
    { check: input.check },
    input.status === "ok" ? 0 : input.status === "warning" ? 1 : 2,
  );

  setGauge(
    "projeto_alfa_reconciliation_drift_amount",
    "Detected drift amount for reconciliation checks",
    { check: input.check },
    input.driftAmount ?? 0,
  );
};

export const renderMetrics = () => {
  const lines: string[] = [];

  for (const metric of metrics.values()) {
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} ${metric.type}`);

    for (const { labels, value } of metric.values.values()) {
      const labelEntries = Object.entries(labels);
      const labelString =
        labelEntries.length > 0
          ? `{${labelEntries.map(([key, labelValue]) => `${key}="${escapeLabelValue(labelValue)}"`).join(",")}}`
          : "";

      lines.push(`${metric.name}${labelString} ${value}`);
    }
  }

  return `${lines.join("\n")}\n`;
};

export const resetMetrics = () => {
  metrics.clear();
};
