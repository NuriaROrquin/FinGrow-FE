"use client"

import { AchievementMedal } from "@/components/achievements/achievement-medal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AchievementDto } from "@/lib/api"
import { formatDate } from "@/lib/format"

// Los meses destacados (mayor ingreso, mayor gasto, mejor ahorro) son de HU-41 y están en
// `monthly-highlights-card.tsx`: acá quedan los hitos alcanzados de HU-44, que son los logros del período.
export function FinancialSummaryCard({ achievements }: { achievements: AchievementDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hitos Alcanzados</CardTitle>
        <CardDescription>Los logros que ganaste en el período</CardDescription>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <ul className="space-y-3">
            {achievements.map((achievement) => (
              <li key={achievement.code} className="flex items-center gap-3">
                <AchievementMedal code={achievement.code} size="sm" />
                <div>
                  <p className="text-sm font-medium">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                    {achievement.achievedAt ? ` · ${formatDate(achievement.achievedAt)}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no ganaste logros en este período.</p>
        )}
      </CardContent>
    </Card>
  )
}
