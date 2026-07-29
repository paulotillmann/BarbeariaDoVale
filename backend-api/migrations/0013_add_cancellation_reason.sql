-- Migration: 0013_add_cancellation_reason.sql
-- Adiciona a coluna cancellation_reason na tabela appointments para registrar o motivo de cancelamentos e bloqueios

ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;
