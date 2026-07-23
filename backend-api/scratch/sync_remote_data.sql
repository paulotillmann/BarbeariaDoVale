-- SQL Dump generated for Cloudflare D1 Remote Sync
PRAGMA foreign_keys = OFF;

DELETE FROM products;
DELETE FROM whatsapp_logs;
DELETE FROM appointment_services;
DELETE FROM appointments;
DELETE FROM customers;
DELETE FROM barber_services;
DELETE FROM barbers;
DELETE FROM services;
DELETE FROM users;

-- Data for users (1 rows)
INSERT INTO users (id, name, phone, email, password_hash, role, created_at) VALUES ('usr-aa90901c-ef20-472f-a434-cee38912a851', 'Paulo Tillmann (Admin)', '34980074070', 'paulogtillmann@gmail.com', '0ac90b2e5c4c4be6d63d6780c1ec89225d2a3664740877103753a777745d7585', 'admin', '2026-07-16 23:50:19');

-- Data for services (12 rows)
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-corte', 'CABELO', 'Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta.', 30, 35.0, '2026-07-14 17:34:42');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-barba', 'BARBA', 'Barboterapia completa com toalha quente, óleos essenciais e massagem facial.', 30, 30.0, '2026-07-14 17:34:42');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-combo', 'COMBO BARBA CABELO E SOMBRANCELHA', 'COMBO BARBA CABELO E SOMBRANCELHA', 60, 70.0, '2026-07-14 17:34:42');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-990658c7-abea-4f30-9144-5c7e062164fc', 'SELAGEM', 'SELAGEM', 60, 50.0, '2026-07-20 17:24:18');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-21d2bcb1-84f8-4735-b682-0476f77b9cf0', 'SOMBRANCELHA', 'SOMBRANCELHA', 0, 10.0, '2026-07-21 21:07:10');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5', 'BARBA EXPRESS', 'BARBA EXPRESS', 30, 25.0, '2026-07-22 15:37:09');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-083539ad-2b3d-452c-8e0e-c8727aff9585', 'BOTOX', 'BOTOX', 30, 50.0, '2026-07-22 15:40:34');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-23b91c73-fdb8-4c75-9ba5-620cb57e1a16', 'RELAXAMENTO', 'RELAXAMENTO', 30, 30.0, '2026-07-22 15:41:59');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-d468393d-2449-424f-a95c-80e5c2f377c4', 'CORTE (LIVRE)', 'CORTE DE CABELO', 0, 35.0, '2026-07-22 15:46:21');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-ad37cce7-de91-470f-9019-f625f2e73545', 'PIGMENTAÇÃO BARBA', 'PIGMENTAÇÃO BARBA', 30, 15.0, '2026-07-22 16:05:07');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-8e885030-b1b0-480d-bf81-9f0b09c834d3', 'PEZINHO', 'PEZINHO', 0, 10.0, '2026-07-22 16:06:40');
INSERT INTO services (id, name, description, duration_minutes, price, created_at) VALUES ('srv-aa8e507d-f8c6-41c0-a427-9e8b60b9ffc9', 'PROGRESSIVA', 'PROGRESSIVA', 60, 50.0, '2026-07-22 16:10:13');

-- Data for barbers (3 rows)
INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, created_at, service_commission, product_commission) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'PAULO TILLMANN NETO', '(34) 99868-4036', NULL, NULL, 'BARBEIRO', '2000-01-01', '2026-07-21 16:37:07', 15.0, 30.0);
INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, created_at, service_commission, product_commission) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'MARCIO DO VALE', '(34) 9', NULL, NULL, 'BARBEIRO CIO', '2000-01-01', '2026-07-21 17:04:36', 30.0, 50.0);
INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, created_at, service_commission, product_commission) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'LUCAS DO VALE', '(34) 98827-2226', NULL, NULL, 'BARBEIRO', '2010-01-01', '2026-07-21 17:05:43', 20.0, 30.0);

