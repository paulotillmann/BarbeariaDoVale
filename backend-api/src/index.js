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

function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) {
    b64 += "=";
  }
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function signJWT(payload, secret = DEFAULT_JWT_SECRET) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));

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

  let binarySig = "";
  const sigBytes = new Uint8Array(signature);
  for (let i = 0; i < sigBytes.byteLength; i++) {
    binarySig += String.fromCharCode(sigBytes[i]);
  }
  const encodedSignature = btoa(binarySig)
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyJWT(token, secret = DEFAULT_JWT_SECRET) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    let b64Sig = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (b64Sig.length % 4 !== 0) {
      b64Sig += "=";
    }
    const sigBinary = atob(b64Sig);
    const sigData = Uint8Array.from(sigBinary, c => c.charCodeAt(0));

    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      sigData,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );

    if (!verified) return null;
    return JSON.parse(base64urlDecode(payloadB64));
  } catch (e) {
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

// --- Funções Auxiliares de Formatação e Fuso Horário (PT-BR UTC-3) ---
function formatDateTimeToBR(dateTimeStr) {
  if (!dateTimeStr) return "";
  const parts = String(dateTimeStr).trim().replace("T", " ").split(" ");
  const datePart = parts[0]; // "2026-08-13"
  const timePart = parts[1] ? parts[1].slice(0, 5) : ""; // "16:30"

  const dateSplit = datePart.split("-");
  if (dateSplit.length === 3) {
    const formattedDate = `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;
    return timePart ? `${formattedDate} às ${timePart}` : formattedDate;
  }
  return dateTimeStr;
}

// Converter string de data/hora no padrão BR ("YYYY-MM-DDTHH:mm") para timestamp UTC em ms (Fuso de Brasília / SP UTC-3)
function getBrazilTimestampMs(appointmentTimeStr) {
  if (!appointmentTimeStr) return 0;
  let cleanStr = String(appointmentTimeStr).trim().replace(" ", "T");
  // Se não contiver indicação de fuso horário (Z ou +/-HH:MM), anexar offset de Brasília (-03:00)
  if (!cleanStr.includes("Z") && !/[+-]\d{2}:\d{2}$/.test(cleanStr)) {
    if (cleanStr.length === 16) cleanStr += ":00"; // garante formato YYYY-MM-DDTHH:mm:ss
    cleanStr += "-03:00";
  }
  return Date.parse(cleanStr);
}

async function sendWhatsApp(env, phone, message) {
  if (!phone || !message) return false;
  try {
    let cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith("55")) {
      cleanPhone = "55" + cleanPhone;
    }
    const targetPhone = cleanPhone || phone;

    const res = await fetch("https://abkyvggiydvigugltboe.supabase.co/functions/v1/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: targetPhone,
        message: message,
        instance: "Barbearia do Vale"
      })
    });
    const data = await res.json();
    console.log("Resultado do envio de WhatsApp via Edge Function:", data);
    return res.ok;
  } catch (e) {
    console.error("Erro ao enviar WhatsApp via Edge Function:", e);
    return false;
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
  const validRoles = ['client', 'barber', 'admin', 'secretario'];
  const targetRole = role && validRoles.includes(role) ? role : 'client';
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  try {
    await c.env.DB.prepare(
      "INSERT INTO users (id, name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(userId, name.trim().toUpperCase(), cleanPhone, cleanEmail, passwordHash, targetRole).run();

    const token = await signJWT({ id: userId, name: name.trim().toUpperCase(), phone: cleanPhone, email: cleanEmail, role: targetRole }, c.env.JWT_SECRET || DEFAULT_JWT_SECRET);
    return c.json({ token, user: { id: userId, name: name.trim().toUpperCase(), phone: cleanPhone, email: cleanEmail, role: targetRole } });
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
  let phoneWithout55 = keyPhoneDigits;
  if (keyPhoneDigits.startsWith("55") && keyPhoneDigits.length >= 12) {
    phoneWithout55 = keyPhoneDigits.slice(2);
  }
  const passwordHash = await hashPassword(password);

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, name, phone, email, password_hash, role 
      FROM users 
      WHERE (email IS NOT NULL AND LOWER(email) = LOWER(?)) 
         OR (phone IS NOT NULL AND (
              REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') = ? OR
              REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') = ? OR
              (LENGTH(?) >= 8 AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '(', ''), ')', ''), '-', '') LIKE ?)
            ))
    `).bind(
      keyClean.toLowerCase(),
      keyPhoneDigits || 'NON_EXISTENT',
      phoneWithout55 || 'NON_EXISTENT',
      keyPhoneDigits || 'NON_EXISTENT',
      keyPhoneDigits ? `%${keyPhoneDigits.slice(-8)}` : 'NON_EXISTENT'
    ).first();

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

// 3.0.1 Atualizar Perfil do Usuário Atual (Meu Perfil e Senha)
app.put('/api/auth/me', authMiddleware, async (c) => {
  const currentUser = c.get('user');
  try {
    const { name, phone, email, currentPassword, newPassword } = await c.req.json();

    if (!name || !name.trim()) {
      return c.json({ error: 'O nome é obrigatório.' }, 400);
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    let updatePasswordHash = null;
    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        return c.json({ error: 'Informe sua senha atual para alterar para uma nova senha.' }, 400);
      }
      const dbUser = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(currentUser.id).first();
      const currentHash = await hashPassword(currentPassword);
      if (!dbUser || dbUser.password_hash !== currentHash) {
        return c.json({ error: 'A senha atual informada está incorreta.' }, 400);
      }
      if (newPassword.trim().length < 6) {
        return c.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, 400);
      }
      updatePasswordHash = await hashPassword(newPassword.trim());
    }

    if (updatePasswordHash) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, email = ?, password_hash = ?
        WHERE id = ?
      `).bind(name.trim().toUpperCase(), cleanPhone, cleanEmail, updatePasswordHash, currentUser.id).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE users
        SET name = ?, phone = ?, email = ?
        WHERE id = ?
      `).bind(name.trim().toUpperCase(), cleanPhone, cleanEmail, currentUser.id).run();
    }

    // Se o usuário atual for um barbeiro vinculado na tabela barbers, atualizamos também nome/telefone lá
    await c.env.DB.prepare(`
      UPDATE barbers SET name = ?, phone = ? WHERE user_id = ?
    `).bind(name.trim().toUpperCase(), phone ? phone.trim() : null, currentUser.id).run();

    const updatedUser = {
      ...currentUser,
      name: name.trim().toUpperCase(),
      phone: cleanPhone,
      email: cleanEmail
    };

    const token = await signJWT(updatedUser, c.env.JWT_SECRET || DEFAULT_JWT_SECRET);

    return c.json({
      success: true,
      user: updatedUser,
      token
    });
  } catch (e) {
    if (e.message && e.message.includes("UNIQUE")) {
      return c.json({ error: 'Este e-mail ou telefone já está em uso por outro usuário.' }, 400);
    }
    return c.json({ error: e.message }, 500);
  }
});

