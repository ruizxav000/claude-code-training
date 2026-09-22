"use client"

import { Button } from "@/components/Button"
import { CardStatus } from "@/data/types"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function ListStatusAction({
  cardId,
  status,
}: {
  cardId: string
  status: CardStatus
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === "cancelled") {
    return <span className="text-sm text-gray-500">—</span>
  }

  const next: CardStatus = status === "active" ? "frozen" : "active"

  const toggle = async () => {
    setPending(true)
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
        return
      }
      router.refresh()
    } catch {
      setError("Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        className="py-1 text-xs"
        disabled={pending}
        onClick={toggle}
      >
        {pending
          ? status === "active"
            ? "Freezing…"
            : "Unfreezing…"
          : status === "active"
            ? "Freeze"
            : "Unfreeze"}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-500">{error}</p>
      )}
    </div>
  )
}
