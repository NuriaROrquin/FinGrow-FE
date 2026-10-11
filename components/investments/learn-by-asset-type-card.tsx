"use client"

import Link from "next/link"
import { ChevronRightIcon, LightbulbIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { investmentTypeLabels, type InvestmentType } from "@/lib/api"

const allTypes = Object.keys(investmentTypeLabels) as InvestmentType[]

function TypeChips({ types, onOpen }: { types: InvestmentType[]; onOpen: (type: InvestmentType) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Button key={type} variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={() => onOpen(type)}>
          {investmentTypeLabels[type]}
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
  const otherTypes = allTypes.filter((type) => !heldTypes?.includes(type))

  return (
    <Card className="h-full border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LightbulbIcon className="size-5 text-primary" />
          Aprendé sobre tus inversiones
        </CardTitle>
        <CardDescription>Cursos y artículos según el tipo de activo</CardDescription>
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
              <p className="text-xs font-medium text-muted-foreground">En tu cartera</p>
              {heldTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="w-full justify-between bg-background"
                  onClick={() => onOpen(type)}
                >
                  {investmentTypeLabels[type]}
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
            {otherTypes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Otros tipos de activo</p>
                <TypeChips types={otherTypes} onOpen={onOpen} />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Elegí un tipo de activo para ver qué conviene saber antes de invertir.</p>
            <TypeChips types={allTypes} onOpen={onOpen} />
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
          <Link href="/dashboard/education">Ver más recursos educativos</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
