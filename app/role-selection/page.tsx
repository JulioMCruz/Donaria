import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HandHeart, Megaphone } from "lucide-react"

export default function RoleSelectionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Choose Your Role</h1>
        <p className="text-muted-foreground">How would you like to use Donaria today?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/dashboard/donor" className="flex">
          <Card className="w-full flex flex-col hover:border-teal-500 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-teal-100 dark:bg-teal-900/50 rounded-full mb-4">
                <HandHeart className="h-10 w-10 text-teal-500" />
              </div>
              <CardTitle className="text-2xl">I want to help</CardTitle>
              <CardDescription>
                Provide financial aid, track your impact, and support communities in crisis through transparent
                donations.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="text-center text-teal-500 font-semibold">Continue as a Donor &rarr;</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/beneficiary" className="flex">
          <Card className="w-full flex flex-col hover:border-rose-500 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-rose-100 dark:bg-rose-900/50 rounded-full mb-4">
                <Megaphone className="h-10 w-10 text-rose-500" />
              </div>
              <CardTitle className="text-2xl">I need help</CardTitle>
              <CardDescription>
                Report an emergency, request assistance for your community, and receive direct, verified aid.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="text-center text-rose-500 font-semibold">Continue as a Beneficiary &rarr;</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
