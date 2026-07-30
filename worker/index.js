const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 30;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  const path = url.pathname;

  if (path === "/api/login" && request.method === "POST") {
    return login(request, env);
  }

  if (path === "/api/logout" && request.method === "POST") {
    return logout();
  }

  if (path === "/api/session" && request.method === "GET") {
    return sessionStatus(request, env);
  }

  const authed = await requireAuth(request, env);
  if (!authed.ok) {
    return authed.response;
  }

  if (path === "/api/invoices" && request.method === "GET") {
    return listInvoices(env);
  }

  if (path === "/api/invoices" && request.method === "POST") {
    return createAndSendInvoice(request, env);
  }

  return json({ error: "Not found" }, 404);
}

async function login(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "Admin login is not configured yet." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const password = String(body.password || "");
  if (!password || !timingSafeEqual(password, env.ADMIN_PASSWORD)) {
    return json({ error: "Incorrect password." }, 401);
  }

  const token = await createSessionToken(env);
  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": buildSessionCookie(token, request.url),
    }
  );
}

function logout() {
  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    }
  );
}

async function sessionStatus(request, env) {
  const session = await readSession(request, env);
  return json({ authenticated: Boolean(session) });
}

async function listInvoices(env) {
  const result = await env.DB.prepare(
    `SELECT id, invoice_number, customer_name, customer_address, customer_email,
            work_description, amount_pence, created_at, sent_at
     FROM invoices
     ORDER BY created_at DESC
     LIMIT 50`
  ).all();

  return json({ invoices: result.results || [] });
}

async function createAndSendInvoice(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const customerName = cleanText(body.customerName, 120);
  const customerAddress = cleanText(body.customerAddress, 500);
  const customerEmail = cleanEmail(body.customerEmail);
  const workDescription = cleanText(body.workDescription, 2000);
  const amountPence = parseAmountPence(body.amount);

  if (!customerName) {
    return json({ error: "Customer name is required." }, 400);
  }
  if (!customerAddress) {
    return json({ error: "Customer address is required." }, 400);
  }
  if (!customerEmail) {
    return json({ error: "A valid customer email is required." }, 400);
  }
  if (!workDescription) {
    return json({ error: "Work description is required." }, 400);
  }
  if (amountPence === null || amountPence <= 0) {
    return json({ error: "Enter a valid amount greater than zero." }, 400);
  }

  const invoiceNumber = await nextInvoiceNumber(env);
  const now = new Date().toISOString();

  const insert = await env.DB.prepare(
    `INSERT INTO invoices
      (invoice_number, customer_name, customer_address, customer_email, work_description, amount_pence, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      invoiceNumber,
      customerName,
      customerAddress,
      customerEmail,
      workDescription,
      amountPence,
      now
    )
    .run();

  const invoice = {
    id: insert.meta.last_row_id,
    invoice_number: invoiceNumber,
    customer_name: customerName,
    customer_address: customerAddress,
    customer_email: customerEmail,
    work_description: workDescription,
    amount_pence: amountPence,
    created_at: now,
  };

  try {
    await sendInvoiceEmail(env, invoice);
  } catch (error) {
    return json(
      {
        error: "Invoice saved but email could not be sent. Check email settings.",
        detail: error.message,
        invoice,
      },
      502
    );
  }

  await env.DB.prepare(`UPDATE invoices SET sent_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), invoice.id)
    .run();

  return json({ ok: true, invoice: { ...invoice, sent_at: new Date().toISOString() } });
}

async function nextInvoiceNumber(env) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const result = await env.DB.prepare(
    `SELECT invoice_number FROM invoices
     WHERE invoice_number LIKE ?
     ORDER BY invoice_number DESC
     LIMIT 1`
  )
    .bind(`${prefix}%`)
    .first();

  let next = 1;
  if (result?.invoice_number) {
    const suffix = result.invoice_number.slice(prefix.length);
    const parsed = Number.parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) {
      next = parsed + 1;
    }
  }

  return `${prefix}${String(next).padStart(3, "0")}`;
}

