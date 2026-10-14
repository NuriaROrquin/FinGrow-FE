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
- **Departamentos y empleados del panel de empresa** (HU-51, HU-54) usan la API real
  (`lib/api/company.ts`, `/api/company/departments` y `/api/company/employees`). El empleado se
  relaciona con su departamento por id. El alta devuelve una contraseña temporal que se muestra
  una sola vez (`components/company/temporary-password-dialog.tsx`): no hay forma de volver a
  pedirla. El switch de estado activa o desactiva el acceso (HU-55): desactivar conserva los
  datos, eliminar los borra. El responsable de un departamento (HU-52) es un empleado activo de
  la empresa elegido con `components/company/manager-picker.tsx`; si después pierde el acceso,
  sigue figurando como "(sin acceso)" hasta que se cambie. El panel principal de la empresa
  (`/dashboard/company`) sigue con métricas mock.
- **Educación** (artículos y cursos) usa la API real. La pantalla de Inversiones abre el contenido
  de cada tipo de activo (HU-35, `components/investments/related-education-dialog.tsx`) y todo
  artículo o curso con `isInvestmentContent` muestra `components/education/investment-disclaimer.tsx`:
  es material educativo, no asesoramiento financiero certificado, y esa aclaración no se saca.
- La capa de acceso HTTP tipada es `lib/api/` (**T-04, SCRUM-22**): `api.get/post/...` manda
  siempre `credentials: "include"` para que viaje la cookie de sesión, y `toastApiError` muestra
  el error. Las rutas se pasan completas (`/api/integrations/...`); `NEXT_PUBLIC_API_URL` no
  incluye `/api`. Como la cookie es `SameSite=None; Secure`, el front en `localhost:3000` puede
  hablar con la API en dev o en local sin configuración extra.
- **La campanita de notificaciones** (`components/notifications/notification-bell.tsx`) usa la
  bandeja real (`/api/notifications`) y no consulta el contador cada tanto: escucha el hub de
  SignalR `/hubs/notifications` (`lib/api/notifications-hub.ts`), que viaja con la misma cookie
  de sesión. Cada notificación nueva llega con el evento `NotificationReceived`. Al conectarse,
  al perder la conexión y al volver a la pestaña se vuelve a pedir el contador: ese pedido pasa
  por `api`, así que de paso renueva la sesión vencida antes de reconectar.
- **Logros (T-22, SCRUM-106)**: `components/achievements/achievement-celebrator.tsx`, montado en el
  layout del dashboard solo para empleados, pide `GET /api/achievements/uncelebrated` al entrar y
  cada vez que la campanita recibe una notificación `AchievementUnlocked` (la campanita dispara
  `ACHIEVEMENT_NOTIFICATION_EVENT`: no hay una segunda conexión al hub). Un logro chico sale como
  toast de sonner con borde dorado, uno importante (`isMajor`) en una celebración central, y varios
  juntos en un solo toast con todas las medallas. Después confirma con
  `POST /api/achievements/celebrate` **solo los códigos que mostró**. Cada logro tiene su medalla
  (`achievement-medal.tsx`): el ícono sale del código, así que un código nuevo en el backend
  necesita su ícono acá. El dorado son los tokens `--gold` y `--gold-soft` de `globals.css`. Los
  nombres y descripciones de los logros vienen del backend en castellano.
- **Bandeja de pendientes (HU-15)**: es la pestaña "Pendientes" de Transacciones
  (`components/transactions/pending-inbox.tsx`, también `/dashboard/transactions?view=pending`).
  Lista lo que propuso un canal automático (`GET /api/transactions/pending`), y cada movimiento
  se confirma con correcciones o se descarta. Los pendientes no aparecen en la tabla general. El
  nivel de confianza (`aiConfidenceLevel`) lo calcula el backend: el front solo lo muestra. Sus
  textos ya están en `lib/i18n` en los tres idiomas.
- `INTEGRACIONES.md` describe Gmail, Mercado Pago y OCR **en modo demo, con datos simulados**:
  no hay credenciales reales conectadas todavía. Las excepciones son WhatsApp (HU-09) y Telegram
  (HU-08): `components/integrations/link-code-integration-card.tsx` es la card genérica de
  vinculación por código (estado real vía `GET /api/integrations/{provider}`, código con
  `POST .../link-code`, sondeo hasta que el chat quede vinculado, desvincular con `DELETE`), y
  `whatsapp-card.tsx` / `telegram-card.tsx` solo aportan textos, ícono y el paso de "abrir el
  chat". El bot de Telegram se configura con `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` y el link
  `https://t.me/<bot>?start=<código>` hace que Telegram mande el código solo. Con el chat
  vinculado, los movimientos se registran escribiéndole al bot (HU-13): todo pasa entre
  Telegram, FinGrow-BE y FinGrow-AI, y en el front solo se ven como pendientes o, ya
  confirmados, con origen "Telegram" en la tabla de Transacciones.

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
lib/            Contexts (auth, preferencias), utils y la capa de acceso HTTP (lib/api)
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
