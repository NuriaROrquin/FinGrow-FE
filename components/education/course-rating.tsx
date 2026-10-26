"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { toast } from "sonner"
import { rateCourse, toastApiError, type CourseDetailDto } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

const scores = [1, 2, 3, 4, 5]

interface CourseRatingProps {
  slug: string
  averageRating: number | null
  ratingCount: number
  myRating: number | null
  canRate: boolean
  onRated: (course: CourseDetailDto) => void
}

function formatAverage(average: number): string {
  return formatNumber(average, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function CourseRating({ slug, averageRating, ratingCount, myRating, canRate, onRated }: CourseRatingProps) {
  const t = useMessages().education
  const [hovered, setHovered] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const handleRate = async (score: number) => {
    setIsSaving(true)
    try {
      const updated = await rateCourse(slug, score)
      onRated(updated)
      toast.success(myRating === null ? t.ratingThanks : t.ratingUpdated)
    } catch (error) {
      toastApiError(error, t.ratingFailed)
    } finally {
      setIsSaving(false)
    }
  }

  const highlighted = hovered || myRating || 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <StarIcon className={cn("size-4", averageRating !== null && "fill-yellow-400 text-yellow-400")} />
        {averageRating === null ? (
          <span>{t.noRatings}</span>
        ) : (
          <span>
            <span className="font-medium text-foreground">{formatAverage(averageRating)}</span> ·{" "}
            {t.ratingCount(ratingCount)}
          </span>
        )}
      </div>

      {canRate ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {myRating === null ? t.rateThisCourse : t.yourRating}
          </p>
          <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
            {scores.map((score) => (
              <button
                key={score}
                type="button"
                disabled={isSaving}
                onClick={() => handleRate(score)}
                onMouseEnter={() => setHovered(score)}
                className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                aria-label={t.rateWith(score)}
                aria-pressed={myRating === score}
              >
                <StarIcon
                  className={cn(
                    "size-6 transition-colors",
                    score <= highlighted ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                  )}
                />
              </button>
            ))}
            {myRating !== null && <span className="ml-2 text-sm text-muted-foreground">({myRating}/5)</span>}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t.finishToRate}</p>
      )}
    </div>
  )
}
