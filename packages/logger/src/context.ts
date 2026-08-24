import { AsyncLocalStorage } from "node:async_hooks"
import type { LogContext } from "./types.js"

const asyncLocalStorage = new AsyncLocalStorage<LogContext>()

export function runWithContext<T>(context: LogContext, fn: () => T): T {
  const current = asyncLocalStorage.getStore() || {}
  const merged = { ...current, ...context }
  return asyncLocalStorage.run(merged, fn)
}

export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return runWithContext({ correlationId }, fn)
}

export function getActiveContext(): LogContext {
  return asyncLocalStorage.getStore() || {}
}

export function generateCorrelationId(prefix = "corr"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
