import { getEnvConfig, type EnvConfig } from "./env.js"

export { envSchema, getEnvConfig, validateEnv, type EnvConfig } from "./env.js"

export function isDevelopment(env: EnvConfig = getEnvConfig()): boolean {
  return env.NODE_ENV === "development"
}

export function isTest(env: EnvConfig = getEnvConfig()): boolean {
  return env.NODE_ENV === "test"
}

export function isProduction(env: EnvConfig = getEnvConfig()): boolean {
  return env.NODE_ENV === "production"
}
