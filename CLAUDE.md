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

Salvo el login, WhatsApp, Telegram y lo que se lista abajo, no hay llamadas reales a la API. Antes de "arreglar" algo que parece
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
  sigue figurando como "(sin acceso)" hasta que se cambie. En el panel principal de la empresa
  (`/dashboard/company`) solo son reales las tarjetas de total de empleados y tasa de
  participación (HU-56, `components/company/participation-cards.tsx`,
  `GET /api/company/metrics/participation`); el resto sigue mock. Cuando el backend manda
  `isParticipationHidden`, la tasa no se muestra ni se calcula en el front: es la protección
  de anonimato para grupos chicos. La tarjeta de salud financiera promedio (HU-57,
  `components/company/financial-health-card.tsx`) también es real: toma el último mes cerrado
  de `GET /api/company/metrics` y lo compara con el anterior. El backend manda el puntaje en
  `null` cuando hay menos de tres empleados con puntaje: la tarjeta lo muestra como oculto por
  anonimato, nunca como cero, y el gráfico de tendencia deja ese mes en blanco.
  **Preocupaciones y recomendaciones (HU-61 y HU-64)**: la pestaña "Principales Preocupaciones"
  (`components/company/financial-concerns-card.tsx`) y la tarjeta "Recomendaciones" de "Análisis"
  (`company-recommendations-card.tsx`) son reales. La página pide una sola vez
  `GET /api/company/metrics/insights` y les pasa el mismo estado a las dos: así muestran el mismo
  mes y la IA no se consulta dos veces. Qué es una preocupación, su orden y cuáles se ocultan por
  anonimato lo decide el backend: no filtres ni reordenes en el front. Con `isAnonymized` no hay
  preocupaciones ni recomendaciones; si la IA no responde (`recommendationsAvailable = false`) las
  preocupaciones se ven igual. Las recomendaciones van sin links (`showLinks={false}`): son acciones
  que la empresa hace fuera de FinGrow.
  **Tendencias (HU-63)**: la tarjeta "Tendencias" de "Análisis" (`components/company/company-trends-card.tsx`)
  pide `GET /api/company/metrics/trends` por su cuenta (no usa la IA, así que no comparte el pedido de
  `/insights`) y muestra dos bloques: tendencias positivas (verde) y oportunidades de mejora (ámbar). El
  backend compara el último mes cerrado con el anterior y decide qué indicador entra, en qué lista, en
  qué orden y cuáles se ocultan por anonimato: el front solo arma los textos con los números que recibe.
  En las preocupaciones mejorar es bajar, por eso una flecha hacia abajo puede estar en verde. Sin mes
  anterior (`previousPeriod = null`), con `isAnonymized` o sin cambios significativos se muestra un aviso
  en lugar de las listas. Los textos están en `lib/i18n` (`companyTrends`), con un texto por cada
  `CompanyTrendIndicator`: un indicador nuevo en el backend necesita su texto en los tres idiomas.
  **Exportar el reporte de la empresa (HU-65)**: "Exportar reporte", en el encabezado del panel, se
  habilita cuando terminó de cargar `/insights`. Al tocarlo pide `GET /api/company/metrics/report`
  (`getCompanyMonthlyReport`, siempre el último mes con foto contra el anterior) y monta
  `components/company/company-report-pdf-export.tsx`, que se captura con el mismo `lib/report-pdf.ts`
  de HU-45. El PDF lleva el nombre de la empresa, los tres indicadores del mes (participación, puntaje
  promedio con su nivel y cursos completados), los dos gráficos de evolución del panel
  (`company-evolution-charts.tsx`, con los mismos datos de `GET /api/company/metrics` que ya pidió la
  página: los meses ocultos por anonimato quedan en blanco), las tendencias (`TrendsContent` de la
  tarjeta de HU-63) y
  las mismas tarjetas de preocupaciones y recomendaciones que se ven en pantalla, con el estado de
  `/insights` que ya tiene la página: la IA no se vuelve a llamar. Un indicador oculto llega en `null`
  con su motivo (`CompanyReportValueStatus`) y el PDF muestra "Oculto" y por qué: no lo completes con
  cero ni filtres nada en el front. Sin ningún mes cerrado no se genera el PDF y se avisa con un toast.
  Los textos están en `lib/i18n` (`companyReportPdf`).
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
- **Preferencias de notificaciones del empleado (HU-05)**: la pestaña Notificaciones de Configuración
  es `components/notifications/notification-preferences.tsx` y usa la API real
  (`/api/notifications/types` y `/api/notifications/channels`). Conviven dos niveles: el **tipo**
  de alerta decide si existe (apagado, no llega a ningún canal ni a la bandeja) y el **canal**
  decide por dónde viaja (la app es fija; Telegram y correo se apagan). Cada switch guarda al
  instante y vuelve atrás si falla. Los 10 tipos son los de `NotificationType`: uno nuevo en el
  backend necesita su texto en `settings.notifications.alertTypes` de los tres idiomas. La
  pestaña de la empresa sigue siendo mock: la empresa no tiene preferencias en el backend.
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
  **Pestaña Logros de Educación (HU-76, SCRUM-138)**: `app/dashboard/education/page.tsx` muestra el
  catálogo real con `GET /api/achievements` (`components/achievements/use-achievements.ts` y
  `achievements-list.tsx`): los 12 logros con su medalla; el ganado sale destacado y con su fecha
  (`achievedAt`), el que falta sale apagado con su `condition` como "cómo conseguirlo". El indicador
  "Logros" de arriba cuenta los ganados sobre el total del catálogo. El hook vuelve a pedir la lista
  cuando llega `ACHIEVEMENT_NOTIFICATION_EVENT`, así un logro nuevo aparece sin recargar. Los textos
  están en `achievements` de los tres idiomas.
