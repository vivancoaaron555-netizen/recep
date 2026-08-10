# 🤖 Recept.ai — Tu Recepcionista de IA 24/7

> Plataforma SaaS completa para automatizar la atención al cliente mediante IA en llamadas telefónicas y WhatsApp.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + TypeScript |
| Frontend | Next.js 14 + Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| IA Cerebro | Groq SDK (llama-3.1-70b-versatile) |
| Voz en llamadas | Vapi.ai + ElevenLabs |
| Telefonía | Twilio |
| Pagos | Stripe |
| Emails | Resend |
| Deploy | Railway |

---

## 🚀 Setup Paso a Paso

### 1. Clonar y configurar el proyecto

```bash
git clone <tu-repo>
cd recept-ai
npm install:all    # instala dependencias en root, backend y frontend
```

### 2. Configurar variables de entorno

```bash
# Copia el .env.example a .env en backend
cp .env.example backend/.env

# Copia el .env.example a .env.local en frontend
cp .env.example frontend/.env.local
```

Rellena **todas** las variables en ambos archivos.

### 3. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) → Crear proyecto
2. En el SQL Editor, ejecuta todo el contenido de `supabase/schema.sql`
3. Copia la URL y las claves API al `.env`

### 4. Configurar Stripe

1. Ve a [stripe.com](https://stripe.com) → Dashboard
2. Crear 3 productos con sus precios:
   - **Starter**: €49/mes → copia el Price ID → `STRIPE_PRICE_BASIC`
   - **Pro**: €99/mes → copia el Price ID → `STRIPE_PRICE_PRO`
   - **Business**: €199/mes → copia el Price ID → `STRIPE_PRICE_BUSINESS`
3. Copiar la clave secreta → `STRIPE_SECRET_KEY`
4. Para el webhook local, usa Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   ```
5. El webhook secret que aparece → `STRIPE_WEBHOOK_SECRET`

#### 🔴 Cambiar Stripe de Test a Live

Cuando estés listo para cobros reales:

1. Ve a Stripe Dashboard → Activar tu cuenta (si no lo has hecho, necesitarás datos bancarios, RFC, etc.)
2. Cambia a **modo Live** con el toggle en la esquina superior derecha
3. Copia las claves **Live** (no las de prueba):
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
4. Crea los **mismos 3 productos en modo Live** y copia los nuevos Price IDs (los de test terminan en `_test`, los de live no)
5. Ve a Developers → Webhooks → **Add endpoint** con la URL real de Railway:
   - URL: `https://tu-backend.railway.app/api/billing/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copia el **Signing Secret** (empieza con `whsec_...`) → `STRIPE_WEBHOOK_SECRET`
6. Actualiza las variables en Railway (o en tu .env) con TODOS los valores live
7. Redeploy el backend

> ⚠️ **Importante:** Siempre prueba con el modo test primero usando números de tarjeta de prueba.
> Los Price IDs de test NO funcionan en modo live y viceversa.

### 5. Configurar Vapi.ai

1. Ve a [vapi.ai](https://vapi.ai) → Crear cuenta
2. Obtén tu API Key → `VAPI_API_KEY`
3. En la sección Webhooks, configura:
   - URL: `https://tu-backend.railway.app/api/vapi/webhook`
   - Eventos: `assistant-request`, `end-of-call-report`, `function-call`

### 6. Configurar Twilio

1. Ve a [twilio.com](https://twilio.com) → Crear cuenta
2. Obtén `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
3. Compra un número de teléfono → `TWILIO_PHONE_NUMBER`
4. Para WhatsApp Sandbox:
   - Ve a Console → Messaging → WhatsApp Sandbox
   - Configura el webhook: `https://tu-backend.railway.app/api/whatsapp/webhook`

### 7. Configurar ElevenLabs

1. Ve a [elevenlabs.io](https://elevenlabs.io) → Crear cuenta
2. Obtén API Key → `ELEVENLABS_API_KEY`

### 8. Configurar Groq

1. Ve a [console.groq.com](https://console.groq.com) → Crear cuenta
2. Crea una API Key → `GROQ_API_KEY`

### 9. Configurar Resend (emails)

1. Ve a [resend.com](https://resend.com) → Crear cuenta
2. Crea una API Key → `RESEND_API_KEY`
3. Verifica tu dominio de envío

---

## 🏃 Desarrollo Local

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto arranca:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

### Comandos útiles

```bash
npm run dev              # Arranca todo en paralelo
npm run dev:backend      # Solo backend
npm run dev:frontend     # Solo frontend
npm run build            # Build de producción
npm run start            # Arranca en producción
```

---

## 📁 Estructura del Proyecto

```
recept-ai/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point Express
│   │   ├── routes/
│   │   │   ├── auth.ts           # POST /register, /login, GET /me
│   │   │   ├── onboarding.ts     # POST /company, /assistant, /channels
│   │   │   ├── vapi.ts           # POST /vapi/webhook (llamadas)
│   │   │   ├── whatsapp.ts       # POST /whatsapp/webhook
│   │   │   ├── billing.ts        # Stripe checkout, portal, webhook
│   │   │   ├── dashboard.ts      # GET /stats, /calls, /appointments
│   │   │   └── admin.ts          # GET /admin/companies, /admin/stats
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT middleware
│   │   │   └── adminOnly.ts      # Admin email check
│   │   └── utils/
│   │       ├── supabase.ts       # Supabase client
│   │       ├── groq.ts           # Groq client + helpers
│   │       ├── twilio.ts         # Twilio Lookup + SMS helpers
│   │       └── generateSystemPrompt.ts  # Dynamic AI prompt
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── onboarding/page.tsx   # 4-step wizard
│   │   ├── dashboard/page.tsx
│   │   ├── calls/page.tsx
│   │   ├── appointments/page.tsx
│   │   ├── settings/page.tsx
│   │   └── admin/page.tsx
│   ├── components/
│   │   └── AppLayout.tsx         # Shared sidebar layout
│   ├── lib/
│   │   ├── api.ts                # Typed API client
│   │   └── auth.ts               # JWT helpers
│   └── package.json
│
├── supabase/
│   └── schema.sql               # Database schema completo
│
├── .env.example                 # Template de variables de entorno
├── package.json                 # Root (concurrently)
└── README.md
```

---

## 🌐 Deploy en Railway

### Backend

1. Conecta tu repo a [railway.app](https://railway.app)
2. Crea un nuevo servicio → selecciona la carpeta `backend`
3. Configura las variables de entorno
4. Railway detecta automáticamente Node.js

### Frontend

1. Crea otro servicio → selecciona la carpeta `frontend`
2. Build command: `npm run build`
3. Start command: `npm run start`
4. Configura `NEXT_PUBLIC_API_URL` con la URL del backend en Railway

---

## 🔑 Variables de Entorno — Backend

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Clave de service role de Supabase |
| `GROQ_API_KEY` | API Key de Groq |
| `VAPI_API_KEY` | API Key de Vapi.ai |
| `TWILIO_ACCOUNT_SID` | SID de cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | Auth token de Twilio |
| `TWILIO_PHONE_NUMBER` | Número Twilio asignado |
| `ELEVENLABS_API_KEY` | API Key de ElevenLabs |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe |
| `STRIPE_PRICE_BASIC` | Price ID del plan Basic |
| `STRIPE_PRICE_PRO` | Price ID del plan Pro |
| `STRIPE_PRICE_BUSINESS` | Price ID del plan Business |
| `RESEND_API_KEY` | API Key de Resend |
| `JWT_SECRET` | Secret para firmar JWTs (mín. 32 chars) |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `ADMIN_EMAIL` | Email del administrador del SaaS |
| `PORT` | Puerto del backend (default: 3001) |

---

## 🧪 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Onboarding (auth requerida)
```
POST   /api/onboarding/company
POST   /api/onboarding/assistant
POST   /api/onboarding/channels
```

### Webhooks
```
POST   /api/vapi/webhook        ← Vapi.ai
POST   /api/whatsapp/webhook    ← Twilio
POST   /api/billing/webhook     ← Stripe
```

### Dashboard (auth requerida)
```
GET    /api/dashboard/stats
GET    /api/calls
GET    /api/appointments
PATCH  /api/appointments/:id
```

### Billing (auth requerida)
```
POST   /api/billing/create-checkout
POST   /api/billing/portal
```

### Admin (solo admin email)
```
GET    /api/admin/companies
GET    /api/admin/stats
```

---

## 📞 Flujo de una Llamada

1. Cliente llama al número Twilio asignado
2. Twilio redirige la llamada a Vapi.ai
3. Vapi envía `assistant-request` al webhook `/api/vapi/webhook`
4. Backend busca la empresa por número, obtiene el asistente y genera el `systemPrompt` dinámico
5. Backend devuelve la configuración del asistente (modelo Groq + voz ElevenLabs)
6. Vapi maneja la llamada con IA: transcribe, genera respuestas, habla
7. Al terminar, Vapi envía `end-of-call-report` con el transcript completo
8. Backend guarda la llamada, genera resumen con Groq y actualiza la DB

## 💬 Flujo de WhatsApp

1. Cliente envía mensaje al número de WhatsApp
2. Twilio recibe y hace POST al webhook `/api/whatsapp/webhook`
3. Backend identifica la empresa, obtiene historial de conversación
4. Groq genera respuesta con contexto completo
5. Backend guarda el mensaje en el historial
6. Respuesta enviada como TwiML al cliente

---

## 📄 Licencia

MIT — Hecho con ❤️ para automatizar la atención al cliente en latinoamérica.
