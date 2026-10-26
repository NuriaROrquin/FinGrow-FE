"use client"

import { useEffect, useState } from "react"
import { ShieldCheckIcon, UsersIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getCompanyParticipation, toastApiError, type CompanyParticipationDto } from "@/lib/api"
import { formatDateText, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

function monthLabel(periodStart: string) {
  return formatDateText(periodStart, { month: "long", year: "numeric" })
}

function formatRate(rate: number) {
  return `${formatNumber(rate, { maximumFractionDigits: 1 })}%`
}

function ParticipationDetail({ participation }: { participation: CompanyParticipationDto }) {
  const t = useMessages().companyPanel

  if (participation.isParticipationHidden) {
    return (
      <div className="flex items-start gap-1 text-sm text-muted-foreground">
        <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
        <span>{t.participationShownFrom(participation.minimumGroupSize)}</span>
      </div>
    )
  }

  if (participation.participationRate === null) {
    return <p className="text-sm text-muted-foreground">{t.noActiveEmployees}</p>
  }

  return (
    <>
      <Progress value={participation.participationRate} className="h-2" />
      <p className="text-sm text-muted-foreground mt-2">
        {t.participationDetail(
          participation.participatingEmployees ?? 0,
          participation.activeEmployees,
          monthLabel(participation.periodStart),
        )}
      </p>
    </>
  )
}

export function ParticipationCards() {
  const t = useMessages().companyPanel
  const [participation, setParticipation] = useState<CompanyParticipationDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getCompanyParticipation(controller.signal)
      .then(setParticipation)
      .catch((error) => {
        if (!controller.signal.aborted) {
          toastApiError(error, t.participationLoadFailed)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [t])

  if (isLoading || !participation) {
    return (
      <>
        {[t.totalEmployees, t.participationRate].map((title) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl">{isLoading ? <Skeleton className="h-8 w-20" /> : "—"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-5 w-full" />
              ) : (
                <p className="text-sm text-muted-foreground">{t.notAvailable}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  const inactiveEmployees = participation.totalEmployees - participation.activeEmployees

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.totalEmployees}</CardDescription>
          <CardTitle className="text-2xl">{participation.totalEmployees}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <UsersIcon className="size-4" />
            <span>
              {t.activeCount(participation.activeEmployees)}
              {inactiveEmployees > 0 && t.withoutAccess(inactiveEmployees)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.participationRate}</CardDescription>
          <CardTitle className="text-2xl">
            {participation.participationRate === null ? "—" : formatRate(participation.participationRate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipationDetail participation={participation} />
        </CardContent>
      </Card>
    </>
  )
}
