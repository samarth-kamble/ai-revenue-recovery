const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /api_?key/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /credit_?card/i,
  /cvv/i,
  /private_?key/i,
  /access_?key/i,
]

export function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }

    if ("code" in err && (err as { code?: unknown }).code) {
      serialized.code = (err as { code?: unknown }).code
    }
    if (err.cause) {
      serialized.cause = formatError(err.cause)
    }

    return redactSecrets(serialized) as Record<string, unknown>
  }

  if (typeof err === "object" && err !== null) {
    return redactSecrets(err as Record<string, unknown>) as Record<
      string,
      unknown
    >
  }

  return { message: String(err) }
}

export function redactSecrets(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data !== "object") {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(redactSecrets)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
      pattern.test(key)
    )

    if (isSensitive) {
      result[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSecrets(value)
    } else {
      result[key] = value
    }
  }

  return result
}