- **Reportes: evolución mensual (HU-41)**. `app/dashboard/reports/page.tsx` arranca en los últimos 6
  meses (contando el mes en curso) y tiene un solo selector de moneda: período y moneda los siguen las
  cards de arriba, el gráfico, los meses destacados y la sección de HU-44. Todo sale de
  `GET /api/reports/monthly-summary` (`getMonthlySummary`), que ya viene recortado por el backend (sin
  los meses antes del primer movimiento del empleado ni el mes en curso vacío; cualquier otro mes vacío
  viene en cero):
  no filtres meses en el front ni recalcules totales, promedio o meses destacados, porque dejarían de
  coincidir con el gráfico. Las cards son `report-summary-cards.tsx`, el gráfico
  `monthly-evolution-chart.tsx` (ingresos y gastos en barras, ahorro en línea) y el mes con mayor
  ingreso, el de mayor gasto y el mejor mes de ahorro `monthly-highlights-card.tsx`, sin umbral de
  historial. Las flechas de `components/period-filter.tsx` mueven la ventana entera (6 meses → los 6
  anteriores).
- **Reportes: análisis de gastos (HU-42)**. La pestaña Análisis de Gastos es
  `components/reports/expense-breakdown-section.tsx`, que muestra lo que la página pide a
  `GET /api/reports/expense-breakdown` con su período y su moneda. El backend manda todo calculado:
  montos, porcentajes con un decimal, el período anterior (misma cantidad de meses, justo antes) y la
  variación de cada categoría.
  No recalcules nada en el front. Ahorro e Inversión no entra en el ranking ni en la base de los
  porcentajes, porque es ahorro y no gasto. Va aparte, en la conciliación al pie de
  `expense-category-details.tsx`: gastos de consumo (100 %) + ahorro e inversión = total, que es igual
  a "Gastos Totales". En la comparación su variación tiene el sentido invertido: que suba es bueno
  (`favorable="increase"` de `expense-variation.tsx`). El switch "Comparar con período anterior" muestra
  la variación, marca "Nueva" una categoría sin gasto antes y suma al final las que bajaron a cero
  (−100 %). Sin historia antes de que termine el período anterior (`hasPreviousPeriod`), el switch
  muestra "Sin período anterior para mostrar". Sus textos están en `lib/i18n` (`expenseBreakdown`); los
  nombres de las categorías salen de `expenseCategoryLabels`, que todavía no pasa por i18n.
- **Hitos y recomendaciones (HU-44)**: debajo del gráfico de Resumen,
  `components/reports/financial-insights-section.tsx` muestra lo que la página pide a
  `GET /api/reports/insights` con su período y su moneda, en dos cards: Hitos Alcanzados
  (`financial-summary-card.tsx`, los logros del período, sin umbral) y Análisis y Recomendaciones (`financial-recommendations-card.tsx`,
  tres recomendaciones de FinGrow-AI). Las recomendaciones necesitan 2 meses con actividad suficiente:
  sin eso, esa card muestra cuánto falta, con los números que manda el backend. Los `highlights` de
  `/insights` ya no se muestran: los meses destacados son de HU-41. El link de cada recomendación sale
  de `action`, una lista cerrada; la IA nunca manda URLs. La aclaración de que no es asesoramiento
  financiero certificado va fija al pie de la card de recomendaciones: no la saques.