async function sendInvoiceEmail(env, invoice) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const businessName = env.BUSINESS_NAME || "E.g. Nelson, Painter and Decorator";
  const businessEmail = env.BUSINESS_EMAIL || "egnelson41@yahoo.co.uk";
  const fromAddress = env.RESEND_FROM || `${businessName} <onboarding@resend.dev>`;
  const amount = formatMoney(invoice.amount_pence);
  const invoiceDate = formatDate(invoice.created_at);
  const subject = `Invoice ${invoice.invoice_number} from ${businessName}`;

  const html = buildInvoiceEmailHtml({
    businessName,
    businessEmail,
    businessPhone: env.BUSINESS_PHONE || "07813 888572",
    invoice,
    amount,
    invoiceDate,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [invoice.customer_email],
      bcc: [businessEmail],
      reply_to: businessEmail,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Email provider returned ${response.status}`);
  }
}

function buildInvoiceEmailHtml({
  businessName,
  businessEmail,
  businessPhone,
  invoice,
  amount,
  invoiceDate,
}) {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7f4ef;font-family:Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ef;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid rgba(27,58,75,0.12);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#1b3a4b;color:#ffffff;padding:24px 28px;">
                <div style="font-size:13px;opacity:0.85;letter-spacing:0.08em;text-transform:uppercase;">Invoice</div>
                <div style="font-size:28px;font-weight:700;margin-top:6px;">${escapeHtml(businessName)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Dear ${escapeHtml(invoice.customer_name)},</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Please find your invoice below for the work completed.</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="padding:8px 0;color:#52606d;width:140px;">Invoice number</td>
                    <td style="padding:8px 0;font-weight:600;">${escapeHtml(invoice.invoice_number)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#52606d;">Date</td>
                    <td style="padding:8px 0;">${escapeHtml(invoiceDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#52606d;">Customer</td>
                    <td style="padding:8px 0;">${escapeHtml(invoice.customer_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#52606d;vertical-align:top;">Address</td>
                    <td style="padding:8px 0;white-space:pre-line;">${escapeHtml(invoice.customer_address)}</td>
                  </tr>
                </table>

                <div style="background:#f7f4ef;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                  <div style="font-size:13px;color:#52606d;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Work completed</div>
                  <div style="white-space:pre-line;line-height:1.6;">${escapeHtml(invoice.work_description)}</div>
                </div>

                <div style="text-align:right;font-size:28px;font-weight:700;color:#1b3a4b;">${escapeHtml(amount)}</div>

                <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#52606d;">
                  If you have any questions about this invoice, please reply to this email or call ${escapeHtml(businessPhone)}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#efeae2;color:#52606d;font-size:14px;">
                ${escapeHtml(businessName)} · ${escapeHtml(businessEmail)} · ${escapeHtml(businessPhone)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function requireAuth(request, env) {
  const session = await readSession(request, env);
  if (!session) {
    return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  }
  return { ok: true };
}

async function readSession(request, env) {
  if (!env.SESSION_SECRET) {
    return null;
  }

  const cookie = getCookie(request, SESSION_COOKIE);
  if (!cookie) {
    return null;
  }

  const [payloadB64, signature] = cookie.split(".");
  if (!payloadB64 || !signature) {
    return null;
  }

  const expected = await sign(payloadB64, env.SESSION_SECRET);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(payloadB64));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function createSessionToken(env) {
  const payload = {
    sub: "admin",
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = btoa(JSON.stringify(payload));
  const signature = await sign(payloadB64, env.SESSION_SECRET);
  return `${payloadB64}.${signature}`;
}

async function sign(value, secret) {
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
    new TextEncoder().encode(value)
  );
  return arrayBufferToHex(signature);
}

function buildSessionCookie(token, requestUrl) {
  const secure = new URL(requestUrl).protocol === "https:" ? " Secure;" : "";
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=${maxAge}`;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}

function cleanText(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "";
  }
  return email.slice(0, 254);
}

function parseAmountPence(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value).replace(/£/g, "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const pounds = Number.parseFloat(normalized);
  if (Number.isNaN(pounds)) {
    return null;
  }

  return Math.round(pounds * 100);
}

function formatMoney(amountPence) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoString));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function timingSafeEqual(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
