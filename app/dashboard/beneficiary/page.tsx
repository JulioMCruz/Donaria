import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HandHeart, PlusCircle } from "lucide-react"
import { NeedCard } from "@/app/components/beneficiary/need-card"

// Mock data for demonstration
const reportedNeeds = [
  {
    id: "1",
    title: "Urgent Shelter for Flood Victims",
    amountNeeded: 5000,
    amountRaised: 4500,
    status: "Funded",
    imageUrl: "/flooded_houses.png",
  },
  {
    id: "2",
    title: "Medical Supplies for Local Clinic",
    amountNeeded: 2500,
    amountRaised: 1200,
    status: "Verified",
    imageUrl: "/medical-clinic-waiting-area.png",
  },
  {
    id: "3",
    title: "Clean Water Distribution",
    amountNeeded: 1000,
    amountRaised: 150,
    status: "Pending",
    imageUrl: "/placeholder-8ospr.png",
  },
]

export default function BeneficiaryDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center gap-2">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">Beneficiary</span>
          <Link href="/">
            <Button variant="outline">Log Out</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Your Reported Needs</h1>
            <Link href="/dashboard/beneficiary/create-need">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Report
              </Button>
            </Link>
          </div>

          {reportedNeeds.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reportedNeeds.map((need) => (
                <NeedCard key={need.id} need={need} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold">No reports found.</h2>
              <p className="text-muted-foreground mt-2">Get started by creating a new emergency report.</p>
              <Link href="/dashboard/beneficiary/create-need" className="mt-4 inline-block">
                <Button>Create New Report</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