// 3.1 Listar Todos os Usuários
app.get('/api/users', authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT id, name, phone, email, role FROM users ORDER BY name ASC").all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 4. Listar Serviços
app.get('/api/services', async (c) => {
  try {
    try {
      await c.env.DB.prepare("ALTER TABLE services ADD COLUMN restricted_access INTEGER DEFAULT 0").run();
    } catch {}

    const { results: services } = await c.env.DB.prepare("SELECT id, name, description, duration_minutes, price, COALESCE(restricted_access, 0) as restricted_access FROM services").all();
    const { results: relations } = await c.env.DB.prepare("SELECT service_id, barber_id FROM barber_services").all();

    const servicesWithBarbers = services.map(srv => {
      const srvRelations = relations.filter(r => r.service_id === srv.id);
      return {
        ...srv,
        restricted_access: Number(srv.restricted_access || 0),
        acesso_restrito: Boolean(srv.restricted_access),
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
    const { name, description, duration_minutes, price, barber_ids, restricted_access, acesso_restrito } = await c.req.json();
    if (!name || duration_minutes === undefined || duration_minutes === null || price === undefined) {
      return c.json({ error: 'Campos nome, duração e preço são obrigatórios.' }, 400);
    }

    try {
      await c.env.DB.prepare("ALTER TABLE services ADD COLUMN restricted_access INTEGER DEFAULT 0").run();
    } catch {}

    const isRestricted = (restricted_access !== undefined ? restricted_access : (acesso_restrito !== undefined ? acesso_restrito : 0)) ? 1 : 0;
    const serviceId = 'srv-' + crypto.randomUUID();

    // Inserir serviço
    await c.env.DB.prepare(
      "INSERT INTO services (id, name, description, duration_minutes, price, restricted_access) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(serviceId, name.trim().toUpperCase(), description ? description.trim().toUpperCase() : null, Number(duration_minutes), Number(price), isRestricted).run();

    // Associar barbeiros
    if (Array.isArray(barber_ids) && barber_ids.length > 0) {
      for (const bId of barber_ids) {
        await c.env.DB.prepare(
          "INSERT OR IGNORE INTO barber_services (barber_id, service_id) VALUES (?, ?)"
        ).bind(bId, serviceId).run();
      }
    }

    return c.json({
      success: true,
      service: {
        id: serviceId,
        name: name.trim().toUpperCase(),
        description: description ? description.trim().toUpperCase() : null,
        duration_minutes,
        price,
        restricted_access: isRestricted,
        acesso_restrito: Boolean(isRestricted),
        barber_ids
      }
    });
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
    const { name, description, duration_minutes, price, barber_ids, restricted_access, acesso_restrito } = await c.req.json();
    if (!name || duration_minutes === undefined || duration_minutes === null || price === undefined) {
      return c.json({ error: 'Campos nome, duração e preço são obrigatórios.' }, 400);
    }

    try {
      await c.env.DB.prepare("ALTER TABLE services ADD COLUMN restricted_access INTEGER DEFAULT 0").run();
    } catch {}

    const isRestricted = (restricted_access !== undefined ? restricted_access : (acesso_restrito !== undefined ? acesso_restrito : 0)) ? 1 : 0;

    const existing = await c.env.DB.prepare("SELECT id FROM services WHERE id = ?").bind(serviceId).first();
    if (!existing) {
      return c.json({ error: 'Serviço não encontrado.' }, 404);
    }

    // Atualizar serviço
    await c.env.DB.prepare(
      "UPDATE services SET name = ?, description = ?, duration_minutes = ?, price = ?, restricted_access = ? WHERE id = ?"
    ).bind(name.trim().toUpperCase(), description ? description.trim().toUpperCase() : null, Number(duration_minutes), Number(price), isRestricted, serviceId).run();

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

    return c.json({
      success: true,
      service: {
        id: serviceId,
        name: name.trim().toUpperCase(),
        description: description ? description.trim().toUpperCase() : null,
        duration_minutes,
        price,
        restricted_access: isRestricted,
        acesso_restrito: Boolean(isRestricted),
        barber_ids
      }
    });
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
    try {
      await c.env.DB.prepare("ALTER TABLE barbers ADD COLUMN user_id TEXT REFERENCES users(id)").run();
    } catch { }

    const countResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM barbers").first();
    if (countResult && countResult.count === 0) {
      await c.env.DB.prepare(`
        INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission, user_id)
        SELECT id, name, phone, NULL, NULL, 'Especialista Do Vale', '2022-01-01', 0, 0, id 
        FROM users 
        WHERE role = 'barber'
      `).run();
    }

    const { results } = await c.env.DB.prepare("SELECT id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission, user_id FROM barbers").all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 5.0.0 Obter dados do Barbeiro logado (Comissões e perfil)
app.get('/api/barbers/me', authMiddleware, async (c) => {
  const user = c.get('user');
  try {
    const barber = await c.env.DB.prepare(
      "SELECT id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission, user_id FROM barbers WHERE user_id = ? OR id = ?"
    ).bind(user.id, user.id).first();
    
    if (!barber) {
      // Fallback: se não encontrar na tabela barbers, retorna dados básicos com comissão 0
      return c.json({
        id: user.id,
        name: user.name,
        phone: user.phone,
        service_commission: 0,
        product_commission: 0,
        user_id: user.id
      });
    }
    return c.json(barber);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 5.0.1 Criar Barbeiro / Profissional (Admin / Secretário)
app.post('/api/barbers', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  try {
    const { name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission, user_id } = await c.req.json();
    if (!name || !name.trim()) {
      return c.json({ error: 'Nome do profissional é obrigatório.' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO barbers (id, name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      name.trim().toUpperCase(),
      phone ? phone.trim() : null,
      photo ? photo.trim() : null,
      birth_date || null,
      specialty ? specialty.trim().toUpperCase() : null,
      hired_at || null,
      Number(service_commission) || 0,
      Number(product_commission) || 0,
      user_id || null
    ).run();

    return c.json({
      success: true,
      barber: {
        id,
        name: name.trim().toUpperCase(),
        phone: phone ? phone.trim() : null,
        photo: photo ? photo.trim() : null,
        birth_date: birth_date || null,
        specialty: specialty ? specialty.trim().toUpperCase() : null,
        hired_at: hired_at || null,
        service_commission: Number(service_commission) || 0,
        product_commission: Number(product_commission) || 0,
        user_id: user_id || null
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 5.0.2 Editar Barbeiro / Profissional (Admin / Secretário)
app.put('/api/barbers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const { name, phone, photo, birth_date, specialty, hired_at, service_commission, product_commission, user_id } = await c.req.json();
    if (!name || !name.trim()) {
      return c.json({ error: 'Nome do profissional é obrigatório.' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE barbers 
      SET name = ?, phone = ?, photo = ?, birth_date = ?, specialty = ?, hired_at = ?, service_commission = ?, product_commission = ?, user_id = ?
      WHERE id = ?
    `).bind(
      name.trim().toUpperCase(),
      phone ? phone.trim() : null,
      photo ? photo.trim() : null,
      birth_date || null,
      specialty ? specialty.trim().toUpperCase() : null,
      hired_at || null,
      Number(service_commission) || 0,
      Number(product_commission) || 0,
      user_id || null,
      id
    ).run();

    return c.json({
      success: true,
      barber: {
        id,
        name: name.trim().toUpperCase(),
        phone: phone ? phone.trim() : null,
        photo: photo ? photo.trim() : null,
        birth_date: birth_date || null,
        specialty: specialty ? specialty.trim().toUpperCase() : null,
        hired_at: hired_at || null,
        service_commission: Number(service_commission) || 0,
        product_commission: Number(product_commission) || 0,
        user_id: user_id || null
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 5.0.3 Excluir Barbeiro / Profissional (Admin / Secretário)
app.delete('/api/barbers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    await c.env.DB.prepare("DELETE FROM barbers WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 5.1 Listar Horários Ocupados (Público)
app.get('/api/appointments/occupied', async (c) => {
  try {
    const query = `
      SELECT a.id, a.barber_id, a.appointment_time, a.status, a.cancellation_reason,
             b.name as barber_name,
             COALESCE(
               (SELECT SUM(s.duration_minutes) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.duration_minutes,
               30
                         ) as duration_minutes,
            (SELECT c.id FROM caixa c WHERE (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id) LIMIT 1) as caixa_id,
            (SELECT c.amount FROM caixa c WHERE (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id) LIMIT 1) as caixa_amount,
            (SELECT c.payment_method FROM caixa c WHERE (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id) LIMIT 1) as caixa_payment_method
      FROM appointments a
      LEFT JOIN barbers b ON (a.barber_id = b.id OR a.barber_id = b.user_id)
      LEFT JOIN services s_single ON a.service_id = s_single.id
      WHERE (a.status != 'cancelled' OR a.cancellation_reason IS NOT NULL)
      ORDER BY a.appointment_time ASC
    `;
    const { results } = await c.env.DB.prepare(query).all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 6. Listar Agendamentos
app.get('/api/appointments', authMiddleware, async (c) => {
  const user = c.get('user');
  try {
    try {
      await syncCompletedAppointmentsToCaixa(c.env.DB);
    } catch (e) {
      console.error('Erro no sync ao listar appointments:', e);
    }
    try {
      await c.env.DB.prepare("ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT").run();
    } catch {}

    try {
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO customers (id, name, phone) VALUES ('cust-bloqueio-sistema', 'BLOQUEIO DE AGENDA', '00000000000')"
      ).run();
      await c.env.DB.prepare(
        "UPDATE appointments SET client_id = 'cust-bloqueio-sistema' WHERE status = 'cancelled' AND cancellation_reason IS NOT NULL AND (client_id IS NULL OR client_id != 'cust-bloqueio-sistema')"
      ).run();
    } catch {}

    let query = `
      SELECT a.id, a.client_id, a.barber_id, a.appointment_time, a.status, a.cancellation_reason,
             CASE 
               WHEN a.status = 'cancelled' AND a.cancellation_reason IS NOT NULL THEN COALESCE(NULLIF(a.cancellation_reason, ''), 'Bloqueio de Agenda')
               ELSE COALESCE(cust.name, u.name, 'Cliente') 
             END as client_name, 
             CASE 
               WHEN a.status = 'cancelled' AND a.cancellation_reason IS NOT NULL THEN ''
               ELSE COALESCE(cust.phone, u.phone, '') 
             END as client_phone,
             b.name as barber_name, b.photo as barber_photo,
             a.service_id,
             COALESCE(
               (SELECT GROUP_CONCAT(aps.service_id, ',') FROM appointment_services aps WHERE aps.appointment_id = a.id),
               a.service_id
             ) as service_ids,
             CASE 
               WHEN a.status = 'cancelled' AND a.cancellation_reason IS NOT NULL THEN 'Bloqueio de Agenda'
               ELSE COALESCE(
                 (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
                 s_single.name
               )
             END as service_name,
             CASE 
               WHEN a.status = 'cancelled' AND a.cancellation_reason IS NOT NULL THEN 0
               ELSE COALESCE(
                 (SELECT SUM(s.price) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
                 s_single.price
               )
             END as service_price,
             COALESCE(
               (SELECT SUM(s.duration_minutes) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.duration_minutes
              ) as duration_minutes,
              (SELECT c.id FROM caixa c WHERE (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id) LIMIT 1) as caixa_id,
              (SELECT c.amount FROM caixa c WHERE (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id) LIMIT 1) as caixa_amount,
              (SELECT c.payment_method FROM caixa c WHERE (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id) LIMIT 1) as caixa_payment_method
       FROM appointments a
      LEFT JOIN users u ON a.client_id = u.id
      LEFT JOIN customers cust ON a.client_id = cust.id
      LEFT JOIN barbers b ON (a.barber_id = b.id OR a.barber_id = b.user_id)
      LEFT JOIN services s_single ON a.service_id = s_single.id
    `;

    query += " ORDER BY a.appointment_time DESC";
    const { results } = await c.env.DB.prepare(query).all();

    return c.json(results);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 6.1. Cancelar / Bloquear Intervalo de Horários (Preserva Agendamentos Existentes de Clientes)
app.post('/api/appointments/cancel-range', authMiddleware, async (c) => {
  try {
    try {
      await c.env.DB.prepare("ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT").run();
    } catch {}

    const { barber_id, date, start_time, end_time, reason } = await c.req.json();

    if (!barber_id || !date || !start_time || !end_time) {
      return c.json({ error: 'Os campos barbeiro, data, horário de início e término são obrigatórios.' }, 400);
    }

    const cancelReason = (reason && reason.trim()) ? reason.trim().toUpperCase() : 'BLOQUEIO DE AGENDA';

    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      return c.json({ error: 'Formato de horário inválido.' }, 400);
    }

    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    if (startTotalMin >= endTotalMin) {
      return c.json({ error: 'O horário de término deve ser posterior ao horário de início.' }, 400);
    }

    // Buscar agendamentos existentes no dia para o barbeiro
    const { results: existingAppts } = await c.env.DB.prepare(`
      SELECT id, appointment_time, status, client_id
      FROM appointments
      WHERE barber_id = ? AND appointment_time LIKE ?
    `).bind(barber_id, `${date}%`).all();

    let createdCount = 0;

    for (let currentMin = startTotalMin; currentMin < endTotalMin; currentMin += 30) {
      const h = String(Math.floor(currentMin / 60)).padStart(2, '0');
      const m = String(currentMin % 60).padStart(2, '0');
      const slotTimeStr = `${date}T${h}:${m}`;

      const existingAtSlot = existingAppts ? existingAppts.find(a => a.appointment_time === slotTimeStr) : null;

      if (existingAtSlot) {
        // REGRA DE OURO: Se tiver agendamento de cliente (confirmado, concluído ou com client_id), NÃO alterar e NÃO cancelar!
        if (existingAtSlot.status === 'confirmed' || existingAtSlot.status === 'completed' || existingAtSlot.client_id) {
          continue; // Preserva agendamento do cliente intacto
        }
        // Se já era um bloqueio/cancelamento sem cliente, atualiza o motivo
        if (existingAtSlot.status === 'cancelled') {
          await c.env.DB.prepare(`
            UPDATE appointments SET cancellation_reason = ? WHERE id = ?
          `).bind(cancelReason, existingAtSlot.id).run();
          createdCount++;
          continue;
        }
      }

      // Slot livre: cria o registro de bloqueio/cancelamento
      const apptId = crypto.randomUUID();
      try {
        await c.env.DB.prepare(`
          INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, cancellation_reason)
          VALUES (?, NULL, ?, NULL, ?, 'cancelled', ?)
        `).bind(apptId, barber_id, slotTimeStr, cancelReason).run();
      } catch (insertErr) {
        if (insertErr.message && insertErr.message.includes("NOT NULL constraint failed")) {
          // Se o schema do banco possui restrição NOT NULL em client_id / service_id
          const fallbackClientId = 'cust-bloqueio-sistema';
          await c.env.DB.prepare(
            "INSERT OR IGNORE INTO customers (id, name, phone) VALUES (?, ?, ?)"
          ).bind(fallbackClientId, 'BLOQUEIO DE AGENDA', '00000000000').run();

          const fallbackServiceId = 'srv-corte';

          await c.env.DB.prepare(`
            INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status, cancellation_reason)
            VALUES (?, ?, ?, ?, ?, 'cancelled', ?)
          `).bind(apptId, fallbackClientId, barber_id, fallbackServiceId, slotTimeStr, cancelReason).run();
        } else {
          throw insertErr;
        }
      }

      createdCount++;
    }

    return c.json({ success: true, count: createdCount });
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
        ).bind(name ? name.trim().toUpperCase() : null, phone || null, clientId).run();
      }
    } else {
      // Criar novo cliente estritamente na tabela 'customers' (SEM mexer em 'users')
      clientId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)"
      ).bind(clientId, name ? name.trim().toUpperCase() : 'CLIENTE SEM NOME', phone || null).run();
    }

    // Processar serviços
    const serviceIds = Array.isArray(service_id) ? service_id : [service_id];
    if (serviceIds.length === 0) {
      return c.json({ error: 'Selecione ao menos um serviço.' }, 400);
    }

    // Calcular duração total dos serviços agendados
    let totalRequestedDuration = 0;
    for (const sId of serviceIds) {
      const sRow = await c.env.DB.prepare("SELECT duration_minutes FROM services WHERE id = ?").bind(sId).first();
      if (sRow) {
        totalRequestedDuration += (sRow.duration_minutes !== undefined && sRow.duration_minutes !== null) ? sRow.duration_minutes : 30;
      }
    }

    // Verificar conflito de horário para o mesmo barbeiro (somente se a duração for > 0)
    if (totalRequestedDuration > 0 && appointment_time) {
      const dateStr = appointment_time.split('T')[0];
      const timeStr = appointment_time.split('T')[1] || "";
      const [reqH, reqM] = timeStr.split(':').map(Number);

      if (!isNaN(reqH) && !isNaN(reqM)) {
        const newStartM = reqH * 60 + reqM;
        const newEndM = newStartM + totalRequestedDuration;

        const reqDateObj = new Date(dateStr + "T00:00:00");
        const dayOfWeek = reqDateObj.getDay();
        const closingHour = dayOfWeek === 6 ? 16 : 20;
        if (dayOfWeek !== 0 && newEndM > closingHour * 60) {
          return c.json({ error: 'O horário selecionado ultrapassa o horário de funcionamento da barbearia.' }, 400);
        }

        const existingAppts = await c.env.DB.prepare(`
          SELECT a.id, a.appointment_time, a.status,
                 COALESCE(
                   (SELECT SUM(s.duration_minutes) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
                   s_single.duration_minutes,
                   30
                 ) as duration_minutes
          FROM appointments a
          LEFT JOIN services s_single ON a.service_id = s_single.id
          WHERE (a.barber_id = ? OR a.barber_id IN (SELECT id FROM barbers WHERE user_id = ?) OR a.barber_id IN (SELECT user_id FROM barbers WHERE id = ?)) 
            AND a.appointment_time LIKE ? 
            AND (a.status != 'cancelled' OR a.cancellation_reason IS NOT NULL)
        `).bind(barber_id, barber_id, barber_id, `${dateStr}%`).all();

        if (existingAppts && existingAppts.results) {
          for (const appt of existingAppts.results) {
            const apptTimePart = appt.appointment_time.split('T')[1] || "";
            const [appH, appM] = apptTimePart.split(':').map(Number);
            if (isNaN(appH) || isNaN(appM)) continue;

            const apptStartM = appH * 60 + appM;
            const apptDuration = (appt.duration_minutes !== undefined && appt.duration_minutes !== null) ? Number(appt.duration_minutes) : 30;
            if (apptDuration === 0) continue;

            const apptEndM = apptStartM + apptDuration;

            const overlapStart = Math.max(newStartM, apptStartM);
            const overlapEnd = Math.min(newEndM, apptEndM);

            if (overlapStart < overlapEnd) {
              return c.json({ error: 'Este horário entra em conflito com outro agendamento existente para este profissional.' }, 400);
            }
          }
        }
      }
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
    let barber = null;
    if (barber_id) {
      barber = await c.env.DB.prepare(`
        SELECT COALESCE(NULLIF(b.name, ''), u.name) as name, 
               COALESCE(NULLIF(b.phone, ''), u.phone) as phone 
        FROM barbers b 
        LEFT JOIN users u ON (b.user_id = u.id OR b.id = u.id)
        WHERE b.id = ? OR b.user_id = ? OR u.id = ?
      `).bind(barber_id, barber_id, barber_id).first();

      if (!barber) {
        barber = await c.env.DB.prepare("SELECT name, phone FROM users WHERE id = ?").bind(barber_id).first();
      }
    }

    const servicesText = serviceNames.length > 0 ? serviceNames.join(", ") : "";

    // 4. Executar os envios e agendamento de lembrete em segundo plano (background)
    c.executionCtx.waitUntil((async () => {
      try {
        const formattedDateTime = formatDateTimeToBR(appointment_time);

        // REGRA DE NEGÓCIO: Não enviar mensagem quando não for selecionado/encontrado um barbeiro/profissional
        if (!barber_id || !barber) {
          console.log("Agendamento sem barbeiro/profissional selecionado. Envio de WhatsApp omitido.");
          return;
        }

        // Enviar mensagem de WhatsApp ao Barbeiro
        if (barber && barber.phone && client) {
          const barberMessage = `🔔 *NOVO AGENDAMENTO SOLICITADO!* 🔔\n\nOlá, *${barber.name}*! Um novo cliente solicitou um horário com você. 📅\n\n👤 *Informações do Cliente:*\n━━━━━━━━━━━━━━━━━━\n📝 *Nome:* ${client.name}\n📱 *Contato:* ${client.phone}\n━━━━━━━━━━━━━━━━━━\n\n✂️ *Detalhes do Atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor Estimado:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\nPor favor, verifique sua agenda no sistema e confirme o atendimento.\n\nBom trabalho! 👊💈`;
          const sentBarber = await sendWhatsApp(c.env, barber.phone, barberMessage);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), appointmentId, 'confirmation', barber.phone, sentBarber ? 'sent' : 'failed').run();
        }

        // Aguardar 1 segundo entre disparos
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enviar mensagem de WhatsApp de confirmação ao Cliente
        if (client && client.phone && servicesText) {
          const barberDisplayName = barber && barber.name ? barber.name : 'Barbearia Do Vale';
          const confirmationText = `🌟 *AGENDAMENTO CONFIRMADO!* 🌟\n\nOlá, *${client.name}*, seu horário na *Barbearia Do Vale* está reservado com sucesso! 🎉\n\n✂️ *Detalhes do seu atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n💈 *Profissional:* ${barberDisplayName}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\n📍 *Endereço:*\nAv. Senador Melo Viana, 709 - Goiás, Araguari/MG\n\nNos vemos em breve! 👊🔥`;
          const sent = await sendWhatsApp(c.env, client.phone, confirmationText);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), appointmentId, 'confirmation', client.phone, sent ? 'sent' : 'failed').run();
        }

        // Agendar Lembrete no Durable Object (Fuso Horário de Brasília UTC-3)
        const appointmentMs = getBrazilTimestampMs(appointment_time);
        const reminderMs = appointmentMs - (30 * 60 * 1000);
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
      await c.env.DB.prepare("UPDATE customers SET name = ?, phone = ? WHERE id = ?").bind(name.trim().toUpperCase(), phone, clientId).run();
    } else {
      clientId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)"
      ).bind(clientId, name.trim().toUpperCase(), phone).run();
    }

    // 3. Processar múltiplos serviços
    const serviceIds = Array.isArray(service_id) ? service_id : [service_id];
    if (serviceIds.length === 0) {
      return c.json({ error: 'Selecione ao menos um serviço.' }, 400);
    }

    let totalRequestedDuration = 0;
    for (const sId of serviceIds) {
      const sRow = await c.env.DB.prepare("SELECT duration_minutes FROM services WHERE id = ?").bind(sId).first();
      if (sRow) {
        totalRequestedDuration += (sRow.duration_minutes !== undefined && sRow.duration_minutes !== null) ? sRow.duration_minutes : 30;
      }
    }

    // 2. Verificar conflito de horário (somente se a duração for > 0)
    if (totalRequestedDuration > 0 && appointment_time) {
      const dateStr = appointment_time.split('T')[0];
      const timeStr = appointment_time.split('T')[1] || "";
      const [reqH, reqM] = timeStr.split(':').map(Number);

      if (!isNaN(reqH) && !isNaN(reqM)) {
        const newStartM = reqH * 60 + reqM;
        const newEndM = newStartM + totalRequestedDuration;

        const reqDateObj = new Date(dateStr + "T00:00:00");
        const dayOfWeek = reqDateObj.getDay();
        const closingHour = dayOfWeek === 6 ? 16 : 20;
        if (dayOfWeek !== 0 && newEndM > closingHour * 60) {
          return c.json({ error: 'O horário selecionado ultrapassa o horário de funcionamento da barbearia.' }, 400);
        }

        const existingAppts = await c.env.DB.prepare(`
          SELECT a.id, a.appointment_time, a.status,
                 COALESCE(
                   (SELECT SUM(s.duration_minutes) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
                   s_single.duration_minutes,
                   30
                 ) as duration_minutes
          FROM appointments a
          LEFT JOIN services s_single ON a.service_id = s_single.id
          WHERE (a.barber_id = ? OR a.barber_id IN (SELECT id FROM barbers WHERE user_id = ?) OR a.barber_id IN (SELECT user_id FROM barbers WHERE id = ?)) 
            AND a.appointment_time LIKE ? 
            AND (a.status != 'cancelled' OR a.cancellation_reason IS NOT NULL)
        `).bind(barber_id, barber_id, barber_id, `${dateStr}%`).all();

        if (existingAppts && existingAppts.results) {
          for (const appt of existingAppts.results) {
            const apptTimePart = appt.appointment_time.split('T')[1] || "";
            const [appH, appM] = apptTimePart.split(':').map(Number);
            if (isNaN(appH) || isNaN(appM)) continue;

            const apptStartM = appH * 60 + appM;
            const apptDuration = (appt.duration_minutes !== undefined && appt.duration_minutes !== null) ? Number(appt.duration_minutes) : 30;
            if (apptDuration === 0) continue;

            const apptEndM = apptStartM + apptDuration;

            const overlapStart = Math.max(newStartM, apptStartM);
            const overlapEnd = Math.min(newEndM, apptEndM);

            if (overlapStart < overlapEnd) {
              return c.json({ error: 'Este horário entra em conflito com outro agendamento existente para este profissional.' }, 400);
            }
          }
        }
      }
    }

    const appointmentId = crypto.randomUUID();
    const primaryServiceId = serviceIds[0];

    await c.env.DB.prepare(
      "INSERT INTO appointments (id, client_id, barber_id, service_id, appointment_time, status) VALUES (?, ?, ?, ?, ?, 'confirmed')"
    ).bind(appointmentId, clientId, barber_id, primaryServiceId, appointment_time).run();

    const createdIds = [appointmentId];
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


    let barber = null;
    if (barber_id) {
      barber = await c.env.DB.prepare(`
        SELECT COALESCE(NULLIF(b.name, ''), u.name) as name, 
               COALESCE(NULLIF(b.phone, ''), u.phone) as phone 
        FROM barbers b 
        LEFT JOIN users u ON (b.user_id = u.id OR b.id = u.id)
        WHERE b.id = ? OR b.user_id = ? OR u.id = ?
      `).bind(barber_id, barber_id, barber_id).first();

      if (!barber) {
        barber = await c.env.DB.prepare("SELECT name, phone FROM users WHERE id = ?").bind(barber_id).first();
      }
    }

    const servicesText = serviceNames.length > 0 ? serviceNames.join(", ") : "";

    // 4. Executar os envios e agendamento de lembrete em segundo plano (background) para evitar timeouts e erros na conexão principal
    c.executionCtx.waitUntil((async () => {
      try {
        const formattedDateTime = formatDateTimeToBR(appointment_time);

        // REGRA DE NEGÓCIO: Não enviar mensagem quando não for selecionado/encontrado um barbeiro/profissional
        if (!barber_id || !barber) {
          console.log("Agendamento rápido sem barbeiro/profissional selecionado. Envio de WhatsApp omitido.");
          return;
        }

        // Enviar mensagem de WhatsApp ao Barbeiro
        if (barber && barber.phone) {
          const barberMessage = `🔔 *NOVO AGENDAMENTO SOLICITADO!* 🔔\n\nOlá, *${barber.name}*! Um novo cliente solicitou um horário com você. 📅\n\n👤 *Informações do Cliente:*\n━━━━━━━━━━━━━━━━━━\n📝 *Nome:* ${name}\n📱 *Contato:* ${phone}\n━━━━━━━━━━━━━━━━━━\n\n✂️ *Detalhes do Atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor Estimado:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\nPor favor, verifique sua agenda no sistema e confirme o atendimento. Caso precise realizar algum ajuste de horário ou serviço, entre em contato direto com o cliente pelo número acima.\n\nBom trabalho! 👊💈`;
          const sentBarber = await sendWhatsApp(c.env, barber.phone, barberMessage);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), createdIds[0], 'confirmation', barber.phone, sentBarber ? 'sent' : 'failed').run();
        }

        // Aguardar 1 segundo entre disparos
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enviar mensagem de WhatsApp de confirmação ao Cliente
        if (phone && servicesText) {
          const barberDisplayName = barber && barber.name ? barber.name : 'Barbearia Do Vale';
          const confirmationText = `🌟 *AGENDAMENTO CONFIRMADO!* 🌟\n\nOlá, *${name}*, seu horário na *Barbearia Do Vale* está reservado com sucesso! 🎉\n\n✂️ *Detalhes do seu atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${servicesText}\n💈 *Profissional:* ${barberDisplayName}\n📅 *Data/Hora:* ${formattedDateTime}\n💵 *Valor:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n━━━━━━━━━━━━━━━━━━\n\n📍 *Endereço:*\nAv. Senador Melo Viana, 709 - Goiás, Araguari/MG\n\n⚠️ _Se precisar reagendar ou cancelar, por favor avise com antecedência._\n\nNos vemos em breve para dar aquele tapa no visual! 👊🔥`;
          const sent = await sendWhatsApp(c.env, phone, confirmationText);
          await c.env.DB.prepare(
            "INSERT INTO whatsapp_logs (id, appointment_id, message_type, phone, status, sent_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
          ).bind(crypto.randomUUID(), createdIds[0], 'confirmation', phone, sent ? 'sent' : 'failed').run();
        }

        // Agendar Lembrete no Durable Object (Fuso Horário de Brasília UTC-3)
        const appointmentMs = getBrazilTimestampMs(appointment_time);
        const reminderMs = appointmentMs - (30 * 60 * 1000);
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

// Função Auxiliar: Excluir lançamentos do caixa e vendas vinculadas ao agendamento
async function deleteAppointmentCaixaAndSales(db, appointmentId) {
  if (!appointmentId) return;
  try {
    // 1. Excluir lançamentos do caixa de serviço (cx-srv-*) ou vinculados diretamente ao appointment_id
    await db.prepare(`
      DELETE FROM caixa 
      WHERE appointment_id = ? 
         OR id = ?
    `).bind(appointmentId, 'cx-srv-' + appointmentId).run();

    // 2. Excluir lançamentos de vendas do caixa vinculadas a este agendamento
    await db.prepare(`
      DELETE FROM caixa 
      WHERE id IN (SELECT 'caixa-sale-' || id FROM sales WHERE appointment_id = ?)
    `).bind(appointmentId).run();

    // 3. Excluir itens de vendas e vendas vinculadas ao agendamento
    const { results: linkedSales } = await db.prepare(
      "SELECT id FROM sales WHERE appointment_id = ?"
    ).bind(appointmentId).all();

    if (linkedSales && linkedSales.length > 0) {
      for (const sale of linkedSales) {
        await db.prepare("DELETE FROM sale_items WHERE sale_id = ?").bind(sale.id).run();
      }
      await db.prepare("DELETE FROM sales WHERE appointment_id = ?").bind(appointmentId).run();
    }
  } catch (err) {
    console.error("Erro ao excluir lançamentos do caixa/vendas para o agendamento:", appointmentId, err);
  }
}

// 8. Cancelar Agendamento
app.put('/api/appointments/:id/cancel', authMiddleware, async (c) => {
  const appointmentId = c.req.param('id');
  const user = c.get('user');

  try {
    const appointment = await c.env.DB.prepare(
      `SELECT a.*, 
              COALESCE(cust.phone, u.phone) as phone, 
              COALESCE(cust.name, u.name) as client_name, 
              COALESCE(
                (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
                s_single.name,
                'Atendimento'
              ) as service_name 
       FROM appointments a 
       LEFT JOIN customers cust ON a.client_id = cust.id 
       LEFT JOIN users u ON a.client_id = u.id 
       LEFT JOIN services s_single ON a.service_id = s_single.id 
       WHERE a.id = ?`
    ).bind(appointmentId).first();

    if (!appointment) {
      return c.json({ error: 'Agendamento não encontrado.' }, 404);
    }

    if (user.role === 'client' && appointment.client_id !== user.id) {
      return c.json({ error: 'Ação não permitida.' }, 403);
    }

    await c.env.DB.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").bind(appointmentId).run();

    // Excluir lançamentos do caixa e vendas vinculadas a este agendamento
    await deleteAppointmentCaixaAndSales(c.env.DB, appointmentId);

    if (appointment.phone) {
      const formattedDateTime = formatDateTimeToBR(appointment.appointment_time);
      const cancellationText = `🚨 *AGENDAMENTO CANCELADO* 🚨\n\nOlá, *${appointment.client_name}*.\nConfirmamos que o seu agendamento para o serviço *${appointment.service_name}* no dia *${formattedDateTime}* foi *CANCELADO* com sucesso. 💸\n\nSe desejar agendar um novo horário, estamos à disposição! 💈✨\n🔗 https://barbeariadovale.pages.dev`;
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

// 8.1 Listar Logs de WhatsApp (Admin)
app.get('/api/whatsapp-logs', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Acesso negado. Apenas administradores podem visualizar os logs.' }, 403);
  }

  try {
    const status = c.req.query('status') || '';
    const messageType = c.req.query('message_type') || '';

    const validStatuses = ['pending', 'sent', 'failed'];
    const validTypes = ['confirmation', 'reminder', 'cancellation'];

    let sql = `
      SELECT wl.id, wl.appointment_id, wl.message_type, wl.phone, wl.status, wl.sent_at, wl.created_at,
             c.name AS customer_name,
             (SELECT GROUP_CONCAT(s.name, ', ')
              FROM appointment_services aps
              JOIN services s ON s.id = aps.service_id
              WHERE aps.appointment_id = a.id) AS service_names
      FROM whatsapp_logs wl
      LEFT JOIN appointments a ON a.id = wl.appointment_id
      LEFT JOIN customers c ON c.id = a.client_id
      WHERE 1=1`;
    const binds = [];

    if (status && validStatuses.includes(status)) {
      sql += ` AND wl.status = ?`;
      binds.push(status);
    }
    if (messageType && validTypes.includes(messageType)) {
      sql += ` AND wl.message_type = ?`;
      binds.push(messageType);
    }

    sql += ` ORDER BY wl.created_at DESC LIMIT 200`;

    const result = await c.env.DB.prepare(sql).bind(...binds).all();
    const logs = result.results || [];

    return c.json({ logs, total: logs.length });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 8.2 Editar Agendamento
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
        .bind(name ? name.trim().toUpperCase() : null, phone || null, existing.client_id).run();
    }

    const targetTime = appointment_time || existing.appointment_time;
    const targetStatus = status || existing.status;

    if (targetStatus === 'cancelled' || targetStatus === 'absent') {
      await deleteAppointmentCaixaAndSales(c.env.DB, appointmentId);
    }

    c.executionCtx.waitUntil((async () => {
      try {
        const doId = c.env.APPOINTMENT_SCHEDULER.idFromName(appointmentId);
        const stub = c.env.APPOINTMENT_SCHEDULER.get(doId);

        if (targetStatus === 'cancelled') {
          await stub.cancelReminder();
        } else if (targetStatus === 'confirmed') {
          const appointmentMs = getBrazilTimestampMs(targetTime);
          const reminderMs = appointmentMs - (30 * 60 * 1000);
          if (reminderMs > Date.now()) {
            await stub.scheduleReminder(appointmentId, reminderMs);
          } else {
            await stub.cancelReminder();
          }
        }
      } catch (err) {
        console.error("Erro ao atualizar lembrete do agendamento no DO:", err);
      }
    })());

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 8.2 Excluir Agendamento / Desfazer Bloqueio
app.delete('/api/appointments/:id', authMiddleware, async (c) => {
  const appointmentId = c.req.param('id');
  try {
    const existing = await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?").bind(appointmentId).first();
    if (!existing) {
      return c.json({ error: 'Agendamento/Bloqueio não encontrado.' }, 404);
    }

    // Excluir lançamentos do caixa e vendas associadas
    await deleteAppointmentCaixaAndSales(c.env.DB, appointmentId);

    if (existing.status === 'cancelled' && existing.cancellation_reason) {
      const dateStr = existing.appointment_time.split('T')[0];
      await c.env.DB.prepare(`
        DELETE FROM appointments 
        WHERE barber_id = ? 
          AND status = 'cancelled' 
          AND cancellation_reason = ? 
          AND appointment_time LIKE ?
      `).bind(existing.barber_id, existing.cancellation_reason, `${dateStr}%`).run();
    } else {
      await c.env.DB.prepare("DELETE FROM appointment_services WHERE appointment_id = ?").bind(appointmentId).run();
      await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(appointmentId).run();
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
    ).bind(name.trim().toUpperCase(), cleanPhone, cleanEmail, newRole, targetUserId).run();

    return c.json({ success: true, user: { id: targetUserId, name: name.trim().toUpperCase(), phone: cleanPhone, email: cleanEmail, role: newRole } });
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

  const upperName = name.trim().toUpperCase();
  const upperAddress = address ? address.trim().toUpperCase() : null;
  const cleanPhone = phone.trim();
  const cleanBirthDate = birth_date || null;
  const cleanPhoto = photo || null;

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO customers (id, name, address, phone, birth_date, photo) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, upperName, upperAddress, cleanPhone, cleanBirthDate, cleanPhoto).run();

    return c.json({ success: true, customer: { id, name: upperName, address: upperAddress, phone: cleanPhone, birth_date: cleanBirthDate, photo: cleanPhoto } });
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

  const upperName = name.trim().toUpperCase();
  const upperAddress = address ? address.trim().toUpperCase() : null;
  const cleanPhone = phone.trim();
  const cleanBirthDate = birth_date || null;
  const cleanPhoto = photo || null;

  try {
    const existing = await c.env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Cliente não encontrado.' }, 404);
    }

    await c.env.DB.prepare(
      "UPDATE customers SET name = ?, address = ?, phone = ?, birth_date = ?, photo = ? WHERE id = ?"
    ).bind(upperName, upperAddress, cleanPhone, cleanBirthDate, cleanPhoto, id).run();

    return c.json({ success: true, customer: { id, name: upperName, address: upperAddress, phone: cleanPhone, birth_date: cleanBirthDate, photo: cleanPhoto } });
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

// 15.1. Histórico Completo do Cliente (Serviços Realizados, Compras de Produtos e Resumo)
app.get('/api/customers/:id/history', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const customerId = c.req.param('id');
  try {
    const customer = await c.env.DB.prepare(
      "SELECT id, name, address, phone, birth_date, photo, created_at FROM customers WHERE id = ?"
    ).bind(customerId).first();

    if (!customer) {
      return c.json({ error: 'Cliente não encontrado.' }, 404);
    }

    // 1. Buscar todos os agendamentos/serviços do cliente (concluídos, confirmados, cancelados, faltas)
    const { results: appointments } = await c.env.DB.prepare(`
      SELECT a.id, a.client_id, a.barber_id, a.appointment_time, a.status, a.cancellation_reason, a.created_at,
             b.name as barber_name, b.photo as barber_photo,
             COALESCE(
               (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.name,
               'Serviço'
             ) as service_name,
             COALESCE(
               (SELECT SUM(s.price) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.price,
               0
             ) as service_price,
             (
               SELECT s.payment_method FROM sales s WHERE s.appointment_id = a.id LIMIT 1
             ) as payment_method
      FROM appointments a
      LEFT JOIN barbers b ON (a.barber_id = b.id OR a.barber_id = b.user_id)
      LEFT JOIN services s_single ON a.service_id = s_single.id
      WHERE a.client_id = ?
      ORDER BY a.appointment_time DESC
    `).bind(customerId).all();

    // 2. Buscar todas as vendas/compras de produtos do cliente
    const { results: sales } = await c.env.DB.prepare(`
      SELECT s.id, s.appointment_id, s.customer_id, s.sale_date, s.payment_method, s.total_amount, s.created_at,
             b.name as barber_name
      FROM sales s
      LEFT JOIN appointments a ON s.appointment_id = a.id
      LEFT JOIN barbers b ON a.barber_id = b.id
      WHERE s.customer_id = ? OR s.appointment_id IN (SELECT id FROM appointments WHERE client_id = ?)
      ORDER BY s.sale_date DESC, s.created_at DESC
    `).bind(customerId, customerId).all();

    const productSales = [];
    if (sales && sales.length > 0) {
      for (const sale of sales) {
        const { results: items } = await c.env.DB.prepare(`
          SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.total_price,
                 p.name as product_name, p.photo as product_photo
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ?
        `).bind(sale.id).all();

        sale.items = items || [];
        
        if (items && items.length > 0) {
          for (const item of items) {
            productSales.push({
              sale_id: sale.id,
              sale_date: sale.sale_date || sale.created_at,
              payment_method: sale.payment_method,
              product_id: item.product_id,
              product_name: item.product_name || 'Produto',
              product_photo: item.product_photo,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              barber_name: sale.barber_name
            });
          }
        }
      }
    }

    // 3. Métricas e Resumo
    // Total pago com serviços (apenas status 'completed' ou 'confirmed')
    const completedServices = (appointments || []).filter(a => a.status === 'completed' || a.status === 'confirmed');
    const totalServicesPaid = completedServices.reduce((acc, curr) => acc + (Number(curr.service_price) || 0), 0);

    // Total pago com produtos
    const totalProductsPaid = (sales || []).reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    // Último serviço (preferência para completed/confirmed, ou o mais recente da lista)
    const lastService = completedServices.length > 0 ? completedServices[0] : (appointments && appointments.length > 0 ? appointments[0] : null);

    // Último produto comprado
    const lastProduct = productSales.length > 0 ? productSales[0] : null;

    return c.json({
      customer,
      summary: {
        total_services_paid: totalServicesPaid,
        total_products_paid: totalProductsPaid,
        total_services_count: appointments ? appointments.length : 0,
        total_completed_services_count: completedServices.length,
        total_products_count: productSales.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
        last_service: lastService ? {
          appointment_time: lastService.appointment_time,
          service_name: lastService.service_name,
          service_price: lastService.service_price,
          barber_name: lastService.barber_name,
          status: lastService.status
        } : null,
        last_product: lastProduct ? {
          sale_date: lastProduct.sale_date,
          product_name: lastProduct.product_name,
          quantity: lastProduct.quantity,
          total_price: lastProduct.total_price,
          payment_method: lastProduct.payment_method
        } : null
      },
      services: appointments || [],
      products: productSales,
      sales: sales || []
    });
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

// --- Endpoints de Produtos (Products Table) ---

// 20. Listar Produtos
app.get('/api/products', authMiddleware, async (c) => {
  try {
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          supplier TEXT,
          supplier_contact_name TEXT,
          supplier_contact_phone TEXT,
          cost_price REAL NOT NULL DEFAULT 0,
          sale_price REAL NOT NULL DEFAULT 0,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          photo TEXT,
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
      `).run();
    } catch {}

    // Listar produtos existentes no banco
    const queryParam = c.req.query('q');
    let results;
    if (queryParam) {
      const search = `%${queryParam}%`;
      results = (await c.env.DB.prepare(
        "SELECT id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, photo, created_at, updated_at FROM products WHERE name LIKE ? OR supplier LIKE ? OR description LIKE ? ORDER BY name ASC"
      ).bind(search, search, search).all()).results;
    } else {
      results = (await c.env.DB.prepare(
        "SELECT id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, photo, created_at, updated_at FROM products ORDER BY name ASC"
      ).all()).results;
    }
    return c.json(results || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 21. Criar Produto
app.post('/api/products', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  try {
    const { name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, photo } = await c.req.json();
    if (!name || !name.trim()) {
      return c.json({ error: 'O nome do produto é obrigatório.' }, 400);
    }

    const id = 'prod-' + crypto.randomUUID();
    const cPrice = Number(cost_price) || 0;
    const sPrice = Number(sale_price) || 0;
    const stockQty = Math.max(0, parseInt(stock_quantity, 10) || 0);

    await c.env.DB.prepare(
      "INSERT INTO products (id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      name.trim().toUpperCase(),
      description ? description.trim().toUpperCase() : null,
      supplier ? supplier.trim().toUpperCase() : null,
      supplier_contact_name ? supplier_contact_name.trim().toUpperCase() : null,
      supplier_contact_phone ? supplier_contact_phone.trim() : null,
      cPrice,
      sPrice,
      stockQty,
      photo ? photo.trim() : null
    ).run();

    return c.json({
      success: true,
      product: {
        id,
        name: name.trim().toUpperCase(),
        description: description ? description.trim().toUpperCase() : null,
        supplier: supplier ? supplier.trim().toUpperCase() : null,
        supplier_contact_name: supplier_contact_name ? supplier_contact_name.trim().toUpperCase() : null,
        supplier_contact_phone: supplier_contact_phone ? supplier_contact_phone.trim() : null,
        cost_price: cPrice,
        sale_price: sPrice,
        stock_quantity: stockQty,
        photo: photo ? photo.trim() : null
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 22. Editar Produto
app.put('/api/products/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const { name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, photo } = await c.req.json();
    if (!name || !name.trim()) {
      return c.json({ error: 'O nome do produto é obrigatório.' }, 400);
    }

    const cPrice = Number(cost_price) || 0;
    const sPrice = Number(sale_price) || 0;
    const stockQty = Math.max(0, parseInt(stock_quantity, 10) || 0);

    const existing = await c.env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(id).first();
    if (existing) {
      await c.env.DB.prepare(
        "UPDATE products SET name = ?, description = ?, supplier = ?, supplier_contact_name = ?, supplier_contact_phone = ?, cost_price = ?, sale_price = ?, stock_quantity = ?, photo = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
      ).bind(
        name.trim().toUpperCase(),
        description ? description.trim().toUpperCase() : null,
        supplier ? supplier.trim().toUpperCase() : null,
        supplier_contact_name ? supplier_contact_name.trim().toUpperCase() : null,
        supplier_contact_phone ? supplier_contact_phone.trim() : null,
        cPrice,
        sPrice,
        stockQty,
        photo ? photo.trim() : null,
        id
      ).run();
    } else {
      await c.env.DB.prepare(
        "INSERT INTO products (id, name, description, supplier, supplier_contact_name, supplier_contact_phone, cost_price, sale_price, stock_quantity, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id,
        name.trim().toUpperCase(),
        description ? description.trim().toUpperCase() : null,
        supplier ? supplier.trim().toUpperCase() : null,
        supplier_contact_name ? supplier_contact_name.trim().toUpperCase() : null,
        supplier_contact_phone ? supplier_contact_phone.trim() : null,
        cPrice,
        sPrice,
        stockQty,
        photo ? photo.trim() : null
      ).run();
    }

    return c.json({
      success: true,
      product: {
        id,
        name: name.trim(),
        description: description ? description.trim() : null,
        supplier: supplier ? supplier.trim() : null,
        supplier_contact_name: supplier_contact_name ? supplier_contact_name.trim() : null,
        supplier_contact_phone: supplier_contact_phone ? supplier_contact_phone.trim() : null,
        cost_price: cPrice,
        sale_price: sPrice,
        stock_quantity: stockQty,
        photo: photo ? photo.trim() : null
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 23. Excluir Produto
app.delete('/api/products/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const existing = await c.env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Produto não encontrado.' }, 404);
    }

    await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// --- Módulo de Fluxo de Caixa (Caixa) ---

// Migração: mescla agendamentos duplicados (mesmo cliente+barbeiro+horário) criados
// pelo fluxo legado (um registro por serviço) em um único registro com appointment_services.
async function mergeOrphanedDuplicateAppointments(db) {
  try {
    // Passo 1: garantir que todo agendamento com service_id tenha ao menos um registro
    // em appointment_services (compatibilidade com dados antigos).
    await db.prepare(`
      INSERT OR IGNORE INTO appointment_services (appointment_id, service_id)
      SELECT id, service_id FROM appointments
      WHERE service_id IS NOT NULL
        AND status != 'cancelled'
        AND id NOT IN (SELECT DISTINCT appointment_id FROM appointment_services)
    `).run();

    // Passo 2: localizar grupos de agendamentos duplicados (mesmo cliente+barbeiro+horário)
    const { results: groups } = await db.prepare(`
      SELECT client_id, barber_id, appointment_time,
             COUNT(*) as cnt,
             GROUP_CONCAT(id, ',') as ids
      FROM appointments
      WHERE status != 'cancelled'
        AND client_id != 'cust-bloqueio-sistema'
      GROUP BY client_id, barber_id, appointment_time
      HAVING COUNT(*) > 1
    `).all();

    if (!groups || groups.length === 0) return;

    for (const group of groups) {
      const ids = group.ids.split(',');

      // Prioridade: manter o agendamento que já tem venda de produto no caixa
      let keepId = ids[0];
      for (const id of ids) {
        const hasSale = await db.prepare(
          "SELECT id FROM caixa WHERE appointment_id = ? AND id NOT LIKE 'cx-srv-%' LIMIT 1"
        ).bind(id).first();
        if (hasSale) { keepId = id; break; }
      }

      const toMerge = ids.filter(id => id !== keepId);

      for (const mergeId of toMerge) {
        // Mover todos os serviços do duplicado para o agendamento principal
        const { results: services } = await db.prepare(
          "SELECT service_id FROM appointment_services WHERE appointment_id = ?"
        ).bind(mergeId).all();

        for (const svc of services) {
          await db.prepare(
            "INSERT OR IGNORE INTO appointment_services (appointment_id, service_id) VALUES (?, ?)"
          ).bind(keepId, svc.service_id).run();
        }

        // Remover os lançamentos de serviço automáticos (serão recriados com dados corretos)
        await db.prepare("DELETE FROM caixa WHERE appointment_id = ? AND id LIKE 'cx-srv-%'").bind(mergeId).run();
        await db.prepare("DELETE FROM caixa WHERE appointment_id = ? AND id LIKE 'cx-srv-%'").bind(keepId).run();

        // Remover registros do duplicado e o agendamento em si
        await db.prepare("DELETE FROM appointment_services WHERE appointment_id = ?").bind(mergeId).run();
        await db.prepare("DELETE FROM appointments WHERE id = ?").bind(mergeId).run();
      }
    }
  } catch (e) {
    console.error("Erro ao mesclar agendamentos duplicados:", e);
  }
}

async function syncCompletedAppointmentsToCaixa(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS caixa (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('receita', 'despesa')),
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
        barber_id TEXT REFERENCES barbers(id) ON DELETE SET NULL,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `).run();

    // Mesclar agendamentos duplicados legados antes de sincronizar
    await mergeOrphanedDuplicateAppointments(db);

    // 1. Limpeza preventiva: Remover lançamentos no caixa de agendamentos cancelados, ausentes ou pendentes
    await db.prepare(`
      DELETE FROM caixa 
      WHERE (appointment_id IS NOT NULL OR id LIKE 'cx-srv-%')
        AND (
          appointment_id IN (SELECT id FROM appointments WHERE status IN ('cancelled', 'absent', 'pending'))
          OR REPLACE(id, 'cx-srv-', '') IN (SELECT id FROM appointments WHERE status IN ('cancelled', 'absent', 'pending'))
        )
    `).run();

    // 2. Limpeza preventiva: Remover lançamentos de serviços de agendamentos que ainda NÃO iniciaram (menos de 10 min de início ou futuros) e que não estão concluídos
    await db.prepare(`
      DELETE FROM caixa
      WHERE id LIKE 'cx-srv-%'
        AND (
          appointment_id IN (
            SELECT id FROM appointments 
            WHERE status != 'completed' 
              AND datetime(REPLACE(appointment_time, 'T', ' '), '+10 minutes') > datetime('now', 'localtime')
          )
          OR REPLACE(id, 'cx-srv-', '') IN (
            SELECT id FROM appointments 
            WHERE status != 'completed' 
              AND datetime(REPLACE(appointment_time, 'T', ' '), '+10 minutes') > datetime('now', 'localtime')
          )
        )
    `).run();

    // 3. Selecionar agendamentos iniciados há pelo menos 10 minutos ou concluídos que ainda não possuem lançamento de serviço no caixa
    const { results: eligibleAppts } = await db.prepare(`
      SELECT a.id, a.barber_id, a.appointment_time, a.status,
             COALESCE(cust.name, u.name, 'Cliente') as client_name,
             b.name as barber_name,
             COALESCE(
               (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.name,
               'Serviço'
             ) as service_name,
             COALESCE(
               (SELECT SUM(s.price) FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.price,
               0
             ) as total_price
      FROM appointments a
      LEFT JOIN users u ON a.client_id = u.id
      LEFT JOIN customers cust ON a.client_id = cust.id
      LEFT JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN services s_single ON a.service_id = s_single.id
      WHERE a.status NOT IN ('cancelled', 'absent', 'pending')
        AND (
          a.status = 'completed' OR
          datetime(REPLACE(a.appointment_time, 'T', ' '), '+10 minutes') <= datetime('now', 'localtime')
        )
        AND a.id NOT IN (SELECT appointment_id FROM caixa WHERE appointment_id IS NOT NULL AND id LIKE 'cx-srv-%')
        AND ('cx-srv-' || a.id) NOT IN (SELECT id FROM caixa WHERE id LIKE 'cx-srv-%')
    `).all();

    let syncedCount = 0;
    if (eligibleAppts && eligibleAppts.length > 0) {
      for (const appt of eligibleAppts) {
        const id = 'cx-srv-' + appt.id;
        const description = `Serviço: ${appt.service_name} - Cliente: ${appt.client_name}`;
        const amount = Number(appt.total_price) || 0;
        const dateStr = appt.appointment_time.replace('T', ' ');

        await db.prepare(`
          INSERT OR IGNORE INTO caixa (id, type, description, amount, category, appointment_id, barber_id, date)
          VALUES (?, 'receita', ?, ?, 'Serviço', ?, ?, ?)
        `).bind(id, description, amount, appt.id, appt.barber_id || null, dateStr).run();

        syncedCount++;
      }
    }
    return syncedCount;
  } catch (e) {
    console.error("Erro ao sincronizar agendamentos para caixa:", e);
    return 0;
  }
}

// 12. Listar Lançamentos do Caixa
app.get('/api/caixa', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  try {
    // Sincroniza agendamentos passados automaticamente
    await syncCompletedAppointmentsToCaixa(c.env.DB);

    let results = [];

    const selectQueryBase = `
      SELECT c.*, 
             COALESCE(b.name, u_barber.name) as barber_name,
             COALESCE(
               cust_appt.name, 
               u_appt.name, 
               (SELECT COALESCE(cust_s.name, u_s.name) FROM sales s LEFT JOIN customers cust_s ON s.customer_id = cust_s.id LEFT JOIN users u_s ON s.customer_id = u_s.id WHERE s.id = REPLACE(c.id, 'caixa-sale-', ''))
             ) as client_name,
             (
               SELECT GROUP_CONCAT(p.name || ' (' || si.quantity || 'x)', ', ')
               FROM sale_items si
               JOIN products p ON si.product_id = p.id
               WHERE si.sale_id = REPLACE(c.id, 'caixa-sale-', '')
             ) as products_detail,
             COALESCE(
               (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
               s_single.name
             ) as service_names
      FROM caixa c
      LEFT JOIN barbers b ON (c.barber_id = b.id OR c.barber_id = b.user_id)
      LEFT JOIN users u_barber ON (c.barber_id = u_barber.id OR b.user_id = u_barber.id)
      LEFT JOIN appointments a ON (c.appointment_id = a.id OR c.id = 'cx-srv-' || a.id)
      LEFT JOIN customers cust_appt ON a.client_id = cust_appt.id
      LEFT JOIN users u_appt ON a.client_id = u_appt.id
      LEFT JOIN services s_single ON a.service_id = s_single.id
    `;

    if (user.role === 'barber') {
      const barber = await c.env.DB.prepare(
        "SELECT id, user_id FROM barbers WHERE user_id = ? OR id = ?"
      ).bind(user.id, user.id).first();
      const barberId = barber ? barber.id : user.id;

      const query = `
        ${selectQueryBase}
        WHERE c.barber_id = ? OR c.barber_id = ? OR b.id = ? OR b.user_id = ?
        ORDER BY c.date DESC, c.created_at DESC
      `;
      const stmt = await c.env.DB.prepare(query).bind(barberId, user.id, barberId, user.id).all();
      results = stmt.results || [];
    } else {
      const query = `
        ${selectQueryBase}
        ORDER BY c.date DESC, c.created_at DESC
      `;
      const stmt = await c.env.DB.prepare(query).all();
      results = stmt.results || [];
    }

    let totalReceitas = 0;
    let totalDespesas = 0;

    (results || []).forEach(item => {
      const val = Number(item.amount) || 0;
      if (item.type === 'receita') {
        totalReceitas += val;
      } else if (item.type === 'despesa') {
        totalDespesas += val;
      }
    });

    const saldo = totalReceitas - totalDespesas;

    return c.json({
      transactions: results || [],
      summary: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo: saldo
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 12.1 Sincronizar Manualmente Agendamentos -> Caixa
app.post('/api/caixa/sync', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  try {
    const count = await syncCompletedAppointmentsToCaixa(c.env.DB);
    return c.json({ success: true, synced_count: count });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 12.2 Criar Lançamento Manual no Caixa
app.post('/api/caixa', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  try {
    const { type, description, amount, category, date, barber_id } = await c.req.json();

    if (!type || !['receita', 'despesa'].includes(type)) {
      return c.json({ error: 'Tipo inválido. Deve ser receita ou despesa.' }, 400);
    }
    if (!description || !description.trim()) {
      return c.json({ error: 'Descrição é obrigatória.' }, 400);
    }
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return c.json({ error: 'Valor deve ser um número positivo.' }, 400);
    }

    const id = 'cx-man-' + crypto.randomUUID();
    const formattedDate = date ? date.replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
    const categoryName = (category && category.trim() ? category.trim() : (type === 'receita' ? 'Receita Avulsa' : 'Despesa Geral')).toUpperCase();

    await c.env.DB.prepare(`
      INSERT INTO caixa (id, type, description, amount, category, barber_id, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      type,
      description.trim().toUpperCase(),
      Number(amount),
      categoryName,
      barber_id || null,
      formattedDate
    ).run();

    return c.json({
      success: true,
      transaction: {
        id,
        type,
        description: description.trim().toUpperCase(),
        amount: Number(amount),
        category: categoryName,
        barber_id: barber_id || null,
        date: formattedDate
      }
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 12.3 Editar Lançamento do Caixa
app.put('/api/caixa/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    const { type, description, amount, category, date, barber_id, payment_method } = await c.req.json();

    const existing = await c.env.DB.prepare("SELECT * FROM caixa WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ error: 'Lançamento não encontrado.' }, 404);
    }

    if (user.role === 'barber') {
      const barber = await c.env.DB.prepare(
        "SELECT id, user_id FROM barbers WHERE user_id = ? OR id = ?"
      ).bind(user.id, user.id).first();
      const barberId = barber ? barber.id : user.id;

      if (existing.barber_id && existing.barber_id !== barberId && existing.barber_id !== user.id) {
        return c.json({ error: 'Ação não permitida para este barbeiro.' }, 403);
      }
    }

    const newType = type || existing.type;
    const newDesc = description ? description.trim().toUpperCase() : existing.description;
    const newAmount = amount !== undefined && amount !== null && !isNaN(Number(amount)) ? Number(amount) : existing.amount;
    const newCategory = category ? category.trim().toUpperCase() : existing.category;
    const newBarberId = barber_id !== undefined ? (barber_id || null) : existing.barber_id;
    const newDate = date ? date.replace('T', ' ') : existing.date;
    const newPaymentMethod = payment_method !== undefined ? (payment_method ? payment_method.trim().toUpperCase() : null) : (existing.payment_method || null);

    await c.env.DB.prepare(`
      UPDATE caixa
      SET type = ?, description = ?, amount = ?, category = ?, barber_id = ?, date = ?, payment_method = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).bind(
      newType,
      newDesc,
      newAmount,
      newCategory,
      newBarberId,
      newDate,
      newPaymentMethod,
      id
    ).run();

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 12.3.1 Atualizar Lançamento do Caixa por Agendamento
app.put('/api/caixa/appointment/:appointmentId', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario' && user.role !== 'barber') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const appointmentId = c.req.param('appointmentId');
  try {
    const { amount, payment_method } = await c.req.json();

    const existing = await c.env.DB.prepare(
      "SELECT * FROM caixa WHERE appointment_id = ? OR id = ?"
    ).bind(appointmentId, 'cx-srv-' + appointmentId).first();

    if (!existing) {
      return c.json({ error: 'Lançamento do caixa não encontrado para este agendamento.' }, 404);
    }

    if (user.role === 'barber') {
      const barber = await c.env.DB.prepare(
        "SELECT id, user_id FROM barbers WHERE user_id = ? OR id = ?"
      ).bind(user.id, user.id).first();
      const barberId = barber ? barber.id : user.id;

      if (existing.barber_id && existing.barber_id !== barberId && existing.barber_id !== user.id) {
        return c.json({ error: 'Ação não permitida para este barbeiro.' }, 403);
      }
    }

    const newAmount = amount !== undefined && amount !== null && !isNaN(Number(amount)) ? Number(amount) : existing.amount;
    const newPaymentMethod = payment_method !== undefined ? (payment_method ? payment_method.trim().toUpperCase() : null) : (existing.payment_method || null);

    await c.env.DB.prepare(`
      UPDATE caixa
      SET amount = ?, payment_method = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).bind(newAmount, newPaymentMethod, existing.id).run();

    return c.json({ success: true, caixa_id: existing.id, amount: newAmount, payment_method: newPaymentMethod });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 12.4 Excluir Lançamento do Caixa
app.delete('/api/caixa/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'secretario') {
    return c.json({ error: 'Acesso negado.' }, 403);
  }

  const id = c.req.param('id');
  try {
    await c.env.DB.prepare("DELETE FROM caixa WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// --- Endpoints de Vendas ---

app.get('/api/sales/all', async (c) => {
  try {
    const { results: sales } = await c.env.DB.prepare(
      `SELECT s.id, s.appointment_id, s.customer_id, s.sale_date, s.payment_method, s.total_amount, s.created_at,
              a.barber_id, b.name as barber_name
       FROM sales s
       LEFT JOIN appointments a ON s.appointment_id = a.id
       LEFT JOIN barbers b ON a.barber_id = b.id
       ORDER BY s.created_at DESC`
    ).all();

    if (sales && sales.length > 0) {
      for (const sale of sales) {
        const { results: items } = await c.env.DB.prepare(
          `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.total_price, p.name as product_name
           FROM sale_items si
           LEFT JOIN products p ON si.product_id = p.id
           WHERE si.sale_id = ?`
        ).bind(sale.id).all();
        sale.items = items || [];
      }
    }

    return c.json(sales || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/api/sales/:id', async (c) => {
  const saleId = c.req.param('id');
  try {
    const sale = await c.env.DB.prepare(
      `SELECT s.id, s.appointment_id, s.customer_id, s.sale_date, s.payment_method, s.total_amount, s.created_at,
              COALESCE(cust.name, u.name, 'Cliente Avulso') as client_name,
              b.id as barber_id, b.name as barber_name,
              a.appointment_time
       FROM sales s
       LEFT JOIN appointments a ON s.appointment_id = a.id
       LEFT JOIN users u ON (s.customer_id = u.id OR a.client_id = u.id)
       LEFT JOIN customers cust ON (s.customer_id = cust.id OR a.client_id = cust.id)
       LEFT JOIN barbers b ON a.barber_id = b.id
       WHERE s.id = ?`
    ).bind(saleId).first();
    if (!sale) return c.json(null);
    
    const { results: items } = await c.env.DB.prepare(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.total_price, p.name as product_name
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`
    ).bind(sale.id).all();

    const caixaEntry = await c.env.DB.prepare("SELECT id FROM caixa WHERE id = ?").bind('caixa-sale-' + sale.id).first();

    return c.json({ ...sale, items: items || [], has_caixa: !!caixaEntry });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/api/sales/appointment/:appointmentId', async (c) => {
  const appointmentId = c.req.param('appointmentId');
  try {
    const sale = await c.env.DB.prepare(
      "SELECT id, appointment_id, customer_id, sale_date, payment_method, total_amount, created_at FROM sales WHERE appointment_id = ?"
    ).bind(appointmentId).first();
    if (!sale) return c.json(null);
    
    const { results: items } = await c.env.DB.prepare(
      `SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, si.total_price, p.name as product_name
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`
    ).bind(sale.id).all();

    // Verificar se existe integração no caixa
    const caixaEntry = await c.env.DB.prepare("SELECT id FROM caixa WHERE id = ?").bind('caixa-sale-' + sale.id).first();

    return c.json({ ...sale, items, has_caixa: !!caixaEntry });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/sales', authMiddleware, async (c) => {
  try {
    const { appointment_id, customer_id, barber_id, sale_date, payment_method, items, sync_caixa } = await c.req.json();
    if (!payment_method || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Forma de pagamento e pelo menos um item são obrigatórios.' }, 400);
    }
    
    const saleId = 'sale-' + crypto.randomUUID();
    let totalAmount = 0;
    
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      totalAmount += itemTotal;
    }

    const validDate = sale_date || new Date().toISOString().slice(0, 19).replace('T', ' ');

    await c.env.DB.prepare(
      "INSERT INTO sales (id, appointment_id, customer_id, sale_date, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(saleId, appointment_id || null, customer_id || null, validDate, payment_method, totalAmount).run();

    for (const item of items) {
      const itemId = 'item-' + crypto.randomUUID();
      const qty = Number(item.quantity);
      const uPrice = Number(item.unit_price);
      const tPrice = qty * uPrice;

      await c.env.DB.prepare(
        "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(itemId, saleId, item.product_id, qty, uPrice, tPrice).run();
    }

    if (sync_caixa) {
      const caixaId = 'caixa-sale-' + saleId;
      const description = `Venda de Produtos (${items.length} ${items.length === 1 ? 'item' : 'itens'}) - Pagamento: ${payment_method}`;
      let barberId = barber_id || null;
      if (!barberId && appointment_id) {
        const appt = await c.env.DB.prepare("SELECT barber_id FROM appointments WHERE id = ?").bind(appointment_id).first();
        if (appt) barberId = appt.barber_id;
      }
      await c.env.DB.prepare(
        "INSERT INTO caixa (id, type, description, amount, category, appointment_id, barber_id, date) VALUES (?, 'receita', ?, ?, 'Venda de Produtos', ?, ?, ?)"
      ).bind(caixaId, description, totalAmount, appointment_id || null, barberId, validDate.slice(0, 10)).run();
    }

    return c.json({ success: true, saleId, totalAmount });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.put('/api/sales/:id', authMiddleware, async (c) => {
  const saleId = c.req.param('id');
  try {
    const { appointment_id, customer_id, barber_id, sale_date, payment_method, items, sync_caixa } = await c.req.json();
    if (!payment_method || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Forma de pagamento e pelo menos um item são obrigatórios.' }, 400);
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += Number(item.quantity) * Number(item.unit_price);
    }

    await c.env.DB.prepare(
      "UPDATE sales SET payment_method = ?, total_amount = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).bind(payment_method, totalAmount, saleId).run();

    await c.env.DB.prepare("DELETE FROM sale_items WHERE sale_id = ?").bind(saleId).run();

    for (const item of items) {
      const itemId = 'item-' + crypto.randomUUID();
      const qty = Number(item.quantity);
      const uPrice = Number(item.unit_price);
      const tPrice = qty * uPrice;

      await c.env.DB.prepare(
        "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(itemId, saleId, item.product_id, qty, uPrice, tPrice).run();
    }

    const caixaId = 'caixa-sale-' + saleId;
    await c.env.DB.prepare("DELETE FROM caixa WHERE id = ?").bind(caixaId).run();

    if (sync_caixa) {
      const description = `Venda de Produtos (${items.length} ${items.length === 1 ? 'item' : 'itens'}) - Pagamento: ${payment_method}`;
      let barberId = barber_id || null;
      if (!barberId && appointment_id) {
        const appt = await c.env.DB.prepare("SELECT barber_id FROM appointments WHERE id = ?").bind(appointment_id).first();
        if (appt) barberId = appt.barber_id;
      }
      const validDate = sale_date || new Date().toISOString().slice(0, 10);
      await c.env.DB.prepare(
        "INSERT INTO caixa (id, type, description, amount, category, appointment_id, barber_id, date) VALUES (?, 'receita', ?, ?, 'Venda de Produtos', ?, ?, ?)"
      ).bind(caixaId, description, totalAmount, appointment_id || null, barberId, validDate.slice(0, 10)).run();
    }

    return c.json({ success: true, saleId, totalAmount });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/api/sales/:id', authMiddleware, async (c) => {
  const saleId = c.req.param('id');
  try {
    await c.env.DB.prepare("DELETE FROM sale_items WHERE sale_id = ?").bind(saleId).run();
    await c.env.DB.prepare("DELETE FROM sales WHERE id = ?").bind(saleId).run();
    await c.env.DB.prepare("DELETE FROM caixa WHERE id = ?").bind('caixa-sale-' + saleId).run();
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
               COALESCE(cust.name, u.name, 'Cliente') as client_name,
               COALESCE(cust.phone, u.phone) as client_phone,
               COALESCE(
                 (SELECT GROUP_CONCAT(s.name, ', ') FROM appointment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.appointment_id = a.id),
                 s_single.name,
                 'Atendimento Do Vale'
               ) as service_name
        FROM appointments a
        LEFT JOIN customers cust ON a.client_id = cust.id
        LEFT JOIN users u ON a.client_id = u.id
        LEFT JOIN services s_single ON a.service_id = s_single.id
        WHERE a.id = ?
      `).bind(appointmentId).first();

      if (appointment && appointment.status === 'confirmed' && appointment.client_phone) {
        const formattedDateTime = formatDateTimeToBR(appointment.appointment_time);
        const reminderText = `⏰ *LEMBRETE DE AGENDAMENTO* ⏰\n\nOlá, *${appointment.client_name}*! Passando para te lembrar que seu horário na *Barbearia Do Vale* está chegando! 😎\n\n✂️ *Dados do atendimento:*\n━━━━━━━━━━━━━━━━━━\n💼 *Serviço(s):* ${appointment.service_name}\n📅 *Data/Hora:* ${formattedDateTime}\n━━━━━━━━━━━━━━━━━━\n\n📍 *Endereço:*\nAv. Senador Melo Viana, 709 - Goiás, Araguari/MG\n\nTe esperamos para dar aquele trato no visual! 👊💈`;
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

