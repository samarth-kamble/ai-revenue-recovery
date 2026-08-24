export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"

export const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

export interface LogContext {
  correlationId?: string
  requestId?: string
  traceId?: string
  service?: string
  module?: string
  [key: string]: unknown
}

export interface LogRecord {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  correlationId?: string
  requestId?: string
  traceId?: string
  module?: string
  meta?: Record<string, unknown>
  error?: Record<string, unknown>
}

export interface LoggerOptions {
  serviceName: string
  minLevel?: LogLevel
  writer?: (record: LogRecord) => void
}

export interface Logger {
  trace(message: string, meta?: Record<string, unknown>): void
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void
  fatal(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void
  child(bindings: LogContext): Logger
}
