-- Migration: 0017_create_settings.sql
-- Tabela para armazenar configurações gerais do sistema (ex: antecedência mínima de agendamento em minutos)

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('min_lead_time_minutes', '30');
INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_name', 'Barbearia Do Vale');
INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_address', 'Av. Senador Melo Viana, 709 - Goiás, Araguari/MG');
INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_phone', '(34) 99868-4036');
INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_open_hours', 'Seg - Sex: 09:00 - 20:00 | Sábado: 08:00 - 19:00');
INSERT OR IGNORE INTO settings (key, value) VALUES ('inactivity_minutes', '5');
