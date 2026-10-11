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
import type { PaymentMethodLabel } from "@/lib/api/transactions"

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

// Mismo mapa pero indexado por la etiqueta ya traducida (ej. "Ahorro e Inversión"),
// por si el backend devuelve el texto en lugar de la clave del enum.
const categoryIconMapByLabel: Record<string, LucideIcon> = {
  Alimentos: Utensils,
  Transporte: Car,
  Vivienda: Home,
  Servicios: Zap,
  Salud: HeartPulse,
  Educación: GraduationCap,
  Entretenimiento: Popcorn,
  Indumentaria: Shirt,
  "Ahorro e Inversión": PiggyBank,
  Salario: Wallet,
  Freelance: Laptop,
  Inversiones: TrendingUp,
  Regalo: Gift,
  Otros: Tag,
}

export function getCategoryIcon(category: string): LucideIcon {
  return categoryIconMap[category] ?? categoryIconMapByLabel[category] ?? Tag
}

const paymentMethodIconMap: Record<PaymentMethodLabel, LucideIcon> = {
  Efectivo: Banknote,
  "Tarjeta de Crédito": CreditCard,
  "Tarjeta de Débito": CreditCard,
  "Transferencia Bancaria": Landmark,
  "Billetera Digital": Smartphone,
}

export function getPaymentMethodIcon(paymentMethod: string): LucideIcon {
  return paymentMethodIconMap[paymentMethod as PaymentMethodLabel] ?? CreditCard
}
