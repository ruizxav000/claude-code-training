"use client"

import { Button } from "@/components/Button"
import { CardStatus } from "@/data/types"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function CardStatusAction({
  cardId,
  status,
}: {
  cardId: string
  status: CardStatus
}) {
  const router = useRouter()
  const [pending, setPending] = useState<CardStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const transition = async (next: CardStatus) => {
    setPending(next)
    setError(null)
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!response.ok) {
        const body = await response.json()
        setError(body.error ?? "Something went wrong.")
        setPending(null)
        return
      }
      router.refresh()
    } catch {
      setError("Something went wrong.")
    } finally {
      setPending(null)
    }
  }

  if (status === "cancelled") {
    return <p className="text-sm text-gray-500">This card is cancelled.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {status === "active" ? (
          <Button
            variant="secondary"
            className="py-1.5"
            disabled={pending !== null}
            onClick={() => transition("frozen")}
          >
            {pending === "frozen" ? "Freezing…" : "Freeze"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="py-1.5"
            disabled={pending !== null}
            onClick={() => transition("active")}
          >
            {pending === "active" ? "Unfreezing…" : "Unfreeze"}
          </Button>
        )}
        <Button
          variant="destructive"
          className="py-1.5"
          disabled={pending !== null}
          onClick={() => transition("cancelled")}
        >
          {pending === "cancelled" ? "Cancelling…" : "Cancel card"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
    </div>
  )
}
