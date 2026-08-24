import { z } from "zod"

export const envSchema = z.object({
  // Runtime
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),

  // PostgreSQL
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("postgres"),
  POSTGRES_DB: z.string().default("revenue_recovery"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/revenue_recovery"),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Kafka
  KAFKA_BROKERS: z.string().default("localhost:9092"),
  KAFKA_CLIENT_ID: z.string().default("ai-revenue-recovery"),

  // Temporal
  TEMPORAL_ADDRESS: z.string().default("localhost:7233"),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  TEMPORAL_TASK_QUEUE: z.string().default("recovery"),

  // ClickHouse
  CLICKHOUSE_HOST: z.string().default("localhost"),
  CLICKHOUSE_PORT: z.coerce.number().default(8123),
  CLICKHOUSE_DB: z.string().default("analytics"),

  // S3 / MinIO
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("ml-artifacts"),

  // LLM Provider
  LLM_API_KEY: z.string().optional().default(""),
  LLM_MODEL: z.string().optional().default(""),

  // Python Internal Services
  ML_INFERENCE_URL: z.string().default("http://localhost:8001"),
  AI_AGENT_URL: z.string().default("http://localhost:8002"),
})

export type EnvConfig = z.infer<typeof envSchema>

/**
 * Validates provided environment variables against the platform schema.
 * Defaults to process.env if no input object is provided.
 */
export function validateEnv(
  inputEnv: Record<string, string | undefined> = process.env
): EnvConfig {
  const parsed = envSchema.safeParse(inputEnv)

  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    throw new Error(
      `[Config] Invalid environment configuration:\n${formattedErrors}`
    )
  }

  return parsed.data
}

/**
 * Gets active environment config with test defaults when running unit tests.
 */
export function getEnvConfig(): EnvConfig {
  return validateEnv(process.env)
}
