const API_BASE = "http://localhost:8000";

function $(sel, ctx = document) {
  return ctx.querySelector(sel);
}
function $$(sel, ctx = document) {
  return [...ctx.querySelectorAll(sel)];
}

function showToast(msg, type = "") {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className = "toast" + (type ? " toast-" + type : "");
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2800);
}

function initPasswordStrength() {
  const pw = $("#password");
  const fill = $("#pwFill");
  const hint = $("#pwHint");
  if (!pw || !fill) return;

  const levels = [
    { label: "Too short", color: "#DC2626", pct: "20%" },
    { label: "Weak", color: "#D97706", pct: "40%" },
    { label: "Fair", color: "#EAB308", pct: "60%" },
    { label: "Good", color: "#16A34A", pct: "80%" },
    { label: "Strong", color: "#15803D", pct: "100%" },
  ];

  pw.addEventListener("input", () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const lvl = v.length === 0 ? null : levels[Math.min(score, 4)];
    fill.style.width = lvl ? lvl.pct : "0";
    fill.style.background = lvl ? lvl.color : "transparent";
    if (hint) hint.textContent = lvl ? lvl.label : "";
  });
}

function initLoginForm() {
  const form = $("#loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#loginError");
    const btn = form.querySelector("button[type=submit]");
    const email = $("#email").value.trim();
    const password = $("#password").value;

    if (!email || !password) {
      err.textContent = "Please fill in all fields.";
      err.classList.add("show");
      return;
    }
    btn.textContent = "Signing in…";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "Sign In";
      btn.disabled = false;
      err.textContent = "Invalid credentials. (API not connected yet)";
      err.classList.add("show");
    }, 900);
  });
}

function initRegisterForm() {
  const form = $("#registerForm");
  if (!form) return;
  initPasswordStrength();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#registerError");
    const succ = $("#registerSuccess");
    const btn = form.querySelector("button[type=submit]");
    err.classList.remove("show");
    succ.classList.remove("show");

    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const password = $("#password").value;
    const confirm = $("#confirm").value;

    if (!name || !email || !password || !confirm) {
      err.textContent = "Please fill in all fields.";
      err.classList.add("show");
      return;
    }
    if (password.length < 8) {
      err.textContent = "Password must be at least 8 characters.";
      err.classList.add("show");
      return;
    }
    if (password !== confirm) {
      err.textContent = "Passwords do not match.";
      err.classList.add("show");
      return;
    }
    btn.textContent = "Creating account…";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "Create Account";
      btn.disabled = false;
      succ.textContent = "Account created! (API not connected yet)";
      succ.classList.add("show");
    }, 900);
  });
}

const CAT_EMOJI = { 1: "🥗", 2: "🍽", 3: "🍰", 4: "🥤" };

const TOKEN_MAP = {
  a3f8c2d1e4b7f09a6c5e2d8b1f4a7c0e3d6b9f2a5c8e1d4b7f0a3c6e9d2b5: 1,
  b7e1d4a0f3c6b9e2d5a8f1c4b7e0d3a6f9c2b5e8d1a4f7c0b3e6d9a2f5c8: 2,
  c1f5a8d2b6e9c3f7a1d4b8e2c6f0a3d7b1e5c9f2a6d0b4e8c1f5a9d3b7e0: 3,
  d4b8e1c5f9a2d6b0e3c7f1a4d8b2e6c0f3a7d1b5e9c3f7a0d4b8e2c6f0a1: 4,
  e9c2f6a3d7b1e5c9f0a4d8b2e6c1f5a9d3b7e0c4f8a1d5b9e3c7f2a6d0b4: 5,
};

