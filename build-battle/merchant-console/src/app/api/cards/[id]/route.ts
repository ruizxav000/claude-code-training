import { setCardStatus } from "@/data/cardQueries"
import { CardStatus } from "@/data/types"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_STATUSES: readonly CardStatus[] = [
  "active",
  "frozen",
  "cancelled",
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Status must be active, frozen, or cancelled." },
      { status: 400 },
    )
  }

  const result = setCardStatus(id, status)
  if (!result.ok) {
    const notFound = result.error === "Card not found."
    return NextResponse.json(
      { error: result.error },
      { status: notFound ? 404 : 409 },
    )
  }

  return NextResponse.json({ card: result.card })
}
