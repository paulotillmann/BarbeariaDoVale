-- Migration: 0012_add_user_id_to_barbers.sql

-- 1. Vincular barbeiros existentes com seus respectivos IDs de usuário
UPDATE barbers SET user_id = id WHERE user_id IS NULL AND id IN (SELECT id FROM users WHERE role = 'barber');


