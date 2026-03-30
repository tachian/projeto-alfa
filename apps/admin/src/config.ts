const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const adminConfig = {
  APP_NAME: process.env.APP_NAME ?? "projeto-alfa-admin",
  PORT: toNumber(process.env.PORT, 3000),
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  ADMIN_API_URL: process.env.ADMIN_API_URL ?? "http://localhost:4000",
};
