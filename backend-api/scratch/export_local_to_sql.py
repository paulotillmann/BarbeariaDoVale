import sqlite3
import os

db_path = r"C:\Users\user\.gemini\antigravity-cli\wrangler-state\v3\d1\miniflare-D1DatabaseObject\aa47ff0bf2b1d6908d3cafab2a5bcd5f3b3a6ef965ce8a8042323eb7b7267306.sqlite"
output_sql = r"c:\BarbeariaDoVale\backend-api\scratch\sync_remote_data.sql"

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

tables_in_order = [
    "users",
    "services",
    "barbers",
    "barber_services",
    "customers",
    "appointments",
    "appointment_services",
    "whatsapp_logs",
    "products"
]

sql_lines = [
    "-- SQL Dump generated for Cloudflare D1 Remote Sync",
    "PRAGMA foreign_keys = OFF;",
    ""
]

# Add cleanup queries
for table in reversed(tables_in_order):
    sql_lines.append(f"DELETE FROM {table};")

sql_lines.append("")

def escape_val(col_name, val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    # Se a coluna for foto e tiver base64 muito longo, zerar ou truncar para evitar erro SQLITE_TOOBIG
    if col_name == "photo" and len(str(val)) > 1000:
        return "NULL"
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

for table in tables_in_order:
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    if not rows:
        continue
    
    col_names = [description[0] for description in cursor.description]
    cols_str = ", ".join(col_names)
    
    sql_lines.append(f"-- Data for {table} ({len(rows)} rows)")
    for row in rows:
        vals_str = ", ".join(escape_val(col, row[col]) for col in col_names)
        sql_lines.append(f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str});")
    sql_lines.append("")

sql_lines.append("PRAGMA foreign_keys = ON;")

os.makedirs(os.path.dirname(output_sql), exist_ok=True)
with open(output_sql, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"SQL dump created at {output_sql} with total lines: {len(sql_lines)}")
conn.close()
