import { describe, expect, it } from "vitest"
import { createCard, setCardStatus } from "./cardQueries"

function issue() {
  return createCard({
    nickname: "Test card",
    merchantId: "mch_01",
    spendLimit: 25000,
    currency: "USD",
    category: "ad_spend",
    last4: "4242",
    numberRef: "numref_test",
  })
}

describe("setCardStatus", () => {
  it("allows active -> frozen -> active", () => {
    const card = issue()
    expect(setCardStatus(card.id, "frozen")).toMatchObject({ ok: true })
    expect(setCardStatus(card.id, "active")).toMatchObject({ ok: true })
  })

  it("allows active or frozen -> cancelled", () => {
    const fromActive = issue()
    expect(setCardStatus(fromActive.id, "cancelled")).toMatchObject({ ok: true })

    const fromFrozen = issue()
    setCardStatus(fromFrozen.id, "frozen")
    expect(setCardStatus(fromFrozen.id, "cancelled")).toMatchObject({ ok: true })
  })

  it("cancelled is terminal: nothing comes back from it", () => {
    const card = issue()
    setCardStatus(card.id, "cancelled")
    expect(setCardStatus(card.id, "active")).toMatchObject({ ok: false })
    expect(setCardStatus(card.id, "frozen")).toMatchObject({ ok: false })
  })

  it("returns not-found for an unknown card id", () => {
    expect(setCardStatus("card_does_not_exist", "frozen")).toMatchObject({
      ok: false,
      error: "Card not found.",
    })
  })
})
