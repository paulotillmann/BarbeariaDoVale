-- Migration: 0014_create_caixa.sql
-- Tabela para controle do Fluxo de Caixa (receitas e despesas)

CREATE TABLE IF NOT EXISTS caixa (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('receita', 'despesa')),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  barber_id TEXT REFERENCES barbers(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_caixa_date ON caixa(date);
CREATE INDEX IF NOT EXISTS idx_caixa_type ON caixa(type);
CREATE INDEX IF NOT EXISTS idx_caixa_appointment_id ON caixa(appointment_id);
