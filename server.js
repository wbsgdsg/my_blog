const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const dataPath = path.join(root, "data", "content.json");
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
}

function parseCookies(req) {
  const cookie = req.headers.cookie || "";
  return Object.fromEntries(
    cookie
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function isAuthed(req) {
  const sid = parseCookies(req).sid;
  return Boolean(sid && sessions.has(sid));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1024 * 1024) {
      throw new Error("请求内容太大");
    }
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function readContent() {
  const text = await fs.readFile(dataPath, "utf8");
  return JSON.parse(text);
}

async function writeContent(content) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  sendJson(res, 401, { error: "请先登录" });
  return false;
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/session" && req.method === "GET") {
    if (!isAuthed(req)) {
      sendJson(res, 401, { error: "未登录" });
      return;
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/login" && req.method === "POST") {
    if (!adminPassword) {
      sendJson(res, 500, { error: "服务器未设置 ADMIN_PASSWORD，后台已禁用" });
      return;
    }

    const body = await readBody(req);
    if (body.password !== adminPassword) {
      sendJson(res, 403, { error: "密码不正确" });
      return;
    }

    const sid = crypto.randomBytes(32).toString("hex");
    sessions.set(sid, Date.now());
    sendJson(res, 200, { ok: true }, {
      "Set-Cookie": `sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
    });
    return;
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    const sid = parseCookies(req).sid;
    if (sid) sessions.delete(sid);
    sendJson(res, 200, { ok: true }, {
      "Set-Cookie": "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    return;
  }

  if (pathname === "/api/works" && req.method === "POST") {
    if (!requireAuth(req, res)) return;
    const body = await readBody(req);
    const work = {
      title: cleanText(body.title, 80),
      type: cleanText(body.type, 30),
      category: ["web", "design", "code"].includes(body.category) ? body.category : "web",
      description: cleanText(body.description, 400),
      url: cleanText(body.url, 300),
      keywords: cleanText(body.keywords, 160)
    };

    if (!work.title || !work.description) {
      sendJson(res, 400, { error: "标题和描述不能为空" });
      return;
    }

    const content = await readContent();
    content.works = [work, ...(content.works || [])];
    await writeContent(content);
    sendJson(res, 201, { ok: true, work });
    return;
  }

  if (pathname === "/api/notes" && req.method === "POST") {
    if (!requireAuth(req, res)) return;
    const body = await readBody(req);
    const note = {
      date: cleanText(body.date, 20) || new Date().toISOString().slice(0, 10),
      title: cleanText(body.title, 100),
      content: cleanText(body.content, 800),
      keywords: cleanText(body.keywords, 160)
    };

    if (!note.title || !note.content) {
      sendJson(res, 400, { error: "标题和内容不能为空" });
      return;
    }

    const content = await readContent();
    content.notes = [note, ...(content.notes || [])];
    await writeContent(content);
    sendJson(res, 201, { ok: true, note });
    return;
  }

  sendJson(res, 404, { error: "接口不存在" });
}

async function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
  } catch {
    send(res, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }

    await serveStatic(req, res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "服务器错误" });
  }
});

server.listen(port, () => {
  console.log(`Blog server running at http://localhost:${port}`);
  if (!adminPassword) {
    console.log("ADMIN_PASSWORD is not set. Admin login is disabled until you set it.");
  }
});
