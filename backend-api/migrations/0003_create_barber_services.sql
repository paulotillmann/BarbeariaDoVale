-- Migration: 0003_create_barber_services.sql
-- Create associative table between barbers and services

CREATE TABLE IF NOT EXISTS barber_services (
  barber_id TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);
