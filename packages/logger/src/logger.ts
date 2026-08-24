import { getActiveContext } from "./context.js"
import { formatError, redactSecrets } from "./redact.js"
import {
  LOG_LEVEL_SEVERITY,
  type LogContext,
  type Logger,
  type LoggerOptions,
  type LogLevel,
  type LogRecord,
} from "./types.js"

export class StructuredLogger implements Logger {
  private serviceName: string
  private minLevel: LogLevel
  private bindings: LogContext
  private writer: (record: LogRecord) => void

  constructor(options: LoggerOptions, bindings: LogContext = {}) {
    this.serviceName = options.serviceName
    this.minLevel =
      options.minLevel || (process.env.LOG_LEVEL as LogLevel) || "info"
    this.bindings = bindings
    this.writer =
      options.writer ||
      ((record: LogRecord) => {
        const jsonOutput = JSON.stringify(record)
        if (record.level === "error" || record.level === "fatal") {
          console.error(jsonOutput)
        } else {
          console.log(jsonOutput)
        }
      })
  }

  private shouldLog(level: LogLevel): boolean {
    const targetSeverity = LOG_LEVEL_SEVERITY[level] || 30
    const minSeverity = LOG_LEVEL_SEVERITY[this.minLevel] || 30
    return targetSeverity >= minSeverity
  }

  private buildRecord(
    level: LogLevel,
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): LogRecord {
    const activeContext = getActiveContext()
    const mergedContext = {
      ...this.bindings,
      ...activeContext,
    }

    let errorObj: Record<string, unknown> | undefined
    let metaObj: Record<string, unknown> | undefined

    if (errorOrMeta !== undefined) {
      if (
        errorOrMeta instanceof Error ||
        (typeof errorOrMeta === "object" &&
          errorOrMeta !== null &&
          ("message" in errorOrMeta || "stack" in errorOrMeta))
      ) {
        errorObj = formatError(errorOrMeta)
        if (meta) {
          metaObj = redactSecrets(meta) as Record<string, unknown>
        }
      } else if (typeof errorOrMeta === "object" && errorOrMeta !== null) {
        metaObj = redactSecrets(errorOrMeta) as Record<string, unknown>
      }
    }

    const { correlationId, requestId, traceId, module, ...restContext } =
      mergedContext

    if (Object.keys(restContext).length > 0) {
      metaObj = { ...restContext, ...metaObj }
    }

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
    }

    if (correlationId) record.correlationId = String(correlationId)
    if (requestId) record.requestId = String(requestId)
    if (traceId) record.traceId = String(traceId)
    if (module) record.module = String(module)
    if (metaObj && Object.keys(metaObj).length > 0) record.meta = metaObj
    if (errorObj) record.error = errorObj

    return record
  }

  private log(
    level: LogLevel,
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) return
    const record = this.buildRecord(level, message, errorOrMeta, meta)
    this.writer(record)
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.log("trace", message, meta)
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta)
  }

  error(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    this.log("error", message, errorOrMeta, meta)
  }

  fatal(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    this.log("fatal", message, errorOrMeta, meta)
  }

  child(bindings: LogContext): Logger {
    return new StructuredLogger(
      {
        serviceName: this.serviceName,
        minLevel: this.minLevel,
        writer: this.writer,
      },
      { ...this.bindings, ...bindings }
    )
  }
}

export function createLogger(options: LoggerOptions): Logger {
  return new StructuredLogger(options)
}
