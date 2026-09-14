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
```

CI (`.github/workflows/ci.yaml`) corre en cada push a `main` y `dev`: `npm ci`, `npm run lint`,
`npm run build`.

## Estado actual: todo es mock

Hoy no hay ninguna llamada real a una API. Antes de "arreglar" algo que parece un bug, revisá si
no es simplemente esto:

- **`lib/auth-context.tsx`** guarda `role`, `userName` e `isAuthenticated` en `useState`. `login()`
  no valida nada contra ningún backend y no persiste sesión — un refresh de página desloguea.
  Se reemplaza en **T-05 (SCRUM-23)**, bloqueada por **T-02 (SCRUM-20)** del backend (JWT).
- **`lib/company-context.tsx`** guarda departamentos y empleados en memoria. El empleado se
  relaciona con su departamento **por nombre** (`departamento: string`), no por id. En
  FinGrow-BE esa misma relación es por id — cuando se conecte a la API real, renombrar un
  departamento ya no puede romper la relación como rompe acá.
- No existe todavía una capa de acceso HTTP tipada (`lib/` solo tiene `utils.ts`, no hay
  `fetch`/cliente API). Es **T-04 (SCRUM-22)**.
- `INTEGRACIONES.md` describe Telegram, Gmail y OCR **en modo demo, con datos simulados**: no
  hay bot ni credenciales reales conectadas todavía.

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
