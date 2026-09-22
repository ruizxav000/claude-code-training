import { allCards, createCard } from "@/data/cardQueries"
import { merchantById } from "@/data/merchants"
import { Currency } from "@/data/types"
import { generateCardNumber } from "@/lib/cardNumber"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_CURRENCIES: readonly Currency[] = ["USD", "EUR", "GBP"]
const MAX_SPEND_LIMIT = 5_000_000

export function GET() {
  return NextResponse.json({ cards: allCards() })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : ""
  const merchantId =
    typeof body.merchantId === "string" ? body.merchantId : ""
  const spendLimit = Number(body.spendLimit)
  const currency = body.currency

  if (!nickname) {
    return NextResponse.json(
      { error: "Nickname is required." },
      { status: 400 },
    )
  }

  const merchant = merchantById(merchantId)
  if (!merchant) {
    return NextResponse.json(
      { error: "Select a merchant." },
      { status: 400 },
    )
  }

  if (!Number.isFinite(spendLimit) || spendLimit <= 0) {
    return NextResponse.json(
      { error: "Spend limit must be greater than zero." },
      { status: 400 },
    )
  }
  if (spendLimit > MAX_SPEND_LIMIT) {
    return NextResponse.json(
      { error: "Spend limit cannot exceed 5,000,000 minor units." },
      { status: 400 },
    )
  }

  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { error: "Currency must be USD, EUR, or GBP." },
      { status: 400 },
    )
  }

  const number = generateCardNumber()
  const last4 = number.slice(-4)
  const numberRef = `numref_${last4}_${Date.now()}`

  const card = createCard({
    nickname,
    merchantId,
    spendLimit,
    currency,
    last4,
    numberRef,
  })

  return NextResponse.json({ card, number }, { status: 201 })
}
