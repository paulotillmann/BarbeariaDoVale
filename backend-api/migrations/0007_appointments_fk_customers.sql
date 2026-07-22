-- Migration: 0007_appointments_fk_customers.sql
-- Altera a chave estrangeira client_id em appointments para referenciar a tabela customers(id)

CREATE TABLE IF NOT EXISTS appointments_new (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES customers(id),
  barber_id TEXT NOT NULL REFERENCES barbers(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  appointment_time TEXT NOT NULL, 
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO appointments_new (id, client_id, barber_id, service_id, appointment_time, status, created_at)
SELECT id, client_id, barber_id, service_id, appointment_time, status, created_at FROM appointments;

DROP TABLE IF EXISTS whatsapp_logs;
DROP TABLE IF EXISTS appointments;

ALTER TABLE appointments_new RENAME TO appointments;

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  message_type TEXT NOT NULL CHECK(message_type IN ('confirmation', 'reminder', 'cancellation')),
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  scheduled_time TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
