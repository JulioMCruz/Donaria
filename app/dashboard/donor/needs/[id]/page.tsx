import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, HandHeart } from "lucide-react"
import { ImageGallery } from "@/app/components/beneficiary/image-gallery"
import { DonationList } from "@/app/components/beneficiary/donation-list"
import { ChangeHistoryList } from "@/app/components/beneficiary/change-history-list"
import { DonationForm } from "@/app/components/donor/donation-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentList } from "@/app/components/donor/comment-list"
import { CommentForm } from "@/app/components/donor/comment-form"

// Mock data for a single need
const needDetails = {
  id: "2",
  title: "Medical Supplies for Local Clinic",
  description:
    "Our local clinic was damaged in the recent earthquake and is running critically low on essential medical supplies, including bandages, antiseptics, and basic medication. Your support can help us restock and continue providing care to over 200 families in the area.",
  place: "Riverside, Central Province",
  amountNeeded: 2500,
  amountRaised: 1200,
  walletAddress: "GABCDE...WXYZ",
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
  ],
  changeHistory: [
    {
      id: "c1",
      date: "2025-07-10",
      field: "Amount Needed",
      oldValue: "$2,000",
      newValue: "$2,500",
    },
  ],
  comments: [
    {
      id: "comment1",
      author: "John D.",
      date: "2025-07-14",
      text: "Happy to help! Stay strong, Riverside.",
      avatarUrl: "/stylized-man-avatar.png",
    },
    {
      id: "comment2",
      author: "Anonymous Donor",
      date: "2025-07-13",
      text: "Sending support from afar.",
      avatarUrl: null,
    },
    {
      id: "comment3",
      author: "Maria S.",
      date: "2025-07-13",
      text: "My thoughts are with your community.",
      avatarUrl: "/avatar-woman.png",
    },
  ],
}

export default function DonorNeedDetailPage({ params }: { params: { id: string } }) {
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
              <DonationForm need={needDetails} />
            </div>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Activity & Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="comments">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="comments">Comments ({needDetails.comments.length})</TabsTrigger>
                    <TabsTrigger value="donations">Donations ({needDetails.donations.length})</TabsTrigger>
                    <TabsTrigger value="history">History ({needDetails.changeHistory.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="comments" className="pt-6">
                    <CommentList comments={needDetails.comments} />
                    <CommentForm />
                  </TabsContent>
                  <TabsContent value="donations" className="pt-6">
                    <DonationList donations={needDetails.donations} />
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
