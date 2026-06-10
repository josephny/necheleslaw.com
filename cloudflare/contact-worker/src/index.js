const MAX_BODY_BYTES = 20000;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function jsonResponse(body, status = 200, origin = "") {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigin(request, env) {
  const origin = (request.headers.get("Origin") || "").replace(/\/$/, "");
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

function clean(value, limit = 2000) {
  return String(value || "").replace(/\0/g, "").trim().slice(0, limit);
}

async function parseRequest(request) {
  const length = Number(request.headers.get("Content-Length") || "0");
  if (!Number.isFinite(length) || length <= 0 || length > MAX_BODY_BYTES) {
    throw new Error("Invalid request size.");
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const data = await request.json();
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, clean(value)])
    );
  }

  const form = await request.formData();
  return Object.fromEntries(
    Array.from(form.entries()).map(([key, value]) => [key, clean(value)])
  );
}

function buildEmail(fields, request, env) {
  if (clean(fields.website)) {
    throw new Error("Invalid submission.");
  }

  const firstName = clean(fields.first_name, 120);
  const lastName = clean(fields.last_name, 120);
  const name = clean(fields.name || `${firstName} ${lastName}`.trim(), 240);
  const email = clean(fields.email || fields.email_address, 320);
  const phone = clean(fields.phone, 120);
  const bestTime = clean(fields.best_time_to_call, 240);
  const message = clean(fields.message, 5000);
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "";

  if (!name) throw new Error("Please enter your name.");
  if (!email || !EMAIL_RE.test(email)) throw new Error("Please enter a valid email address.");
  if (!message) throw new Error("Please enter a message.");

  const text = [
    "Request a Consultation",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Best time to call: ${bestTime}`,
    `Source IP: ${ip}`,
    "",
    "Message:",
    message,
  ].join("\n");

  return {
    from: env.CONTACT_FROM,
    to: env.CONTACT_TO.split(",").map((value) => value.trim()).filter(Boolean),
    reply_to: email,
    subject: "NECHELESLAW.COM WEBSITE INQUIRY",
    text,
    html: text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>\n"),
  };
}

async function sendEmail(payload, env) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Email service rejected the message.");
  }
  return data;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "https://necheleslaw.com",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
          Vary: "Origin",
        },
      });
    }

    if (request.method !== "POST" || url.pathname !== "/contact-submit") {
      return jsonResponse({ ok: false, error: "Not found." }, 404, origin);
    }

    if (!origin) {
      return jsonResponse({ ok: false, error: "This origin is not allowed." }, 403);
    }

    try {
      const fields = await parseRequest(request);
      const payload = buildEmail(fields, request, env);
      await sendEmail(payload, env);
      return jsonResponse({ ok: true }, 200, origin);
    } catch (error) {
      return jsonResponse(
        { ok: false, error: error.message || "The message could not be sent." },
        400,
        origin
      );
    }
  },
};
