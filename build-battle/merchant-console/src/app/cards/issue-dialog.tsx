"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import { Input } from "@/components/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { Currency } from "@/data/types"
import { parseAmountToMinorUnits } from "@/lib/money"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"]

type MerchantOption = { id: string; name: string; currency: Currency }

export function IssueCardDialog({
  merchants,
}: {
  merchants: MerchantOption[]
}) {
  const router = useRouter()
  const nicknameId = useId()
  const limitId = useId()

  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState("")
  const [merchantId, setMerchantId] = useState("")
  const [limitInput, setLimitInput] = useState("")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reveal, setReveal] = useState<{ number: string; last4: string } | null>(
    null,
  )

  const reset = () => {
    setNickname("")
    setMerchantId("")
    setLimitInput("")
    setCurrency("USD")
    setError(null)
    setReveal(null)
  }

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) {
      const hadReveal = reveal !== null
      reset()
      if (hadReveal) router.refresh()
    }
  }

  const submit = async () => {
    setError(null)

    const spendLimit = parseAmountToMinorUnits(limitInput)
    if (!merchantId) {
      setError("Select a merchant.")
      return
    }
    if (spendLimit === null || spendLimit <= 0) {
      setError("Enter a spend limit greater than zero.")
      return
    }

    setPending(true)
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          merchantId,
          spendLimit,
          currency,
        }),
      })
      const body = await response.json()
      if (!response.ok) {
        setError(body.error ?? "Something went wrong.")
        return
      }
      setReveal({ number: body.number, last4: body.card.last4 })
    } catch {
      setError("Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerTrigger asChild>
        <Button className="w-full sm:w-fit">Issue card</Button>
      </DrawerTrigger>
      <DrawerContent>
        {reveal ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Card issued</DrawerTitle>
              <DrawerDescription>
                This is the only time the full number is shown. It will not
                appear again.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center font-mono text-lg tracking-widest text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50">
                {reveal.number}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Everywhere else, this card shows as •••• {reveal.last4}.
              </p>
            </DrawerBody>
            <DrawerFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DrawerFooter>
          </>
        ) : (
          <>
            <DrawerHeader>
              <DrawerTitle>Issue a virtual card</DrawerTitle>
              <DrawerDescription>
                Generated on the test BIN. The full number is shown once, right
                after this.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor={nicknameId}
                  className="text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  Nickname
                </label>
                <Input
                  id={nicknameId}
                  className="mt-1"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="Ad spend — Q4"
                />
              </div>

              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  Merchant
                </span>
                <Select
                  value={merchantId}
                  onValueChange={(value) => {
                    setMerchantId(value)
                    const merchant = merchants.find((m) => m.id === value)
                    if (merchant) setCurrency(merchant.currency)
                  }}
                >
                  <SelectTrigger className="mt-1 py-1.5">
                    <SelectValue placeholder="Select a merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.id}>
                        {merchant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label
                    htmlFor={limitId}
                    className="text-sm font-medium text-gray-900 dark:text-gray-50"
                  >
                    Spend limit
                  </label>
                  <Input
                    id={limitId}
                    className="mt-1"
                    inputMode="decimal"
                    value={limitInput}
                    onChange={(event) => setLimitInput(event.target.value)}
                    placeholder="250.00"
                  />
                </div>
                <div className="w-28">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    Currency
                  </span>
                  <Select
                    value={currency}
                    onValueChange={(value) => setCurrency(value as Currency)}
                  >
                    <SelectTrigger className="mt-1 py-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
              )}
            </DrawerBody>
            <DrawerFooter>
              <Button
                variant="secondary"
                onClick={() => close(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending}>
                {pending ? "Issuing…" : "Issue card"}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
