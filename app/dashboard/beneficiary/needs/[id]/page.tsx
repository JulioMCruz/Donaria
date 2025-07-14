import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, HandHeart, Pencil } from "lucide-react"
import { ImageGallery } from "@/app/components/beneficiary/image-gallery"
import { DonationList } from "@/app/components/beneficiary/donation-list"
import { Progress } from "@/components/ui/progress"
import { ChangeHistoryList } from "@/app/components/beneficiary/change-history-list"

// Mock data for a single need, including multiple images and donations
const needDetails = {
  id: "2",
  title: "Medical Supplies for Local Clinic",
  description:
    "Our local clinic was damaged in the recent earthquake and is running critically low on essential medical supplies, including bandages, antiseptics, and basic medication. Your support can help us restock and continue providing care to over 200 families in the area.",
  place: "Riverside, Central Province",
  amountNeeded: 2500,
  amountRaised: 1200,
  walletAddress: "GABC...XYZ",
  status: "Verified",
  images: [
    "/medical-clinic-waiting-area.png",
    "/placeholder-8ospr.png",
    "/placeholder-8ospr.png",
    "/placeholder-8ospr.png",
  ],
  donations: [
    { id: "d1", amount: 50, wallet: "GXYZ...ABC", date: "2025-07-13" },
    { id: "d2", amount: 25, wallet: "GDEF...TUV", date: "2025-07-12" },
    { id: "d3", amount: 100, wallet: "GHIJ...QRS", date: "2025-07-12" },
    { id: "d4", amount: 10, wallet: "ANONYMOUS", date: "2025-07-11" },
  ],
  changeHistory: [
    {
      id: "c1",
      date: "2025-07-10",
      field: "Amount Needed",
      oldValue: "$2,000",
      newValue: "$2,500",
    },
    {
      id: "c2",
      date: "2025-07-09",
      field: "Description",
      oldValue: "Low on medical supplies.",
      newValue: "Critically low on essential medical supplies, including bandages...",
    },
  ],
}

export default function NeedDetailPage({ params }: { params: { id: string } }) {
  const progress = (needDetails.amountRaised / needDetails.amountNeeded) * 100
  const canEdit = needDetails.status !== "Funded"

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center gap-2">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href={`/dashboard/beneficiary/needs/${params.id}/edit`}>
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
              <ImageGallery images={needDetails.images} />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">{needDetails.title}</CardTitle>
                  <CardDescription>{needDetails.place}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{needDetails.description}</p>
                  <div>
                    <div className="mb-2">
                      <Progress value={progress} />
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        ${needDetails.amountRaised.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        raised of ${needDetails.amountNeeded.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">Receiving Wallet:</p>
                    <p className="text-muted-foreground break-all">{needDetails.walletAddress}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <DonationList donations={needDetails.donations} />
            <ChangeHistoryList history={needDetails.changeHistory} />
          </div>
        </div>
      </main>
    </div>
  )
}
