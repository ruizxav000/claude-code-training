import { describe, expect, it } from "vitest"
import { generateCardNumber, isValidLuhn } from "./cardNumber"

describe("generateCardNumber", () => {
  it("starts with the 4242 test BIN", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCardNumber().startsWith("4242")).toBe(true)
    }
  })

  it("is 16 digits", () => {
    expect(generateCardNumber()).toMatch(/^\d{16}$/)
  })

  it("carries a valid Luhn check digit", () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidLuhn(generateCardNumber())).toBe(true)
    }
  })
})

describe("isValidLuhn", () => {
  it("accepts a known-valid Luhn number", () => {
    expect(isValidLuhn("4242424242424242")).toBe(true)
  })

  it("rejects a number with a flipped check digit", () => {
    expect(isValidLuhn("4242424242424241")).toBe(false)
  })

  it("rejects non-numeric input", () => {
    expect(isValidLuhn("4242-4242-4242-4242")).toBe(false)
  })
})
