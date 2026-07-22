import sqlite3

db = r'C:\Users\user\.gemini\antigravity-cli\wrangler-state\v3\d1\miniflare-D1DatabaseObject\aa47ff0bf2b1d6908d3cafab2a5bcd5f3b3a6ef965ce8a8042323eb7b7267306.sqlite'
conn = sqlite3.connect(db)
cur = conn.cursor()

query = """
    SELECT a.id, 
           c.name as client_name, 
           b.name as barber_name, 
           a.appointment_time, 
           COALESCE(
             (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
             s_single.name
           ) as service_name,
           a.status
    FROM appointments a
    LEFT JOIN customers c ON a.client_id = c.id
    LEFT JOIN barbers b ON a.barber_id = b.id
    LEFT JOIN services s_single ON a.service_id = s_single.id
    ORDER BY a.appointment_time DESC
"""

rows = cur.execute(query).fetchall()
print(f"TOTAL DE AGENDAMENTOS: {len(rows)}\n")
print(f"{'ID (Abreviado)':<16} | {'CLIENTE':<26} | {'BARBEIRO':<20} | {'DATA / HORA':<16} | {'STATUS':<10} | {'SERVIÇO(S)'}")
print("-" * 120)
for r in rows:
    a_id = r[0][:14] + "..." if len(r[0]) > 14 else r[0]
    c_name = (r[1] or 'N/A')[:25]
    b_name = (r[2] or 'N/A')[:19]
    time = r[3]
    service = r[4] or 'N/A'
    status = r[5]
    print(f"{a_id:<16} | {c_name:<26} | {b_name:<20} | {time:<16} | {status:<10} | {service}")

conn.close()
