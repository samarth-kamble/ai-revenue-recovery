import { describe, expect, it } from "vitest"
import { isDevelopment, isProduction, isTest } from "./index.js"
import { validateEnv } from "./env.js"

describe("Environment Validation & Configuration", () => {
  it("parses default development configuration correctly", () => {
    const config = validateEnv({})
    expect(config.NODE_ENV).toBe("development")
    expect(config.LOG_LEVEL).toBe("info")
    expect(config.POSTGRES_PORT).toBe(5432)
    expect(config.DATABASE_URL).toContain("postgres")
  })

  it("coerces numeric environment variables correctly", () => {
    const config = validateEnv({
      POSTGRES_PORT: "5433",
      REDIS_PORT: "6380",
    })
    expect(config.POSTGRES_PORT).toBe(5433)
    expect(config.REDIS_PORT).toBe(6380)
  })

  it("detects environment modes correctly", () => {
    const devConfig = validateEnv({ NODE_ENV: "development" })
    const testConfig = validateEnv({ NODE_ENV: "test" })
    const prodConfig = validateEnv({ NODE_ENV: "production" })

    expect(isDevelopment(devConfig)).toBe(true)
    expect(isTest(testConfig)).toBe(true)
    expect(isProduction(prodConfig)).toBe(true)
  })

  it("throws error for invalid enum values", () => {
    expect(() =>
      validateEnv({ NODE_ENV: "invalid_env" as unknown as "development" })
    ).toThrowError(/Invalid environment configuration/)
  })
})