function dietBadgesHtml(item) {
  const b = [];
  if (item.is_vegan)
    b.push('<span class="diet-badge diet-badge-vegan">🌱 Vegan</span>');
  if (item.is_vegetarian)
    b.push(
      '<span class="diet-badge diet-badge-vegetarian">🥬 Vegetarian</span>',
    );
  if (item.is_halal)
    b.push('<span class="diet-badge diet-badge-halal">☪ Halal</span>');
  if (item.is_gluten_free)
    b.push('<span class="diet-badge diet-badge-gf">🌾 Gluten-Free</span>');
  if (item.is_spicy)
    b.push('<span class="diet-badge diet-badge-spicy">🌶 Spicy</span>');
  return b.join("");
}

function cardImageHtml(item) {
  const emoji = CAT_EMOJI[item.category_id] ?? "🍽";
  if (!item.image_url) return `<div class="card-emoji">${emoji}</div>`;
  return `<img src="${item.image_url}" alt="${item.name}" loading="lazy" data-emoji="${emoji}">`;
}

function wireImageFallbacks() {
  $$(".menu-card-img img").forEach((img) => {
    img.addEventListener("error", () => {
      img.parentElement.innerHTML = `<div class="card-emoji">${img.dataset.emoji}</div>`;
    });
  });
}

function renderCardHtml(item) {
  const badges = dietBadgesHtml(item);
  const price = parseFloat(item.price).toFixed(2);
  return `
    <article class="menu-card"
      data-cat="${item.category_id}"
      data-name="${item.name.toLowerCase()}"
      data-desc="${(item.description || "").toLowerCase()}"
      data-vegan="${item.is_vegan}"
      data-vegetarian="${item.is_vegetarian}"
      data-halal="${item.is_halal}"
      data-gf="${item.is_gluten_free}"
      data-spicy="${item.is_spicy}">
      <div class="menu-card-img">${cardImageHtml(item)}</div>
      <div class="menu-card-badges">${badges}</div>
      <div class="menu-card-body">
        <p class="menu-card-name">${item.name}</p>
        <p class="menu-card-desc">${item.description || ""}</p>
        <div class="menu-card-foot">
          <span class="menu-card-price">$${price}</span>
          <button class="btn-add" data-item="${item.name}" aria-label="Add ${item.name}">+</button>
        </div>
      </div>
    </article>`;
}

