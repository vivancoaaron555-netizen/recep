-- =============================================
-- RECEPT.AI — Supabase Schema
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'owner', -- owner | admin
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: companies
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sector      TEXT NOT NULL DEFAULT 'general',
  schedule    JSONB NOT NULL DEFAULT '{
    "monday":    {"open": "09:00", "close": "18:00", "active": true},
    "tuesday":   {"open": "09:00", "close": "18:00", "active": true},
    "wednesday": {"open": "09:00", "close": "18:00", "active": true},
    "thursday":  {"open": "09:00", "close": "18:00", "active": true},
    "friday":    {"open": "09:00", "close": "18:00", "active": true},
    "saturday":  {"open": "09:00", "close": "13:00", "active": false},
    "sunday":    {"open": "09:00", "close": "13:00", "active": false}
  }',
  services    TEXT[] NOT NULL DEFAULT '{}',
  address     TEXT,
  faq         TEXT,
  phone       TEXT,
  website     TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verification_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: assistants
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assistants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Sofia',
  gender          TEXT NOT NULL DEFAULT 'female', -- female | male
  voice_id        TEXT NOT NULL DEFAULT 'EXAVITQu4vr4xnSDxMaL', -- ElevenLabs voice ID
  language        TEXT NOT NULL DEFAULT 'es',
  personality     TEXT NOT NULL DEFAULT 'professional',
  system_prompt   TEXT,
  vapi_assistant_id TEXT, -- ID del asistente creado en Vapi
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: calls
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone_from          TEXT,
  phone_to            TEXT,
  duration_seconds    INTEGER NOT NULL DEFAULT 0,
  transcript          TEXT,
  summary             TEXT,
  appointment_created BOOLEAN NOT NULL DEFAULT FALSE,
  vapi_call_id        TEXT,
  status              TEXT NOT NULL DEFAULT 'completed', -- completed | missed | failed
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: appointments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_name    TEXT NOT NULL,
  patient_phone   TEXT NOT NULL,
  service         TEXT NOT NULL,
  date            TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled | completed
  notes           TEXT,
  source          TEXT NOT NULL DEFAULT 'call', -- call | whatsapp | web
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'basic', -- basic | pro | clinic
  status                  TEXT NOT NULL DEFAULT 'trialing', -- trialing | active | past_due | canceled | unpaid
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: phone_numbers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_numbers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  twilio_number   TEXT NOT NULL,
  twilio_sid      TEXT NOT NULL,
  friendly_name   TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLE: whatsapp_conversations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone_from      TEXT NOT NULL,
  messages        JSONB NOT NULL DEFAULT '[]',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  appointment_created BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_company_id ON assistants(company_id);
CREATE INDEX IF NOT EXISTS idx_calls_company_id ON calls(company_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_company_id ON phone_numbers(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_conversations(company_id, phone_from);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER FUNCTION
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
-- We use service role key from backend, so RLS is advisory.
-- Enable RLS on all tables.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "Service role has full access to users"
  ON users FOR ALL USING (true);

CREATE POLICY "Service role has full access to companies"
  ON companies FOR ALL USING (true);

CREATE POLICY "Service role has full access to assistants"
  ON assistants FOR ALL USING (true);

CREATE POLICY "Service role has full access to calls"
  ON calls FOR ALL USING (true);

CREATE POLICY "Service role has full access to appointments"
  ON appointments FOR ALL USING (true);

CREATE POLICY "Service role has full access to subscriptions"
  ON subscriptions FOR ALL USING (true);

CREATE POLICY "Service role has full access to phone_numbers"
  ON phone_numbers FOR ALL USING (true);

CREATE POLICY "Service role has full access to whatsapp_conversations"
  ON whatsapp_conversations FOR ALL USING (true);

-- ─────────────────────────────────────────────
-- SEED: ElevenLabs voice options (reference)
-- ─────────────────────────────────────────────
-- Female ES: EXAVITQu4vr4xnSDxMaL (Sarah), XB0fDUnXU5powFXDhCwa (Charlotte)
-- Male ES:   pNInz6obpgDQGcFmaJgB (Adam), N2lVS1w4EtoT3dr4eOWO (Callum)
-- Female EN: 21m00Tcm4TlvDq8ikWAM (Rachel), AZnzlk1XvdvUeBnXmlld (Domi)
-- Male EN:   ErXwobaYiN019PkySvjV (Antoni), VR6AewLTigWG4xSOukaG (Arnold)
