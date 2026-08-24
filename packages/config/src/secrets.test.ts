import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("Secret Prevention & Git Safety", () => {
  const rootDir = path.resolve(__dirname, "../../../")

  it("ensures .gitignore ignores .env files while allowing .env.example", () => {
    const gitignorePath = path.join(rootDir, ".gitignore")
    expect(fs.existsSync(gitignorePath)).toBe(true)

    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8")
    expect(gitignoreContent).toMatch(/^\.env$/m)
    expect(gitignoreContent).toMatch(/^!\.env\.example$/m)
  })

  it("ensures .env.example contains no committed secret values", () => {
    const envExamplePath = path.join(rootDir, ".env.example")
    expect(fs.existsSync(envExamplePath)).toBe(true)

    const content = fs.readFileSync(envExamplePath, "utf-8")
    const lines = content.split("\n")

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue

      const [key, value] = trimmed.split("=", 2)
      if (key === "LLM_API_KEY" || key === "S3_SECRET_KEY") {
        if (key === "LLM_API_KEY") {
          expect(value?.trim()).toBe("")
        }
        if (key === "S3_SECRET_KEY") {
          expect(value?.trim()).toMatch(/^(minioadmin|placeholder|)$/)
        }
      }
    }
  })

  it("ensures no private keys are present in repository root configs", () => {
    const rootFiles = ["package.json", ".env.example", "README.md"]
    for (const file of rootFiles) {
      const filePath = path.join(rootDir, file)
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, "utf-8")
        expect(text).not.toContain("-----BEGIN PRIVATE KEY-----")
        expect(text).not.toContain("-----BEGIN RSA PRIVATE KEY-----")
      }
    }
  })
})
