-- Migration: 0000_init.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('client', 'barber', 'admin')),
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id),
  barber_id TEXT NOT NULL REFERENCES users(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  appointment_time TEXT NOT NULL, -- Formato: YYYY-MM-DD HH:MM
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

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

-- Seed de Serviços Clássicos
INSERT INTO services (id, name, description, duration_minutes, price) VALUES
('srv-corte', 'Corte de Cabelo', 'Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta.', 30, 55.00),
('srv-barba', 'Barba Completa', 'Barboterapia completa com toalha quente, óleos essenciais e massagem facial.', 30, 45.00),
('srv-combo', 'Combo Do Vale (Corte + Barba)', 'A experiência completa da Barbearia Do Vale com desconto exclusivo.', 60, 90.00);

-- Seed de Barbeiros e Administrador
-- Hash de '123456' com o salt 'barbearia-vale-salt-2026' -> 8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8
-- Hash de '123@admin' com o salt 'barbearia-vale-salt-2026' -> 745bc59acd3598ab3102504155dca20433a58da62159c8a85f1300ba5401529d
INSERT INTO users (id, name, phone, email, password_hash, role) VALUES
('barb-marcio', 'MARCIO DO VALE', '34988537720', NULL, '8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8', 'barber'),
('barb-lucas', 'LUCAS DO VALE', '34988272226', NULL, '8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8', 'barber'),
('barb-paulo', 'PAULO TILLMANN NETO', '34998684036', NULL, '8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8', 'barber'),
('admin-root', 'Paulo Admin', '84999999999', 'paulogtillmann@gmail.com', '745bc59acd3598ab3102504155dca20433a58da62159c8a85f1300ba5401529d', 'admin');
