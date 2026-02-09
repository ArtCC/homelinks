const form = document.getElementById("app-form");
const list = document.getElementById("apps");
const empty = document.getElementById("empty");
const appId = document.getElementById("app-id");
const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("image-preview");
const previewImg = document.getElementById("preview-img");
const removePreviewBtn = document.getElementById("remove-preview");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");
const template = document.getElementById("app-item-template");
const logoutBtn = document.getElementById("logout-btn");
const formError = document.getElementById("form-error");
const searchInput = document.getElementById("search");
const countLabel = document.getElementById("count");
const pagination = document.getElementById("pagination");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

const maxImageBytes = 1 * 1024 * 1024;
const maxImageSize = 1024;
const pageSize = 10;

let allApps = [];
let currentPage = 1;
let lastImageError = "";

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
  if (response.status === 401) {
    window.location.href = "/login.html";
    return [];
  }
  if (!response.ok) return [];
  return response.json();
}

function setFormError(message) {
  formError.textContent = message;
  formError.hidden = !message;
  lastImageError = message;
}

function paginate(items) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return {
    pageItems: items.slice(start, end),
    totalPages,
  };
}

function renderPagination(totalItems, totalPages) {
  if (totalItems <= pageSize) {
    pagination.hidden = true;
    return;
  }
  pagination.hidden = false;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

function getFilteredApps() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return allApps;
  return allApps.filter((app) => app.name.toLowerCase().includes(query));
}

function resetForm() {
  appId.value = "";
  formTitle.textContent = "New app";
  saveBtn.textContent = "Save";
  cancelBtn.hidden = true;
  form.reset();
  imageInput.value = "";
  imagePreview.hidden = true;
  previewImg.src = "";
  setFormError("");
}

function renderApps(apps) {
  list.innerHTML = "";
  empty.hidden = apps.length > 0;

  apps.forEach((app) => {
    const node = template.content.cloneNode(true);
    const item = node.querySelector(".app-card");
    const thumb = node.querySelector(".app-thumbnail");
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

      // Mostrar imagen actual en el preview si existe
      if (app.image_url) {
        previewImg.src = app.image_url;
        imagePreview.hidden = false;
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      } else {
        imagePreview.hidden = true;
        previewImg.src = "";
      }

      nameInput.focus();
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete "${app.name}"?`)) return;

      deleteBtn.disabled = true;
      const originalText = deleteBtn.textContent;
      deleteBtn.textContent = "Deleting...";

      try {
        const response = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
        if (response.status === 401) {
          window.location.href = "/login.html";
          return;
        }
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          alert(data.error || "Failed to delete app");
          return;
        }
        await load();
      } catch (err) {
        console.error("Error deleting app:", err);
        alert("Network error, please try again");
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalText;
      }
    });

    list.appendChild(item);
  });

  // Renderizar iconos de Lucide en los elementos dinámicos
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function load() {
  allApps = await fetchApps();
  renderAndPaginate();
}

function renderAndPaginate() {
  const filtered = getFilteredApps();
  const { pageItems, totalPages } = paginate(filtered);
  renderApps(pageItems);
  renderPagination(filtered.length, totalPages);
  countLabel.textContent = `${filtered.length} app${filtered.length === 1 ? "" : "s"}`;
}

async function validateImageFile(file) {
  if (file.size > maxImageBytes) {
    return "Image must be <= 1MB";
  }

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise((resolve, reject) => {
      image.onload = () => resolve({ width: image.width, height: image.height });
      image.onerror = () => reject(new Error("Invalid image"));
      image.src = objectUrl;
    });

    if (dimensions.width > maxImageSize || dimensions.height > maxImageSize) {
      return "Image must be max 1024x1024";
    }
  } catch (err) {
    return "Invalid image file";
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const url = normalizeUrl(urlInput.value);
  if (!name || !url) return;
  if (lastImageError) return;

  // Deshabilitar botón y mostrar loading state
  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "Saving...";
  setFormError("");

  const payload = new FormData();
  payload.append("name", name);
  payload.append("url", url);
  if (imageInput.files[0]) {
    payload.append("image", imageInput.files[0]);
  }

  const id = appId.value;
  try {
    let response;
    if (id) {
      response = await fetch(`/api/apps/${id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      response = await fetch("/api/apps", {
        method: "POST",
        body: payload,
      });
    }

    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setFormError(data.error || "Failed to save app");
      return;
    }

    resetForm();
    await load();
  } catch (err) {
    console.error("Error saving app:", err);
    setFormError("Network error, please try again");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
});

cancelBtn.addEventListener("click", () => {
  resetForm();
});

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];
  if (!file) {
    setFormError("");
    imagePreview.hidden = true;
    return;
  }

  const message = await validateImageFile(file);
  if (message) {
    setFormError(message);
    imageInput.value = "";
    imagePreview.hidden = true;
  } else {
    setFormError("");
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imagePreview.hidden = false;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    };
    reader.readAsDataURL(file);
  }
});

removePreviewBtn.addEventListener("click", () => {
  imageInput.value = "";
  imagePreview.hidden = true;
  previewImg.src = "";
});

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderAndPaginate();
});

prevPageBtn.addEventListener("click", () => {
  currentPage = Math.max(1, currentPage - 1);
  renderAndPaginate();
});

nextPageBtn.addEventListener("click", () => {
  currentPage += 1;
  renderAndPaginate();
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login.html";
  });
}

load();
