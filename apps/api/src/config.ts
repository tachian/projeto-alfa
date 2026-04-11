import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(currentDir, "../.env");

dotenv.config({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  APP_NAME: z.string().min(1),
  APP_URL: z.string().url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  RABBITMQ_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1),
  KYC_PROVIDER: z.enum(["mock"]).default("mock"),
  KYC_MOCK_DEFAULT_STATUS: z.enum(["approved", "manual_review", "rejected"]).default("approved"),
  PROMETHEUS_PORT: z.coerce.number().int().positive().default(9464),
  RISK_MAX_ORDER_QUANTITY: z.coerce.number().int().positive().default(1000),
  RISK_MAX_ORDER_RESERVE_AMOUNT: z.coerce.number().positive().default(25000),
  RISK_MAX_OPEN_ORDERS_PER_MARKET: z.coerce.number().int().positive().default(25),
  RISK_MAX_GROSS_EXPOSURE_PER_MARKET: z.coerce.number().int().positive().default(5000),
  RISK_MAX_WITHDRAWAL_AMOUNT: z.coerce.number().positive().default(10000),
  RISK_MAX_DAILY_WITHDRAWAL_AMOUNT: z.coerce.number().positive().default(25000),
  PAYMENTS_ENABLED_DEPOSIT_METHODS: z.string().default("manual_mock"),
  PAYMENTS_ENABLED_WITHDRAWAL_METHODS: z.string().default("manual_mock"),
  PAYMENTS_SUPPORTED_CURRENCIES: z.string().default("USD"),
});

export type AppConfig = z.infer<typeof envSchema>;

export const appConfig = envSchema.parse(process.env);
