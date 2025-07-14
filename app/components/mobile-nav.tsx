import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HandHeart } from "lucide-react"

export function MobileNav() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="#" className="flex items-center gap-2 font-bold text-lg">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span>DONARIA</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-4 p-4">
        <Link href="#features" className="text-lg font-medium hover:underline underline-offset-4">
          How it Works
        </Link>
        <Link href="#impact" className="text-lg font-medium hover:underline underline-offset-4">
          Impact
        </Link>
      </nav>
      <div className="mt-auto p-4 border-t">
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full bg-transparent">
            Log In
          </Button>
        </Link>
      </div>
    </div>
  )
}
