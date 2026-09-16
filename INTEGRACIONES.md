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
- ⏳ Registro de transacciones mediante lenguaje natural (HU-13)
- ⏳ Procesamiento de tickets con OCR desde Telegram
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
```

El bot automáticamente:
- Detecta si es un ingreso o gasto
- Extrae el monto
- Identifica la categoría
- Registra la fecha actual

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

### 3. Procesamiento OCR de Tickets

**Ubicación**: Transacciones > Escanear Ticket

#### Características:
- ✅ Extracción automática de datos
- ✅ Reconocimiento de monto y comercio
- ✅ Detección de categoría
- ✅ Confianza del resultado (%)
- ✅ Edición antes de guardar

#### Cómo usar:
1. Ve a **Transacciones**
2. Haz clic en **Escanear Ticket**
3. Sube una foto del ticket o factura
4. Haz clic en **Procesar con OCR**
5. Revisa y edita los datos extraídos
6. Guarda la transacción

#### Formatos soportados:
- 📄 Tickets de compras
- 🧾 Facturas impresas
- 📱 Capturas de pantalla
- 🖼️ Imágenes JPG, PNG, WEBP

---

### 4. Procesamiento de Lenguaje Natural

**Ubicación**: Transacciones > Mensaje Telegram

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
Pedro toma fotos de sus tickets de compras y los procesa con OCR:
- Supermercado Día: $1,250.50
- Farmacia: $890
- Estación de servicio: $3,500

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

# OCR Service
OCR_API_KEY=your_ocr_api_key
OCR_API_URL=your_ocr_api_url
```

### Tecnologías sugeridas para producción:
- **Telegram Bot**: node-telegram-bot-api
- **Gmail API**: googleapis
- **OCR**: Google Vision API, Tesseract.js, AWS Textract
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
Usuario sube imagen
    ↓
Envía a servicio OCR
    ↓
Extrae texto del ticket
    ↓
Procesa datos con IA
    ↓
Identifica monto y comercio
    ↓
Usuario confirma y guarda
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
  - Escanear Ticket (OCR)
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

