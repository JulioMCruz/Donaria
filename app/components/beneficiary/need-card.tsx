import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Need = {
  id: string
  title: string
  amountNeeded: number
  amountRaised: number
  status: "Pending" | "Verified" | "Funded"
  imageUrl: string
}

interface NeedCardProps {
  need: Need
}

export function NeedCard({ need }: NeedCardProps) {
  const progress = (need.amountRaised / need.amountNeeded) * 100

  return (
    <Card>
      <CardHeader>
        <div className="relative h-40 w-full mb-4">
          <img
            src={need.imageUrl || "/placeholder.svg"}
            alt={need.title}
            className="rounded-lg object-cover w-full h-full"
          />
          <Badge
            className={cn("absolute top-2 right-2", {
              "bg-yellow-500 text-white": need.status === "Pending",
              "bg-green-500 text-white": need.status === "Verified",
              "bg-teal-500 text-white": need.status === "Funded",
            })}
          >
            {need.status}
          </Badge>
        </div>
        <CardTitle className="text-lg">{need.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-sm">
            <span className="font-semibold">${need.amountRaised.toLocaleString()}</span>
            <span className="text-muted-foreground">raised of ${need.amountNeeded.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/beneficiary/needs/${need.id}`} className="w-full">
          <Button variant="secondary" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
