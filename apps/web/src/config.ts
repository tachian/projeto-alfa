const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const webConfig = {
  APP_NAME: process.env.APP_NAME ?? "projeto-alfa-web",
  PORT: toNumber(process.env.PORT, 3002),
  APP_URL: process.env.APP_URL ?? "http://localhost:3002",
  API_URL: process.env.API_URL ?? "http://localhost:4000",
};
