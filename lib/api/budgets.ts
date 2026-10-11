import { api } from "./client"
import { isApiError } from "./errors"
import type { Currency, ExpenseCategory } from "./transactions"

export type BudgetPeriod = "Monthly" | "Yearly"

/** Estado de una categoría frente a su tope: advertencia desde el 80 %, excedida desde el 100 %. */
export type BudgetHealth = "OnTrack" | "Warning" | "Exceeded"

export interface BudgetLimitDto {
  category: ExpenseCategory
  amount: number
  /**
   * Los campos calculados llegan en `getBudget` y `setBudgetLimit`. Crear o duplicar un
   * presupuesto devuelve solo los topes, y ahí vienen en `null`.
   */
  spent?: number | null
  /** Negativo cuando lo gastado supera el tope. */
  remaining?: number | null
  usedPercentage?: number | null
  health?: BudgetHealth | null
}

export interface BudgetDto {
  id: string
  period: BudgetPeriod
  /** Primer día del período, formato yyyy-MM-dd. */
  periodStart: string
  /** Último día del período (inclusive), formato yyyy-MM-dd. */
  periodEnd: string
  /** `null` solo si el presupuesto no tiene topes. */
  currency: Currency | null
  limits: BudgetLimitDto[]
  createdAt: string
}

export interface CreateBudgetPayload {
  year: number
  /** 1 a 12. */
  month: number
  currency: Currency
  limits: BudgetLimitDto[]
}

/**
 * Presupuesto de un mes, o `null` si el empleado todavía no cargó uno.
 *
 * El backend responde 404 cuando no existe; acá se traduce a `null` porque para la
 * pantalla "no hay presupuesto" es un estado normal, no un error que mostrar.
 */
export async function getBudget(year: number, month: number, signal?: AbortSignal): Promise<BudgetDto | null> {
  try {
    return await api.get<BudgetDto>(`/api/budgets/${year}/${month}`, { signal })
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null
    }

    throw error
  }
}

export function createBudget(payload: CreateBudgetPayload, signal?: AbortSignal): Promise<BudgetDto> {
  return api.post<BudgetDto>("/api/budgets", payload, { signal })
}

export interface SetBudgetLimitPayload {
  category: ExpenseCategory
  amount: number
}

/**
 * Define o edita el tope de una categoría. Si la categoría no tenía tope, lo agrega.
 * Devuelve el presupuesto completo con lo gastado y el estado de cada categoría ya recalculados.
 */
export function setBudgetLimit(
  year: number,
  month: number,
  payload: SetBudgetLimitPayload,
  signal?: AbortSignal,
): Promise<BudgetDto> {
  return api.put<BudgetDto>(`/api/budgets/${year}/${month}/limits`, payload, { signal })
}

/** Crea el presupuesto de `year`/`month` copiando los topes del mes anterior. */
export function duplicatePreviousBudget(year: number, month: number, signal?: AbortSignal): Promise<BudgetDto> {
  return api.post<BudgetDto>("/api/budgets/duplicate-previous", { year, month }, { signal })
}