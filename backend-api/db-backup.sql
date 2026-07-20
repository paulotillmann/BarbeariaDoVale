PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_init.sql','2026-07-14 17:34:42');
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('client', 'barber', 'admin')),
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('barb-carlos','CARLOS MAGNOS LIMA DA SILVA','84999990001',NULL,'8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8','barber','2026-07-14 17:34:42');
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('barb-felix','FELIX SUEL','84999990002',NULL,'8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8','barber','2026-07-14 17:34:42');
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('barb-givanildo','GIVANILDO SOARES VERÍSSIMO','84999990003',NULL,'8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8','barber','2026-07-14 17:34:42');
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('barb-wagner','WAGNER WILLIAM FERNANDES DA SILVA','84999990004',NULL,'8a7c29377a064bc3dfb49bbbb6d934bbdbdcf9e1d8825875ea48cd1be49339e8','barber','2026-07-14 17:34:42');
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('admin-root','Paulo Admin','84999999999','paulogtillmann@gmail.com','745bc59acd3598ab3102504155dca20433a58da62159c8a85f1300ba5401529d','admin','2026-07-14 17:34:42');
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('usr-aa90901c-ef20-472f-a434-cee38912a851','Gustavo Tillmann ','(34) 98832-2462',NULL,'quick-booking-user-hash','client','2026-07-16 23:50:19');
INSERT INTO "users" ("id","name","phone","email","password_hash","role","created_at") VALUES('usr-b73c873d-4c63-46ce-9b56-6e32010f649f','KELLY TILLMANN','(34) 98821-8498',NULL,'quick-booking-user-hash','client','2026-07-16 20:29:17');
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
INSERT INTO "services" ("id","name","description","duration_minutes","price","created_at") VALUES('srv-corte','Corte de Cabelo','Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta.',30,55,'2026-07-14 17:34:42');
INSERT INTO "services" ("id","name","description","duration_minutes","price","created_at") VALUES('srv-barba','Barba Completa','Barboterapia completa com toalha quente, óleos essenciais e massagem facial.',30,45,'2026-07-14 17:34:42');
INSERT INTO "services" ("id","name","description","duration_minutes","price","created_at") VALUES('srv-combo','Combo Brooklyn (Corte + Barba)','A experiência completa da Barbearia Brooklyn com desconto exclusivo.',60,90,'2026-07-14 17:34:42');
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id),
  barber_id TEXT NOT NULL REFERENCES users(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  appointment_time TEXT NOT NULL, 
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
INSERT INTO "appointments" ("id","client_id","barber_id","service_id","appointment_time","status","created_at") VALUES('8a237228-d7b6-450a-8083-f91c6c0a4064','usr-aa90901c-ef20-472f-a434-cee38912a851','barb-givanildo','srv-corte','2026-07-17T18:30','confirmed','2026-07-16 23:50:19');
INSERT INTO "appointments" ("id","client_id","barber_id","service_id","appointment_time","status","created_at") VALUES('3544b1bd-7463-4915-bd17-913617e3cb76','usr-aa90901c-ef20-472f-a434-cee38912a851','barb-givanildo','srv-combo','2026-07-17T17:30','confirmed','2026-07-16 23:55:13');
CREATE TABLE whatsapp_logs (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  message_type TEXT NOT NULL CHECK(message_type IN ('confirmation', 'reminder', 'cancellation')),
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  scheduled_time TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
INSERT INTO "whatsapp_logs" ("id","appointment_id","message_type","phone","status","scheduled_time","sent_at","created_at") VALUES('49b71f0d-7394-4671-b9da-415b8d3da41d','8a237228-d7b6-450a-8083-f91c6c0a4064','confirmation','84999990003','sent',NULL,'2026-07-16 23:50:22','2026-07-16 23:50:22');
INSERT INTO "whatsapp_logs" ("id","appointment_id","message_type","phone","status","scheduled_time","sent_at","created_at") VALUES('03d1a827-e615-4dfb-ac3e-6bf032a06494','8a237228-d7b6-450a-8083-f91c6c0a4064','confirmation','(34) 98832-2462','sent',NULL,'2026-07-16 23:50:34','2026-07-16 23:50:34');
INSERT INTO "whatsapp_logs" ("id","appointment_id","message_type","phone","status","scheduled_time","sent_at","created_at") VALUES('0649ba5b-05d7-480c-bb45-f80444a14a2c','3544b1bd-7463-4915-bd17-913617e3cb76','confirmation','84999990003','sent',NULL,'2026-07-16 23:55:16','2026-07-16 23:55:16');
INSERT INTO "whatsapp_logs" ("id","appointment_id","message_type","phone","status","scheduled_time","sent_at","created_at") VALUES('dc6a9fba-0188-4d74-8e7f-471fe38c51f3','3544b1bd-7463-4915-bd17-913617e3cb76','confirmation','(34) 98832-2462','sent',NULL,'2026-07-16 23:55:28','2026-07-16 23:55:28');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',1);
