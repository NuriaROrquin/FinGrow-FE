"use client"

interface MockLoginRequest {
  email: string
  password: string
}

interface MockLoginResponse {
  token: string
}

const NAME_IDENTIFIER_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
const COMPANY_ID_CLAIM = "company_id"
const MOCK_COMPANY_ID = "22222222-2222-2222-2222-222222222222"
const MOCK_TOKEN_DURATION_SECONDS = 60 * 30

/** Mock temporal del endpoint de login. Reemplazar por api.post cuando exista el backend. */
export async function mockLogin({
  email,
  password,
}: MockLoginRequest): Promise<MockLoginResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 300))

  const normalizedEmail = email.trim()
  if (!normalizedEmail || !password.trim()) {
    throw new Error("El usuario y la contraseña son obligatorios")
  }

  // Convención temporal: usar un email que contenga "empresa" para probar el dashboard empresarial.
  const role = normalizedEmail.toLowerCase().includes("empresa") ? "Empresa" : "User"
  const tokenPayload = createTokenPayload(normalizedEmail, role)

  return {
    // La firma es ficticia: el secret real no debe exponerse en el navegador.
    token: [
      encodeBase64Url({ alg: "HS256", typ: "JWT" }),
      encodeBase64Url(tokenPayload),
      "mock-signature",
    ].join("."),
  }
}

function createTokenPayload(email: string, role: "User" | "Empresa") {
  return {
    [NAME_IDENTIFIER_CLAIM]: email,
    [COMPANY_ID_CLAIM]: MOCK_COMPANY_ID,
    [ROLE_CLAIM]: role,
    aud: "FinGrow",
    iss: "FinGrow",
    exp: Math.floor(Date.now() / 1000) + MOCK_TOKEN_DURATION_SECONDS,
  }
}

function encodeBase64Url(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}