- **Análisis de Presupuesto (HU-25)**: al pie de la pestaña Presupuestos,
  `components/budgets/budget-analysis-card.tsx` pide `GET /api/budgets/analysis` con su propio selector
  de moneda (arranca en la moneda preferida; no hay todavía un selector de moneda general). Mira los
  últimos 6 meses y el mes en curso con presupuesto en esa moneda, y no depende del mes elegido en la
  pestaña. Con menos de 2 meses con presupuesto (el mes en curso cuenta) muestra cuánto falta, con los
  números del backend. Los datos calculados son de los meses cerrados y cada cartel dice qué mes o qué
  período mira; si la IA no responde, se muestran igual. `MonthlyBudgetSection` avisa con
  `onBudgetsChanged` cada cambio guardado (y cada alerta de presupuesto) y la card se recarga sin volver
  al esqueleto. Las recomendaciones se dibujan con `components/recommendations/recommendation-list.tsx`,
  la misma lista que usa la card de HU-44; acá sin el link "Ver presupuestos", porque ya se está en esa
  pantalla.
- **Exportar el reporte a PDF (HU-45)**. La página de Reportes pide los cuatro endpoints al entrar
  (`useReportRequest`, `components/reports/use-report-request.ts`) y les pasa los datos a las secciones,
  que ya no piden nada por su cuenta. Así el PDF sale con los mismos datos que se ven, sin volver a
  pedirlos: las recomendaciones de `/insights` se generan con FinGrow-AI en cada pedido, así que pedirlas
  de nuevo podría traer otras. El switch de comparación de gastos y la moneda del reporte de ahorros
  también viven en la página. "Exportar PDF" se habilita cuando terminaron de cargar las cuatro y monta
  `components/reports/report-pdf-export.tsx`: una versión del reporte fuera de pantalla, de 900 px fijos,
  con las tres pestañas apiladas, encabezado (logo, empleado, período, moneda, fecha y hora de
  generación) y en modo exportación (`ReportExportProvider`): sin animaciones de recharts, sin el switch
  de comparación (la comparación sale si estaba prendida), sin los links de las recomendaciones y con la
  moneda de ahorros como texto. `lib/report-pdf.ts` captura cada `[data-pdf-block]` con
  `html2canvas-pro` (el `html2canvas` original no entiende los colores `oklch` de Tailwind v4), siempre
  en tema claro y con un ancho de ventana de escritorio, y arma un A4 con `jspdf`: corta las páginas
  entre cards y, si una card no entra en una página, entre líneas; al pie va "FinGrow" y el número de
  página. Los textos nuevos están en `lib/i18n` (`reportPdf`). El reporte de ahorros siempre termina en
  el mes en curso (el backend solo recibe la cantidad de meses): si no coincide con el período elegido,
  la card lo avisa con `savingsReport.periodNote`, en pantalla y en el PDF.
- **Bandeja de pendientes (HU-15)**: es la pestaña "Pendientes" de Transacciones
  (`components/transactions/pending-inbox.tsx`, también `/dashboard/transactions?view=pending`).
  Lista lo que propuso un canal automático (`GET /api/transactions/pending`), y cada movimiento
  se confirma con correcciones o se descarta. Los pendientes no aparecen en la tabla general. El
  nivel de confianza (`aiConfidenceLevel`) lo calcula el backend: el front solo lo muestra. Sus
  textos ya están en `lib/i18n` en los tres idiomas.
- **Escanear un comprobante (HU-12)** es real: `components/transactions/scan-receipt-dialog.tsx`
  sube el archivo con `POST /api/receipts` y lo escanea con `POST /api/receipts/{id}/scan`, que
  devuelve el movimiento ya creado como pendiente. Se abre enseguida en la misma revisión de la
  bandeja (`usePendingReview` + `PendingReviewDialogs`, `components/transactions/pending-review.tsx`):
  si se cierra sin confirmar, queda en Pendientes. Antes de subir, `lib/receipt-image.ts` recomprime
  toda foto a JPEG de hasta 2000 px y 5 MB (el tope de Textract), así que WEBP o HEIC llegan al
  backend como JPEG; un HEIC que el navegador no puede abrir se avisa. Si no se puede leer, el
  diálogo ofrece cargarlo a mano con el comprobante ya adjunto (`preloadedReceipt` de
  `AddTransactionForm`). Con fuente `ReceiptScan`, la confianza es la de la lectura (monto, fecha y
  comercio), no la de la categoría: `ConfidenceBadge` lo explica con `subject="reading"`.
- `INTEGRACIONES.md` describe Gmail y Mercado Pago **en modo demo, con datos simulados**:
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
