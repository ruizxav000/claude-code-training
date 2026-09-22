import { store } from "./store"
import { Card, CardStatus, Currency } from "./types"

const pad = (n: number, width = 6) => String(n).padStart(width, "0")

export function allCards(): Card[] {
  return [...store.cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function cardById(id: string): Card | null {
  return store.cards.find((c) => c.id === id) ?? null
}

export function createCard(input: {
  nickname: string
  merchantId: string
  spendLimit: number
  currency: Currency
  last4: string
  numberRef: string
}): Card {
  const card: Card = {
    id: `card_${pad(store.cards.length + 1)}`,
    nickname: input.nickname,
    merchantId: input.merchantId,
    last4: input.last4,
    numberRef: input.numberRef,
    spendLimit: input.spendLimit,
    currency: input.currency,
    status: "active",
    spend: 0,
    createdAt: new Date().toISOString(),
  }
  store.cards.push(card)
  return card
}

const ALLOWED_TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  active: ["frozen", "cancelled"],
  frozen: ["active", "cancelled"],
  cancelled: [],
}

export type TransitionResult =
  | { ok: true; card: Card }
  | { ok: false; error: string }

/** The one place `store.cards` status changes. Guards the state machine. */
export function setCardStatus(id: string, next: CardStatus): TransitionResult {
  const card = cardById(id)
  if (!card) return { ok: false, error: "Card not found." }
  if (card.status === next) return { ok: true, card }
  if (!ALLOWED_TRANSITIONS[card.status].includes(next)) {
    return {
      ok: false,
      error: `Cannot move a ${card.status} card to ${next}.`,
    }
  }
  card.status = next
  return { ok: true, card }
}
