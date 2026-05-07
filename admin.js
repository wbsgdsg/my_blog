const loginPanel = document.querySelector("#loginPanel");
const editorPanel = document.querySelector("#editorPanel");
const loginForm = document.querySelector("#loginForm");
const workForm = document.querySelector("#workForm");
const noteForm = document.querySelector("#noteForm");
const logoutButton = document.querySelector("#logoutButton");
const statusText = document.querySelector("#statusText");

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("is-error", isError);
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }

  return data;
}

function showEditor() {
  loginPanel.hidden = true;
  editorPanel.hidden = false;
}

function showLogin() {
  loginPanel.hidden = false;
  editorPanel.hidden = true;
}

async function checkSession() {
  try {
    await api("/api/session");
    showEditor();
  } catch {
    showLogin();
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify(formToObject(loginForm))
    });
    loginForm.reset();
    showEditor();
    setStatus("登录成功。");
  } catch (error) {
    setStatus(error.message, true);
  }
});

workForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api("/api/works", {
      method: "POST",
      body: JSON.stringify(formToObject(workForm))
    });
    workForm.reset();
    setStatus("作品已保存，首页刷新后可见。");
  } catch (error) {
    setStatus(error.message, true);
  }
});

noteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api("/api/notes", {
      method: "POST",
      body: JSON.stringify(formToObject(noteForm))
    });
    noteForm.reset();
    setStatus("学习笔记已保存，首页刷新后可见。");
  } catch (error) {
    setStatus(error.message, true);
  }
});

logoutButton?.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" }).catch(() => {});
  showLogin();
});

checkSession();
