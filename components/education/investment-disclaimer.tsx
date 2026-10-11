import { InfoIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function InvestmentDisclaimer({ className }: { className?: string }) {
  return (
    <Alert className={cn("border-primary/20 bg-primary/5", className)}>
      <InfoIcon className="text-primary" />
      <AlertTitle>Material educativo</AlertTitle>
      <AlertDescription>
        Este contenido es para aprender y no es asesoramiento financiero certificado. Las decisiones de inversión son
        tuyas: evaluá tu situación y, si lo necesitás, consultá a un asesor profesional.
      </AlertDescription>
    </Alert>
  )
}
