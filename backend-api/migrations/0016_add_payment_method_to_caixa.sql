-- Migration: 0016_add_payment_method_to_caixa.sql
-- Adicionar coluna payment_method na tabela caixa

ALTER TABLE caixa ADD COLUMN payment_method TEXT;