function renderSections(items) {
  const body = $("#menuBody");
  if (!body) return;

  /* Group by category, preserving display order */
  const groups = {};
  items.forEach((item) => {
    (groups[item.category_id] ??= {
      name: item.category_name,
      items: [],
    }).items.push(item);
  });

  const keys = Object.keys(groups);
  if (keys.length === 0) {
    body.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p class="empty-state-title">No dishes found</p>
      <p class="empty-state-desc">Try a different search or filter.</p>
    </div>`;
    return;
  }

  body.innerHTML =
    keys
      .map((catId) => {
        const g = groups[catId];
        return `
      <section class="menu-section" data-section="${catId}">
        <div class="menu-section-header">
          <h2 class="menu-section-title">${g.name}</h2>
          <span class="menu-section-count">${g.items.length} item${g.items.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="menu-grid">${g.items.map(renderCardHtml).join("")}</div>
      </section>`;
      })
      .join("") +
    `
    <div class="empty-state" id="emptyState" style="display:none">
      <div class="empty-state-icon">🔍</div>
      <p class="empty-state-title">No dishes found</p>
      <p class="empty-state-desc">Try adjusting your filters or search term.</p>
    </div>`;

  wireAddButtons();
  wireImageFallbacks();
}

function wireAddButtons() {
  $$(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.item;
      btn.style.transform = "scale(0.8)";
      btn.textContent = "✓";
      showToast(name + " added", "success");
      setTimeout(() => {
        btn.style.transform = "";
        btn.textContent = "+";
      }, 600);
    });
  });
}

function applyFilters() {
  const activeCat = $(".cat-btn.active")?.dataset.cat ?? "all";
  const activeDiet = $$(".diet-btn.active").map((b) => b.dataset.filter);
  const query = ($("#menuSearch")?.value ?? "").trim().toLowerCase();

  const cards = $$(".menu-card");
  const sections = $$(".menu-section");
  let visible = 0;

  cards.forEach((card) => {
    const d = card.dataset;
    const matchCat = activeCat === "all" || d.cat === activeCat;
    const matchDiet = activeDiet.every((f) => d[f] === "1");
    const matchText =
      !query || d.name.includes(query) || d.desc.includes(query);
    const show = matchCat && matchDiet && matchText;
    card.classList.toggle("hidden", !show);
    if (show) visible++;
  });

  sections.forEach((sec) => {
    sec.style.display =
      $$(".menu-card:not(.hidden)", sec).length > 0 ? "" : "none";
  });

  const empty = $("#emptyState");
  if (empty) empty.style.display = visible === 0 ? "flex" : "none";
}

async function initMenuPage() {
  const body = $("#menuBody");
  if (!body) return;

  /* Table chip */
  const token = new URLSearchParams(location.search).get("table");
  const tableLabel = $("#tableLabel");
  if (tableLabel && token)
    tableLabel.textContent = "Table " + (TOKEN_MAP[token] ?? "?");

  try {
    const [catRes, itemRes] = await Promise.all([
      fetch(`${API_BASE}/menu/categories`),
      fetch(`${API_BASE}/menu/items`),
    ]);

    if (!catRes.ok || !itemRes.ok) throw new Error("API error");

    const { data: categories } = await catRes.json();
    const { data: items } = await itemRes.json();

    /* Build category tabs */
    const catNav = $("#catNav");
    if (catNav) {
      catNav.innerHTML =
        `<button class="cat-btn active" data-cat="all">🍴 All</button>` +
        categories
          .map(
            (c) =>
              `<button class="cat-btn" data-cat="${c.id}">${CAT_EMOJI[c.id] ?? "🍽"} ${c.name}</button>`,
          )
          .join("");

      $$(".cat-btn", catNav).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".cat-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          applyFilters();
        });
      });
    }

    /* Render all items */
    renderSections(items);

    /* Dietary filter buttons */
    $$(".diet-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("active");
        applyFilters();
      });
    });

    /* Search */
    $("#menuSearch")?.addEventListener("input", applyFilters);
  } catch {
    body.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">Could not load menu</p>
      <p class="empty-state-desc">Make sure the backend server is running on port 8000.</p>
    </div>`;
  }

  /* Waiter / Bill buttons */
  $("#btnWaiter")?.addEventListener("click", function () {
    this.disabled = true;
    this.textContent = "✓ Waiter called";
    showToast("Your waiter is on the way!", "success");
    setTimeout(() => {
      this.disabled = false;
      this.innerHTML = "🔔 Call Waiter";
    }, 4000);
  });

  $("#btnBill")?.addEventListener("click", function () {
    this.disabled = true;
    this.textContent = "✓ Bill requested";
    showToast("Your bill is being prepared!", "success");
    setTimeout(() => {
      this.disabled = false;
      this.innerHTML = "🧾 Request Bill";
    }, 4000);
  });
}

function initAdminPage() {
  const sidebar = $("#sidebar");
  if (!sidebar) return;

  const overlay = $("#sidebarOverlay");
  const burger = $("#hamburger");

  const open = () => {
    sidebar.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  burger?.addEventListener("click", () =>
    sidebar.classList.contains("open") ? close() : open(),
  );
  overlay?.addEventListener("click", close);

  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      $$(".nav-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      if (window.innerWidth < 900) close();
    });
  });

  $$(".btn-success").forEach((btn) => {
    if (btn.textContent.trim() === "Resolve") {
      btn.addEventListener("click", () => {
        btn.closest("tr").style.opacity = ".35";
        btn.textContent = "✓ Done";
        btn.disabled = true;
        showToast("Request resolved", "success");
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
  initMenuPage();
  initAdminPage();
});
