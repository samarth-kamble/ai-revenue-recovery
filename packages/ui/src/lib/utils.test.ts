import { describe, expect, it } from "vitest"
import { cn } from "./utils.js"

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500")
  })

  it("handles conditional classes correctly", () => {
    const showPadding = false
    expect(cn("px-2", showPadding && "py-1", "bg-blue-500")).toBe(
      "px-2 bg-blue-500"
    )
  })

  it("overrides conflicting tailwind classes correctly", () => {
    expect(cn("px-2 px-4", "p-6")).toBe("p-6")
  })
})
