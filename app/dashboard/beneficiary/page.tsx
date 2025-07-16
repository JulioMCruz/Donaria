"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, RefreshCw } from "lucide-react"
import { NeedCard } from "@/app/components/beneficiary/need-card"
import { useAuth } from "@/contexts/AuthContext"
import { useWallet } from "@/contexts/WalletContext"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Need = {
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

export default function BeneficiaryDashboard() {
  const { user } = useAuth()
  const { wallet } = useWallet()
  const [reports, setReports] = useState<Need[]>([])
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)

  // Function to fetch user reports from the API
  const fetchReports = async () => {
    if (!user || !wallet?.publicKey) {
      console.log('⏳ User or wallet not ready yet, user:', !!user, 'publicKey:', !!wallet?.publicKey)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Fetching reports for user:', wallet.publicKey.substring(0, 10) + '...')

      // Use direct SDK route in development, rewrite handles it in production
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('ngrok.io') ||
                           process.env.NODE_ENV === 'development'
      const apiUrl = isDevelopment
        ? `/api/vercel/soroban/need-reports/user?userAddress=${wallet.publicKey}`
        : `/api/soroban/need-reports/user?userAddress=${wallet.publicKey}`
      
      console.log('🌍 Environment:', process.env.NODE_ENV)
      console.log('🌐 Hostname:', window.location.hostname)
      console.log('🔧 isDevelopment:', isDevelopment)
      console.log('🔗 API URL:', apiUrl)
      console.log('📡 Making fetch request...')
      
      const response = await fetch(apiUrl)
      console.log('📊 Response status:', response.status)
      console.log('📊 Response ok:', response.ok)
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (response.ok && data.success) {
        console.log(`✅ Successfully loaded ${data.reports.length} reports`)
        setReports(data.reports)
      } else {
        console.error('❌ API request failed:')
        console.error('  - Status:', response.status)
        console.error('  - Data:', data)
        console.error('  - Error:', data.error)
        setError(data.error || 'Failed to fetch reports')
        toast.error('Failed to load your reports')
      }
    } catch (error: any) {
      console.error('❌ Error fetching reports:', error)
      setError('Failed to load reports')
      toast.error('Failed to load your reports')
    } finally {
      setLoading(false)
    }
  }

  // Load reports when component mounts and when user/wallet changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - user:', !!user, 'publicKey:', !!wallet?.publicKey)
    if (user && wallet?.publicKey) {
      fetchReports()
    } else {
      setLoading(false) // Stop loading if no user or wallet
    }
  }, [user, wallet?.publicKey])

  // Manual refresh function
  const handleRefresh = () => {
    fetchReports()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Your Reported Needs</h1>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link href="/dashboard/beneficiary/create-need">
                <Button size="lg">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Report
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {loading && reports.length === 0 ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Loading your reports...</h2>
              <p className="text-muted-foreground mt-2">Fetching data from the blockchain</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error loading reports</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : reports.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} found
                </p>
                {loading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Refreshing...
                  </div>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((need) => (
                  <NeedCard key={need.id} need={need} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold">No reports found</h2>
              <p className="text-muted-foreground mt-2">Get started by creating your first emergency report.</p>
              <Link href="/dashboard/beneficiary/create-need" className="mt-4 inline-block">
                <Button>Create Your First Report</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
