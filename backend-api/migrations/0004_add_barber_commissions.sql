-- Migration: 0004_add_barber_commissions.sql

ALTER TABLE barbers ADD COLUMN service_commission REAL DEFAULT 0;
ALTER TABLE barbers ADD COLUMN product_commission REAL DEFAULT 0;
