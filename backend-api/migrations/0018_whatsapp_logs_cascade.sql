-- Migration: 0018_whatsapp_logs_cascade.sql
-- Adiciona ON DELETE CASCADE na chave estrangeira appointment_id da tabela whatsapp_logs

CREATE TABLE IF NOT EXISTS whatsapp_logs_new (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK(message_type IN ('confirmation', 'reminder', 'cancellation')),
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  scheduled_time TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO whatsapp_logs_new (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at)
SELECT id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at FROM whatsapp_logs;

DROP TABLE IF EXISTS whatsapp_logs;

ALTER TABLE whatsapp_logs_new RENAME TO whatsapp_logs;
