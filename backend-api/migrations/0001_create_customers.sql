-- Migration: 0001_create_customers.sql

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT NOT NULL,
  birth_date TEXT,
  photo TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
