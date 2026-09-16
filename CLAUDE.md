# FinGrow · Frontend

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4, con componentes shadcn/radix-ui.
Es uno de tres repos: **FinGrow-FE** (este), FinGrow-BE (.NET 10, reglas de negocio y datos) y
FinGrow-AI (Python, OCR y lenguaje natural). El frontend nunca llama directo a FinGrow-AI: pasa
siempre por FinGrow-BE.

## Comandos

```bash
npm install
npm run dev      # localhost:3000
npm run build
npm run lint
docker compose up -d --build   # imagen standalone en localhost:3000; NEXT_PUBLIC_* se fijan al buildear
```

CI (`.github/workflows/ci.yaml`) corre en cada push a `main` y `dev`: `npm ci`, `npm run lint`,
`npm run build`.

## Estado actual: casi todo es mock

Salvo el login, WhatsApp y Telegram, no hay llamadas reales a la API. Antes de "arreglar" algo que parece
un bug, revisá si no es simplemente esto:

- **`lib/auth-context.tsx`** (T-05, SCRUM-23; login de empresa: HU-46) mantiene la sesión real:
`login()` llama a `POST /login/empleado` o `POST /login/empresa` según el rol, el backend
responde con la cookie **HttpOnly** `fingrow-session` (que lleva el JWT) y un `SessionResponse`
con `userId`, `companyId`, `fullName`, `role` y `expiresAt`. Al cargar la página se rehidrata
con `GET /session`; `logout()` llama a `DELETE /session`. El JavaScript nunca ve el token: en
`localStorage` solo queda `fingrow-role`, para saber a qué login volver ante un 401.
- **`lib/company-context.tsx`** guarda departamentos y empleados en memoria. El empleado se
  relaciona con su departamento **por nombre** (`departamento: string`), no por id. En
  FinGrow-BE esa misma relación es por id — cuando se conecte a la API real, renombrar un
  departamento ya no puede romper la relación como rompe acá.
- La capa de acceso HTTP tipada es `lib/api/` (**T-04, SCRUM-22**): `api.get/post/...` manda
  siempre `credentials: "include"` para que viaje la cookie de sesión, y `toastApiError` muestra
  el error. Las rutas se pasan completas (`/api/integrations/...`); `NEXT_PUBLIC_API_URL` no
  incluye `/api`. Como la cookie es `SameSite=None; Secure`, el front en `localhost:3000` puede
  hablar con la API en dev o en local sin configuración extra.
- `INTEGRACIONES.md` describe Gmail, Mercado Pago y OCR **en modo demo, con datos simulados**:
  no hay credenciales reales conectadas todavía. Las excepciones son WhatsApp (HU-09) y Telegram
  (HU-08): `components/integrations/link-code-integration-card.tsx` es la card genérica de
  vinculación por código (estado real vía `GET /api/integrations/{provider}`, código con
  `POST .../link-code`, sondeo hasta que el chat quede vinculado, desvincular con `DELETE`), y
  `whatsapp-card.tsx` / `telegram-card.tsx` solo aportan textos, ícono y el paso de "abrir el
  chat". El bot de Telegram se configura con `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` y el link
  `https://t.me/<bot>?start=<código>` hace que Telegram mande el código solo.

## Contratos compartidos con los otros repos

- **Categorías de ingreso/gasto**: cuando se conecten los formularios a la API real, tienen que
  usar los mismos diez valores de `ExpenseCategory` que maneja FinGrow-BE (y que a su vez son
  contrato con FinGrow-AI), en el mismo texto en castellano (`ahorro_inversion`, no
  `AhorroInversion` ni una traducción propia).
- **Un importe siempre lleva su moneda.** El backend nunca acepta un monto sin moneda (`Money` es
  monto + moneda); los formularios que hoy solo piden un número van a necesitar ese segundo campo
  cuando se conecten.

## Arquitectura y estructura

```
app/            Rutas (App Router): dashboard, login/empleado, login/empresa
components/ui/  Componentes shadcn — generados, no reescribir el estilo base a mano
lib/            Contexts (auth, company) y utils; todavía sin capa de acceso HTTP
hooks/          Hooks compartidos (use-mobile, use-toast)
```

- Alias de import `@/*` apunta a la raíz del proyecto (`tsconfig.json`).
- El dominio de negocio (`Departamento`, `Empleado`, roles `"empleado" | "empresa"`) está en
  castellano a propósito, para ser consistente con el resto de la plataforma; el código de UI
  (props, hooks, nombres de componentes) sigue en inglés.

## Convenciones

- `"use client"` en todo componente que use estado o contexto (Next.js App Router).
- Warnings de ESLint no deberían acumularse: la CI corre `npm run lint` en cada push.
- Componentes de `components/ui/` son de shadcn: para modificarlos, preferir las props que ya
  exponen antes que editar el archivo generado.
