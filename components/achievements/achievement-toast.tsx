"use client"

import { MedalIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import type { AchievementDto } from "@/lib/api"
import type { Messages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { AchievementMedal, MedalStar } from "./achievement-medal"

const TOAST_DURATION_MS = 6_000

/** Las estrellas que salen de la medalla del toast: destino de cada una y su demora. */
const toastStars = [
  { dx: "-1.6rem", dy: "-1.25rem", delay: "0s" },
  { dx: "1.6rem", dy: "-1.5rem", delay: "0.08s" },
  { dx: "1.75rem", dy: "1rem", delay: "0.15s" },
]

/** Toast de un logro: va donde van los demás toasts, con borde dorado y la medalla del logro. */
export function showAchievementToast(achievement: AchievementDto, t: Messages) {
  toast.custom(
    (id) => (
      <ToastFrame onClose={() => toast.dismiss(id)} closeLabel={t.achievements.close}>
        <span className="relative">
          <AchievementMedal code={achievement.code} />
          {toastStars.map((star) => (
            <MedalStar key={star.dx + star.dy} {...star} />
          ))}
        </span>
        <TitledText title={t.achievements.unlocked}>
          <span className="block text-sm font-medium">{achievement.name}</span>
          <span className="block text-sm text-muted-foreground">{achievement.description}</span>
        </TitledText>
      </ToastFrame>
    ),
    { duration: TOAST_DURATION_MS },
  )
}

/** Varios logros juntos (el otorgamiento retroactivo, o dos que se ganan con una misma acción): un toast con todas las medallas. */
export function showAchievementsToast(achievements: AchievementDto[], t: Messages) {
  toast.custom(
    (id) => (
      <ToastFrame onClose={() => toast.dismiss(id)} closeLabel={t.achievements.close} centered>
        <span className="flex w-full flex-col items-center text-center">
          <span className="flex items-center gap-1.5 text-sm font-bold text-gold">
            <MedalIcon className="size-4 shrink-0" aria-hidden />
            {t.achievements.unlockedMany}
          </span>
          <span className="text-sm font-medium">{t.achievements.earnedCount(achievements.length)}</span>
          <span className="mt-2 flex flex-wrap justify-center gap-1.5">
            {achievements.map((achievement) => (
              <span key={achievement.code} title={achievement.name}>
                <AchievementMedal code={achievement.code} size="sm" />
              </span>
            ))}
          </span>
        </span>
      </ToastFrame>
    ),
    { duration: TOAST_DURATION_MS },
  )
}

function ToastFrame({
  children,
  onClose,
  closeLabel,
  centered = false,
}: {
  children: React.ReactNode
  onClose: () => void
  closeLabel: string
  /** Con el contenido centrado, el margen de la X va de los dos lados para no correr el eje. */
  centered?: boolean
}) {
  return (
    <div
      className={cn(
        "relative ml-auto flex w-fit min-w-64 max-w-[min(356px,calc(100vw-2rem))] items-center gap-3 rounded-md border-[1.5px] border-gold bg-popover py-3 text-popover-foreground shadow-lg",
        centered ? "px-9" : "pr-9 pl-4",
      )}
    >
      {children}
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute top-2 right-2 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  )
}

/** El ícono va en su propia columna para que las líneas de abajo arranquen alineadas con el título. */
function TitledText({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 gap-1.5">
      <MedalIcon className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-gold">{title}</span>
        {children}
      </span>
    </span>
  )
}
