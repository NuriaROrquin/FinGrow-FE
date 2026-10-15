# Integraciones de la Plataforma Fingrow

Este documento describe las nuevas funcionalidades de integración implementadas en la plataforma Fingrow.

## 🚀 Funcionalidades Implementadas

### 1. Integración con Telegram Bot

**Ubicación**: Configuración > Integraciones > Telegram Bot

Es una integración **real** (HU-08): la card consulta a FinGrow-BE si el chat está vinculado,
pide el código de un solo uso y lo detecta apenas el bot lo valida.

#### Características:
- ✅ Vinculación de cuenta mediante código único (vence a los 10 minutos)
- ✅ Estado real y desvinculación desde la misma card
- ✅ Registro de transacciones mediante lenguaje natural (HU-13)
- ✅ Escaneo de tickets: mandale al bot una foto o un PDF de una página (HU-12)
- ⏳ Recepción de notificaciones y consulta de balance

#### Cómo usar:
1. Ve a **Configuración > Integraciones**
2. Haz clic en **Vincular Telegram**
3. Tocá **Abrir**: se abre el bot (`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`) con el código ya cargado
4. Tocá **Iniciar** en Telegram; si ya tenías el chat abierto, pegá el código y mandalo
5. El bot confirma y la card pasa a **Vinculado** sola

#### Ejemplos de mensajes:
```
"Gasté $500 en supermercado"
"Pagué $1500 en el almuerzo con el equipo"
"Ingreso de $10000 por freelance"
"Cobré $50000 por proyecto de diseño web"
"Ayer gasté $2000 en la farmacia"
```

El bot (con FinGrow-AI detrás):
- Detecta si es un ingreso o gasto
- Extrae el monto y la moneda (pesos salvo que diga dólares, euros o reales)
- Identifica la categoría y, si lo dice, el medio de pago
- Registra la fecha que dice el mensaje ("Ayer gasté $500 en el súper"); si no dice ninguna, la de hoy.
  Con un período vago ("la semana pasada") propone una fecha y la marca como estimada
- Contesta con lo que entendió y botones para confirmar o descartar. Si el mensaje no dice
  cómo se pagó, los botones son los medios de pago y tocar uno confirma con ese medio
- Si no encuentra el monto, repregunta en lugar de registrar algo incorrecto

Lo que se registra por el bot nace pendiente: si el empleado no toca ningún botón, queda en
**Transacciones > Pendientes** para revisarlo desde la web. En la tabla de Transacciones la
columna **Origen** muestra "Telegram".

---

### 2. Integración con Gmail

**Ubicación**: Configuración > Integraciones > Gmail

#### Características:
- ✅ Conexión segura con OAuth 2.0
- ✅ Procesamiento automático de facturas
- ✅ Detección de servicios recurrentes
- ✅ Sincronización en tiempo real
- ✅ Historial de facturas procesadas

#### Servicios detectados automáticamente:
- ⚡ Electricidad (Edenor, Edesur, EPE)
- 🔥 Gas (MetroGAS, Camuzzi)
- 💧 Agua (AySA, ABSA)
- 📡 Internet y Telefonía (Fibertel, Movistar, Personal, Claro)
- 🏢 Otros servicios recurrentes

#### Cómo funciona:
1. Ve a **Configuración > Integraciones**
2. Haz clic en **Conectar con Gmail**
3. Autoriza el acceso a tu cuenta
4. La plataforma escaneará automáticamente tus correos
5. Las facturas se registrarán como transacciones

---

### 3. Escaneo de comprobantes (OCR)

**Ubicación**: Transacciones > Escanear comprobante (también `/dashboard/transactions?mode=ocr`)

Es una integración **real** (HU-12): la foto se guarda como comprobante en FinGrow-BE, que se la
manda a FinGrow-AI. Ahí la lee Amazon Textract (`AnalyzeExpense`) y Claude limpia el nombre del
comercio y elige la categoría. El frontend nunca habla con FinGrow-AI ni con Textract.

#### Características:
- ✅ Subir una foto o un PDF de una página, arrastrarlo o sacar la foto con la cámara
- ✅ Monto, fecha, comercio, categoría y medio de pago precargados
- ✅ Nivel de confianza de la lectura (alta, media o baja)
- ✅ Revisión inmediata: se puede corregir cualquier campo antes de confirmar
- ✅ Si no se puede leer, mensaje claro y carga manual con la imagen ya adjunta

#### Cómo usar:
1. Ve a **Transacciones**
2. Haz clic en **Escanear comprobante**
3. Sube una foto o un PDF, o usa la cámara
4. Haz clic en **Escanear**
5. Revisa lo que se leyó, corrige lo que haga falta y **Confirma**

Si cerrás la revisión sin confirmar, el movimiento queda en la pestaña **Pendientes**.

#### Formatos soportados:
- 🖼️ Fotos JPG, PNG, WEBP y HEIC (HEIC solo en navegadores que lo abren, como Safari)
- 📄 PDF de una sola página
- Hasta 5 MB: las fotos se recomprimen en el navegador a JPEG de hasta 2000 px antes de subirse

---

### 4. Procesamiento de Lenguaje Natural

**Ubicación**: el bot de Telegram (ver sección 1). El botón **Transacciones > Mensaje Telegram**
abre el chat con el bot; la interpretación la hace FinGrow-AI, no el frontend. Las palabras clave
de abajo son orientativas: el modelo entiende el mensaje completo.

#### Características:
- ✅ Análisis de mensajes en español
- ✅ Detección automática de tipo (ingreso/gasto)
- ✅ Extracción de monto
- ✅ Identificación de categoría
- ✅ Procesamiento con IA

#### Palabras clave detectadas:

