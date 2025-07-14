"use client"

import { Search, Loader2, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DonorNeedCard } from "@/app/components/donor/donor-need-card"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Need = {
  id: string
  title: string
  place: string
  amountNeeded: number
  amountRaised: number
  status: string
  imageUrl: string
  type: string
}

type ApiNeed = {
  id: string
  title: string
  description: string
  location: string
  category: string
  amountNeeded: number
  amountRaised: number
  status: "Pending" | "Verified" | "Funded"
  imageUrl: string
  imageUrls: string[]
  creator: string
  createdAt: number
  updatedAt: number
  verificationNotes: string
}

export default function DonorDashboard() {
  const [allNeeds, setAllNeeds] = useState<Need[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("")

  // Function to map API data to DonorNeedCard format
  const mapApiNeedToCardNeed = (apiNeed: ApiNeed): Need => {
    return {
      id: apiNeed.id,
      title: apiNeed.title,
      place: apiNeed.location,
      amountNeeded: apiNeed.amountNeeded,
      amountRaised: apiNeed.amountRaised,
      status: apiNeed.status,
      imageUrl: apiNeed.imageUrl,
      type: apiNeed.category
    }
  }

  // Function to fetch all needs from the API
  const fetchAllNeeds = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Fetching all needs from smart contract...')

      const response = await fetch('/api/soroban/need-reports/get')
      const data = await response.json()

      if (response.ok && data.success) {
        const mappedNeeds = Array.isArray(data.reports) 
          ? data.reports.map(mapApiNeedToCardNeed)
          : []
        
        console.log(`✅ Loaded ${mappedNeeds.length} needs for donors`)
        setAllNeeds(mappedNeeds)
      } else {
        console.error('❌ Failed to fetch needs:', data.error)
        setError(data.error || 'Failed to fetch needs')
        toast.error('Failed to load needs')
      }
    } catch (error: any) {
      console.error('❌ Error fetching needs:', error)
      setError('Failed to load needs')
      toast.error('Failed to load needs')
    } finally {
      setLoading(false)
    }
  }

  // Load needs when component mounts
  useEffect(() => {
    fetchAllNeeds()
  }, [])

  // Manual refresh function
  const handleRefresh = () => {
    fetchAllNeeds()
  }

  // Filter and sort needs
  const filteredNeeds = allNeeds.filter(need => {
    const matchesSearch = need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.place.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterType || need.type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const sortedNeeds = [...filteredNeeds].sort((a, b) => {
    switch (sortBy) {
      case 'urgent':
        return (a.amountRaised / a.amountNeeded) - (b.amountRaised / b.amountNeeded)
      case 'newest':
        return b.id.localeCompare(a.id) // Assuming higher IDs are newer
      case 'closest':
        return (b.amountRaised / b.amountNeeded) - (a.amountRaised / a.amountNeeded)
      default:
        return 0
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Find a Need to Support</h1>
            <p className="text-muted-foreground mt-2">Browse verified reports and make a direct impact.</p>
          </div>

          <div className="mb-8 p-4 bg-card rounded-lg border flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by title or location..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="food">Food & Water</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Most Urgent</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="closest">Closest to Goal</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {loading && allNeeds.length === 0 ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Loading needs...</h2>
              <p className="text-muted-foreground mt-2">Fetching data from the blockchain</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error loading needs</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : sortedNeeds.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {sortedNeeds.length} need{sortedNeeds.length !== 1 ? 's' : ''} found
                </p>
                {loading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Refreshing...
                  </div>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedNeeds.map((need) => (
                  <DonorNeedCard key={need.id} need={need} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold">No needs found</h2>
              <p className="text-muted-foreground mt-2">
                {searchTerm || filterType ? 'Try adjusting your search or filter criteria.' : 'No needs have been reported yet.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
