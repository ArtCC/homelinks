const form = document.getElementById("app-form");
const list = document.getElementById("apps");
const empty = document.getElementById("empty");
const appId = document.getElementById("app-id");
const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");
const template = document.getElementById("app-item-template");

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `http://${trimmed}`;
}

async function fetchApps() {
  const response = await fetch("/api/apps");
  if (!response.ok) return [];
  return response.json();
}

function resetForm() {
  appId.value = "";
  formTitle.textContent = "New app";
  saveBtn.textContent = "Save";
  cancelBtn.hidden = true;
  form.reset();
}

function renderApps(apps) {
  list.innerHTML = "";
  empty.hidden = apps.length > 0;

  apps.forEach((app) => {
    const node = template.content.cloneNode(true);
    const item = node.querySelector(".app-item");
    const name = node.querySelector(".app-name");
    const link = node.querySelector(".app-url");
    const openBtn = node.querySelector(".open");
    const editBtn = node.querySelector(".edit");
    const deleteBtn = node.querySelector(".delete");

    name.textContent = app.name;
    link.textContent = app.url;
    link.href = app.url;

    openBtn.addEventListener("click", () => {
      window.open(app.url, "_blank", "noopener");
    });

    editBtn.addEventListener("click", () => {
      appId.value = app.id;
      nameInput.value = app.name;
      urlInput.value = app.url;
      formTitle.textContent = "Edit app";
      saveBtn.textContent = "Update";
      cancelBtn.hidden = false;
      nameInput.focus();
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete "${app.name}"?`)) return;
      await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
      load();
    });

    list.appendChild(item);
  });
}

async function load() {
  const apps = await fetchApps();
  renderApps(apps);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: nameInput.value.trim(),
    url: normalizeUrl(urlInput.value),
  };
  if (!payload.name || !payload.url) return;

  const id = appId.value;
  if (id) {
    await fetch(`/api/apps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  resetForm();
  load();
});

cancelBtn.addEventListener("click", () => {
  resetForm();
});

load();