-- Data for barber_services (36 rows)
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-barba');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-barba');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-barba');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-combo');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-combo');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-combo');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-083539ad-2b3d-452c-8e0e-c8727aff9585');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-083539ad-2b3d-452c-8e0e-c8727aff9585');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-083539ad-2b3d-452c-8e0e-c8727aff9585');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-corte');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-corte');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-23b91c73-fdb8-4c75-9ba5-620cb57e1a16');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-23b91c73-fdb8-4c75-9ba5-620cb57e1a16');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-23b91c73-fdb8-4c75-9ba5-620cb57e1a16');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-21d2bcb1-84f8-4735-b682-0476f77b9cf0');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-21d2bcb1-84f8-4735-b682-0476f77b9cf0');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-21d2bcb1-84f8-4735-b682-0476f77b9cf0');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-ad37cce7-de91-470f-9019-f625f2e73545');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-ad37cce7-de91-470f-9019-f625f2e73545');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-ad37cce7-de91-470f-9019-f625f2e73545');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-8e885030-b1b0-480d-bf81-9f0b09c834d3');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-8e885030-b1b0-480d-bf81-9f0b09c834d3');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-8e885030-b1b0-480d-bf81-9f0b09c834d3');
INSERT INTO barber_services (barber_id, service_id) VALUES ('578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-aa8e507d-f8c6-41c0-a427-9e8b60b9ffc9');
INSERT INTO barber_services (barber_id, service_id) VALUES ('f117b672-566d-401b-9442-fe220a2a173d', 'srv-aa8e507d-f8c6-41c0-a427-9e8b60b9ffc9');
INSERT INTO barber_services (barber_id, service_id) VALUES ('87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-aa8e507d-f8c6-41c0-a427-9e8b60b9ffc9');

