"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, HandHeart, Pencil, Loader2 } from "lucide-react"
import { ImageGallery } from "@/app/components/beneficiary/image-gallery"
import { DonationList } from "@/app/components/beneficiary/donation-list"
import { Progress } from "@/components/ui/progress"
import { ChangeHistoryList } from "@/app/components/beneficiary/change-history-list"
import { useState, useEffect, use } from "react"
import { toast } from "sonner"

interface Need {
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

export default function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [need, setNeed] = useState<Need | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch need data on component mount
  useEffect(() => {
    const fetchNeed = async () => {
      if (!resolvedParams.id) return

      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching need data for ID:', resolvedParams.id)

        const response = await fetch(`/api/soroban/need-reports/get?reportId=${resolvedParams.id}`)
        const data = await response.json()

        if (response.ok && data.success && data.reports) {
          const needData = data.reports
          console.log('✅ Need data loaded:', needData)
          setNeed(needData)
        } else {
          console.error('❌ Failed to fetch need:', data.error)
          setError(data.error || 'Failed to fetch need data')
          toast.error('Failed to load need data')
        }
      } catch (error: any) {
        console.error('❌ Error fetching need:', error)
        setError('Failed to load need data')
        toast.error('Failed to load need data')
      } finally {
        setLoading(false)
      }
    }

    fetchNeed()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading need details...</h2>
          <p className="text-muted-foreground mt-2">Fetching information from the blockchain</p>
        </div>
      </div>
    )
  }

  if (error || !need) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
        <div className="text-center py-16 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error loading need</h2>
          <p className="text-muted-foreground mt-2">{error || 'Need not found'}</p>
          <Link href="/dashboard/beneficiary">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const progress = (need.amountRaised / need.amountNeeded) * 100
  const canEdit = need.status !== "Funded"

  // Mock data for donations and change history (these would need separate API endpoints)
  const donations = [
    { id: "d1", amount: 50, wallet: "GXYZ...ABC", date: "2025-07-13" },
    { id: "d2", amount: 25, wallet: "GDEF...TUV", date: "2025-07-12" },
  ]
  
  const changeHistory = [
    {
      id: "c1",
      date: new Date(need.updatedAt).toLocaleDateString(),
      field: "Last Updated",
      oldValue: "Previous version",
      newValue: "Current version",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center gap-2">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href={`/dashboard/beneficiary/needs/${resolvedParams.id}/edit`}>
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Need
              </Button>
            </Link>
          )}
          <Link href="/dashboard/beneficiary">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <ImageGallery images={need.imageUrls || [need.imageUrl]} />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">{need.title}</CardTitle>
                  <CardDescription>{need.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{need.description}</p>
                  <div>
                    <div className="mb-2">
                      <Progress value={progress} />
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        ${(need.amountRaised / 100).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        raised of ${(need.amountNeeded / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">Receiving Wallet:</p>
                    <p className="text-muted-foreground break-all">{need.creator}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">Status:</p>
                    <p className="text-muted-foreground">{need.status}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">Category:</p>
                    <p className="text-muted-foreground">{need.category}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <DonationList donations={donations} />
            <ChangeHistoryList history={changeHistory} />
          </div>
        </div>
      </main>
    </div>
  )
}
