import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Donation = {
  id: string
  amount: number
  wallet: string
  date: string
}

interface DonationListProps {
  donations: Donation[]
}

export function DonationList({ donations }: DonationListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Donations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>From Wallet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell>{new Date(donation.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">${donation.amount.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground truncate" style={{ maxWidth: "150px" }}>
                  {donation.wallet}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
