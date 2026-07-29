-- Migration: 0011_add_restricted_access.sql
-- Adiciona a coluna restricted_access à tabela services (0 = público na Landing Page, 1 = acesso restrito)
ALTER TABLE services ADD COLUMN restricted_access INTEGER DEFAULT 0;
