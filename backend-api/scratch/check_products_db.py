import sqlite3
import os

db_path = r"c:\BarbeariaDoVale\backend-api\.wrangler\state\v3\d1\miniflare-D1DatabaseObject\aa47ff0bf2b1d6908d3cafab2a5bcd5f3b3a6ef965ce8a8042323eb7b7267306.sqlite"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(products);")
columns = cursor.fetchall()
print("COLUMNS IN PRODUCTS TABLE:")
for col in columns:
    print(col)

print("\nRECORDS IN PRODUCTS TABLE:")
cursor.execute("SELECT id, name, photo FROM products;")
rows = cursor.fetchall()
for row in rows:
    print(row[0], row[1], row[2][:30] if row[2] else None)

conn.close()
