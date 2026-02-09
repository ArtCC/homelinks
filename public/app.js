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
const addAppBtn = document.getElementById("add-app-btn");
const formSection = document.getElementById("form-section");
const emptyIcon = document.getElementById("empty-icon");
const emptyMessage = document.getElementById("empty-message");
const emptyHint = document.getElementById("empty-hint");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const viewToggleBtn = document.getElementById("view-toggle-btn");
const listTemplate = document.getElementById("app-list-item-template");

const maxImageBytes = 1 * 1024 * 1024;
const maxImageSize = 1024;
const pageSize = 6;

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
  form.reset();
  imageInput.value = "";
  imagePreview.hidden = true;
  previewImg.src = "";
  setFormError("");
  formSection.hidden = true;
}

function showForm() {
  formSection.hidden = false;
  nameInput.focus();
}

function renderApps(apps) {
  list.innerHTML = "";

  // Determinar si estamos buscando
  const isSearching = searchInput.value.trim().length > 0;
  const hasApps = apps.length > 0;

  empty.hidden = hasApps;

  // Actualizar mensaje según contexto
  if (!hasApps) {
    if (isSearching) {
      emptyIcon.setAttribute("data-lucide", "search-x");
      emptyMessage.textContent = "No apps found.";
      emptyHint.textContent = "Try a different search term.";
    } else if (allApps.length === 0) {
      emptyIcon.setAttribute("data-lucide", "inbox");
      emptyMessage.textContent = "You do not have any apps yet.";
      emptyHint.innerHTML = 'Click <strong>Add app</strong> to get started!';
    }
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Determinar vista actual
  const currentView = getStoredView();
  const currentTemplate = currentView === "list" ? listTemplate : template;
  const isListView = currentView === "list";

  apps.forEach((app) => {
    const node = currentTemplate.content.cloneNode(true);

    // Selectors depending on view
    const item = node.querySelector(isListView ? ".app-list-item" : ".app-card");
    const thumb = node.querySelector(isListView ? ".list-item-thumbnail" : ".app-thumbnail");
    const name = node.querySelector(isListView ? ".list-item-name" : ".app-name");
    const link = node.querySelector(isListView ? ".list-item-url" : ".app-url");
    const openBtn = node.querySelector(".open");
    const editBtn = node.querySelector(".edit");
    const deleteBtn = node.querySelector(".delete");
    const favoriteBtn = node.querySelector(".btn-favorite");
    const starIcon = node.querySelector(".star-icon");

    name.textContent = app.name;
    link.textContent = app.url;
    link.href = app.url;

    if (app.image_url) {
      thumb.src = app.image_url;
      thumb.hidden = false;
    } else {
      thumb.hidden = true;
    }

    // Configurar estado de favorito
    if (app.favorite) {
      item.classList.add("is-favorite");
      starIcon.setAttribute("data-lucide", "star");
      starIcon.classList.add("star-filled");
    } else {
      starIcon.setAttribute("data-lucide", "star");
      starIcon.classList.remove("star-filled");
    }

    favoriteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const response = await fetch(`/api/apps/${app.id}/favorite`, { method: "PATCH" });
        if (response.status === 401) {
          window.location.href = "/login.html";
          return;
        }
        if (response.ok) {
          await load();
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    });

    openBtn.addEventListener("click", () => {
      link.click();
    });

    editBtn.addEventListener("click", () => {
      appId.value = app.id;
      nameInput.value = app.name;
      urlInput.value = app.url;
      formTitle.textContent = "Edit app";
      saveBtn.textContent = "Update";

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

      showForm();
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

addAppBtn.addEventListener("click", () => {
  showForm();
});

// Theme management
const THEMES = ["auto", "light", "dark"];
const THEME_ICONS = {
  auto: "monitor",
  light: "sun",
  dark: "moon"
};

function getStoredTheme() {
  return localStorage.getItem("theme") || "auto";
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);

  // Remove all theme classes
  document.body.classList.remove("theme-light", "theme-dark");

  // Apply theme
  if (theme === "light") {
    document.body.classList.add("theme-light");
  } else if (theme === "dark") {
    document.body.classList.add("theme-dark");
  }
  // auto = no class, uses prefers-color-scheme

  // Update icon - clear and recreate
  const iconName = THEME_ICONS[theme];
  const currentIcon = document.getElementById("theme-icon");
  if (currentIcon) {
    currentIcon.innerHTML = "";
    currentIcon.setAttribute("data-lucide", iconName);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function cycleTheme() {
  const current = getStoredTheme();
  const currentIndex = THEMES.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  const nextTheme = THEMES[nextIndex];
  setTheme(nextTheme);
}

// View management
const VIEW_MODES = ["grid", "list"];
const VIEW_ICONS = {
  grid: "grid-3x3",
  list: "list"
};

function getStoredView() {
  return localStorage.getItem("view") || "grid";
}

function setView(view) {
  localStorage.setItem("view", view);

  // Update list class
  if (view === "list") {
    list.classList.add("list-view");
  } else {
    list.classList.remove("list-view");
  }

  // Update icon
  const iconName = VIEW_ICONS[view];
  const currentIcon = document.getElementById("view-icon");
  if (currentIcon) {
    currentIcon.innerHTML = "";
    currentIcon.setAttribute("data-lucide", iconName);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Re-render apps with new view
  renderAndPaginate();
}

function cycleView() {
  const current = getStoredView();
  const currentIndex = VIEW_MODES.indexOf(current);
  const nextIndex = (currentIndex + 1) % VIEW_MODES.length;
  const nextView = VIEW_MODES[nextIndex];
  setView(nextView);
}

// Initialize theme
setTheme(getStoredTheme());

themeToggleBtn.addEventListener("click", () => {
  cycleTheme();
});

// Initialize view
setView(getStoredView());

viewToggleBtn.addEventListener("click", () => {
  cycleView();
});

load();
