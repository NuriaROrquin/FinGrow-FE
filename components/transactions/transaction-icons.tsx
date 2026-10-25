import type { LucideIcon } from "lucide-react"
import {
  Utensils,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  Popcorn,
  Shirt,
  PiggyBank,
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
  Tag,
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
} from "lucide-react"
import type { PaymentMethod } from "@/lib/api/transactions"

// Mapa de categoría (clave del enum, ej. "AhorroInversion") a ícono representativo.
const categoryIconMap: Record<string, LucideIcon> = {
  // Gastos
  Alimentos: Utensils,
  Transporte: Car,
  Vivienda: Home,
  Servicios: Zap,
  Salud: HeartPulse,
  Educacion: GraduationCap,
  Entretenimiento: Popcorn,
  Indumentaria: Shirt,
  AhorroInversion: PiggyBank,
  // Ingresos
  Salario: Wallet,
  Freelance: Laptop,
  Inversiones: TrendingUp,
  Regalo: Gift,
  Otros: Tag,
}

export function getCategoryIcon(category: string): LucideIcon {
  return categoryIconMap[category] ?? Tag
}

const paymentMethodIconMap: Record<PaymentMethod, LucideIcon> = {
  Cash: Banknote,
  CreditCard: CreditCard,
  DebitCard: CreditCard,
  BankTransfer: Landmark,
  DigitalWallet: Smartphone,
}

export function getPaymentMethodIcon(paymentMethod: PaymentMethod): LucideIcon {
  return paymentMethodIconMap[paymentMethod] ?? CreditCard
}
