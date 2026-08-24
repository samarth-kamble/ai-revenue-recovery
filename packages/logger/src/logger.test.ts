import { describe, expect, it } from "vitest"
import {
  createLogger,
  formatError,
  generateCorrelationId,
  redactSecrets,
  runWithCorrelationId,
  type LogRecord,
} from "./index.js"

describe("Shared Logging (@workspace/logger)", () => {
  it("outputs structured JSON log records with service name", () => {
    const logs: LogRecord[] = []
    const logger = createLogger({
      serviceName: "web",
      minLevel: "info",
      writer: (record) => logs.push(record),
    })

    logger.info("Server started", { port: 3000 })

    expect(logs.length).toBe(1)
    expect(logs[0]?.service).toBe("web")
    expect(logs[0]?.level).toBe("info")
    expect(logs[0]?.message).toBe("Server started")
    expect(logs[0]?.meta?.port).toBe(3000)
    expect(logs[0]?.timestamp).toBeDefined()
  })

  it("filters logs by log level threshold", () => {
    const logs: LogRecord[] = []
    const logger = createLogger({
      serviceName: "ai-agent",
      minLevel: "warn",
      writer: (record) => logs.push(record),
    })

    logger.debug("Debug event")
    logger.info("Info event")
    logger.warn("Warn event")
    logger.error("Error event")

    expect(logs.length).toBe(2)
    expect(logs.map((l) => l.level)).toEqual(["warn", "error"])
  })

  it("propagates correlationId via AsyncLocalStorage context", () => {
    const logs: LogRecord[] = []
    const logger = createLogger({
      serviceName: "payment-recovery",
      writer: (record) => logs.push(record),
    })

    const testCorrelationId = generateCorrelationId("rec")

    runWithCorrelationId(testCorrelationId, () => {
      logger.info("Processing case")
      const childLogger = logger.child({ module: "policy-engine" })
      childLogger.info("Evaluating rule")
    })

    expect(logs.length).toBe(2)
    expect(logs[0]?.correlationId).toBe(testCorrelationId)
    expect(logs[1]?.correlationId).toBe(testCorrelationId)
    expect(logs[1]?.module).toBe("policy-engine")
  })

  it("formats errors safely without crashing", () => {
    const error = new Error("Database timeout")
    const formatted = formatError(error)

    expect(formatted.name).toBe("Error")
    expect(formatted.message).toBe("Database timeout")
    expect(formatted.stack).toBeDefined()
  })

  it("redacts sensitive fields like passwords and API keys", () => {
    const payload = {
      username: "merchant_admin",
      password: "SuperSecretPassword123!",
      apiKey: "sk_live_abcdef123456",
      llm_api_key: "secret_llm_key",
      nested: {
        authorization: "Bearer eyJhbGciOi...",
        creditCard: "4111111111111111",
      },
    }

    const redacted = redactSecrets(payload) as typeof payload

    expect(redacted.username).toBe("merchant_admin")
    expect(redacted.password).toBe("[REDACTED]")
    expect(redacted.apiKey).toBe("[REDACTED]")
    expect(redacted.llm_api_key).toBe("[REDACTED]")
    expect(redacted.nested.authorization).toBe("[REDACTED]")
    expect(redacted.nested.creditCard).toBe("[REDACTED]")
  })
})
