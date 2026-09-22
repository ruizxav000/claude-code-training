/**
 * Test-BIN card numbers only. Every number starts with 4242 so nothing in
 * this app can ever resemble a real PAN, and every number carries a valid
 * Luhn check digit like a real card number would.
 */

const BIN = "4242"
const LENGTH = 16

/** Luhn check digit for a string of digits (no check digit included yet). */
function luhnCheckDigit(digits: string): string {
  let sum = 0
  let double = true // rightmost of the existing digits doubles first
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return String((10 - (sum % 10)) % 10)
}

export function isValidLuhn(number: string): boolean {
  if (!/^\d+$/.test(number)) return false
  const body = number.slice(0, -1)
  const checkDigit = number.slice(-1)
  return luhnCheckDigit(body) === checkDigit
}

/** Generates a 16-digit, `4242`-prefixed number with a valid Luhn check digit. */
export function generateCardNumber(): string {
  let body = BIN
  for (let i = BIN.length; i < LENGTH - 1; i++) {
    body += String(Math.floor(Math.random() * 10))
  }
  return body + luhnCheckDigit(body)
}
