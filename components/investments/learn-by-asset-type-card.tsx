"use client"

import Link from "next/link"
import { ChevronRightIcon, LightbulbIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { INVESTMENT_TYPES, type InvestmentType } from "@/lib/api"
import { useMessages } from "@/lib/i18n"

function TypeChips({ types, onOpen }: { types: InvestmentType[]; onOpen: (type: InvestmentType) => void }) {
  const typeLabels = useMessages().labels.investmentTypes

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Button key={type} variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={() => onOpen(type)}>
          {typeLabels[type]}
        </Button>
      ))}
    </div>
  )
}

export function LearnByAssetTypeCard({
  heldTypes,
  onOpen,
}: {
  heldTypes: InvestmentType[] | null
  onOpen: (type: InvestmentType) => void
}) {
  const messages = useMessages()
  const t = messages.investments
  const typeLabels = messages.labels.investmentTypes
  const otherTypes = INVESTMENT_TYPES.filter((type) => !heldTypes?.includes(type))

  return (
    <Card className="h-full border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LightbulbIcon className="size-5 text-primary" />
          {t.learnTitle}
        </CardTitle>
        <CardDescription>{t.learnDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {heldTypes === null ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : heldTypes.length > 0 ? (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{t.inYourPortfolio}</p>
              {heldTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="w-full justify-between bg-background"
                  onClick={() => onOpen(type)}
                >
                  {typeLabels[type]}
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
            {otherTypes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t.otherTypes}</p>
                <TypeChips types={otherTypes} onOpen={onOpen} />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t.pickType}</p>
            <TypeChips types={INVESTMENT_TYPES} onOpen={onOpen} />
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
          <Link href="/dashboard/education">{t.moreResources}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
