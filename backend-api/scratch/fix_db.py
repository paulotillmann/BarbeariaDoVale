import sqlite3

db = r'C:\Users\user\.gemini\antigravity-cli\wrangler-state\v3\d1\miniflare-D1DatabaseObject\aa47ff0bf2b1d6908d3cafab2a5bcd5f3b3a6ef965ce8a8042323eb7b7267306.sqlite'
conn = sqlite3.connect(db)
cur = conn.cursor()

# Disable foreign keys temporarily during schema update
cur.execute("PRAGMA foreign_keys = OFF;")

# Recreate appointments table to reference customers(id) instead of users(id)
cur.execute("""
CREATE TABLE IF NOT EXISTS appointments_new (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES customers(id),
  barber_id TEXT NOT NULL REFERENCES barbers(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  appointment_time TEXT NOT NULL, 
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
""")

cur.execute("""
INSERT INTO appointments_new (id, client_id, barber_id, service_id, appointment_time, status, created_at)
SELECT id, client_id, barber_id, service_id, appointment_time, status, created_at FROM appointments;
""")

cur.execute("DROP TABLE IF EXISTS whatsapp_logs;")
cur.execute("DROP TABLE IF EXISTS appointments;")
cur.execute("ALTER TABLE appointments_new RENAME TO appointments;")

cur.execute("""
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  message_type TEXT NOT NULL CHECK(message_type IN ('confirmation', 'reminder', 'cancellation')),
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  scheduled_time TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
""")

# Delete any auto-created client rows from users table (since users table is only for login system users)
cur.execute("DELETE FROM users WHERE password_hash = 'client-auto-created'")

# Re-enable foreign keys and verify
cur.execute("PRAGMA foreign_keys = ON;")
conn.commit()
conn.close()

print("Schema updated successfully: client_id in appointments now references customers(id) directly!")
