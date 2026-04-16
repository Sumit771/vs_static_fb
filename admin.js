const byId = (id) => document.getElementById(id);
window.byId = byId;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function extractImageUrl(text) {
  if (!text) return "";
  // Detect [img]...[/img] tags
  const match = text.match(/\[img\](.*?)\[\/img\]/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

function isValidInstagramReelUrl(url) {
  if (!url) return false;
  // Standardize URL and handle various formats: /reel/ID, /reels/ID, /p/ID
  return /instagram\.com\/(?:reels?|p)\/[A-Za-z0-9_-]+/.test(url);
}

function getInstagramEmbedUrl(url) {
  if (!url) return '';
  const cleanUrl = url.split('?')[0].split('#')[0];
  const match = cleanUrl.match(/\/(?:reels?|p)\/([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed/`;
  }
  return '';
}

window.updateReelPreview = function() {
  const urlInput = byId("modal-reel-url");
  const previewContainer = byId("reel-preview-container");
  const errorContainer = byId("preview-error");
  if (!urlInput || !previewContainer || !errorContainer) return;

  const url = urlInput.value.trim();
  const embedUrl = getInstagramEmbedUrl(url);

  if (embedUrl) {
    previewContainer.style.display = "block";
    previewContainer.classList.add("reels-loading");
    errorContainer.style.display = "none";
    previewContainer.innerHTML = `
      <iframe 
        src="${embedUrl}" 
        class="w-full h-full" 
        frameborder="0" 
        scrolling="no" 
        allowtransparency="true" 
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        onload="this.parentElement.classList.remove('reels-loading'); this.classList.add('loaded');">
      </iframe>
    `;
  } else if (url.length > 10) {
    previewContainer.style.display = "none";
    errorContainer.style.display = "block";
    errorContainer.textContent = "Please enter a valid Instagram Reel URL (e.g. https://www.instagram.com/reel/...)";
  } else {
    previewContainer.style.display = "none";
    errorContainer.style.display = "none";
  }
};

// ─── CSRF Token (Fix #5) ──────────────────────────────────────────────────────
// Cached per page-load; refreshed after login.
let _csrfToken = null;

async function getCsrfToken() {
  if (_csrfToken) return _csrfToken;
  try {
    const res = await fetch("/api/csrf-token", { credentials: "include" });
    const data = await res.json();
    _csrfToken = data.csrfToken || null;
  } catch (_e) {
    _csrfToken = null;
  }
  return _csrfToken;
}

function setCsrfToken(token) {
  _csrfToken = token || null;
}

// Wrapper: adds CSRF header to mutating requests automatically
async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = { ...(options.headers || {}) };

  if (mutating) {
    const token = await getCsrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers
  });
}

let currentSettings = null;
let currentContacts = [];
let currentServices = [];
let currentPortfolioItems = [];
let currentReelsItems = [];
let currentTestimonials = [];
let currentPortfolioCategories = [];
let lastActiveIconInput = null;

const curatedIcons = [
  // DESIGN & CREATIVE
  { class: "fa-solid fa-pen-nib", name: "Pen Nib", cat: "creative" },
  { class: "fa-solid fa-palette", name: "Palette", cat: "creative" },
  { class: "fa-solid fa-bezier-curve", name: "Bezier", cat: "creative" },
  { class: "fa-solid fa-crop-simple", name: "Crop", cat: "creative" },
  { class: "fa-solid fa-wand-magic-sparkles", name: "AI Magic", cat: "creative" },
  { class: "fa-solid fa-layer-group", name: "Layers", cat: "creative" },
  { class: "fa-solid fa-paint-roller", name: "Branding", cat: "creative" },
  { class: "fa-solid fa-vector-square", name: "Vector", cat: "creative" },
  { class: "fa-solid fa-swatchbook", name: "Colors", cat: "creative" },

  // DIGITAL & WEB
  { class: "fa-solid fa-desktop", name: "Desktop", cat: "digital" },
  { class: "fa-solid fa-mobile-screen-button", name: "Mobile", cat: "digital" },
  { class: "fa-solid fa-laptop-code", name: "Development", cat: "digital" },
  { class: "fa-solid fa-code", name: "Coding", cat: "digital" },
  { class: "fa-solid fa-window-maximize", name: "UI Design", cat: "digital" },
  { class: "fa-solid fa-gauge-high", name: "Speed", cat: "digital" },
  { class: "fa-solid fa-shield-halved", name: "Secure", cat: "digital" },

  // MEDIA & CINEMATIC
  { class: "fa-solid fa-camera", name: "Camera", cat: "media" },
  { class: "fa-solid fa-film", name: "Film/Reel", cat: "media" },
  { class: "fa-solid fa-clapperboard", name: "Clapper", cat: "media" },
  { class: "fa-solid fa-play", name: "Play", cat: "media" },
  { class: "fa-solid fa-music", name: "Music", cat: "media" },
  { class: "fa-solid fa-headphones", name: "Audio", cat: "media" },
  { class: "fa-solid fa-photo-film", name: "Visuals", cat: "media" },
  { class: "fa-solid fa-sliders", name: "Editing", cat: "media" },
  { class: "fa-solid fa-bolt", name: "Effects", cat: "media" },

  // SOCIAL & PROMO
  { class: "fa-brands fa-instagram", name: "Instagram", cat: "social" },
  { class: "fa-brands fa-youtube", name: "YouTube", cat: "social" },
  { class: "fa-brands fa-tiktok", name: "TikTok", cat: "social" },
  { class: "fa-brands fa-facebook", name: "Facebook", cat: "social" },
  { class: "fa-brands fa-twitter", name: "Twitter/X", cat: "social" },
  { class: "fa-solid fa-hashtag", name: "Hashtag", cat: "social" },
  { class: "fa-solid fa-bullhorn", name: "Marketing", cat: "social" },
  { class: "fa-solid fa-share-nodes", name: "Sharing", cat: "social" },
  { class: "fa-solid fa-at", name: "Mention", cat: "social" },

  // PRINT & BUSINESS
  { class: "fa-solid fa-print", name: "Print", cat: "business" },
  { class: "fa-solid fa-address-card", name: "Card", cat: "business" },
  { class: "fa-solid fa-newspaper", name: "Magazine", cat: "business" },
  { class: "fa-solid fa-envelope", name: "Email", cat: "business" },
  { class: "fa-solid fa-rocket", name: "Launch", cat: "business" },
  { class: "fa-solid fa-briefcase", name: "Work", cat: "business" },
  { class: "fa-solid fa-star", name: "Award", cat: "business" },
  { class: "fa-solid fa-gem", name: "Premium", cat: "business" },
  { class: "fa-solid fa-handshake", name: "Client", cat: "business" }
];

let iconSearchQuery = "";
let iconActiveCategory = "all";

/* ==========================================================================
   ICON GUIDE / STUDIO ASSET LIBRARY LOGIC
   ========================================================================== */
window.openIconGuide = function(targetInputId) {
  lastActiveIconInput = targetInputId;
  const grid = document.getElementById("iconGrid");
  const modal = document.getElementById("iconGuideModal");
  if (!grid || !modal) return;
  
  // Reset explorer state
  const searchInput = document.getElementById("iconSearchInput");
  if (searchInput) searchInput.value = "";
  iconSearchQuery = "";
  iconActiveCategory = "all";
  document.querySelectorAll("[data-icon-cat]").forEach(b => b.classList.toggle("active", b.dataset.iconCat === "all"));
  
  window.renderIconGrid();
  modal.showModal();
};

window.closeIconGuide = function() {
  document.getElementById("iconGuideModal")?.close();
};

window.renderIconGrid = function() {
  const grid = document.getElementById("iconGrid");
  if (!grid) return;

  const filtered = curatedIcons.filter(icon => {
    const matchesSearch = (icon.name + " " + icon.class).toLowerCase().includes(iconSearchQuery);
    const matchesCat = iconActiveCategory === "all" || icon.cat === iconActiveCategory;
    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-light); font-weight: 500;">No icons found matching your search.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(icon => `
    <div class="icon-card" data-icon-class="${icon.class}">
      <i class="${icon.class}"></i>
      <span>${icon.name}</span>
    </div>
  `).join("");
};

window.selectIcon = function(iconClass) {
  if (lastActiveIconInput) {
    const input = document.getElementById(lastActiveIconInput);
    if (input) {
      input.value = iconClass;
      input.style.borderColor = "var(--primary)";
      // Premium Pulse Animation
      input.animate([
        { boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.4)' },
        { boxShadow: '0 0 0 10px rgba(139, 92, 246, 0)' }
      ], { duration: 600 });
      setTimeout(() => input.style.borderColor = "", 1000);
    }
  }
  window.closeIconGuide();
};

// Global Event Delegation for Icon Selection
document.addEventListener("click", (e) => {
  const iconCard = e.target.closest(".icon-card");
  if (iconCard && iconCard.dataset.iconClass) {
    window.selectIcon(iconCard.dataset.iconClass);
  }
});

// Initialization of Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Search input
    document.getElementById("iconSearchInput")?.addEventListener("input", (e) => {
        iconSearchQuery = e.target.value.toLowerCase();
        window.renderIconGrid();
    });

    // Category Buttons
    document.addEventListener("click", (e) => {
      const catBtn = e.target.closest("[data-icon-cat]");
      if (catBtn) {
        document.querySelectorAll("[data-icon-cat]").forEach(b => b.classList.remove("active"));
        catBtn.classList.add("active");
        iconActiveCategory = catBtn.dataset.iconCat;
        window.renderIconGrid();
      }
    });

    // Wire up the trigger buttons
    document.getElementById("showIconGuideBtn")?.addEventListener("click", (e) => { e.preventDefault(); window.openIconGuide("modal-icon"); });
    document.getElementById("showIconGuideBtnPort")?.addEventListener("click", (e) => { e.preventDefault(); window.openIconGuide("newCategoryIcon"); });
    document.getElementById("closeIconGuideBtn")?.addEventListener("click", (e) => { e.preventDefault(); window.closeIconGuide(); });
    document.getElementById("statusModalCloseBtn")?.addEventListener("click", () => { byId("statusModal").close(); });
});

function setStatus(message, isError = false) {
  const modal = byId("statusModal");
  const icon = byId("statusIcon");
  const title = byId("statusTitle");
  const msg = byId("statusMessage");
  
  if (!modal || !icon || !title || !msg) {
    console.error("Status modal elements not found!");
    return;
  }

  // Set the visual state
  modal.classList.remove("success", "error");
  modal.classList.add(isError ? "error" : "success");
  
  title.textContent = isError ? "Error Occurred" : "Action Success";
  icon.innerHTML = isError ? '<i class="fa-solid fa-circle-xmark"></i>' : '<i class="fa-solid fa-circle-check"></i>';
  msg.textContent = message;

  modal.showModal();

  // Auto-close if successful
  if (!isError) {
    setTimeout(() => {
      if (modal.open) modal.close();
    }, 2800);
  }
}

function parseJsonField(id, fieldName) {
  const raw = byId(id).value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON array.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid ${fieldName}: ${error.message}`);
  }
}

function updateOverviewMetrics() {
  const servicesCount = byId("servicesCount");
  if (servicesCount) servicesCount.textContent = currentServices.length;

  const reelsCount = byId("reelsCount");
  if (reelsCount) reelsCount.textContent = currentReelsItems.length;

  const portfolioCount = byId("portfolioCount");
  if (portfolioCount) portfolioCount.textContent = currentPortfolioItems.length;

  const testimonialsCount = byId("testimonialsCount");
  if (testimonialsCount) testimonialsCount.textContent = currentTestimonials.length;
}

function setRawJsonEditors() {
  const servicesTextarea = byId("services");
  const portfolioTextarea = byId("portfolioItems");
  const reelsTextarea = byId("reelsItems");
  if (servicesTextarea) {
    servicesTextarea.value = JSON.stringify(currentServices, null, 2);
  }
  if (portfolioTextarea) {
    portfolioTextarea.value = JSON.stringify(currentPortfolioItems, null, 2);
  }
  if (reelsTextarea) {
    reelsTextarea.value = JSON.stringify(currentReelsItems, null, 2);
  }
  const testimonialsTextarea = byId("testimonials");
  if (testimonialsTextarea) {
    testimonialsTextarea.value = JSON.stringify(currentTestimonials, null, 2);
  }
  const categoriesTextarea = byId("portfolioCategories");
  if (categoriesTextarea) {
    categoriesTextarea.value = JSON.stringify(currentPortfolioCategories, null, 2);
  }
}

function renderPortfolioCategories() {
  const list = byId("categoriesList");
  if (!list) return;

  const getString = (val, fallback) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.label) return getString(val.label, fallback);
    return val ? String(val) : fallback;
  };

  list.innerHTML = currentPortfolioCategories.map((cat, index) => {
    const label = getString(cat?.label || cat, "Unnamed");
    const icon = getString(cat?.icon, "fa-solid fa-star");
    const subs = Array.isArray(cat?.subCategories) ? cat.subCategories : [];

    return `
      <div class="category-group-card" style="background: var(--card-bg); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="${escapeHtml(icon)}"></i>
            <strong style="font-size: 1.1rem;">${escapeHtml(label)}</strong>
          </div>
          <i class="fa-solid fa-trash" style="cursor: pointer; color: var(--text-light); margin-left: auto;" data-action="removePortfolioCategory" data-index="${index}"></i>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
          ${subs.map(sub => `<span style="font-size: 0.8rem; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 4px;">${escapeHtml(getString(sub, ""))}</span>`).join("")}
        </div>
      </div>
    `;
  }).join("");
  setRawJsonEditors();
}

window.addPortfolioCategory = async function () {
  const nameInput = byId("newCategoryInput");
  const iconInput = byId("newCategoryIcon");
  const subsInput = byId("newSubCategories");
  
  const name = nameInput.value.trim();
  const icon = iconInput.value.trim() || "fa-solid fa-star";
  const subs = subsInput.value.split("\n").map(s => s.trim()).filter(Boolean);

  if (name) {
    currentPortfolioCategories.push({ label: name, icon, subCategories: subs });
    nameInput.value = "";
    iconInput.value = "";
    subsInput.value = "";
    renderPortfolioCategories();
    await saveSettings();
  }
};

window.removePortfolioCategory = async function (index) {
  if (!confirm("Delete this category and all its settings?")) return;
  currentPortfolioCategories.splice(index, 1);
  renderPortfolioCategories();
  await saveSettings();
};

function renderServicesEditor() {
  const container = byId("servicesEditor");
  if (!container) return;
  container.innerHTML = `<div class="crud-list">` + currentServices
    .map(
      (service, index) => `
      <div class="crud-list-item">
        <div class="crud-item-content">
          <div class="crud-item-icon"><i class="${escapeHtml(service.icon)}"></i></div>
          <div class="crud-item-details">
            <h4>${escapeHtml(service.title)}</h4>
            <p>${escapeHtml(service.description)}</p>
          </div>
        </div>
        <div class="crud-item-actions">
          <button type="button" class="secondary-btn" data-action="openCrudModal" data-type="service" data-index="${index}">Edit</button>
          <button type="button" class="secondary-btn danger" data-action="removeService" data-index="${index}">Delete</button>
        </div>
      </div>
    `
    )
    .join("") + `</div>`;
  setRawJsonEditors();
}

function renderPortfolioEditor() {
  const container = byId("portfolioEditor");
  if (!container) return;
  container.innerHTML = `<div class="crud-list">` + currentPortfolioItems
    .map(
      (item, index) => `
      <div class="crud-list-item">
        <div class="crud-item-content">
          <img src="${escapeHtml(item.image)}" class="crud-item-thumb" alt="Thumb" onerror="this.style.display='none'" />
          <div class="crud-item-details">
            <h4>${escapeHtml(item.category)}</h4>
            <p>${escapeHtml(item.alt)}</p>
          </div>
        </div>
        <div class="crud-item-actions">
          <button type="button" class="secondary-btn" data-action="openCrudModal" data-type="portfolio" data-index="${index}">Edit</button>
          <button type="button" class="secondary-btn danger" data-action="removePortfolioItem" data-index="${index}">Delete</button>
        </div>
      </div>
    `
    )
    .join("") + `</div>`;
  setRawJsonEditors();
}

function renderReelsEditor() {
  const container = byId("reelsEditor");
  if (!container) return;
  container.innerHTML = `<div class="crud-list">` + currentReelsItems
    .map(
      (item, index) => `
      <div class="crud-list-item">
        <div class="crud-item-content">
          <div class="crud-item-icon" style="background:var(--icon-orange)"><i class="fa-brands fa-instagram"></i></div>
          <div class="crud-item-details">
            <h4>${escapeHtml(item.title || `Reel ${index + 1}`)}</h4>
            <p style="font-family: monospace; font-size: 0.8rem; color: var(--primary);">${escapeHtml(item.image)}</p>
          </div>
        </div>
        <div class="crud-item-actions">
          <button type="button" class="secondary-btn" data-action="openCrudModal" data-type="reel" data-index="${index}">Edit</button>
          <button type="button" class="secondary-btn danger" data-action="removeReelItem" data-index="${index}">Delete</button>
        </div>
      </div>
    `
    )
    .join("") + `</div>`;
  setRawJsonEditors();
}

function renderTestimonialsEditor() {
  const container = byId("testimonialsEditor");
  if (!container) return;
  container.innerHTML = `<div class="crud-list">` + currentTestimonials
    .map(
      (item, index) => `
      <div class="crud-list-item">
        <div class="crud-item-content">
          <div class="crud-item-icon" style="background:var(--icon-green); padding:0; overflow:hidden;">
            ${item.image 
              ? `<img src="${escapeHtml(item.image)}" style="width: 100%; hieght: 100%; object-fit: cover;" />` 
              : `<i class="fa-solid fa-star"></i>`}
          </div>
          <div class="crud-item-details">
            <h4>${escapeHtml(item.name)} (${item.rating}/5)</h4>
            <p>"${escapeHtml(item.quote)}"</p>
          </div>
        </div>
        <div class="crud-item-actions">
          <button type="button" class="secondary-btn" data-action="openCrudModal" data-type="testimonial" data-index="${index}">Edit</button>
          <button type="button" class="secondary-btn danger" data-action="removeTestimonial" data-index="${index}">Delete</button>
        </div>
      </div>
    `
    )
    .join("") + `</div>`;
  setRawJsonEditors();
}

function addService() { openCrudModal('service', -1); }
function addPortfolioItem() { openCrudModal('portfolio', -1); }
function addReelItem() { openCrudModal('reel', -1); }
function addTestimonial() { openCrudModal('testimonial', -1); }

function updateServiceField(index, field, value) {
  if (!currentServices[index]) return;
  currentServices[index][field] = value;
  setRawJsonEditors();
}

function updatePortfolioField(index, field, value) {
  if (!currentPortfolioItems[index]) return;
  currentPortfolioItems[index][field] = value;
  setRawJsonEditors();
}

function updateReelField(index, field, value) {
  if (!currentReelsItems[index]) return;
  currentReelsItems[index][field] = value;
  setRawJsonEditors();
}

function updateTestimonialField(index, field, value) {
  if (!currentTestimonials[index]) return;
  currentTestimonials[index][field] = value;
  setRawJsonEditors();
}

async function removeService(index) {
  if (!confirm("Delete this service?")) return;
  currentServices.splice(index, 1);
  renderServicesEditor();
  updateOverviewMetrics();
  await saveSettings();
}

async function removePortfolioItem(index) {
  if (!confirm("Delete this portfolio item?")) return;
  currentPortfolioItems.splice(index, 1);
  renderPortfolioEditor();
  updateOverviewMetrics();
  await saveSettings();
}

async function removeReelItem(index) {
  if (!confirm("Delete this reel?")) return;
  currentReelsItems.splice(index, 1);
  renderReelsEditor();
  updateOverviewMetrics();
  await saveSettings();
}

async function removeTestimonial(index) {
  if (!confirm("Delete this testimonial?")) return;
  currentTestimonials.splice(index, 1);
  renderTestimonialsEditor();
  updateOverviewMetrics();
  await saveSettings();
}

// Fix #9: no more double-confirm — removed the redundant wrapper confirm;
// now directly invokes the delete logic (removeService already confirms).
function removeServiceFromPreview(index) {
  const service = currentServices[index];
  if (!service) return;
  removeService(index).then(() => {
    renderDashboardPreview(currentSettings);
    setStatus("Service removed.");
  });
}

window.addService = addService;
window.addPortfolioItem = addPortfolioItem;
window.addReelItem = addReelItem;
window.addTestimonial = addTestimonial;
window.updateServiceField = updateServiceField;
window.updatePortfolioField = updatePortfolioField;
window.updateReelField = updateReelField;
window.updateTestimonialField = updateTestimonialField;
window.removeService = removeService;
window.removePortfolioItem = removePortfolioItem;
window.removeReelItem = removeReelItem;
window.removeTestimonial = removeTestimonial;
window.removeServiceFromPreview = removeServiceFromPreview;

let currentEditType = "";
let currentEditIndex = -1;

function openCrudModal(type, index) {
  currentEditType = type;
  currentEditIndex = index;

  const modal = byId("crudModal");
  const title = byId("crudModalTitle");
  const body = byId("crudModalBody");

  let html = "";

  if (type === "service") {
    title.textContent = index === -1 ? "Add Service" : "Edit Service";
    const item = index === -1 ? { icon: "fa-solid fa-star", title: "", description: "", image: "" } : currentServices[index];
    html = `
      <div class="item-row">
        <label>Icon Class (FontAwesome)</label>
        <input id="modal-icon" value="${escapeHtml(item.icon)}" />
      </div>
      <div class="item-row">
        <label>Title</label>
        <input id="modal-title" value="${escapeHtml(item.title)}" />
      </div>
      <div class="item-row">
        <label>Description</label>
        <textarea id="modal-desc" rows="3">${escapeHtml(item.description)}</textarea>
      </div>
      <div class="item-row">
        <label>Illustration Image URL</label>
        <input id="modal-service-img" value="${escapeHtml(item.image || "")}" placeholder="https://images.unsplash.com/..." />
      </div>
    `;
  } else if (type === "portfolio") {
    title.textContent = index === -1 ? "Add Portfolio Item" : "Edit Portfolio Item";
    const item = index === -1 ? { category: "", subCategory: "", image: "", alt: "" } : currentPortfolioItems[index];

    const currentCatObj = currentPortfolioCategories.find(c => c.label === item.category);
    const subOptions = currentCatObj ? currentCatObj.subCategories : [];

    html = `
      <div class="item-row">
        <label>Main Category</label>
        <select id="modal-cat" class="modal-select">
          <option value="">Select Category</option>
          ${currentPortfolioCategories.map(c => `<option value="${escapeHtml(c.label)}" ${item.category === c.label ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join("")}
        </select>
      </div>
      <div class="item-row">
        <label>Sub Category</label>
        <select id="modal-sub-cat" class="modal-select">
          ${subOptions.map(s => `<option value="${escapeHtml(s)}" ${item.subCategory === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join("")}
        </select>
      </div>
      <div class="item-row">
        <label>Image URL</label>
        <input id="modal-img" value="${escapeHtml(item.image)}" />
      </div>
      <div class="item-row">
        <label>Project Title</label>
        <input id="modal-title" value="${escapeHtml(item.title || "")}" />
      </div>
      <div class="item-row">
        <label>Image Alt Description</label>
        <input id="modal-alt" value="${escapeHtml(item.alt || "")}" />
      </div>
    `;
  } else if (type === "reel") {
    title.textContent = index === -1 ? "Add Instagram Reel" : "Edit Instagram Reel";
    const item = index === -1 ? { image: "", alt: "" } : currentReelsItems[index];
    html = `
      <div class="item-row">
        <label>Instagram Reel Link</label>
        <input id="modal-reel-url" placeholder="e.g. https://www.instagram.com/reel/Cqxxxxx/" value="${escapeHtml(item.image)}" />
        <small style="color:var(--text-light);margin-top:4px;display:block;">Must be a valid https://www.instagram.com/reel/... URL.</small>
      </div>
      <div id="preview-error" class="preview-error"></div>
      <div id="reel-preview-container" class="reel-preview-container"></div>
      <div class="item-row">
        <label>Reel Title</label>
        <input id="modal-title" value="${escapeHtml(item.title || "")}" />
      </div>
      <div class="item-row">
        <label>Accessibility Alt Text</label>
        <input id="modal-alt" value="${escapeHtml(item.alt || "")}" />
      </div>
    `;
    // Trigger initial preview if editing
    setTimeout(() => window.updateReelPreview(), 100);
  } else if (type === "testimonial") {
    title.textContent = index === -1 ? "Add Testimonial" : "Edit Testimonial";
    const item = index === -1 ? { name: "", quote: "", rating: 5 } : currentTestimonials[index];
    html = `
      <div class="item-row">
        <label>Client Name</label>
        <input id="modal-name" value="${escapeHtml(item.name)}" />
      </div>
      <div class="item-row">
        <label>Quote</label>
        <textarea id="modal-quote" rows="3">${escapeHtml(item.quote)}</textarea>
      </div>
      <div class="item-row">
        <label>Client Image URL</label>
        <input id="modal-testimonial-img" value="${escapeHtml(item.image || "")}" placeholder="e.g. ImgBB direct link" />
      </div>
      <div class="item-row">
        <label>Rating (1-5)</label>
        <input type="number" id="modal-rating" min="1" max="5" value="${escapeHtml(item.rating)}" />
      </div>
    `;
  }

  body.innerHTML = html;
  modal.showModal();
}
window.openCrudModal = openCrudModal;

function closeCrudModal() {
  byId("crudModal").close();
}
window.closeCrudModal = closeCrudModal;

window.updateSubCategoryOptions = function (categoryLabel) {
  const subCatSelect = byId("modal-sub-cat");
  if (!subCatSelect) return;
  
  if (!categoryLabel) {
    subCatSelect.innerHTML = '<option value="">Select a sub-category</option>';
    return;
  }

  const catObj = currentPortfolioCategories.find(c => c.label === categoryLabel);
  const options = catObj ? catObj.subCategories : [];
  
  if (options.length === 0) {
    subCatSelect.innerHTML = '<option value="">No sub-categories available</option>';
  } else {
    subCatSelect.innerHTML = options.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  }
};

async function saveCrudItem() {
  if (currentEditType === "service") {
    const item = {
      icon: byId("modal-icon").value.trim(),
      title: byId("modal-title").value.trim(),
      description: byId("modal-desc").value.trim(),
      image: extractImageUrl(byId("modal-service-img").value)
    };
    if (currentEditIndex === -1) currentServices.push(item);
    else currentServices[currentEditIndex] = item;
    renderServicesEditor();
  } else if (currentEditType === "portfolio") {
    const item = {
      category: byId("modal-cat").value.trim(),
      subCategory: byId("modal-sub-cat").value.trim(),
      image: extractImageUrl(byId("modal-img").value),
      title: byId("modal-title").value.trim(),
      alt: byId("modal-alt").value.trim()
    };
    if (currentEditIndex === -1) currentPortfolioItems.push(item);
    else currentPortfolioItems[currentEditIndex] = item;
    renderPortfolioEditor();
  } else if (currentEditType === "reel") {
    const reelUrl = byId("modal-reel-url").value.trim();
    // Fix #2: enforce valid Instagram reel URL on the client before saving
    if (reelUrl && !isValidInstagramReelUrl(reelUrl)) {
      setStatus("Reel URL must be a valid https://www.instagram.com/reel/... link.", true);
      return;
    }
    const item = {
      image: reelUrl,
      title: byId("modal-title").value.trim(),
      alt: byId("modal-alt").value.trim()
    };
    if (currentEditIndex === -1) currentReelsItems.push(item);
    else currentReelsItems[currentEditIndex] = item;
    renderReelsEditor();
  } else if (currentEditType === "testimonial") {
    const item = {
      name: byId("modal-name").value.trim(),
      quote: byId("modal-quote").value.trim(),
      image: extractImageUrl(byId("modal-testimonial-img").value),
      rating: Number(byId("modal-rating").value) || 5
    };
    if (currentEditIndex === -1) currentTestimonials.push(item);
    else currentTestimonials[currentEditIndex] = item;
    renderTestimonialsEditor();
  }

  updateOverviewMetrics();
  closeCrudModal();
  await saveSettings();
}
window.saveCrudItem = saveCrudItem;

function renderDashboardPreview(settings) {
  const servicePreviewList = byId("servicePreviewList");
  const reelsPreviewList = byId("reelsPreviewList");
  const messagePreviewList = byId("messagePreviewList");
  const aboutSummaryImage = byId("aboutSummaryImage");
  const summaryYearsExperience = byId("summaryYearsExperience");
  const summaryClientsCount = byId("summaryClientsCount");

  if (servicePreviewList) {
    servicePreviewList.innerHTML = (currentServices || []).slice(0, 2)
      .map(
        (service, index) => `
          <div class="preview-item">
            <strong>${escapeHtml(service.title)}</strong>
            <div class="item-actions">
              <button type="button" class="secondary-btn" data-action="activateTab" data-tab="servicesTab">Edit</button>
              <button type="button" class="secondary-btn danger" data-action="removeServiceFromPreview" data-index="${index}">Delete</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  if (reelsPreviewList) {
    reelsPreviewList.innerHTML = (currentReelsItems || []).slice(0, 2)
      .map(
        (_item, index) => `
          <div class="reel-preview-card" style="background: var(--card-bg); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; position: relative;">
            <i class="fa-brands fa-instagram" style="font-size: 3rem; color: var(--text-light); opacity: 0.5;"></i>
            <div class="reel-preview-footer">
              <span class="reel-label">Reel ${index + 1}</span>
              <button class="secondary-btn" type="button" data-action="activateTab" data-tab="reelsTab">Edit</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  if (messagePreviewList) {
    messagePreviewList.innerHTML = (currentContacts || []).slice(0, 3)
      .map(
        (contact) => `
          <div class="message-item">
            <p>
              <strong>${escapeHtml(contact.name)}:</strong>
              <span>${escapeHtml(contact.message.slice(0, 50))}${contact.message.length > 50 ? "…" : ""
          }</span>
            </p>
          </div>
        `
      )
      .join("");
  }

  // Fix #12: only set the image src if it passes a basic URL validity check
  if (aboutSummaryImage && settings?.about?.image) {
    try {
      const u = new URL(settings.about.image);
      if (u.protocol === "https:" || u.protocol === "http:") {
        aboutSummaryImage.src = settings.about.image;
      }
    } catch (_e) { /* invalid URL — leave existing src */ }
  }
  if (summaryYearsExperience) {
    summaryYearsExperience.textContent = settings?.about?.yearsExperience || "0+";
  }
  if (summaryClientsCount) {
    summaryClientsCount.textContent = settings?.about?.clientsCount || "0+";
  }
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON response from server (${res.status}): ${text.slice(0, 200)}`);
  }
}

function fillForm(settings) {
  byId("email").value = settings?.contact?.email || "";
  byId("location").value = settings?.contact?.location || "";
  byId("whatsappNumber").value = settings?.contact?.whatsappNumber || "";
  byId("instagram").value = settings?.socialLinks?.instagram || "";
  byId("youtube").value = settings?.socialLinks?.youtube || "";
  byId("linkedin").value = settings?.socialLinks?.linkedin || "";
  byId("ownerImage").value = settings?.hero?.ownerImage || "";
  byId("heroTitle").value = settings?.hero?.title || "";
  byId("heroTaglineHero").value = settings?.hero?.taglineHero || "";
  byId("heroDemoImages").value = (settings?.hero?.demoImages || []).join("\n");
  byId("aboutImage").value = settings?.about?.image || "";
  byId("aboutText").value = settings?.about?.text || "";
  byId("yearsExperience").value = settings?.about?.yearsExperience || "";
  byId("clientsCount").value = settings?.about?.clientsCount || "";
  byId("skills").value = (settings?.about?.skills || []).join(", ");
  byId("siteTitle").value = settings?.siteInfo?.brandName || "";
  byId("brandLogo").value = settings?.siteInfo?.brandLogo || "";
  byId("favicon").value = settings?.siteInfo?.favicon || "";
  byId("siteTagline").value = settings?.siteInfo?.tagline || "";
  byId("footerText").value = settings?.siteInfo?.footerText || "";
  currentSettings = settings;
  currentServices = Array.isArray(settings?.services) ? [...settings.services] : [];
  currentPortfolioItems = Array.isArray(settings?.portfolioItems) ? [...settings.portfolioItems] : [];
  currentReelsItems = Array.isArray(settings?.reelsItems) ? [...settings.reelsItems] : [];
  currentTestimonials = Array.isArray(settings?.testimonials) ? [...settings.testimonials] : [];
  currentPortfolioCategories = Array.isArray(settings?.portfolioCategories) 
    ? settings.portfolioCategories.map(cat => {
        const getString = (val) => {
            if (typeof val === 'string') return val;
            if (val && typeof val === 'object' && val.label) return getString(val.label);
            return String(val || "");
        };

        const label = getString(cat?.label || cat);
        const icon = getString(cat?.icon || "fa-solid fa-star");
        const subs = Array.isArray(cat?.subCategories) ? cat.subCategories.map(s => getString(s)) : [];

        return { label, icon, subCategories: subs };
      })
    : [
        { label: "Posters", icon: "fa-solid fa-image", subCategories: ["Music", "Album"] },
        { label: "Social", icon: "fa-solid fa-hashtag", subCategories: ["Reels", "Posts"] }
      ];
  updateOverviewMetrics();
  renderDashboardPreview(settings);
  renderServicesEditor();
  renderPortfolioCategories();
  renderPortfolioEditor();
  renderReelsEditor();
  renderTestimonialsEditor();
}

function isValidImageUrl(value) {
  if (!value) return true; // Allow empty values for branding (optional)
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function collectPayload() {
  const ownerImage = extractImageUrl(byId("ownerImage").value);
  // Fix #11: split on both \n and \r\n (Windows line endings)
  const heroDemoImages = byId("heroDemoImages")
    .value.split(/\r?\n/)
    .map((v) => extractImageUrl(v))
    .filter(Boolean);
  const aboutImage = extractImageUrl(byId("aboutImage").value);

  if (!isValidImageUrl(ownerImage)) {
    throw new Error("Owner image URL is invalid.");
  }
  if (!isValidImageUrl(aboutImage)) {
    throw new Error("About image URL is invalid.");
  }
  for (const imageUrl of heroDemoImages) {
    if (!isValidImageUrl(imageUrl)) {
      throw new Error(`Invalid hero image URL: ${imageUrl}`);
    }
  }

  return {
    siteInfo: {
      brandName: byId("siteTitle").value.trim(),
      brandLogo: extractImageUrl(byId("brandLogo").value),
      favicon: extractImageUrl(byId("favicon").value),
      tagline: byId("siteTagline").value.trim(),
      footerText: byId("footerText").value.trim()
    },
    hero: {
      title: byId("heroTitle").value.trim(),
      taglineHero: byId("heroTaglineHero").value.trim(),
      ownerImage,
      demoImages: heroDemoImages
    },
    portfolioCategories: currentPortfolioCategories,
    services: currentServices,
    portfolioItems: currentPortfolioItems,
    reelsItems: currentReelsItems,
    testimonials: currentTestimonials,
    about: {
      image: aboutImage,
      text: byId("aboutText").value.trim(),
      skills: byId("skills")
        .value.split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      yearsExperience: byId("yearsExperience").value.trim(),
      clientsCount: byId("clientsCount").value.trim()
    },
    contact: {
      email: byId("email").value.trim(),
      location: byId("location").value.trim(),
      whatsappNumber: byId("whatsappNumber").value.trim()
    },
    socialLinks: {
      instagram: byId("instagram").value.trim(),
      youtube: byId("youtube").value.trim(),
      linkedin: byId("linkedin").value.trim()
    }
  };
}

async function loadSettings() {
  try {
    // ensure firebase loads
    await new Promise(r => setTimeout(r, 100));
    const { doc, getDoc } = window.firebaseFirestoreVars;
    const settingsRef = doc(window.firebaseDb, "settings", "main");
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      fillForm(docSnap.data() || {});
      setStatus("Settings loaded successfully from database.");
    } else {
      console.warn("No site settings found in Firebase!");
      fillForm({});
      setStatus("Settings loaded (empty).");
    }
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function saveSettings() {
  try {
    const payload = collectPayload();
    const { doc, setDoc } = window.firebaseFirestoreVars;
    const settingsRef = doc(window.firebaseDb, "settings", "main");
    await setDoc(settingsRef, payload);

    fillForm(payload);
    setStatus("Settings saved successfully to database.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadContacts() {
  try {
    const { collection, getDocs } = window.firebaseFirestoreVars;
    const querySnapshot = await getDocs(collection(window.firebaseDb, "contacts"));
    
    currentContacts = [];
    querySnapshot.forEach((docSnap) => {
      currentContacts.push({ _id: docSnap.id, ...docSnap.data() });
    });

    updateOverviewMetrics();
    renderDashboardPreview(currentSettings);
    const html = (currentContacts)
      .map(
        (c) => `
        <div class="item">
          <div class="contact-row">
            <input id="name-${escapeHtml(c._id)}" value="${escapeHtml(c.name || '')}" />
            <input id="email-${escapeHtml(c._id)}" value="${escapeHtml(c.email || '')}" />
          </div>
          <textarea id="message-${escapeHtml(c._id)}" rows="3">${escapeHtml(c.message || '')}</textarea>
          <div class="item-actions">
            <button type="button" data-action="updateContact" data-id="${escapeHtml(c._id)}">Save</button>
            <button type="button" data-action="deleteContact" data-id="${escapeHtml(c._id)}">Delete</button>
          </div>
        </div>
      `
      )
      .join("");
    byId("contactsList").innerHTML = html || "<p>No contacts found.</p>";
    setStatus("Contacts loaded successfully from database.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function updateContact(id) {
  try {
    const name = byId(`name-${id}`).value.trim();
    const email = byId(`email-${id}`).value.trim();
    const message = byId(`message-${id}`).value.trim();

    const { doc, setDoc } = window.firebaseFirestoreVars;
    await setDoc(doc(window.firebaseDb, "contacts", id), { name, email, message }, { merge: true });

    setStatus("Contact updated.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function deleteContact(id) {
  if (!confirm("Delete this contact submission?")) return;
  try {
    const { doc, deleteDoc } = window.firebaseFirestoreVars;
    await deleteDoc(doc(window.firebaseDb, "contacts", id));

    await loadContacts();
    setStatus("Contact deleted.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

window.updateContact = updateContact;
window.deleteContact = deleteContact;

function activateTab(targetId) {
  const workspaceTitle = byId("workspaceTitle");

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const isActive = btn.dataset.tab === targetId;
    btn.classList.toggle("active", isActive);
    if (isActive && workspaceTitle) {
      workspaceTitle.textContent = btn.textContent.trim();
    }
  });
  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === targetId);
  });

  // Close mobile sidebar when a tab is clicked
  const sidebar = byId("adminSidebar");
  const overlay = byId("sidebarOverlay");
  if (sidebar && sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
  }

  // Load specific tab data if necessary
  if (targetId === "trafficTab" && typeof fetchTrafficData === "function") {
    fetchTrafficData();
  }
}
window.activateTab = activateTab;

async function login(event) {
  event.preventDefault();
  const username = byId("username").value.trim();
  const password = byId("password").value.trim();
  const loginStatus = byId("loginStatus");
  try {
    const { signInWithEmailAndPassword } = window.firebaseAuthVars;
    // Note: Firebase expects an email address, so if the user types a username we could map it
    // For simplicity, we assume they enter their email. If they enter "admin", we append a dummy domain.
    const email = username.includes('@') ? username : `${username}@admin.local`;
    
    await signInWithEmailAndPassword(window.firebaseAuth, email, password);

    if (byId("adminProfileName")) {
      byId("adminProfileName").textContent = username;
    }

    loginStatus.textContent = "Login successful. Redirecting...";
    loginStatus.style.color = "#2f6a2f";
    byId("loginView").classList.add("hidden");
    byId("panelView").classList.remove("hidden");
    await loadSettings();
    await loadContacts();
  } catch (error) {
    loginStatus.textContent = `Error: ${error.message}`;
    loginStatus.style.color = "#c22b2b";
  }
}

async function logout() {
  const { signOut } = window.firebaseAuthVars;
  await signOut(window.firebaseAuth);
  byId("panelView").classList.add("hidden");
  byId("loginView").classList.remove("hidden");
}

async function initSession() {
  const { onAuthStateChanged } = window.firebaseAuthVars;
  // Use a small delay in case Firebase has cached credentials
  onAuthStateChanged(window.firebaseAuth, async (user) => {
    if (user) {
      if (byId("adminProfileName")) {
        byId("adminProfileName").textContent = user.email.split('@')[0] || "Admin";
      }
      byId("loginView").classList.add("hidden");
      byId("panelView").classList.remove("hidden");
      await loadSettings();
      await loadContacts();
    } else {
      byId("panelView").classList.add("hidden");
      byId("loginView").classList.remove("hidden");
    }
  });
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

byId("loginForm").addEventListener("submit", login);
byId("logoutBtn").addEventListener("click", logout);
byId("saveSettings")?.addEventListener("click", saveSettings);
byId("loadContacts").addEventListener("click", loadContacts);
byId("addServiceBtn")?.addEventListener("click", addService);
byId("addCategoryBtn")?.addEventListener("click", addPortfolioCategory);
byId("newCategoryInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addPortfolioCategory();
});
byId("addPortfolioBtn")?.addEventListener("click", addPortfolioItem);
byId("addReelBtn")?.addEventListener("click", addReelItem);
byId("addTestimonialBtn")?.addEventListener("click", addTestimonial);

// Wire tab buttons
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

// Wire CRUD modal buttons (no more inline onclick in HTML)
byId("crudModalCloseBtn")?.addEventListener("click", closeCrudModal);
byId("crudModalCancelBtn")?.addEventListener("click", closeCrudModal);
byId("crudModalSaveBtn")?.addEventListener("click", saveCrudItem);

// ─── Delegated event listener for dynamically-rendered data-action buttons ────
// Replaces inline onclick= attributes in rendered HTML (Fix #13 / CSP)
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const index  = el.dataset.index !== undefined ? Number(el.dataset.index) : undefined;
  const tab    = el.dataset.tab;
  const id     = el.dataset.id;
  const type   = el.dataset.type;

  switch (action) {
    case "activateTab":
      if (tab) { e.preventDefault(); activateTab(tab); }
      break;
    case "saveSettings":
      saveSettings();
      break;
    case "openCrudModal":
      if (type !== undefined && index !== undefined) openCrudModal(type, index);
      break;
    case "removeService":
      if (index !== undefined) removeService(index);
      break;
    case "removePortfolioItem":
      if (index !== undefined) removePortfolioItem(index);
      break;
    case "removeReelItem":
      if (index !== undefined) removeReelItem(index);
      break;
    case "removeTestimonial":
      if (index !== undefined) removeTestimonial(index);
      break;
    case "removeServiceFromPreview":
      if (index !== undefined) removeServiceFromPreview(index);
      break;
    case "removePortfolioCategory":
      if (index !== undefined) removePortfolioCategory(index);
      break;
    case "updateContact":
      if (id) updateContact(id);
      break;
    case "deleteContact":
      if (id) deleteContact(id);
      break;
    default:
      break;
  }
});

// Delegated change/input listeners for modal reactivity (Fix #13 / CSP)
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "modal-cat") {
    window.updateSubCategoryOptions(e.target.value);
  }
});

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "modal-reel-url") {
    window.updateReelPreview();
  }
  
  // ImgBB BBCode Auto-Extraction
  const imageFieldIds = ["ownerImage", "aboutImage", "brandLogo", "favicon", "modal-service-img", "modal-img"];
  if (e.target && imageFieldIds.includes(e.target.id)) {
    const val = e.target.value;
    if (val.includes("[img]")) {
      e.target.value = extractImageUrl(val);
    }
  }

  // Handle heroDemoImages textarea special case
  if (e.target && e.target.id === "heroDemoImages") {
    const lines = e.target.value.split(/\r?\n/);
    const cleaned = lines.map(line => extractImageUrl(line));
    if (cleaned.join("\n") !== e.target.value) {
      e.target.value = cleaned.join("\n");
    }
  }
});

// ─── Mobile Sidebar Toggle ──────────────────────────────────────────────────
const mobileMenuBtn = byId("mobileMenuBtn");
const mobileCloseBtn = byId("mobileCloseBtn");
const adminSidebar = byId("adminSidebar");
const sidebarOverlay = byId("sidebarOverlay");

function toggleSidebar() {
  if (adminSidebar) adminSidebar.classList.toggle("open");
  if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", toggleSidebar);
if (mobileCloseBtn) mobileCloseBtn.addEventListener("click", toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", toggleSidebar);

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const themeToggleBtn = byId("themeToggleBtn");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("admin-theme", newTheme);
    const icon = themeToggleBtn.querySelector("i");
    if (newTheme === "dark") {
      icon.className = "fa-solid fa-sun";
    } else {
      icon.className = "fa-solid fa-moon";
    }
  });

  // Init theme
  const savedTheme = localStorage.getItem("admin-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  const icon = themeToggleBtn.querySelector("i");
  if (savedTheme === "dark") {
    icon.className = "fa-solid fa-sun";
  } else {
    icon.className = "fa-solid fa-moon";
  }
}

// ─── Traffic Manager ──────────────────────────────────────────────────────────

const trafficTableBody = byId("trafficTableBody");
const trafficTotalCount = byId("trafficTotalCount");
const purgeTrafficBtn = byId("purgeTrafficBtn");
let currentTrafficFilter = "day";

async function fetchTrafficData() {
  if (!trafficTableBody) return;
  trafficTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-light);">Loading traffic data...</td></tr>`;
  
  try {
    const { collection, getDocs } = window.firebaseFirestoreVars;
    const querySnapshot = await getDocs(collection(window.firebaseDb, "traffic"));
    const traffic = [];
    querySnapshot.forEach(docSnap => traffic.push({ _id: docSnap.id, ...docSnap.data() }));

    if (trafficTotalCount) trafficTotalCount.textContent = traffic.length;
    if (traffic.length === 0) {
      trafficTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-light);">No traffic recorded for this period.</td></tr>`;
      return;
    }
    
    trafficTableBody.innerHTML = traffic.map(t => {
      const date = new Date(t.createdAt || Date.now()).toLocaleString();
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px;">${date}</td>
          <td style="padding: 12px; font-family: monospace;">${escapeHtml(t.ip || 'Unknown')}</td>
          <td style="padding: 12px;">${escapeHtml(t.country || 'Unknown')}</td>
          <td style="padding: 12px;">${escapeHtml(t.region || t.city || 'Unknown')}</td>
        </tr>
      `;
    }).join("");
  } catch (error) {
    console.error("Failed to load traffic", error);
    trafficTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-light);">Error loading traffic data.</td></tr>`;
  }
}

document.querySelectorAll(".traffic-filters .filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".traffic-filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTrafficFilter = btn.dataset.filter;
    // We are fetching all data in this simplified firebase version, but filter visual representation could be done here.
    fetchTrafficData();
  });
});

if (purgeTrafficBtn) {
  purgeTrafficBtn.addEventListener("click", async () => {
    const primaryConfirm = confirm("Are you sure you want to delete ALL traffic data?");
    if (!primaryConfirm) return;
    
    const secondaryConfirm = confirm("WARNING: This action is irreversible. All traffic logs will be permanently deleted. Are you absolutely sure?");
    if (!secondaryConfirm) return;
    
    try {
      const { collection, getDocs, deleteDoc, doc } = window.firebaseFirestoreVars;
      const querySnapshot = await getDocs(collection(window.firebaseDb, "traffic"));
      const deletePromises = [];
      querySnapshot.forEach(docSnap => {
        deletePromises.push(deleteDoc(doc(window.firebaseDb, "traffic", docSnap.id)));
      });
      await Promise.all(deletePromises);
      setStatus("All traffic data has been successfully purged.");
      fetchTrafficData();
    } catch (e) {
      alert("Failed to purge traffic data.");
      console.error(e);
    }
  });
}

initSession();
