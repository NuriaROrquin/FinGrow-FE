/**
 * Un error devuelto por la API, ya normalizado.
 *
 * El backend puede responder con dos formas distintas y esta clase las unifica en
 * una sola: siempre hay un `code` para decidir por programa y un `description`
 * para mostrarle a la persona.
 */
export class ApiError extends Error {
  /** Código estable del error, pensado para comparar en código. */
  readonly code: string

  /** Mensaje para mostrar al usuario, en castellano. */
  readonly description: string

  /** Status HTTP de la respuesta. */
  readonly status: number

  /** Identificador de la request en el backend, útil para buscar en los logs. */
  readonly traceId?: string

  /** Errores por campo cuando la respuesta es una falla de validación. */
  readonly fieldErrors?: Record<string, string[]>

  constructor(init: {
    code: string
    description: string
    status: number
    traceId?: string
    fieldErrors?: Record<string, string[]>
  }) {
    super(init.description)
    this.name = "ApiError"
    this.code = init.code
    this.description = init.description
    this.status = init.status
    this.traceId = init.traceId
    this.fieldErrors = init.fieldErrors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Códigos que genera el cliente, no el backend. */
export const ClientErrorCodes = {
  /** La API no respondió: se cortó la red, está caída o CORS bloqueó la llamada. */
  Network: "network_error",
  /** La respuesta no se pudo interpretar como JSON. */
  InvalidResponse: "invalid_response",
  /** El backend respondió un error sin cuerpo reconocible. */
  Unknown: "unknown_error",
} as const

/**
 * Forma que devuelven los casos de uso del backend (el record Error de la capa
 * Application: Code, Description, Type), serializado en camelCase.
 */
interface BackendErrorBody {
  code?: unknown
  description?: unknown
}

/**
 * Forma RFC 7807 que devuelve hoy el middleware de excepciones del backend.
 * Incluye `errors` porque es lo que agrega ASP.NET ante fallas de validación.
 */
interface ProblemDetailsBody {
  type?: unknown
  title?: unknown
  detail?: unknown
  status?: unknown
  traceId?: unknown
  errors?: unknown
}

const FALLBACK_DESCRIPTIONS: Record<number, string> = {
  400: "Los datos enviados no son válidos.",
  401: "Tu sesión expiró. Volvé a iniciar sesión.",
  403: "No tenés permiso para hacer esto.",
  404: "No encontramos lo que buscabas.",
  409: "La operación entra en conflicto con el estado actual.",
  500: "Ocurrió un error inesperado. Probá de nuevo en un momento.",
}

/**
 * Convierte el cuerpo de una respuesta con error en un ApiError.
 *
 * Acepta las dos formas porque conviven: el middleware de excepciones ya devuelve
 * ProblemDetails, y T-03 va a mapear el Error de los casos de uso a HTTP. Mientras
 * ese mapeo no exista, esta función se queda con lo mejor que encuentre en lugar
 * de romper.
 */
export function parseApiError(status: number, body: unknown): ApiError {
  const fallback = FALLBACK_DESCRIPTIONS[status] ?? "Ocurrió un error inesperado."

  if (typeof body !== "object" || body === null) {
    return new ApiError({ code: ClientErrorCodes.Unknown, description: fallback, status })
  }

  const backendError = body as BackendErrorBody
  if (typeof backendError.code === "string" && typeof backendError.description === "string") {
    return new ApiError({
      code: backendError.code,
      description: backendError.description,
      status,
    })
  }

  const problem = body as ProblemDetailsBody

  return new ApiError({
    code: typeof problem.type === "string" ? problem.type : String(status),
    description:
      pickFirstString(problem.detail, problem.title) ?? fallback,
    status,
    traceId: typeof problem.traceId === "string" ? problem.traceId : undefined,
    fieldErrors: parseFieldErrors(problem.errors),
  })
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }

  return undefined
}

function parseFieldErrors(errors: unknown): Record<string, string[]> | undefined {
  if (typeof errors !== "object" || errors === null) {
    return undefined
  }

  const parsed: Record<string, string[]> = {}

  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages)) {
      parsed[field] = messages.filter((message): message is string => typeof message === "string")
    }
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined
}