-- Data for customers (28 rows)
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('d44b9570-6ae3-4f6a-8ff5-13149c74e389', 'PAULO GUSTAVO TILLMANN', 'ALAMEDA ROZA DORAZIO TOMAZ, 130', '(34) 98832-2462', '1973-04-22', NULL, '2026-07-19 15:46:32');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('5f86a4f0-9f70-4576-bc17-d4058796ddad', 'KELLY TILLMANN', 'ALAMEDA ROZA DORAZIO TOMAZ, 130', '(34) 98821-8498', '1972-10-17', NULL, '2026-07-19 15:48:17');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('bafc1e46-7137-46b1-960a-45cf2164d709', 'PAULO GUSTAVO TILLMANN', 'ALAMEDA ROZA DORAZIO TOMAZ, 130', '(34) 98832-2462', '1973-04-22', NULL, '2026-07-19 15:49:45');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('27855156-627a-4ab8-b749-015db557d6db', 'CARLOS JOSE', NULL, '(34) 98733-7717', NULL, NULL, '2026-07-21 16:57:32');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('882e167e-f2fb-4a11-82ca-1159213c95a1', 'Carlos Eduardo Silva', NULL, '(34) 98000-0000', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('d4792c70-8e36-435e-839c-e60685b4f5e6', 'Lucas Gabriel Oliveira', NULL, '34980012345', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('837a22bc-0fa4-42c6-9752-a865c4728a38', 'Matheus Henrique Santos', NULL, '34980024690', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('ffaf9d06-d4bc-42eb-8d34-23bd401b8a6a', 'Gabriel Rodrigues Souza', NULL, '34980037035', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('e4e742ab-4d0e-4030-8548-f14574af5e98', 'Felipe Augusto Pereira', NULL, '34980049380', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('60067d5f-b92c-48d1-a83f-bcc5c6e02453', 'KELLY TILLMANN', NULL, '(34) 98821-8498', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('e520d12a-dba6-4d6d-8d49-12d3d16db10b', 'Bruno Leonardo Ferreira', NULL, '34980074070', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('29ddd92e-cca2-4d7f-8570-f44af59828f0', 'Gustavo Henrique Lima', NULL, '34980086415', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('19429a2b-3a8a-4d21-91e3-820fb6aeda78', 'Rafael Barbosa Carvalho', NULL, '34980098760', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('d411b368-ba3e-4751-a145-20df36d8e945', 'Daniel Vitor Gomes', NULL, '34980111105', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('66b99e0e-04f0-46c9-a588-d132ba6ac8b1', 'Thiago Alexander Martins', NULL, '34980123450', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('09496d16-d03d-4142-b5d8-b8a503dc9c7f', 'Diego Armando Ribeiro', NULL, '34980135795', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('cdedd16f-b168-4884-beb2-ce0ed6b0e344', 'Vinícius Gabriel Almeida', NULL, '34980148140', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('07b06898-e44a-4721-bfb8-4a122022a554', 'Marcelo Augusto Araujo', NULL, '34980160485', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('bb48caef-7bd6-4ec2-b5fe-fa2898f2e460', 'Leonardo Vinícius Melo', NULL, '34980172830', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('0ff75b5b-c12b-42e1-80d6-44a1f30b3b2c', 'André Luiz Cardoso', NULL, '(34) 98018-5175', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('987614b7-1e8f-4fd7-a61b-f68b29b8061e', 'Fernando Henrique Teixeira', NULL, '(34) 98019-7520', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('c0f79757-6c25-448b-8d8f-8c9f5550cd5c', 'Guilherme Eduardo Castro', NULL, '34980209865', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('0377e924-1fb6-42eb-8987-77891fa05484', 'Samuel Victor Rocha', NULL, '34980222210', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('6d75e38e-43fa-4b73-ae67-d1a7ae3793e2', 'Eduardo Felipe Correia', NULL, '34980234555', NULL, NULL, '2026-07-21 18:47:06');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('dcdb32c5-6809-43e5-ad36-78501d7d039d', 'JOÃO PEREIRA', NULL, '(34) 98767-2324', NULL, NULL, '2026-07-21 19:39:09');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('889528c7-12f7-4766-a97f-5b229de769d7', 'JUNIOR SANTOS', NULL, '(34) 97890-2324', NULL, NULL, '2026-07-21 19:40:38');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('usr-f7140250-1772-48e9-9fcf-815e37721139', 'Cliente Teste FK', NULL, '34977889900', NULL, NULL, '2026-07-21 20:05:40');
INSERT INTO customers (id, name, address, phone, birth_date, photo, created_at) VALUES ('3360c46a-11f2-4d4e-840e-d80b39903127', 'Cliente Exclusivo Customers', NULL, '34955554444', NULL, NULL, '2026-07-21 20:12:33');

-- Data for appointments (25 rows)
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('20fe6f8f-1d77-4012-a3fb-9bccfcfc856c', 'd44b9570-6ae3-4f6a-8ff5-13149c74e389', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-21T18:00', 'cancelled', '2026-07-21 16:37:21');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('e7584185-d2df-48b3-9131-949c40f2f122', '5f86a4f0-9f70-4576-bc17-d4058796ddad', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-barba', '2026-07-21T18:00', 'confirmed', '2026-07-21 16:37:21');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('78120050-6af2-49e1-8c4a-9130e302714f', 'bafc1e46-7137-46b1-960a-45cf2164d709', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-21T18:30', 'confirmed', '2026-07-21 16:48:10');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('a4902723-04d7-43df-9b5e-716a36dd547d', '27855156-627a-4ab8-b749-015db557d6db', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-barba', '2026-07-21T18:00', 'confirmed', '2026-07-21 16:57:42');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('63c3ce23-3ba4-4773-a652-cc1feb5a16b9', '882e167e-f2fb-4a11-82ca-1159213c95a1', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-combo', '2026-07-21T18:00', 'confirmed', '2026-07-21 17:06:14');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('caa2926d-3c0e-4424-95a1-fb21a40e59c9', 'd4792c70-8e36-435e-839c-e60685b4f5e6', '87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-corte', '2026-07-22T09:30', 'confirmed', '2026-07-21 18:45:41');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('5de6e81f-b82f-4ccd-80a7-5c85f07caba4', '837a22bc-0fa4-42c6-9752-a865c4728a38', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-22T12:30', 'absent', '2026-07-21 18:52:32');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('6372996b-f281-4a79-9f0d-5906a9de4845', 'ffaf9d06-d4bc-42eb-8d34-23bd401b8a6a', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-combo', '2026-07-22T11:30', 'confirmed', '2026-07-21 18:53:35');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('039d109e-f7d2-4129-837a-492e95d1f51f', 'e4e742ab-4d0e-4030-8548-f14574af5e98', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-barba', '2026-07-22T12:30', 'confirmed', '2026-07-21 18:58:52');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('baff7819-b5fd-4793-aab6-2f4fadabdf65', '60067d5f-b92c-48d1-a83f-bcc5c6e02453', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-990658c7-abea-4f30-9144-5c7e062164fc', '2026-07-22T11:00', 'confirmed', '2026-07-21 19:30:29');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('872e8755-4a0b-4c44-9fcb-28d998d047cc', 'e520d12a-dba6-4d6d-8d49-12d3d16db10b', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-22T14:30', 'confirmed', '2026-07-21 19:39:34');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('acd56ea0-b593-404a-972c-8dbe05c6a28b', '29ddd92e-cca2-4d7f-8570-f44af59828f0', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-combo', '2026-07-23T10:00', 'cancelled', '2026-07-21 19:40:49');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('68ea42d8-0fbd-45a8-8f22-44b5f4d074cf', '19429a2b-3a8a-4d21-91e3-820fb6aeda78', '87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-corte', '2026-07-23T12:00', 'confirmed', '2026-07-21 19:41:16');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('0c9669fa-a3ed-4d0d-846c-152b9eb2eb3a', 'usr-f7140250-1772-48e9-9fcf-815e37721139', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-25T16:00', 'cancelled', '2026-07-21 20:05:40');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('6263cef1-82a5-4b49-b190-3bc8bf4a05c1', 'd44b9570-6ae3-4f6a-8ff5-13149c74e389', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-25T11:30', 'confirmed', '2026-07-21 20:11:04');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('ec279ac5-469e-48f6-892e-dc05a5e607b6', '3360c46a-11f2-4d4e-840e-d80b39903127', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-26T10:00', 'confirmed', '2026-07-21 20:12:33');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('a9481610-5daa-40a1-903e-fed2fe36c4ae', '882e167e-f2fb-4a11-82ca-1159213c95a1', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-barba', '2026-07-23T12:30', 'confirmed', '2026-07-21 20:17:10');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('db9de442-2802-4249-a776-4ca3ef1c89e8', 'dcdb32c5-6809-43e5-ad36-78501d7d039d', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-22T16:00', 'confirmed', '2026-07-21 21:10:06');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('b9a00f10-1ad5-40be-a3e9-80fc09f1ff66', 'dcdb32c5-6809-43e5-ad36-78501d7d039d', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-corte', '2026-07-23T10:30', 'confirmed', '2026-07-22 15:17:46');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('71c0ba6e-1a95-44f1-a519-bcd132c2deef', '987614b7-1e8f-4fd7-a61b-f68b29b8061e', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-corte', '2026-07-23T14:00', 'confirmed', '2026-07-22 15:32:57');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('ca586b20-65b6-495d-8b9a-2b140012e745', '0ff75b5b-c12b-42e1-80d6-44a1f30b3b2c', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4', '2026-07-25T12:00', 'confirmed', '2026-07-22 15:47:51');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('558fb4ba-9ef8-40f3-979b-ef6132d37ed9', 'd44b9570-6ae3-4f6a-8ff5-13149c74e389', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4', '2026-07-23T15:00', 'confirmed', '2026-07-22 15:58:28');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('e697d075-ac33-460f-8537-363a93f2c2dd', '987614b7-1e8f-4fd7-a61b-f68b29b8061e', 'f117b672-566d-401b-9442-fe220a2a173d', 'srv-corte', '2026-07-24T11:00', 'confirmed', '2026-07-22 16:23:32');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('5364d41f-88fa-429f-9884-b28e0b8cb07b', 'dcdb32c5-6809-43e5-ad36-78501d7d039d', '578d7e25-b354-42a3-87a3-bc8f4af86851', 'srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5', '2026-07-24T10:00', 'confirmed', '2026-07-22 16:34:00');
INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, created_at) VALUES ('b8732c7f-4f10-4f04-a653-7b5c64adddc5', '882e167e-f2fb-4a11-82ca-1159213c95a1', '87d114f2-ec76-4722-ad92-316400f2b4f6', 'srv-combo', '2026-07-24T11:30', 'confirmed', '2026-07-22 16:34:53');

-- Data for appointment_services (31 rows)
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('78120050-6af2-49e1-8c4a-9130e302714f', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('78120050-6af2-49e1-8c4a-9130e302714f', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('a4902723-04d7-43df-9b5e-716a36dd547d', 'srv-barba');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('a4902723-04d7-43df-9b5e-716a36dd547d', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('63c3ce23-3ba4-4773-a652-cc1feb5a16b9', 'srv-combo');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('caa2926d-3c0e-4424-95a1-fb21a40e59c9', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('caa2926d-3c0e-4424-95a1-fb21a40e59c9', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('6372996b-f281-4a79-9f0d-5906a9de4845', 'srv-combo');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('039d109e-f7d2-4129-837a-492e95d1f51f', 'srv-barba');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('5de6e81f-b82f-4ccd-80a7-5c85f07caba4', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('5de6e81f-b82f-4ccd-80a7-5c85f07caba4', 'srv-barba');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('acd56ea0-b593-404a-972c-8dbe05c6a28b', 'srv-combo');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('872e8755-4a0b-4c44-9fcb-28d998d047cc', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('68ea42d8-0fbd-45a8-8f22-44b5f4d074cf', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('baff7819-b5fd-4793-aab6-2f4fadabdf65', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('0c9669fa-a3ed-4d0d-846c-152b9eb2eb3a', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('6263cef1-82a5-4b49-b190-3bc8bf4a05c1', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('ec279ac5-469e-48f6-892e-dc05a5e607b6', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('a9481610-5daa-40a1-903e-fed2fe36c4ae', 'srv-barba');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('db9de442-2802-4249-a776-4ca3ef1c89e8', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('db9de442-2802-4249-a776-4ca3ef1c89e8', 'srv-21d2bcb1-84f8-4735-b682-0476f77b9cf0');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('b9a00f10-1ad5-40be-a3e9-80fc09f1ff66', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('b9a00f10-1ad5-40be-a3e9-80fc09f1ff66', 'srv-barba');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('71c0ba6e-1a95-44f1-a519-bcd132c2deef', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('71c0ba6e-1a95-44f1-a519-bcd132c2deef', 'srv-990658c7-abea-4f30-9144-5c7e062164fc');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('ca586b20-65b6-495d-8b9a-2b140012e745', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('558fb4ba-9ef8-40f3-979b-ef6132d37ed9', 'srv-d468393d-2449-424f-a95c-80e5c2f377c4');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('e697d075-ac33-460f-8537-363a93f2c2dd', 'srv-corte');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('e697d075-ac33-460f-8537-363a93f2c2dd', 'srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('5364d41f-88fa-429f-9884-b28e0b8cb07b', 'srv-8b1e4b02-3efb-47e9-a963-cf662dc2d5d5');
INSERT INTO appointment_services (appointment_id, service_id) VALUES ('b8732c7f-4f10-4f04-a653-7b5c64adddc5', 'srv-combo');

-- Data for whatsapp_logs (19 rows)
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('da45c24c-7c91-4934-b6f3-475393b8a50c', 'db9de442-2802-4249-a776-4ca3ef1c89e8', 'confirmation', '(34) 99868-4036', 'sent', NULL, '2026-07-21 21:10:10', '2026-07-21 21:10:10');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('496e0591-a03b-4f08-88a0-35ca6cda10b9', 'db9de442-2802-4249-a776-4ca3ef1c89e8', 'confirmation', '(34) 98767-2324', 'failed', NULL, '2026-07-21 21:10:21', '2026-07-21 21:10:21');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('eb3cac6c-ac46-439c-848c-904270b88b04', '68ea42d8-0fbd-45a8-8f22-44b5f4d074cf', 'cancellation', '34980098760', 'failed', NULL, '2026-07-22 15:13:50', '2026-07-22 15:13:50');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('06e24a11-2bb5-4893-bf4b-f1e637a32916', 'acd56ea0-b593-404a-972c-8dbe05c6a28b', 'cancellation', '34980086415', 'failed', NULL, '2026-07-22 15:16:42', '2026-07-22 15:16:42');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('913f48de-9310-4cd0-aecd-2f3205068b72', 'b9a00f10-1ad5-40be-a3e9-80fc09f1ff66', 'confirmation', '(34) 9', 'failed', NULL, '2026-07-22 15:17:47', '2026-07-22 15:17:47');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('3e038081-f86f-4403-87a6-041ad9f87763', 'b9a00f10-1ad5-40be-a3e9-80fc09f1ff66', 'confirmation', '(34) 98767-2324', 'failed', NULL, '2026-07-22 15:17:57', '2026-07-22 15:17:57');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('ea2de7b4-b3f4-46ed-b65c-8650ba41dca7', 'acd56ea0-b593-404a-972c-8dbe05c6a28b', 'cancellation', '34980086415', 'failed', NULL, '2026-07-22 15:18:13', '2026-07-22 15:18:13');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('8f9005bf-f8eb-4524-973e-1ceef4da9581', '71c0ba6e-1a95-44f1-a519-bcd132c2deef', 'confirmation', '(34) 99868-4036', 'sent', NULL, '2026-07-22 15:33:00', '2026-07-22 15:33:00');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('b1360a32-bba7-4dca-8a50-1b34f149dc57', '71c0ba6e-1a95-44f1-a519-bcd132c2deef', 'confirmation', '(34) 98019-7520', 'failed', NULL, '2026-07-22 15:33:11', '2026-07-22 15:33:11');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('92f292dd-6fc3-4d37-8d7a-7c667bf2dfb8', 'ca586b20-65b6-495d-8b9a-2b140012e745', 'confirmation', '(34) 99868-4036', 'sent', NULL, '2026-07-22 15:47:54', '2026-07-22 15:47:54');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('d207c9ee-8897-426d-bfef-5a6703017136', 'ca586b20-65b6-495d-8b9a-2b140012e745', 'confirmation', '(34) 98018-5175', 'failed', NULL, '2026-07-22 15:48:05', '2026-07-22 15:48:05');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('bc50fcb1-5dce-4fd7-a76d-b2d91e11bb69', '558fb4ba-9ef8-40f3-979b-ef6132d37ed9', 'confirmation', '(34) 99868-4036', 'sent', NULL, '2026-07-22 15:58:31', '2026-07-22 15:58:31');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('376f1113-e436-4b02-b527-a6153c886a8e', '558fb4ba-9ef8-40f3-979b-ef6132d37ed9', 'confirmation', '(34) 98832-2462', 'sent', NULL, '2026-07-22 15:58:44', '2026-07-22 15:58:44');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('da959bc5-b800-4640-9a8a-c7c995e838e0', 'e697d075-ac33-460f-8537-363a93f2c2dd', 'confirmation', '(34) 9', 'failed', NULL, '2026-07-22 16:23:33', '2026-07-22 16:23:33');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('4710b254-bf43-43f6-99d8-2f1800ee4bc2', 'e697d075-ac33-460f-8537-363a93f2c2dd', 'confirmation', '(34) 98019-7520', 'failed', NULL, '2026-07-22 16:23:44', '2026-07-22 16:23:44');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('c0700e9a-6912-4d66-99f2-e1edcbcc0fc9', '5364d41f-88fa-429f-9884-b28e0b8cb07b', 'confirmation', '(34) 99868-4036', 'sent', NULL, '2026-07-22 16:34:04', '2026-07-22 16:34:04');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('67e41db7-0ab7-4dab-bec6-bf49b8d05cdc', '5364d41f-88fa-429f-9884-b28e0b8cb07b', 'confirmation', '(34) 98767-2324', 'failed', NULL, '2026-07-22 16:34:15', '2026-07-22 16:34:15');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('c8e79067-da2a-4b32-97b0-fe25e876541a', 'b8732c7f-4f10-4f04-a653-7b5c64adddc5', 'confirmation', '(34) 98827-2226', 'sent', NULL, '2026-07-22 16:34:56', '2026-07-22 16:34:56');
INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, scheduled_time, sent_at, created_at) VALUES ('977ca256-d257-4829-81fe-eec59ca5546e', 'b8732c7f-4f10-4f04-a653-7b5c64adddc5', 'confirmation', '(34) 98000-0000', 'failed', NULL, '2026-07-22 16:35:07', '2026-07-22 16:35:07');

-- Data for products (3 rows)
INSERT INTO products (id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, created_at, updated_at, photo) VALUES ('prod-pomada-mate', 'Pomada Modeladora Effect Mate 100g', 'Efeito fosco, alta fixação e fragrância amadeirada exclusiva Do Vale.', 'Barber Supply Brasil', 'Carlos Eduardo', '(34) 99888-7766', 22.5, 45.0, 12, '2026-07-23 15:52:29', '2026-07-23 15:54:10', NULL);
INSERT INTO products (id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, created_at, updated_at, photo) VALUES ('prod-oleo-barba', 'Óleo Hidratante para Barba 30ml', 'Enriquecido com óleo de argan e jojoba para hidratação e brilho natural.', 'Cosméticos Vale Gold', 'Mariana Souza', '(34) 99777-5544', 18.0, 38.0, 8, '2026-07-23 15:52:29', '2026-07-23 15:54:47', NULL);
INSERT INTO products (id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, created_at, updated_at, photo) VALUES ('prod-shampoo-barba', 'Shampoo 2 em 1 Cabelo e Barba 250ml', 'Limpeza profunda sem ressecar a pele e os fios com mentol refrescante.', 'Barber Supply Brasil', 'Carlos Eduardo', '(34) 99888-7766', 25.0, 52.0, 2, '2026-07-23 15:52:29', '2026-07-23 15:54:25', NULL);

PRAGMA foreign_keys = ON;