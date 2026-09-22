import { Button } from "@/components/Button"
import Link from "next/link"

export default function CardNotFound() {
  return (
    <div className="flex flex-col items-center gap-2 p-16 text-center">
      <p className="font-medium text-gray-900 dark:text-gray-50">
        Card not found
      </p>
      <p className="text-sm text-gray-500">
        It may have never existed, or the dev server restarted and cleared
        the in-memory store.
      </p>
      <Button asChild className="mt-2">
        <Link href="/cards">Back to cards</Link>
      </Button>
    </div>
  )
}
