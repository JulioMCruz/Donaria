import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

interface DonorNeedCardProps {
  need: Need
}

export function DonorNeedCard({ need }: DonorNeedCardProps) {
  const progress = (need.amountRaised / need.amountNeeded) * 100

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="relative h-40 w-full mb-4">
          <img
            src={need.imageUrl || "/placeholder.svg"}
            alt={need.title}
            className="rounded-lg object-cover w-full h-full"
          />
          <Badge variant="secondary" className="absolute top-2 left-2">
            {need.type}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-snug">{need.title}</CardTitle>
        <CardDescription>{need.place}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-sm">
            <span className="font-semibold">${need.amountRaised.toLocaleString()}</span>
            <span className="text-muted-foreground">raised of ${need.amountNeeded.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/donor/needs/${need.id}`} className="w-full">
          <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">View & Donate</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
