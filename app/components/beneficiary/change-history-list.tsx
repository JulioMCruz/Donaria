import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type Change = {
  id: string
  date: string
  field: string
  oldValue: string
  newValue: string
}

interface ChangeHistoryListProps {
  history: Change[]
}

export function ChangeHistoryList({ history }: ChangeHistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transparency Log: Edit History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <ScrollArea className="h-72">
            <div className="space-y-6">
              {history.map((change) => (
                <div key={change.id} className="flex items-start gap-4">
                  <div className="text-center">
                    <p className="font-semibold text-sm">
                      {new Date(change.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(change.date).toLocaleDateString("en-US", { year: "numeric" })}
                    </p>
                  </div>
                  <div className="border-l pl-4 flex-1">
                    <p className="text-sm">
                      Field <Badge variant="secondary">{change.field}</Badge> was updated.
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>
                        <span className="font-semibold">From:</span> {change.oldValue}
                      </p>
                      <p>
                        <span className="font-semibold">To:</span> {change.newValue}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No changes have been made to this report yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
