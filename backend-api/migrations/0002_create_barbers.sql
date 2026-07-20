-- Migration: 0002_create_barbers.sql

CREATE TABLE IF NOT EXISTS barbers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo TEXT,
  birth_date TEXT,
  specialty TEXT,
  hired_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
