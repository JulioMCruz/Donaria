import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HandHeart, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DonorNeedCard } from "@/app/components/donor/donor-need-card"

// Mock data for all active needs from different beneficiaries
const allNeeds = [
  {
    id: "2",
    title: "Medical Supplies for Local Clinic",
    place: "Riverside, Central Province",
    amountNeeded: 2500,
    amountRaised: 1200,
    status: "Verified",
    imageUrl: "/medical-clinic-waiting-area.png",
    type: "Health",
  },
  {
    id: "1",
    title: "Urgent Shelter for Flood Victims",
    place: "Coastal City, East Region",
    amountNeeded: 5000,
    amountRaised: 4500,
    status: "Verified",
    imageUrl: "/flooded_houses.png",
    type: "Shelter",
  },
  {
    id: "3",
    title: "Clean Water Distribution",
    place: "Mountain Village, North",
    amountNeeded: 1000,
    amountRaised: 150,
    status: "Verified",
    imageUrl: "/placeholder-8ospr.png",
    type: "Water",
  },
  {
    id: "4",
    title: "Food Packages for Displaced Families",
    place: "Green Valley, West Region",
    amountNeeded: 3000,
    amountRaised: 2800,
    status: "Verified",
    imageUrl: "/assorted-food-packages.png",
    type: "Food",
  },
]

export default function DonorDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center gap-2">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">Donor</span>
          <Link href="/">
            <Button variant="outline">Log Out</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Find a Need to Support</h1>
            <p className="text-muted-foreground mt-2">Browse verified reports and make a direct impact.</p>
          </div>

          <div className="mb-8 p-4 bg-card rounded-lg border flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search by title or location..." className="pl-10" />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Most Urgent</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="closest">Closest to Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allNeeds.map((need) => (
              <DonorNeedCard key={need.id} need={need} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
