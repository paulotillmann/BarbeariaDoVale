-- Migration: 0006_appointment_services.sql
-- Tabela de relacionamento para permitir múltiplos serviços em um único agendamento

CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, service_id)
);
