import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DurableObject } from "cloudflare:workers";

const app = new Hono();

// Habilitar CORS para o frontend
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// --- Funções Auxiliares de Criptografia (Nativas do Web Crypto) ---
const SALT = "barbearia-vale-salt-2026";
const DEFAULT_JWT_SECRET = "barbearia-secret-key-2026";

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signJWT(payload, secret = DEFAULT_JWT_SECRET) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyJWT(token, secret = DEFAULT_JWT_SECRET) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigData = new Uint8Array(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map(c => c.charCodeAt(0))
    );

    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      sigData,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );

    if (!verified) return null;
    return JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// Middleware de Autenticação JWT
async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Não autorizado. Token ausente.' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyJWT(token, c.env.JWT_SECRET || DEFAULT_JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Token inválido ou expirado.' }, 401);
  }

  c.set('user', payload);
  await next();
}

// --- Funções Auxiliares de Formatação e API Evolution ---
function formatDateTimeToBR(dateTimeStr) {
  if (!dateTimeStr) return "";
  // Substitui T por espaço caso venha do input datetime-local
  const parts = dateTimeStr.replace("T", " ").split(" ");
  const datePart = parts[0]; // "2026-07-17"
  const timePart = parts[1] || ""; // "18:00"

  const dateSplit = datePart.split("-");
  if (dateSplit.length === 3) {
    const formattedDate = `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;
    return timePart ? `${formattedDate} às ${timePart}` : formattedDate;
  }
  return dateTimeStr;
}

async function sendWhatsApp(env, phone, message) {
  try {
    const res = await fetch("https://abkyvggiydvigugltboe.supabase.co/functions/v1/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: phone,
        message: message
      })
    });
    const data = await res.json();
    console.log("Resultado do envio de WhatsApp via Edge Function:", data);
    return res.ok;
  } catch (e) {
    console.error("Erro ao enviar WhatsApp via Edge Function:", e);
    return true;
  }
}

// --- Endpoints da API ---

app.get('/', (c) => c.text('API Barbearia do Vale - Ativa e rodando no Cloudflare Workers!'));

// 1. Autenticação: Registro
app.post('/api/auth/register', async (c) => {
  const { name, phone, email, password, role } = await c.req.json();
  if (!name || (!phone && !email) || !password) {
    return c.json({ error: 'Os campos nome, senha e pelo menos telefone ou email são obrigatórios.' }, 400);
  }

  const cleanPhone = phone ? phone.replace(/\D/g, "") : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const targetRole = role && ['client', 'barber'].includes(role) ? role : 'client';
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  try {
    await c.env.DB.prepare(
      "INSERT INTO users (id, name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(userId, name, cleanPhone, cleanEmail, passwordHash, targetRole).run();

    const token = await signJWT({ id: userId, name, phone: cleanPhone, email: cleanEmail, role: targetRole }, c.env.JWT_SECRET || DEFAULT_JWT_SECRET);
    return c.json({ token, user: { id: userId, name, phone: cleanPhone, email: cleanEmail, role: targetRole } });
  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      return c.json({ error: 'Este número de telefone ou email já está cadastrado.' }, 400);
    }
    return c.json({ error: 'Erro interno ao cadastrar: ' + e.message }, 500);
  }
});

// 2. Autenticação: Login (Suporta telefone ou email)
app.post('/api/auth/login', async (c) => {
  const { loginKey, password } = await c.req.json();
  if (!loginKey || !password) {
    return c.json({ error: 'Campos loginKey (telefone ou email) e password são obrigatórios.' }, 400);
  }

  const keyClean = loginKey.trim();
  const keyPhoneDigits = keyClean.replace(/\D/g, "");
  const passwordHash = await hashPassword(password);

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, name, phone, email, password_hash, role 
      FROM users 
      WHERE (email IS NOT NULL AND LOWER(email) = LOWER(?)) 
         OR (phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') = ?)
    `).bind(keyClean.toLowerCase(), keyPhoneDigits || 'NON_EXISTENT').first();

    if (!user || user.password_hash !== passwordHash) {
      return c.json({ error: 'Dados de acesso incorretos.' }, 400);
    }

    const token = await signJWT({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }, c.env.JWT_SECRET || DEFAULT_JWT_SECRET);
    return c.json({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (e) {
    return c.json({ error: 'Erro interno no servidor: ' + e.message }, 500);
  }
});

// 2.5 Atualização / Recuperação de Senha (Reset Password)
app.post('/api/auth/reset-password', async (c) => {
  const { loginKey, newPassword } = await c.req.json();
  if (!loginKey || !newPassword) {
    return c.json({ error: 'Campos loginKey (telefone ou email) e newPassword são obrigatórios.' }, 400);
  }

  const keyClean = loginKey.trim();
  const keyPhoneDigits = keyClean.replace(/\D/g, "");
  const newPasswordHash = await hashPassword(newPassword);

  try {
    const user = await c.env.DB.prepare(`
      SELECT id FROM users 
      WHERE (email IS NOT NULL AND LOWER(email) = LOWER(?)) 
         OR (phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') = ?)
    `).bind(keyClean.toLowerCase(), keyPhoneDigits || 'NON_EXISTENT').first();

    if (!user) {
      return c.json({ error: 'Usuário não encontrado com os dados informados.' }, 404);
    }

    await c.env.DB.prepare(
      "UPDATE users SET password_hash = ? WHERE id = ?"
    ).bind(newPasswordHash, user.id).run();

    return c.json({ message: 'Senha atualizada com sucesso!' });
  } catch (e) {
    return c.json({ error: 'Erro interno ao resetar senha: ' + e.message }, 500);
  }
});

// 3. Obter Usuário Atual
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// 4. Listar Serviços
app.get('/api/services', async (c) => {
  try {
    const { results: services } = await c.env.DB.prepare("SELECT id, name, description, duration_minutes, price FROM services").all();
    const { results: relations } = await c.env.DB.prepare("SELECT service_id, barber_id FROM barber_services").all();

    const servicesWithBarbers = services.map(srv => {
      const srvRelations = relations.filter(r => r.service_id === srv.id);
      return {
        ...srv,
        barber_ids: srvRelations.map(r => r.barber_id)
      };
    });

    return c.json(servicesWithBarbers);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 4.1 Criar Serviço (Admin)
app.post('/api/services', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem adicionar serviços.' }, 403);
  }

  try {
    const { name, description, duration_minutes, price, barber_ids } = await c.req.json();
    if (!name || !duration_minutes || price === undefined) {
      return c.json({ error: 'Campos nome, duração e preço são obrigatórios.' }, 400);
    }

    const serviceId = 'srv-' + crypto.randomUUID();

    // Inserir serviço
    await c.env.DB.prepare(
      "INSERT INTO services (id, name, description, duration_minutes, price) VALUES (?, ?, ?, ?, ?)"
    ).bind(serviceId, name, description || null, Number(duration_minutes), Number(price)).run();

    // Associar barbeiros
    if (Array.isArray(barber_ids) && barber_ids.length > 0) {
      for (const bId of barber_ids) {
        await c.env.DB.prepare(
          "INSERT OR IGNORE INTO barber_services (barber_id, service_id) VALUES (?, ?)"
        ).bind(bId, serviceId).run();
      }
    }

    return c.json({ success: true, service: { id: serviceId, name, description, duration_minutes, price, barber_ids } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 4.2 Editar Serviço (Admin)
app.put('/api/services/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem editar serviços.' }, 403);
  }

  const serviceId = c.req.param('id');
  try {
    const { name, description, duration_minutes, price, barber_ids } = await c.req.json();
    if (!name || !duration_minutes || price === undefined) {
      return c.json({ error: 'Campos nome, duração e preço são obrigatórios.' }, 400);
    }

    const existing = await c.env.DB.prepare("SELECT id FROM services WHERE id = ?").bind(serviceId).first();
    if (!existing) {
      return c.json({ error: 'Serviço não encontrado.' }, 404);
    }

    // Atualizar serviço
    await c.env.DB.prepare(
      "UPDATE services SET name = ?, description = ?, duration_minutes = ?, price = ? WHERE id = ?"
    ).bind(name, description || null, Number(duration_minutes), Number(price), serviceId).run();

    // Remover associações antigas
    await c.env.DB.prepare("DELETE FROM barber_services WHERE service_id = ?").bind(serviceId).run();

    // Adicionar novas associações
    if (Array.isArray(barber_ids) && barber_ids.length > 0) {
      for (const bId of barber_ids) {
        await c.env.DB.prepare(
          "INSERT OR IGNORE INTO barber_services (barber_id, service_id) VALUES (?, ?)"
        ).bind(bId, serviceId).run();
      }
    }

    return c.json({ success: true, service: { id: serviceId, name, description, duration_minutes, price, barber_ids } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 4.3 Excluir Serviço (Admin)
app.delete('/api/services/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem excluir serviços.' }, 403);
  }

  const serviceId = c.req.param('id');
  try {
    const existing = await c.env.DB.prepare("SELECT id FROM services WHERE id = ?").bind(serviceId).first();
    if (!existing) {
      return c.json({ error: 'Serviço não encontrado.' }, 404);
    }

    // Deletar associações
    await c.env.DB.prepare("DELETE FROM barber_services WHERE service_id = ?").bind(serviceId).run();

    // Deletar serviço
    await c.env.DB.prepare("DELETE FROM services WHERE id = ?").bind(serviceId).run();

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 5. Listar Barbeiros
app.get('/api/barbers', async (c) => {
  try {
    try {
      await c.env.DB.prepare("ALTER TABLE barbers ADD COLUMN service_commission REAL DEFAULT 0").run();
    } catch { }
    try {
      await c.env.DB.prepare("ALTER TABLE barbers ADD COLUMN product_commission REAL DEFAULT 0").run();
    } catch { }

    const countResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM barbers").first();
    if (countResult && countResult.count === 0) {
      await c.env.DB.prepare(`
        INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission)
        SELECT id, name, phone, NULL, NULL, 'Especialista Do Vale', '2022-01-01', 0, 0 
        FROM users 
        WHERE role = 'barber'
      `).run();
    }

    const { results } = await c.env.DB.prepare("SELECT id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission FROM barbers").all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 6. Listar Agendamentos
app.get('/api/appointments', authMiddleware, async (c) => {
  const user = c.get('user');
  try {
    let query = `
      SELECT a.id, a.client_id, a.barber_id, a.appointment_time, a.status, 
             COALESCE(cust.name, u.name, 'Cliente') as client_name, 
             COALESCE(cust.phone, u.phone, '') as client_phone,
             b.name as barber_name, b.photo as barber_photo,
             a.service_id,
             COALESCE(
               (SELECT GROUP_CONCAT(aps.service_id, ',') FROM appointment_services aps WHERE aps.appointment_id = a.id),
               a.service_id
             ) as service_ids,
             COALESCE(
               (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.name
             ) as service_name,
             COALESCE(
               (SELECT SUM(s.price) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.price
             ) as service_price,
             COALESCE(
               (SELECT SUM(s.duration_minutes) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.duration_minutes
             ) as duration_minutes
      FROM appointments a
      LEFT JOIN users u ON a.client_id = u.id
      LEFT JOIN customers cust ON a.client_id = cust.id
      JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN services s_single ON a.service_id = s_single.id
    `;


    let results;
    if (user.role === 'client') {
      query += " WHERE a.client_id = ? ORDER BY a.appointment_time DESC";
      results = (await c.env.DB.prepare(query).bind(user.id).all()).results;
    } else if (user.role === 'barber') {
      query += " WHERE a.barber_id = ? ORDER BY a.appointment_time DESC";
      results = (await c.env.DB.prepare(query).bind(user.id).all()).results;
    } else {
      // Admin vê tudo
      query += " ORDER BY a.appointment_time DESC";
      results = (await c.env.DB.prepare(query).all()).results;
    }

    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 7. Criar Agendamento
app.post('/api/appointments', authMiddleware, async (c) => {
  const user = c.get('user');
  const { barber_id, service_id, appointment_time, name, phone } = await c.req.json();

  if (!barber_id || !service_id || !appointment_time) {
    return c.json({ error: 'Os campos barber_id, service_id e appointment_time são obrigatórios.' }, 400);
  }

  // A agenda pertence a um Cliente (tabela customers). O usuário logado é apenas o operador que realiza a ação.
  let clientId = null;
  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";

  try {
    let existingCust = null;

    if (cleanPhone) {
      existingCust = await c.env.DB.prepare(
        "SELECT id, name FROM customers WHERE phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') = ?"
      ).bind(cleanPhone).first();
    }

    if (!existingCust && name) {
      existingCust = await c.env.DB.prepare(
        "SELECT id, name FROM customers WHERE LOWER(name) = LOWER(?)"
      ).bind(name.trim()).first();
    }

    if (existingCust) {
      clientId = existingCust.id;
      if (name || phone) {
        await c.env.DB.prepare(
          "UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?"
        ).bind(name ? name.trim() : null, phone || null, clientId).run();
      }
    } else {
      // Criar novo cliente estritamente na tabela 'customers' (SEM mexer em 'users')
      clientId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)"
      ).bind(clientId, name ? name.trim() : 'Cliente Sem Nome', phone || null).run();
    }

    // Verificar conflito de horário para o mesmo barbeiro
    const conflict = await c.env.DB.prepare(
      "SELECT id FROM appointments WHERE barber_id = ? AND appointment_time = ? AND status = 'confirmed'"
    ).bind(barber_id, appointment_time).first();

    if (conflict) {
      return c.json({ error: 'Este horário já está reservado com este barbeiro.' }, 400);
    }

    // Processar serviços
    const serviceIds = Array.isArray(service_id) ? service_id : [service_id];
    if (serviceIds.length === 0) {
      return c.json({ error: 'Selecione ao menos um serviço.' }, 400);
    }

    const appointmentId = crypto.randomUUID();
    const primaryServiceId = serviceIds[0];

    // Criar o agendamento principal com client_id -> cliente da tabela customers
    await c.env.DB.prepare(
      "INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status) VALUES (?, ?, ?, ?, ?, 'confirmed')"
    ).bind(appointmentId, clientId, barber_id, primaryServiceId, appointment_time).run();

    const serviceNames = [];
    let totalPrice = 0;

    for (const sId of serviceIds) {
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO appointment_services (appointment_id, service_id) VALUES (?, ?)"
      ).bind(appointmentId, sId).run();

      const service = await c.env.DB.prepare("SELECT name, price FROM services WHERE id = ?").bind(sId).first();
      if (service) {
        serviceNames.push(service.name);
        totalPrice += service.price;
      }
    }

    // Obter dados do cliente (tabela customers) e do barbeiro para notificações
    const client = await c.env.DB.prepare("SELECT name, phone FROM customers WHERE id = ?").bind(clientId).first();
    const barber = await c.env.DB.prepare("SELECT name, phone FROM barbers WHERE id = ?").bind(barber_id).first();

    const servicesText = serviceNames.length > 0 ? serviceNames.join(", ") : "";

    // 4. Executar os envios e agendamento de lembrete em segundo plano (background)
    c.executionCtx.waitUntil((async () => {
      try {
        const formattedDateTime = formatDateTimeToBR(appointment_time);

        // Enviar mensagem de WhatsApp ao Barbeiro
        if (barber && barber.phone && client) {
          const barberMessage = `🔔 *NOVO AGENDAMENTO SOLICITADO!* 🔔\n\nOlá, *${barber.name}*! Um novo cliente solicitou um horário com você. 📅\n\n👤 *Informações do Cliente:*\n━━━━━━━━━━━━━━━━━━\n📝 *Nome:* ${client.name}\n📱 *Contato:* ${client.phone}\n━━━━━━━━━━━━━━━━━━\n\n✂️ *Detalhes do Atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor Estimado:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\nPor favor, verifique sua agenda no sistema e confirme o atendimento.\n\nBom trabalho! 👊💈`;
          const sentBarber = await sendWhatsApp(c.env, barber.phone, barberMessage);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), appointmentId, 'confirmation', barber.phone, sentBarber ? 'sent' : 'failed').run();
        }

        // Aguardar 10 segundos
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Enviar mensagem de WhatsApp de confirmação ao Cliente
        if (client && client.phone && servicesText) {
          const confirmationText = `🌟 *AGENDAMENTO CONFIRMADO!* 🌟\n\nOlá, *${client.name}*, seu horário na *Barbearia Do Vale* está reservado com sucesso! 🎉\n\n✂️ *Detalhes do seu atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n💈 *Profissional:* ${barber ? barber.name : 'Barbearia Do Vale'}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\n📍 *Endereço:*\nAv. Senador Melo Viana, 709 - Goiás, Araguari/MG\n\nNos vemos em breve! 👊🔥`;
          const sent = await sendWhatsApp(c.env, client.phone, confirmationText);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), appointmentId, 'confirmation', client.phone, sent ? 'sent' : 'failed').run();
        }

        // Agendar Lembrete no Durable Object
        const appointmentMs = Date.parse(appointment_time);
        const reminderMs = appointmentMs - (2 * 60 * 60 * 1000);
        if (reminderMs > Date.now() && client && client.phone) {
          const doId = c.env.APPOINTMENT_SCHEDULER.idFromName(appointmentId);
          const stub = c.env.APPOINTMENT_SCHEDULER.get(doId);
          await stub.scheduleReminder(appointmentId, reminderMs);
        }
      } catch (err) {
        console.error("Erro no processamento em segundo plano do agendamento:", err);
      }
    })());

    return c.json({ success: true, appointment_ids: [appointmentId] });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 7.1. Criar Agendamento Rápido (Público)
app.post('/api/appointments/quick', async (c) => {
  const { barber_id, service_id, appointment_time, name, phone } = await c.req.json();

  if (!barber_id || !service_id || !appointment_time || !name || !phone) {
    return c.json({ error: 'Os campos barber_id, service_id, appointment_time, name e phone são obrigatórios.' }, 400);
  }

  try {
    // 1. Obter ou criar cliente na tabela 'customers'
    let clientId;
    const cleanPhone = phone.replace(/\D/g, "");
    const existingCust = await c.env.DB.prepare(
      "SELECT id FROM customers WHERE phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') = ?"
    ).bind(cleanPhone).first();

    if (existingCust) {
      clientId = existingCust.id;
      await c.env.DB.prepare("UPDATE customers SET name = ?, phone = ? WHERE id = ?").bind(name.trim(), phone, clientId).run();
    } else {
      clientId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)"
      ).bind(clientId, name.trim(), phone).run();
    }

    // 2. Verificar conflito de horário
    const conflict = await c.env.DB.prepare(
      "SELECT id FROM appointments WHERE barber_id = ? AND appointment_time = ? AND status = 'confirmed' AND client_id != ?"
    ).bind(barber_id, appointment_time, clientId).first();

    if (conflict) {
      return c.json({ error: 'Este horário já está reservado com este barbeiro.' }, 400);
    }

    // 3. Processar múltiplos serviços
    const serviceIds = Array.isArray(service_id) ? service_id : [service_id];
    if (serviceIds.length === 0) {
      return c.json({ error: 'Selecione ao menos um serviço.' }, 400);
    }

    const createdIds = [];
    const serviceNames = [];
    let totalPrice = 0;

    for (const sId of serviceIds) {
      const appointmentId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status) VALUES (?, ?, ?, ?, ?, 'confirmed')"
      ).bind(appointmentId, clientId, barber_id, sId, appointment_time).run();

      const service = await c.env.DB.prepare("SELECT name, price FROM services WHERE id = ?").bind(sId).first();
      if (service) {
        serviceNames.push(service.name);
        totalPrice += service.price;
      }
      createdIds.push(appointmentId);
    }

    const barber = await c.env.DB.prepare("SELECT name, phone FROM users WHERE id = ?").bind(barber_id).first();

    const servicesText = serviceNames.length > 0 ? serviceNames.join(", ") : "";

    // 4. Executar os envios e agendamento de lembrete em segundo plano (background) para evitar timeouts e erros na conexão principal
    c.executionCtx.waitUntil((async () => {
      try {
        const formattedDateTime = formatDateTimeToBR(appointment_time);

        // Enviar mensagem de WhatsApp ao Barbeiro
        if (barber && barber.phone) {
          const barberMessage = `🔔 *NOVO AGENDAMENTO SOLICITADO!* 🔔\n\nOlá, *${barber.name}*! Um novo cliente solicitou um horário com você. 📅\n\n👤 *Informações do Cliente:*\n━━━━━━━━━━━━━━━━━━\n📝 *Nome:* ${name}\n📱 *Contato:* ${phone}\n━━━━━━━━━━━━━━━━━━\n\n✂️ *Detalhes do Atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor Estimado:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\nPor favor, verifique sua agenda no sistema e confirme o atendimento. Caso precise realizar algum ajuste de horário ou serviço, entre em contato direto com o cliente pelo número acima.\n\nBom trabalho! 👊💈`;
          const sentBarber = await sendWhatsApp(c.env, barber.phone, barberMessage);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), createdIds[0], 'confirmation', barber.phone, sentBarber ? 'sent' : 'failed').run();
        }

        // Aguardar 10 segundos
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Enviar mensagem de WhatsApp de confirmação ao Cliente
        if (phone && servicesText) {
          const confirmationText = `🌟 *AGENDAMENTO CONFIRMADO!* 🌟\n\nOlá, *${name}*, seu horário na *Barbearia Do Vale* está reservado com sucesso! 🎉\n\n✂️ *Detalhes do seu atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n💈 *Profissional:* ${barber.name}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\n📍 *Endereço:*\nAv. Senador Melo Viana, 709 - Goiás, Araguari/MG\n\n⚠️ _Se precisar reagendar ou cancelar, por favor avise com antecedência._\n\nNos vemos em breve para dar aquele tapa no visual! 👊🔥`;
          const sent = await sendWhatsApp(c.env, phone, confirmationText);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), createdIds[0], 'confirmation', phone, sent ? 'sent' : 'failed').run();
        }

        // Agendar Lembrete
        const appointmentMs = Date.parse(appointment_time);
        const reminderMs = appointmentMs - (2 * 60 * 60 * 1000);
        if (reminderMs > Date.now() && phone && createdIds.length > 0) {
          const doId = c.env.APPOINTMENT_SCHEDULER.idFromName(createdIds[0]);
          const stub = c.env.APPOINTMENT_SCHEDULER.get(doId);
          await stub.scheduleReminder(createdIds[0], reminderMs);
        }
      } catch (err) {
        console.error("Erro no processamento em segundo plano do agendamento rápido:", err);
      }
    })());

    return c.json({ success: true, appointmentIds: createdIds });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 8. Cancelar Agendamento
app.put('/api/appointments/:id/cancel', authMiddleware, async (c) => {
  const appointmentId = c.req.param('id');
  const user = c.get('user');

  try {
    const appointment = await c.env.DB.prepare(
      "SELECT a.*, COALESCE(cust.phone, u.phone) as phone, COALESCE(cust.name, u.name) as client_name, s.name as service_name FROM appointments a LEFT JOIN customers cust ON a.client_id = cust.id LEFT JOIN users u ON a.client_id = u.id JOIN services s ON a.service_id = s.id WHERE a.id = ?"
    ).bind(appointmentId).first();

    if (!appointment) {
      return c.json({ error: 'Agendamento não encontrado.' }, 404);
    }

    if (user.role === 'client' && appointment.client_id !== user.id) {
      return c.json({ error: 'Ação não permitida.' }, 403);
    }

    await c.env.DB.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").bind(appointmentId).run();

    if (appointment.phone) {
      const cancellationText = `🚨 *AGENDAMENTO CANCELADO* 🚨\n\nOlá, *${appointment.client_name}*.\nConfirmamos que o seu agendamento para o serviço *${appointment.service_name}* no dia *${appointment.appointment_time}* foi *CANCELADO* com sucesso. 💸\n\nSe desejar agendar um novo horário, estamos à disposição! 💈✨\n🔗 https://barbeariadovale.com.br`;
      const sent = await sendWhatsApp(c.env, appointment.phone, cancellationText);

      await c.env.DB.prepare(
        "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
      ).bind(crypto.randomUUID(), appointmentId, 'cancellation', appointment.phone, sent ? 'sent' : 'failed').run();
    }

    const doId = c.env.APPOINTMENT_SCHEDULER.idFromName(appointmentId);
    const stub = c.env.APPOINTMENT_SCHEDULER.get(doId);
    await stub.cancelReminder();

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 8.1 Editar Agendamento
app.put('/api/appointments/:id', authMiddleware, async (c) => {
  const appointmentId = c.req.param('id');
  const user = c.get('user');
  const { barber_id, service_id, appointment_time, name, phone, status } = await c.req.json();

  try {
    const existing = await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?").bind(appointmentId).first();
    if (!existing) {
      return c.json({ error: 'Agendamento não encontrado.' }, 404);
    }

    if (user.role === 'client' && existing.client_id !== user.id) {
      return c.json({ error: 'Ação não permitida.' }, 403);
    }

    const serviceIds = Array.isArray(service_id) ? service_id : (service_id ? [service_id] : []);
    const primaryServiceId = serviceIds.length > 0 ? serviceIds[0] : existing.service_id;

    await c.env.DB.prepare(`
      UPDATE appointments 
      SET barber_id = ?, service_id = ?, appointment_time = ?, status = ?
      WHERE id = ?
    `).bind(
      barber_id || existing.barber_id,
      primaryServiceId,
      appointment_time || existing.appointment_time,
      status || existing.status,
      appointmentId
    ).run();

    if (serviceIds.length > 0) {
      await c.env.DB.prepare("DELETE FROM appointment_services WHERE appointment_id = ?").bind(appointmentId).run();
      for (const sId of serviceIds) {
        await c.env.DB.prepare(
          "INSERT OR IGNORE INTO appointment_services (appointment_id, service_id) VALUES (?, ?)"
        ).bind(appointmentId, sId).run();
      }
    }

    if (name || phone) {
      await c.env.DB.prepare("UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?")
        .bind(name ? name.trim() : null, phone || null, existing.client_id).run();
    }

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});


// 9. Admin: Listar todos os usuários (para a tela de permissões)
app.get('/api/users', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem ver os usuários.' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, phone, email, role, created_at FROM users ORDER BY role DESC, name ASC"
    ).all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 10. Admin: Mudar role/permissão de um usuário
app.put('/api/users/:id/role', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem alterar permissões.' }, 403);
  }

  const targetUserId = c.req.param('id');
  const { role } = await c.req.json();

  if (!role || !['client', 'barber', 'admin'].includes(role)) {
    return c.json({ error: 'Role inválida. Deve ser client, barber ou admin.' }, 400);
  }

  // Prevenir que o admin mude sua própria role acidentalmente
  if (targetUserId === user.id) {
    return c.json({ error: 'Você não pode alterar sua própria permissão de administrador.' }, 400);
  }

  try {
    await c.env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, targetUserId).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 10.1 Admin: Editar dados completas de um usuário
app.put('/api/users/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem editar usuários.' }, 403);
  }

  const targetUserId = c.req.param('id');
  const { name, phone, email, role } = await c.req.json();

  if (!name || !name.trim()) {
    return c.json({ error: 'O nome do usuário é obrigatório.' }, 400);
  }

  if (role && !['client', 'barber', 'admin'].includes(role)) {
    return c.json({ error: 'Perfil/Role inválido.' }, 400);
  }

  if (targetUserId === user.id && role && role !== 'admin') {
    return c.json({ error: 'Você não pode remover seu próprio perfil de administrador.' }, 400);
  }

  const cleanPhone = phone ? phone.replace(/\D/g, "") : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  try {
    const existing = await c.env.DB.prepare("SELECT id, role FROM users WHERE id = ?").bind(targetUserId).first();
    if (!existing) {
      return c.json({ error: 'Usuário não encontrado.' }, 404);
    }

    const newRole = role || existing.role;

    await c.env.DB.prepare(
      "UPDATE users SET name = ?, phone = ?, email = ?, role = ? WHERE id = ?"
    ).bind(name.trim(), cleanPhone, cleanEmail, newRole, targetUserId).run();

    return c.json({ success: true, user: { id: targetUserId, name: name.trim(), phone: cleanPhone, email: cleanEmail, role: newRole } });
  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      return c.json({ error: 'Telefone ou e-mail já cadastrados por outro usuário.' }, 400);
    }
    return c.json({ error: e.message }, 500);
  }
});

// 10.2 Admin: Excluir um usuário
app.delete('/api/users/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem excluir usuários.' }, 403);
  }

  const targetUserId = c.req.param('id');

  if (targetUserId === user.id) {
    return c.json({ error: 'Você não pode excluir sua própria conta de administrador.' }, 400);
  }

  try {
    const existing = await c.env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(targetUserId).first();
    if (!existing) {
      return c.json({ error: 'Usuário não encontrado.' }, 404);
    }

    // 1. Deletar logs de WhatsApp dos agendamentos vinculados ao usuário (como cliente ou barbeiro)
    await c.env.DB.prepare(`
      DELETE FROM whatsapp_logs 
      WHERE appointment_id IN (
        SELECT id FROM appointments WHERE client_id = ? OR barber_id = ?
      )
    `).bind(targetUserId, targetUserId).run();

    // 2. Deletar agendamentos do usuário
    await c.env.DB.prepare("DELETE FROM appointments WHERE client_id = ? OR barber_id = ?").bind(targetUserId, targetUserId).run();

    // 3. Deletar relações de serviços do barbeiro (se aplicável)
    await c.env.DB.prepare("DELETE FROM barber_services WHERE barber_id = ?").bind(targetUserId).run();

    // 4. Deletar ficha de barbeiro (se aplicável)
    await c.env.DB.prepare("DELETE FROM barbers WHERE id = ?").bind(targetUserId).run();

    // 5. Deletar usuário da tabela principal
    await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(targetUserId).run();

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// --- Endpoints de Clientes (Customers Table) ---

// 11. Listar Clientes (com pesquisa/filtro opcional)
app.get('/api/customers', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado. Apenas administradores e barbeiros podem gerenciar clientes.' }, 403);
  }

  const queryParam = c.req.query('q');
  try {
    let results;
    if (queryParam) {
      const search = `%${queryParam}%`;
      results = (await c.env.DB.prepare(
        "SELECT id, name, address, phone, birth_date, photo, created_at FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC"
      ).bind(search, search).all()).results;
    } else {
      results = (await c.env.DB.prepare(
        "SELECT id, name, address, phone, birth_date, photo, created_at FROM customers ORDER BY name ASC"
      ).all()).results;
    }
    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 12. Obter Cliente por ID
app.get('/api/customers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const customer = await c.env.DB.prepare(
      "SELECT id, name, address, phone, birth_date, photo, created_at FROM customers WHERE id = ?"
    ).bind(id).first();
    if (!customer) {
      return c.json({ error: 'Cliente não encontrado.' }, 404);
    }
    return c.json(customer);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 13. Criar Cliente
app.post('/api/customers', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const { name, address, phone, birth_date, photo } = await c.req.json();
  if (!name || !phone) {
    return c.json({ error: 'Os campos nome e celular são obrigatórios.' }, 400);
  }

  const cleanAddress = address || null;
  const cleanBirthDate = birth_date || null;
  const cleanPhoto = photo || null;

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO customers (id, name, address, phone, birth_date, photo) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, name, cleanAddress, phone, cleanBirthDate, cleanPhoto).run();

    return c.json({ success: true, customer: { id, name, address: cleanAddress, phone, birth_date: cleanBirthDate, photo: cleanPhoto } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 14. Editar/Atualizar Cliente
app.put('/api/customers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  const { name, address, phone, birth_date, photo } = await c.req.json();
  if (!name || !phone) {
    return c.json({ error: 'Os campos nome e celular são obrigatórios.' }, 400);
  }

  const cleanAddress = address || null;
  const cleanBirthDate = birth_date || null;
  const cleanPhoto = photo || null;

  try {
    const existing = await c.env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Cliente não encontrado.' }, 404);
    }

    await c.env.DB.prepare(
      "UPDATE customers SET name = ?, address = ?, phone = ?, birth_date = ?, photo = ? WHERE id = ?"
    ).bind(name, cleanAddress, phone, cleanBirthDate, cleanPhoto, id).run();

    return c.json({ success: true, customer: { id, name, address: cleanAddress, phone, birth_date: cleanBirthDate, photo: cleanPhoto } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 15. Excluir Cliente
app.delete('/api/customers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const existing = await c.env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Cliente não encontrado.' }, 404);
    }

    await c.env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 16. Obter um profissional específico
app.get('/api/barbers/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const barber = await c.env.DB.prepare(
      "SELECT id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission FROM barbers WHERE id = ?"
    ).bind(id).first();
    if (!barber) {
      return c.json({ error: 'Profissional não encontrado.' }, 404);
    }
    return c.json(barber);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 17. Criar profissional
app.post('/api/barbers', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  try {
    const { name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission } = await c.req.json();
    if (!name || !phone) {
      return c.json({ error: 'Os campos nome e telefone/whatsapp são obrigatórios.' }, 400);
    }

    const sCommission = Number(service_commission) || 0;
    const pCommission = Number(product_commission) || 0;

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, name, phone, photo || null, birth_date || null, specialty || null, hired_at || null, sCommission, pCommission).run();

    return c.json({ success: true, barber: { id, name, phone, photo, birth_date, specialty, hired_at, service_commission: sCommission, product_commission: pCommission } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 18. Atualizar profissional
app.put('/api/barbers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const { name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission } = await c.req.json();
    if (!name || !phone) {
      return c.json({ error: 'Os campos nome e telefone/whatsapp são obrigatórios.' }, 400);
    }

    const sCommission = Number(service_commission) || 0;
    const pCommission = Number(product_commission) || 0;

    const existing = await c.env.DB.prepare("SELECT id FROM barbers WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Profissional não encontrado.' }, 404);
    }

    await c.env.DB.prepare(
      "UPDATE barbers SET name = ?, phone = ?, photo = ?, birth_date = ?, specialty = ?, hired_at = ?, service_commission = ?, product_commission = ? WHERE id = ?"
    ).bind(name, phone, photo, birth_date, specialty, hired_at, sCommission, pCommission, id).run();

    return c.json({ success: true, barber: { id, name, phone, photo, birth_date, specialty, hired_at, service_commission: sCommission, product_commission: pCommission } });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 19. Excluir profissional
app.delete('/api/barbers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const existing = await c.env.DB.prepare("SELECT id FROM barbers WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Profissional não encontrado.' }, 404);
    }

    await c.env.DB.prepare("DELETE FROM barbers WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;

// --- CLASSE DO DURABLE OBJECT PARA AGENDAMENTOS (DURABLE ALARMS) ---
export class AppointmentScheduler extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.state = state;
    this.env = env;
  }

  async scheduleReminder(appointmentId, timestamp) {
    await this.state.storage.put('appointmentId', appointmentId);
    await this.state.storage.setAlarm(timestamp);
  }

  async cancelReminder() {
    await this.state.storage.deleteAll();
  }

  async alarm() {
    const appointmentId = await this.state.storage.get('appointmentId');
    if (!appointmentId) return;

    try {
      const appointment = await this.env.DB.prepare(`
        SELECT a.id, a.status, a.appointment_time, 
               c.name as client_name, c.phone as client_phone,
               s.name as service_name
        FROM appointments a
        JOIN users c ON a.client_id = c.id
        JOIN services s ON a.service_id = s.id
        WHERE a.id = ?
      `).bind(appointmentId).first();

      if (appointment && appointment.status === 'confirmed' && appointment.client_phone) {
        const reminderText = `⏰ *LEMBRETE DE AGENDAMENTO* ⏰\n\nOlá, *${appointment.client_name}*! Passando para te lembrar que seu horário na *Barbearia Do Vale* está chegando! 😎\n\n✂️ *Dados do atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço:* ${appointment.service_name}\n📅 *Hoje às:* ${appointment.appointment_time.split(' ')[1] || appointment.appointment_time}\n━━━━━━━━━━━━━━━━━━\n\n📍 *Endereço:*\nAv. Senador Melo Viana, 709 - Goiás, Araguari/MG\n\nTe esperamos para dar aquele trato no visual! 👊💈`;
        const sent = await sendWhatsApp(this.env, appointment.client_phone, reminderText);

        await this.env.DB.prepare(
          "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
        ).bind(crypto.randomUUID(), appointmentId, 'reminder', appointment.client_phone, sent ? 'sent' : 'failed').run();
      }
    } catch (e) {
      console.error("Erro no alarme do DO:", e);
    } finally {
      await this.state.storage.deleteAll();
    }
  }
}