**Para Ingresos:**
- ingreso, cobré, cobro, recibí
- salario, freelance, proyecto

**Para Gastos:**
- gasté, pagué, compré
- comida, almuerzo, cena, supermercado
- transporte, uber, taxi
- servicios, factura

**Categorías automáticas:**
- 🍔 Comida: comida, almuerzo, cena, supermercado
- 🚗 Transporte: transporte, uber, taxi, gasolina
- 💼 Freelance: freelance, proyecto, trabajo
- 💰 Salario: salario, sueldo
- 🎭 Entretenimiento: cine, teatro, streaming
- 🏠 Servicios: luz, gas, agua, internet

---

## 🎯 Casos de Uso

### Caso 1: Empleado registra gastos diarios
Juan usa Telegram para registrar sus gastos diarios:
```
"Gasté $350 en el almuerzo"
"Pagué $120 en taxi al trabajo"
"Compré $2500 en supermercado"
```

### Caso 2: Procesamiento automático de facturas
María vincula su Gmail y la plataforma detecta automáticamente:
- Factura de Edenor: $45.000
- Factura de Fibertel: $89.000
- Factura de MetroGAS: $23.000

### Caso 3: Escaneo de tickets
Pedro le saca una foto al ticket del súper desde Transacciones. La app le muestra
"Supermercado Día, $1.250,50, Alimentos, Débito" con confianza alta; corrige la fecha y confirma.
El ticket de la farmacia se lo manda por foto al bot de Telegram, que le contesta con lo que leyó
y los botones para confirmar o descartar.

---

## 🔧 Configuración Técnica

### Variables de entorno (Demo)
Las funcionalidades actuales están en **modo demo** con datos simulados. Para implementación real, configurar:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=your_webhook_url

# Gmail API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

El OCR no se configura en el frontend: las credenciales de Textract (`OCR_PROVIDER`,
`OCR_AWS_REGION`, `OCR_AWS_ACCESS_KEY_ID`, `OCR_AWS_SECRET_ACCESS_KEY`) van en FinGrow-AI.

### Tecnologías sugeridas para producción:
- **Telegram Bot**: node-telegram-bot-api
- **Gmail API**: googleapis
- **OCR**: Amazon Textract (`AnalyzeExpense`), en FinGrow-AI
- **NLP**: OpenAI GPT-4, Anthropic Claude, Google PaLM

---

## 📊 Flujo de Datos

### Telegram → Plataforma
```
Usuario envía mensaje
    ↓
Bot recibe mensaje
    ↓
Backend procesa con NLP
    ↓
Extrae: tipo, monto, categoría
    ↓
Crea transacción
    ↓
Envía confirmación
```

### Gmail → Plataforma
```
Nuevo email recibido
    ↓
Webhook notifica a la plataforma
    ↓
Analiza remitente y contenido
    ↓
Detecta si es factura
    ↓
Extrae datos (monto, servicio)
    ↓
Crea transacción automáticamente
```

### OCR → Plataforma
```
Usuario sube o fotografía el comprobante (recomprimido a JPEG si es foto)
    ↓
POST /api/receipts: FinGrow-BE lo guarda en el almacenamiento
    ↓
POST /api/receipts/{id}/scan: FinGrow-BE se lo manda a FinGrow-AI
    ↓
Textract lee monto, fecha y comercio; Claude elige la categoría
    ↓
FinGrow-BE crea el movimiento como pendiente, con el comprobante asociado
    ↓
Usuario revisa, corrige y confirma (o lo deja en Pendientes)
```

---

## 🎨 Interfaz de Usuario

### Página de Configuración
- **Pestañas**: Perfil, Notificaciones, **Integraciones**, Seguridad, Preferencias
- **Cards de integración**: Telegram, Gmail, OCR
- **Estados**: No vinculado / Vinculado
- **Badges**: Indicadores de estado
- **Ejemplos**: Casos de uso en cada sección

### Página de Transacciones
- **Botones principales**:
  - Escanear comprobante (OCR)
  - Mensaje Telegram (NLP)
  - Agregar Transacción (Manual)
- **Modales interactivos**: Diálogos con feedback en tiempo real
- **Procesamiento visual**: Spinners y alertas de estado

---

## 🔐 Seguridad

### Medidas implementadas:
- ✅ Códigos únicos de vinculación
- ✅ Tokens de autenticación
- ✅ Validación de datos
- ✅ Confirmación antes de guardar

### Recomendaciones para producción:
- Encriptación de credenciales
- Rate limiting en APIs
- Validación del remitente en emails
- Sanitización de mensajes de Telegram
- Almacenamiento seguro de tokens

---

## 📈 Métricas y Monitoreo

### Datos a trackear:
- Transacciones por fuente (Telegram, Gmail, OCR, Manual)
- Tasa de éxito del procesamiento OCR
- Precisión del NLP en categorización
- Facturas procesadas automáticamente
- Uso de cada integración

---

## 🚀 Próximos Pasos

### Mejoras futuras:
1. **Telegram Bot real** con comandos interactivos
2. **Gmail API** con OAuth implementado
3. **OCR mejorado** con múltiples proveedores
4. **NLP avanzado** con modelos de IA
5. **Notificaciones push** en tiempo real
6. **Categorización inteligente** con machine learning
7. **Detección de duplicados** automática
8. **Reportes de integraciones** en el dashboard

---

## 📞 Soporte

Para consultas sobre las integraciones, contactar al equipo de desarrollo en:
- Email: dev@fingrow.com
- Telegram: @FingrowSupport
- Documentación: docs.fingrow.com

---

**Versión**: 1.0.0 (Demo)  
**Última actualización**: Octubre 2025  
**Autor**: Equipo Fingrow

