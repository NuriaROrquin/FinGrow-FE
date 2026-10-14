"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { AchievementDto } from "@/lib/api"
import { useMessages } from "@/lib/i18n"

import { AchievementMedal, MedalStar } from "./achievement-medal"

const celebrationStars = [
  { dx: "-4.1rem", dy: "-1.9rem", delay: "0s" },
  { dx: "4rem", dy: "-2.25rem", delay: "0.06s" },
  { dx: "-4.6rem", dy: "1.5rem", delay: "0.12s" },
  { dx: "4.5rem", dy: "1.75rem", delay: "0.18s" },
  { dx: "-2.5rem", dy: "-4rem", delay: "0.1s" },
  { dx: "2.6rem", dy: "-4.1rem", delay: "0.22s" },
  { dx: "0rem", dy: "4.25rem", delay: "0.16s" },
]

interface AchievementCelebrationDialogProps {
  achievement: AchievementDto | null
  onClose: () => void
}

/** La celebración central de un logro importante. */
export function AchievementCelebrationDialog({ achievement, onClose }: AchievementCelebrationDialogProps) {
  const t = useMessages()

  return (
    <Dialog open={achievement !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs border-[1.5px] border-gold text-center">
        {achievement && (
          <div className="flex flex-col items-center gap-1 pt-2">
            <span className="relative mb-3">
              <AchievementMedal code={achievement.code} size="lg" className="animate-in zoom-in-50 duration-500" />
              {celebrationStars.map((star) => (
                <MedalStar key={star.dx + star.dy} {...star} />
              ))}
            </span>
            <p className="text-xs font-medium text-gold">{t.achievements.unlocked}</p>
            <DialogTitle className="text-lg">{achievement.name}</DialogTitle>
            <DialogDescription className="mb-4">{achievement.description}</DialogDescription>
            <Button className="w-full" onClick={onClose}>
              {t.achievements.great}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
