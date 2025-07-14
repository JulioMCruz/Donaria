"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, HandHeart, Loader2 } from "lucide-react"
import { ImageGallery } from "@/app/components/beneficiary/image-gallery"
import { DonationList } from "@/app/components/beneficiary/donation-list"
import { ChangeHistoryList } from "@/app/components/beneficiary/change-history-list"
import { DonationInteractionCard } from "@/app/components/donor/donation-interaction-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentList } from "@/app/components/donor/comment-list"
import { CommentForm } from "@/app/components/donor/comment-form"
import { useState, useEffect, use } from "react"
import { toast } from "sonner"

interface ApiNeed {
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

interface DonorNeedDetails {
  id: string
  title: string
  description: string
  place: string
  amountNeeded: number
  amountRaised: number
  walletAddress: string
  status: string
  author: string
  authorAvatarUrl: string | null
  reputationScore: number
  images: string[]
  donations: Array<{ id: string; amount: number; wallet: string; date: string }>
  changeHistory: Array<{ id: string; date: string; field: string; oldValue: string; newValue: string }>
  comments: Array<{ id: string; author: string; date: string; text: string; avatarUrl: string | null }>
}

interface UserProfile {
  id?: string
  firebaseUid: string
  email?: string
  name?: string
  avatar?: string
  provider: string
  walletAddress?: string
  createdAt?: string
  updatedAt?: string
}

export default function DonorNeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [needDetails, setNeedDetails] = useState<DonorNeedDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realDonations, setRealDonations] = useState<Array<{ id: string; amount: number; wallet: string; date: string; transactionHash?: string }>>([])
  const [donationsLoading, setDonationsLoading] = useState(false)

  // Function to fetch real donations for the need
  const fetchRealDonations = async (needId: string) => {
    try {
      setDonationsLoading(true)
      console.log('💰 Fetching real donations for need:', needId)
      
      const response = await fetch(`/api/donations/by-need?needId=${needId}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log(`✅ Loaded ${data.donations.length} real donations`)
        setRealDonations(data.donations)
      } else {
        console.error('❌ Failed to fetch donations:', data.error)
        setRealDonations([])
      }
    } catch (error) {
      console.error('❌ Error fetching donations:', error)
      setRealDonations([])
    } finally {
      setDonationsLoading(false)
    }
  }

  // Function to fetch user data by wallet address
  const fetchUserData = async (walletAddress: string): Promise<UserProfile | null> => {
    try {
      console.log('👤 Fetching user data for wallet:', walletAddress.substring(0, 10) + '...')
      const response = await fetch(`/api/users/by-wallet?walletAddress=${walletAddress}`)
      const data = await response.json()

      if (response.ok && data.exists) {
        console.log('✅ User data found:', data.user.name || 'No name')
        return data.user
      } else {
        console.log('⚠️ No user data found for wallet')
        return null
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
      return null
    }
  }

  // Function to transform API data to donor detail format
  const transformApiNeedToDetails = async (apiNeed: ApiNeed): Promise<DonorNeedDetails> => {
    // Fetch user data for the creator
    const userData = await fetchUserData(apiNeed.creator)
    
    return {
      id: apiNeed.id,
      title: apiNeed.title,
      description: apiNeed.description,
      place: apiNeed.location,
      amountNeeded: apiNeed.amountNeeded,
      amountRaised: apiNeed.amountRaised,
      walletAddress: apiNeed.creator,
      status: apiNeed.status,
      author: userData?.name || apiNeed.creator.substring(0, 10) + '...', // Use real name or truncated wallet
      authorAvatarUrl: userData?.avatar || "/beneficiary-avatar.png", // Use real avatar or default
      reputationScore: 92, // Default reputation score
      images: apiNeed.imageUrls && apiNeed.imageUrls.length > 0 ? apiNeed.imageUrls : [apiNeed.imageUrl],
      // Mock data for donations, change history, and comments (these would need separate API endpoints)
      donations: [
        { id: "d1", amount: 50, wallet: "GXYZ...ABC", date: "2025-07-13" },
        { id: "d2", amount: 25, wallet: "GDEF...TUV", date: "2025-07-12" },
      ],
      changeHistory: [
        {
          id: "c1",
          date: new Date(apiNeed.updatedAt).toLocaleDateString(),
          field: "Last Updated",
          oldValue: "Previous version",
          newValue: "Current version",
        },
      ],
      comments: [
        {
          id: "comment1",
          author: "John D.",
          date: "2025-07-14",
          text: "Happy to help! Stay strong.",
          avatarUrl: "/stylized-man-avatar.png",
        },
        {
          id: "comment2",
          author: "Anonymous Donor",
          date: "2025-07-13",
          text: "Sending support from afar.",
          avatarUrl: null,
        },
      ],
    }
  }

  // Function to fetch need data
  const fetchNeed = async () => {
    if (!resolvedParams.id) return

    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Fetching need data for donor view, ID:', resolvedParams.id)

      const response = await fetch(`/api/soroban/need-reports/get?reportId=${resolvedParams.id}`)
      const data = await response.json()

      if (response.ok && data.success && data.reports) {
        const transformedNeed = await transformApiNeedToDetails(data.reports)
        console.log('✅ Need data loaded for donor view:', transformedNeed)
        setNeedDetails(transformedNeed)
        
        // Fetch real donations for this need
        await fetchRealDonations(resolvedParams.id)
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

  // Fetch need data on component mount
  useEffect(() => {
    fetchNeed()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
          <Link href="/" className="flex items-center justify-center gap-2">
            <HandHeart className="h-6 w-6 text-teal-500" />
            <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
          </Link>
          <Link href="/dashboard/donor">
            <Button variant="outline" size="sm" className="bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Needs
            </Button>
          </Link>
        </header>
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading need details...</h2>
          <p className="text-muted-foreground mt-2">Fetching information from the blockchain</p>
        </div>
      </div>
    )
  }

  if (error || !needDetails) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
          <Link href="/" className="flex items-center justify-center gap-2">
            <HandHeart className="h-6 w-6 text-teal-500" />
            <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
          </Link>
          <Link href="/dashboard/donor">
            <Button variant="outline" size="sm" className="bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Needs
            </Button>
          </Link>
        </header>
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-16 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error loading need</h2>
              <p className="text-muted-foreground mt-2">{error || 'Need not found'}</p>
              <Link href="/dashboard/donor">
                <Button className="mt-4">Back to Donor Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center gap-2">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>
        <Link href="/dashboard/donor">
          <Button variant="outline" size="sm" className="bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Needs
          </Button>
        </Link>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ImageGallery images={needDetails.images} />
            </div>
            <div className="row-start-1 lg:row-auto">
              <DonationInteractionCard 
                need={needDetails} 
                onDonationComplete={() => {
                  // Refresh the need data and donations after donation
                  fetchNeed()
                  fetchRealDonations(resolvedParams.id)
                }}
              />
            </div>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Activity & Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="comments">
                  <TabsList className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3">
                    <TabsTrigger value="comments">Comments ({needDetails.comments.length})</TabsTrigger>
                    <TabsTrigger value="donations">Donations ({realDonations.length})</TabsTrigger>
                    <TabsTrigger value="history">History ({needDetails.changeHistory.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="comments" className="pt-6">
                    <CommentList comments={needDetails.comments} />
                    <CommentForm />
                  </TabsContent>
                  <TabsContent value="donations" className="pt-6">
                    {donationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading donations...</span>
                      </div>
                    ) : (
                      <DonationList donations={realDonations} />
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="pt-6">
                    <ChangeHistoryList history={needDetails.changeHistory} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
