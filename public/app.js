const form = document.getElementById("app-form");
const list = document.getElementById("apps");
const empty = document.getElementById("empty");
const appId = document.getElementById("app-id");
const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const imageInput = document.getElementById("image");
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
  imageInput.value = "";
}

function renderApps(apps) {
  list.innerHTML = "";
  empty.hidden = apps.length > 0;

  apps.forEach((app) => {
    const node = template.content.cloneNode(true);
    const item = node.querySelector(".app-item");
    const thumb = node.querySelector(".app-thumb");
    const name = node.querySelector(".app-name");
    const link = node.querySelector(".app-url");
    const openBtn = node.querySelector(".open");
    const editBtn = node.querySelector(".edit");
    const deleteBtn = node.querySelector(".delete");

    name.textContent = app.name;
    link.textContent = app.url;
    link.href = app.url;

    if (app.image_url) {
      thumb.src = app.image_url;
      thumb.hidden = false;
    } else {
      thumb.hidden = true;
    }

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
  const name = nameInput.value.trim();
  const url = normalizeUrl(urlInput.value);
  if (!name || !url) return;

  const payload = new FormData();
  payload.append("name", name);
  payload.append("url", url);
  if (imageInput.files[0]) {
    payload.append("image", imageInput.files[0]);
  }

  const id = appId.value;
  if (id) {
    await fetch(`/api/apps/${id}`, {
      method: "PUT",
      body: payload,
    });
  } else {
    await fetch("/api/apps", {
      method: "POST",
      body: payload,
    });
  }

  resetForm();
  load();
});

cancelBtn.addEventListener("click", () => {
  resetForm();
});

load();
