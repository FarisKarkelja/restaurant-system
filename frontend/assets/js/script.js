/* ============================================================
   Serviqo — Frontend Application Script
   Covers: Auth, Menu + Cart, Requests, Admin Panel + Orders,
           Analytics (Serviqo 2.1)
   ============================================================ */

const API_BASE = 'http://localhost:8000';

// ================================================================
// DESIGN PATTERN: Observer (Event Bus)
//
// AnalyticsEventBus is the Subject.  Any module can publish events;
// any other module can subscribe without either knowing about the
// other.  Used here so the Analytics dashboard refreshes
// automatically whenever new order data arrives from the 4-second
// poll — without coupling the polling code to analytics at all.
// ================================================================
const AnalyticsEventBus = (() => {
  const _listeners = {};
  return {
    subscribe(event, cb) {
      (_listeners[event] ??= []).push(cb);
    },
    unsubscribe(event, cb) {
      if (_listeners[event]) _listeners[event] = _listeners[event].filter(f => f !== cb);
    },
    publish(event, data = null) {
      (_listeners[event] ?? []).forEach(cb => cb(data));
    },
  };
})();

// ---- Tiny DOM helpers ----
function  $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

// ---- Auth helpers ----
function getToken()   { return localStorage.getItem('serviqo_token'); }
function getUser()    { return JSON.parse(localStorage.getItem('serviqo_user') || 'null'); }
function clearAuth()  { localStorage.removeItem('serviqo_token'); localStorage.removeItem('serviqo_user'); }
function saveAuth(token, user) {
  localStorage.setItem('serviqo_token', token);
  localStorage.setItem('serviqo_user', JSON.stringify(user));
}
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}

// ---- Toast ----
function showToast(msg, type = '', duration = 3000) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = 'toast' + (type ? ' toast-' + type : '');
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

// ---- Password strength meter ----
function initPasswordStrength() {
  const pw   = $('#password');
  const fill = $('#pwFill');
  const hint = $('#pwHint');
  if (!pw || !fill) return;

  const levels = [
    { label: 'Too short', color: '#DC2626', pct: '20%' },
    { label: 'Weak',      color: '#D97706', pct: '40%' },
    { label: 'Fair',      color: '#EAB308', pct: '60%' },
    { label: 'Good',      color: '#16A34A', pct: '80%' },
    { label: 'Strong',    color: '#15803D', pct: '100%' },
  ];

  pw.addEventListener('input', () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 8)          score++;
    if (v.length >= 12)         score++;
    if (/[A-Z]/.test(v))        score++;
    if (/[0-9]/.test(v))        score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const lvl = v.length === 0 ? null : levels[Math.min(score, 4)];
    fill.style.width      = lvl ? lvl.pct   : '0';
    fill.style.background = lvl ? lvl.color : 'transparent';
    if (hint) hint.textContent = lvl ? lvl.label : '';
  });
}

// ================================================================
// LOGIN PAGE
// ================================================================
function initLoginForm() {
  const form = $('#loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#loginError');
    const btn = form.querySelector('button[type=submit]');
    err.classList.remove('show');

    const email    = $('#email').value.trim();
    const password = $('#password').value;

    if (!email || !password) {
      err.textContent = 'Missing data';
      err.classList.add('show');
      return;
    }

    btn.textContent = 'Signing in…';
    btn.disabled    = true;

    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        err.textContent = data.error || 'Invalid email or password';
        err.classList.add('show');
        return;
      }

      saveAuth(data.token, data.user);

      if (data.user.role === 'Admin' || data.user.role === 'Waiter') {
        window.location.href = 'pages/admin.html';
      } else {
        window.location.href = 'pages/menu.html';
      }

    } catch {
      err.textContent = 'Cannot reach server. Is the backend running?';
      err.classList.add('show');
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled    = false;
    }
  });
}

// ================================================================
// REGISTER PAGE
// ================================================================
function initRegisterForm() {
  const form = $('#registerForm');
  if (!form) return;
  initPasswordStrength();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err  = $('#registerError');
    const succ = $('#registerSuccess');
    const btn  = form.querySelector('button[type=submit]');
    err.classList.remove('show');
    succ.classList.remove('show');

    const name     = $('#name').value.trim();
    const email    = $('#email').value.trim();
    const password = $('#password').value;
    const confirm  = $('#confirm').value;

    if (!name || !email || !password || !confirm) {
      err.textContent = 'Missing data';
      err.classList.add('show');
      return;
    }
    if (!email.includes('@')) {
      err.textContent = 'Invalid email format';
      err.classList.add('show');
      return;
    }
    if (password.length < 8) {
      err.textContent = 'Weak password';
      err.classList.add('show');
      return;
    }
    if (password !== confirm) {
      err.textContent = 'Passwords must match';
      err.classList.add('show');
      return;
    }

    btn.textContent = 'Creating account…';
    btn.disabled    = true;

    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        err.textContent = data.error || 'Registration failed';
        err.classList.add('show');
        return;
      }

      succ.textContent = 'Account created! Redirecting to login…';
      succ.classList.add('show');
      setTimeout(() => { window.location.href = '../index.html'; }, 1500);

    } catch {
      err.textContent = 'Cannot reach server. Is the backend running?';
      err.classList.add('show');
    } finally {
      btn.textContent = 'Create Account';
      btn.disabled    = false;
    }
  });
}

// ================================================================
// ================================================================
// MENU PAGE — Trending items (Observer: menu subscribes to this set)
// ================================================================
let trendingItemIds = new Set();

async function loadTrendingItems() {
  try {
    const res = await fetch(`${API_BASE}/menu/trending`);
    if (!res.ok) return;
    const { data } = await res.json();
    trendingItemIds = new Set(data.map(id => +id));
  } catch { }
}

// MENU PAGE — rendering helpers
// ================================================================

function dietBadgesHtml(item) {
  const b = [];
  if (item.is_vegan)       b.push('<span class="diet-badge diet-badge-vegan">Vegan</span>');
  if (item.is_vegetarian)  b.push('<span class="diet-badge diet-badge-vegetarian">Vegetarian</span>');
  if (item.is_halal)       b.push('<span class="diet-badge diet-badge-halal">Halal</span>');
  if (item.is_gluten_free) b.push('<span class="diet-badge diet-badge-gf">Gluten-Free</span>');
  if (item.is_spicy)       b.push('<span class="diet-badge diet-badge-spicy">Spicy</span>');
  return b.join('');
}

function cardImageHtml(item) {
  if (!item.image_url) return `<div class="card-emoji">🍽</div>`;
  return `<img src="${item.image_url}" alt="${item.name}" loading="lazy">`;
}

function wireImageFallbacks() {
  $$('.menu-card-img img').forEach(img => {
    img.addEventListener('error', () => {
      img.parentElement.innerHTML = `<div class="card-emoji">🍽</div>`;
    });
  });
}

function renderCardHtml(item) {
  const badges    = dietBadgesHtml(item);
  const price     = parseFloat(item.price).toFixed(2);
  const safeName  = item.name.replace(/"/g, '&quot;');
  const trending  = trendingItemIds.has(+item.id);
  return `
    <article class="menu-card"
      data-cat="${item.category_id}"
      data-name="${item.name.toLowerCase()}"
      data-desc="${(item.description || '').toLowerCase()}"
      data-vegan="${item.is_vegan || 0}"
      data-vegetarian="${item.is_vegetarian || 0}"
      data-halal="${item.is_halal || 0}"
      data-gf="${item.is_gluten_free || 0}"
      data-spicy="${item.is_spicy || 0}">
      <div class="menu-card-img">
        ${trending ? '<span class="trending-badge">🔥 Popular</span>' : ''}
        ${cardImageHtml(item)}
      </div>
      <div class="menu-card-badges">${badges}</div>
      <div class="menu-card-body">
        <p class="menu-card-name">${item.name}</p>
        <p class="menu-card-desc">${item.description || ''}</p>
        <div class="menu-card-foot">
          <span class="menu-card-price">$${price}</span>
          <button class="btn-add"
                  data-id="${item.id}"
                  data-name="${safeName}"
                  data-price="${item.price}"
                  aria-label="Add ${item.name}">+</button>
        </div>
      </div>
    </article>`;
}

function renderSections(items) {
  const body = $('#menuBody');
  if (!body) return;

  const groups = {};
  items.forEach(item => {
    (groups[item.category_id] ??= { name: item.category_name, items: [] }).items.push(item);
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

  body.innerHTML = keys.map(catId => {
    const g = groups[catId];
    return `
      <section class="menu-section" data-section="${catId}">
        <div class="menu-section-header">
          <h2 class="menu-section-title">${g.name}</h2>
          <span class="menu-section-count">${g.items.length} item${g.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="menu-grid">${g.items.map(renderCardHtml).join('')}</div>
      </section>`;
  }).join('') + `
    <div class="empty-state" id="emptyState" style="display:none">
      <div class="empty-state-icon">🔍</div>
      <p class="empty-state-title">No dishes found</p>
      <p class="empty-state-desc">Try adjusting your filters or search term.</p>
    </div>`;

  wireAddButtons();
  wireImageFallbacks();
  syncCartButtons();
}

function wireAddButtons() {
  $$('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = +btn.dataset.id;
      const name  = btn.dataset.name;
      const price = +btn.dataset.price;
      addToCart(id, name, price);
      btn.style.transform = 'scale(0.82)';
      setTimeout(() => { btn.style.transform = ''; }, 180);
      showToast(name + ' added', 'success', 1500);
    });
  });
}

function applyFilters() {
  const activeCat  = $('.cat-btn.active')?.dataset.cat ?? 'all';
  const activeDiet = $$('.diet-btn.active').map(b => b.dataset.filter);
  const query      = ($('#menuSearch')?.value ?? '').trim().toLowerCase();

  const cards    = $$('.menu-card');
  const sections = $$('.menu-section');
  let   visible  = 0;

  cards.forEach(card => {
    const d = card.dataset;
    const matchCat  = activeCat === 'all' || d.cat === activeCat;
    const matchDiet = activeDiet.every(f => d[f] === '1');
    const matchText = !query || d.name.includes(query) || d.desc.includes(query);
    const show = matchCat && matchDiet && matchText;
    card.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  sections.forEach(sec => {
    sec.style.display = $$('.menu-card:not(.hidden)', sec).length > 0 ? '' : 'none';
  });

  const empty = $('#emptyState');
  if (empty) empty.style.display = visible === 0 ? 'flex' : 'none';
}

// ================================================================
// CART
// ================================================================
let cart        = {};  // { itemId: { id, name, price, qty } }
let _tableToken = '';

function cartCount() {
  return Object.values(cart).reduce((s, i) => s + i.qty, 0);
}
function cartTotalVal() {
  return Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
}

function updateCartBadge() {
  const count = cartCount();
  const badge = $('#cartBadge');
  const label = $('#cartLabel');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }
  if (label) label.textContent = count > 0 ? `Order (${count})` : 'Order';
}

function syncCartButtons() {
  $$('.btn-add').forEach(btn => {
    const id  = +btn.dataset.id;
    const qty = cart[id]?.qty ?? 0;
    if (qty > 0) {
      btn.textContent = qty;
      btn.classList.add('in-cart');
    } else {
      btn.textContent = '+';
      btn.classList.remove('in-cart');
    }
  });
}

function addToCart(id, name, price) {
  if (cart[id]) {
    cart[id].qty++;
  } else {
    cart[id] = { id, name, price, qty: 1 };
  }
  updateCartBadge();
  syncCartButtons();
  renderCartItems();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
  }
  updateCartBadge();
  syncCartButtons();
  renderCartItems();
}

function renderCartItems() {
  const body = $('#cartItems');
  if (!body) return;

  const items = Object.values(cart);
  if (items.length === 0) {
    body.innerHTML = `<div class="cart-empty">No items yet.<br>Browse the menu and tap <strong>+</strong> to add dishes.</div>`;
    const tot = $('#cartTotal');
    if (tot) tot.textContent = '$0.00';
    return;
  }

  body.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="cart-qty">${item.qty}</span>
        <button class="cart-qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
    </div>`).join('');

  const tot = $('#cartTotal');
  if (tot) tot.textContent = '$' + cartTotalVal().toFixed(2);
}

function openCart() {
  renderCartItems();
  $('#cartDrawer')?.classList.add('open');
  $('#cartBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $('#cartDrawer')?.classList.remove('open');
  $('#cartBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

async function submitOrder() {
  if (!_tableToken) {
    showToast('No table token — scan the QR code at your table', 'error');
    return;
  }
  const items = Object.values(cart);
  if (items.length === 0) {
    showToast('Add some items first', 'error');
    return;
  }

  const btn = $('#btnSendOrder');
  btn.disabled    = true;
  btn.textContent = 'Sending…';

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        table_token: _tableToken,
        items: items.map(i => ({ menu_item_id: i.id, quantity: i.qty })),
        notes: $('#orderNotes')?.value?.trim() || null,
      }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      cart = {};
      syncCartButtons();
      updateCartBadge();
      renderCartItems();
      closeCart();
      if ($('#orderNotes')) $('#orderNotes').value = '';

      const confirm = $('#orderConfirm');
      if (confirm) {
        confirm.style.display = 'flex';
        $('#orderConfirmClose')?.addEventListener('click', () => {
          confirm.style.display = 'none';
        }, { once: true });
      } else {
        showToast('Order sent to kitchen!', 'success', 4000);
      }
    } else {
      showToast(data.error || 'Could not place order', 'error');
    }
  } catch {
    showToast('Server unavailable', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '🍽 Send Order to Kitchen';
  }
}

function initCart(token) {
  _tableToken = token;
  updateCartBadge();
  $('#btnCart')?.addEventListener('click', openCart);
  $('#cartClose')?.addEventListener('click', closeCart);
  $('#cartBackdrop')?.addEventListener('click', closeCart);
  $('#btnSendOrder')?.addEventListener('click', submitOrder);
}

// ================================================================
// MENU PAGE
// ================================================================
async function initMenuPage() {
  const body = $('#menuBody');
  if (!body) return;

  const token      = new URLSearchParams(location.search).get('table') ?? '';
  const tableLabel = $('#tableLabel');

  // Load trending IDs before rendering so badges appear on first paint
  await loadTrendingItems();

  try {
    const fetches = [
      fetch(`${API_BASE}/menu/categories`),
      fetch(`${API_BASE}/menu/items`),
    ];
    if (token && tableLabel) {
      fetches.push(fetch(`${API_BASE}/tables/token/${encodeURIComponent(token)}`));
    }

    const [catRes, itemRes, tableRes] = await Promise.all(fetches);

    if (tableRes?.ok) {
      const { data: tableData } = await tableRes.json();
      if (tableLabel) tableLabel.textContent = 'Table ' + tableData.table_number;
    } else if (tableLabel && token) {
      tableLabel.textContent = 'Table —';
    }

    if (!catRes.ok || !itemRes.ok) throw new Error('API error');

    const { data: categories } = await catRes.json();
    const { data: items }      = await itemRes.json();

    const catNav = $('#catNav');
    if (catNav) {
      catNav.innerHTML =
        `<button class="cat-btn active" data-cat="all">All</button>` +
        categories.map(c =>
          `<button class="cat-btn" data-cat="${c.id}">${c.name}</button>`
        ).join('');

      $$('.cat-btn', catNav).forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          applyFilters();
        });
      });
    }

    renderSections(items);

    $$('.diet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        applyFilters();
      });
    });

    $('#menuSearch')?.addEventListener('input', applyFilters);

  } catch {
    body.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">Could not load menu</p>
      <p class="empty-state-desc">Make sure the backend server is running on port 8000.</p>
    </div>`;
  }

  // Init cart (must run even if menu fails, so token is captured)
  initCart(token);

  // Call Waiter
  const btnWaiter = $('#btnWaiter');
  if (btnWaiter) {
    btnWaiter.addEventListener('click', async function () {
      if (!token) { showToast('No table token in URL', 'error'); return; }
      this.disabled = true;
      this.textContent = '…';
      try {
        const res  = await fetch(`${API_BASE}/requests/waiter`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ table_token: token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.textContent = '✓ Waiter called';
          showToast('Your waiter is on the way!', 'success');
        } else {
          this.textContent = '🔔 Call Waiter';
          showToast(data.error || 'Could not call waiter', 'error');
          this.disabled = false;
          return;
        }
      } catch {
        this.textContent = '🔔 Call Waiter';
        showToast('Server unavailable', 'error');
        this.disabled = false;
        return;
      }
      setTimeout(() => { this.disabled = false; this.innerHTML = '🔔 Call Waiter'; }, 5000);
    });
  }

  // Request Bill
  const btnBill = $('#btnBill');
  if (btnBill) {
    btnBill.addEventListener('click', async function () {
      if (!token) { showToast('No table token in URL', 'error'); return; }
      this.disabled = true;
      this.textContent = '…';
      try {
        const res  = await fetch(`${API_BASE}/requests/bill`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ table_token: token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.textContent = '✓ Bill requested';
          showToast('Your bill is being prepared!', 'success');
        } else {
          this.textContent = '🧾 Request Bill';
          showToast(data.error || 'Could not request bill', 'error');
          this.disabled = false;
          return;
        }
      } catch {
        this.textContent = '🧾 Request Bill';
        showToast('Server unavailable', 'error');
        this.disabled = false;
        return;
      }
      setTimeout(() => { this.disabled = false; this.innerHTML = '🧾 Request Bill'; }, 5000);
    });
  }
}

// ================================================================
// ADMIN PANEL
// ================================================================
let adminPollInterval = null;
let knownRequestIds   = new Set();
let adminWaiters      = [];

function initAdminPage() {
  const sidebar = $('#sidebar');
  if (!sidebar) return;

  const token = getToken();
  const user  = getUser();
  if (!token || !user || !['Admin', 'Waiter'].includes(user.role)) {
    window.location.href = '../index.html';
    return;
  }

  const nameEl = $('.sidebar-user-name');
  const subEl  = $('.sidebar-user-sub');
  if (nameEl) nameEl.textContent = user.name;
  if (subEl)  subEl.textContent  = user.email;

  const avatarEl = $('.sidebar-avatar');
  if (avatarEl) avatarEl.textContent = (user.name || 'A').charAt(0).toUpperCase();

  if (user.role !== 'Admin') {
    $$('.nav-item[data-section="users"], .nav-item[data-section="menu"], .nav-item[data-section="categories"]')
      .forEach(el => el.style.display = 'none');
    const panel = $('#assignments');
    if (panel) panel.style.display = 'none';
  }

  const topbarTitle = $('.topbar-title');

  const overlay = $('#sidebarOverlay');
  const burger  = $('#hamburger');
  const open  = () => { sidebar.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { sidebar.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; };
  burger?.addEventListener('click',  () => sidebar.classList.contains('open') ? close() : open());
  overlay?.addEventListener('click', close);

  $$('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      $$('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const label = item.querySelector(':not(.nav-icon):not(.nav-badge)')?.textContent?.trim();
      if (topbarTitle && label) topbarTitle.textContent = label;
      const section = item.dataset.section;
      if (section) {
        $$('[id^="section-"]').forEach(s => s.style.display = 'none');
        const target = $(`#section-${section}`);
        if (target) target.style.display = '';
        if (section === 'categories') loadCategoriesSection();
        if (section === 'menu')       loadMenuSection();
        if (section === 'users')      loadUsersSection();
        if (section === 'analytics')  loadAnalyticsDashboard();
      }
      if (window.innerWidth < 900) close();
    });
  });

  const logoutBtn = $('#btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      window.location.href = '../index.html';
    });
  }

  loadAdminDashboard();
  adminPollInterval = setInterval(loadAdminDashboard, 4000);

  loadWaiters().then(() => loadAdminAssignments());
}

async function loadAdminDashboard() {
  await Promise.all([
    loadAdminTables(),
    loadAdminRequests(),
    loadAdminOrders(),
    loadAdminStats(),
    loadAdminAssignments(),
  ]);
}

// ---- Tables ----
async function loadAdminTables() {
  try {
    const res  = await fetch(`${API_BASE}/tables`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    renderAdminTables(data);
  } catch { }
}

function renderAdminTables(tables) {
  const grid = $('#tablesGrid');
  if (!grid) return;

  const occupied = tables.filter(t => t.status === 'occupied').length;
  const statActive = $('#statActiveTables');
  if (statActive) statActive.textContent = occupied;

  grid.innerHTML = tables.map(t => `
    <div class="table-tile ${t.status}" data-id="${t.id}">
      <div class="tile-num">${t.table_number}</div>
      <div class="tile-cap">${t.capacity} seats</div>
      <div class="tile-dot"></div>
      <select class="tile-status-select" data-table-id="${t.id}" title="Change status">
        <option value="available"${t.status === 'available' ? ' selected' : ''}>Available</option>
        <option value="occupied"${t.status === 'occupied'  ? ' selected' : ''}>Occupied</option>
        <option value="reserved"${t.status === 'reserved'  ? ' selected' : ''}>Reserved</option>
      </select>
      <button class="tile-qr-btn" data-token="${t.qr_token}" data-num="${t.table_number}">QR</button>
    </div>`).join('');

  $$('.tile-qr-btn', grid).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showQrModal(btn.dataset.token, btn.dataset.num);
    });
  });

  $$('.tile-status-select', grid).forEach(sel => {
    sel.addEventListener('change', async function () {
      const id     = this.dataset.tableId;
      const status = this.value;
      try {
        const res = await fetch(`${API_BASE}/tables/${id}/status`, {
          method:  'PUT',
          headers: authHeaders(),
          body:    JSON.stringify({ status }),
        });
        if (res.ok) {
          const tile = this.closest('.table-tile');
          tile.className = `table-tile ${status}`;
          showToast(`Table ${id} → ${status}`, 'success');
          loadAdminTables();
          loadAdminAssignments();
        }
      } catch { showToast('Failed to update table', 'error'); }
    });
  });

}

// ---- Requests ----
async function loadAdminRequests() {
  try {
    const res  = await fetch(`${API_BASE}/requests/pending`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    renderAdminRequests(data);
    updateAdminStats(data);
  } catch { }
}

function timeAgo(isoStr) {
  const secs = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + ' min ago';
  return Math.floor(secs / 3600) + ' h ago';
}

function renderAdminRequests(requests) {
  const tbody = $('#requestsTableBody');
  if (!tbody) return;

  const badge = $('#requestsBadge');
  if (badge) badge.textContent = requests.length || '';

  if (requests.length === 0) {
    knownRequestIds.clear();
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:20px;">No pending requests</td></tr>`;
    return;
  }

  const newOnes = knownRequestIds.size > 0
    ? requests.filter(r => !knownRequestIds.has(`${r.type}-${r.id}`))
    : [];

  if (newOnes.length > 0) {
    const labels = newOnes.map(r =>
      `Table ${r.table_number} — ${r.type === 'waiter' ? '🔔 Waiter' : '🧾 Bill'}`
    ).join(', ');
    showToast(labels, 'error', 6000);
  }

  knownRequestIds = new Set(requests.map(r => `${r.type}-${r.id}`));

  tbody.innerHTML = requests.map(r => {
    const isNew = newOnes.some(n => n.type === r.type && n.id === r.id);
    const typeLabel = r.type === 'waiter'
      ? '<span class="badge badge-amber">🔔 Waiter</span>'
      : '<span class="badge badge-gold">🧾 Bill</span>';
    const endpoint = r.type === 'waiter'
      ? `${API_BASE}/requests/waiter/${r.id}/resolve`
      : `${API_BASE}/requests/bill/${r.id}/resolve`;
    return `
      <tr id="req-${r.type}-${r.id}" ${isNew ? 'class="row-new"' : ''}>
        <td><strong>Table ${r.table_number}</strong></td>
        <td>${typeLabel}</td>
        <td style="color:var(--text-3);font-size:.8rem;">${timeAgo(r.created_at)}</td>
        <td>
          <button class="btn btn-success btn-sm"
                  onclick="resolveRequest('${endpoint}','${r.type}-${r.id}',this)">
            Resolve
          </button>
        </td>
      </tr>`;
  }).join('');
}

async function resolveRequest(endpoint, rowId, btn) {
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res = await fetch(endpoint, { method: 'PUT', headers: authHeaders() });
    if (res.ok) {
      const row = $(`#req-${rowId}`);
      if (row) { row.style.opacity = '.3'; setTimeout(() => row.remove(), 600); }
      showToast('Request resolved', 'success');
      loadAdminRequests();
    } else {
      btn.disabled = false; btn.textContent = 'Resolve';
      showToast('Failed to resolve', 'error');
    }
  } catch {
    btn.disabled = false; btn.textContent = 'Resolve';
    showToast('Server error', 'error');
  }
}

function updateAdminStats(requests) {
  const statPending = $('#statPendingRequests');
  if (statPending) statPending.textContent = requests.length;
}

// ---- Orders ----
async function loadAdminOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders/active`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    renderAdminOrders(data);
    // Observer: notify any subscriber that order data has changed
    AnalyticsEventBus.publish('ordersUpdated', data);
  } catch { }
}

async function loadAdminStats() {
  try {
    const res = await fetch(`${API_BASE}/orders/stats`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    const todayEl   = $('#statTodayOrders');
    const revenueEl = $('#statRevenue');
    if (todayEl)   todayEl.textContent   = data.count;
    if (revenueEl) revenueEl.textContent = '$' + data.revenue.toFixed(2);
  } catch { }
}

const ORDER_STATUS_BADGE = {
  pending:   '<span class="badge badge-amber">Pending</span>',
  confirmed: '<span class="badge badge-blue">Confirmed</span>',
  preparing: '<span class="badge badge-purple">Preparing</span>',
  served:    '<span class="badge badge-green">Delivered</span>',
};

function renderAdminOrders(orders) {
  const tbody = $('#ordersTableBody');
  if (!tbody) return;

  const badge = $('#ordersBadge');
  if (badge) badge.textContent = orders.length || '';

  const activeBadge = $('#activeOrdersBadge');
  if (activeBadge) activeBadge.textContent = orders.length;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:28px;">No active orders — kitchen is clear ✓</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const itemsList = order.items
      .map(i => `${i.item_name} ×${i.quantity}`)
      .join(', ');

    const statusBadge = ORDER_STATUS_BADGE[order.status] ?? order.status;

    const actions = [];
    if (order.status === 'pending') {
      actions.push(`<button class="btn btn-neutral btn-sm" onclick="updateOrderStatus(${order.id},'confirmed',this)">Confirm</button>`);
    }
    if (order.status === 'confirmed') {
      actions.push(`<button class="btn btn-neutral btn-sm" onclick="updateOrderStatus(${order.id},'preparing',this)">Preparing</button>`);
    }
    if (['pending','confirmed','preparing'].includes(order.status)) {
      actions.push(`<button class="btn btn-success btn-sm" onclick="updateOrderStatus(${order.id},'served',this)">✓ Delivered</button>`);
    }

    return `
      <tr id="order-row-${order.id}">
        <td><strong>Table ${order.table_number}</strong></td>
        <td style="max-width:280px;font-size:.8rem;color:var(--text-2);line-height:1.5;">${itemsList}</td>
        <td><strong>$${parseFloat(order.total_price).toFixed(2)}</strong></td>
        <td>${statusBadge}</td>
        <td style="color:var(--text-3);font-size:.8rem;white-space:nowrap;">${timeAgo(order.created_at)}</td>
        <td style="white-space:nowrap;display:flex;gap:6px;">${actions.join('')}</td>
      </tr>`;
  }).join('');
}

async function updateOrderStatus(orderId, status, btn) {
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      const msg = status === 'served' ? 'Order marked as delivered!' : `Order → ${status}`;
      showToast(msg, 'success');
      loadAdminOrders();
      loadAdminTables();
      loadAdminStats();
    } else {
      btn.disabled    = false;
      btn.textContent = 'Retry';
      showToast('Failed to update order', 'error');
    }
  } catch {
    btn.disabled    = false;
    btn.textContent = 'Retry';
    showToast('Server error', 'error');
  }
}

// ================================================================
// CATALOGUE MANAGEMENT — Categories & Menu Items (Admin only)
// ================================================================
const _catStore  = {};
const _itemStore = {};
let editingCatId  = null;
let editingItemId = null;
let adminCats     = [];

// ---- Categories ----

async function loadCategoriesSection() {
  try {
    const res = await fetch(`${API_BASE}/menu/categories`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    adminCats = data;
    data.forEach(c => (_catStore[c.id] = c));
    renderCategories(data);
  } catch {}
}

function renderCategories(cats) {
  const tbody = $('#categoriesTableBody');
  if (!tbody) return;
  if (cats.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:24px;">No categories yet. Add one above.</td></tr>`;
    return;
  }
  tbody.innerHTML = cats.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td style="color:var(--text-2);font-size:.85rem;">${c.description || '—'}</td>
      <td>${c.display_order}</td>
      <td><span class="badge ${+c.is_active ? 'badge-green' : 'badge-neutral'}">${+c.is_active ? 'Active' : 'Inactive'}</span></td>
      <td style="display:flex;gap:6px;">
        <button class="btn btn-neutral btn-sm" onclick="openCategoryModal(${c.id})">Edit</button>
        <button class="btn btn-ghost btn-sm"   onclick="deleteCategory(${c.id}, this)">Delete</button>
      </td>
    </tr>`).join('');
}

function openCategoryModal(catId = null) {
  editingCatId = catId;
  const errEl = $('#catError');
  errEl.classList.remove('show');
  $('#categoryModalTitle').textContent = catId ? 'Edit Category' : 'Add Category';
  if (catId) {
    const c = _catStore[catId];
    $('#catName').value    = c.name;
    $('#catDesc').value    = c.description || '';
    $('#catOrder').value   = c.display_order;
    $('#catActive').checked = !!+c.is_active;
  } else {
    $('#catName').value    = '';
    $('#catDesc').value    = '';
    $('#catOrder').value   = 0;
    $('#catActive').checked = true;
  }
  $('#categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
  $('#categoryModal').style.display = 'none';
}

async function saveCategory() {
  const name  = $('#catName').value.trim();
  const errEl = $('#catError');
  errEl.classList.remove('show');
  if (!name) { errEl.textContent = 'Name is required'; errEl.classList.add('show'); return; }

  const btn = $('#categoryModal .btn-primary');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    const url    = editingCatId ? `${API_BASE}/menu/categories/${editingCatId}` : `${API_BASE}/menu/categories`;
    const method = editingCatId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method, headers: authHeaders(),
      body: JSON.stringify({
        name,
        description:   $('#catDesc').value.trim(),
        display_order: parseInt($('#catOrder').value, 10) || 0,
        is_active:     $('#catActive').checked ? 1 : 0,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(editingCatId ? 'Category updated' : 'Category created', 'success');
      closeCategoryModal();
      loadCategoriesSection();
    } else {
      errEl.textContent = data.error || 'Failed to save';
      errEl.classList.add('show');
    }
  } catch {
    errEl.textContent = 'Server error';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function deleteCategory(id, btn) {
  if (!confirm('Delete this category? Menu items inside it will also be deleted.')) return;
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/menu/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) { showToast('Category deleted', 'success'); loadCategoriesSection(); }
    else showToast('Failed to delete', 'error');
  } catch { showToast('Server error', 'error'); }
  finally { btn.disabled = false; }
}

// ---- Menu Items ----

async function loadMenuSection() {
  try {
    const [catRes, itemRes] = await Promise.all([
      fetch(`${API_BASE}/menu/categories`, { headers: authHeaders() }),
      fetch(`${API_BASE}/menu/items`,      { headers: authHeaders() }),
    ]);
    if (!catRes.ok || !itemRes.ok) return;
    const { data: cats  } = await catRes.json();
    const { data: items } = await itemRes.json();
    adminCats = cats;
    cats.forEach(c  => (_catStore[c.id]   = c));
    items.forEach(i => (_itemStore[i.id]  = i));
    renderMenuItems(items);
  } catch {}
}

const DIET_LABELS = {
  is_vegan: 'Vegan', is_vegetarian: 'Vegetarian', is_halal: 'Halal',
  is_gluten_free: 'Gluten-Free', is_spicy: 'Spicy',
};

function renderMenuItems(items) {
  const tbody = $('#menuItemsTableBody');
  if (!tbody) return;
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:24px;">No menu items yet. Add one above.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => {
    const diet  = Object.entries(DIET_LABELS).filter(([k]) => +item[k]).map(([, v]) => `<span class="badge badge-neutral" style="font-size:.7rem;">${v}</span>`).join(' ');
    const avail = +item.is_available
      ? '<span class="badge badge-green">Yes</span>'
      : '<span class="badge badge-neutral">No</span>';
    return `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td style="color:var(--text-2);font-size:.85rem;">${item.category_name}</td>
        <td><strong>$${parseFloat(item.price).toFixed(2)}</strong></td>
        <td style="font-size:.8rem;">${diet || '—'}</td>
        <td>${avail}</td>
        <td style="display:flex;gap:6px;">
          <button class="btn btn-neutral btn-sm" onclick="openMenuItemModal(${item.id})">Edit</button>
          <button class="btn btn-ghost btn-sm"   onclick="deleteMenuItem(${item.id}, this)">Delete</button>
        </td>
      </tr>`;
  }).join('');
}

function openMenuItemModal(itemId = null) {
  editingItemId = itemId;
  const errEl = $('#itemError');
  errEl.classList.remove('show');
  $('#menuItemModalTitle').textContent = itemId ? 'Edit Menu Item' : 'Add Menu Item';

  $('#itemCategory').innerHTML = adminCats.map(c =>
    `<option value="${c.id}">${c.name}</option>`
  ).join('');

  if (itemId) {
    const i = _itemStore[itemId];
    $('#itemName').value       = i.name;
    $('#itemCategory').value   = i.category_id;
    $('#itemDesc').value       = i.description || '';
    $('#itemPrice').value      = i.price;
    $('#itemImageUrl').value   = i.image_url || '';
    $('#itemVegan').checked    = !!+i.is_vegan;
    $('#itemVeg').checked      = !!+i.is_vegetarian;
    $('#itemHalal').checked    = !!+i.is_halal;
    $('#itemGf').checked       = !!+i.is_gluten_free;
    $('#itemSpicy').checked    = !!+i.is_spicy;
    $('#itemAvailable').checked = !!+i.is_available;
  } else {
    $('#itemName').value       = '';
    $('#itemDesc').value       = '';
    $('#itemPrice').value      = '';
    $('#itemImageUrl').value   = '';
    $('#itemVegan').checked    = false;
    $('#itemVeg').checked      = false;
    $('#itemHalal').checked    = false;
    $('#itemGf').checked       = false;
    $('#itemSpicy').checked    = false;
    $('#itemAvailable').checked = true;
  }
  $('#menuItemModal').style.display = 'flex';
}

function closeMenuItemModal() {
  $('#menuItemModal').style.display = 'none';
}

async function saveMenuItem() {
  const name  = $('#itemName').value.trim();
  const price = parseFloat($('#itemPrice').value);
  const catId = parseInt($('#itemCategory').value, 10);
  const errEl = $('#itemError');
  errEl.classList.remove('show');

  if (!name || isNaN(price) || price <= 0 || !catId) {
    errEl.textContent = 'Name, category and a valid price are required';
    errEl.classList.add('show');
    return;
  }

  const btn = $('#menuItemModal .btn-primary');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    const url    = editingItemId ? `${API_BASE}/menu/items/${editingItemId}` : `${API_BASE}/menu/items`;
    const method = editingItemId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method, headers: authHeaders(),
      body: JSON.stringify({
        name, category_id: catId,
        description:    $('#itemDesc').value.trim(),
        price,
        image_url:      $('#itemImageUrl').value.trim() || null,
        is_available:   $('#itemAvailable').checked ? 1 : 0,
        is_vegan:       $('#itemVegan').checked  ? 1 : 0,
        is_vegetarian:  $('#itemVeg').checked    ? 1 : 0,
        is_halal:       $('#itemHalal').checked  ? 1 : 0,
        is_gluten_free: $('#itemGf').checked     ? 1 : 0,
        is_spicy:       $('#itemSpicy').checked  ? 1 : 0,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(editingItemId ? 'Item updated' : 'Item created', 'success');
      closeMenuItemModal();
      loadMenuSection();
    } else {
      errEl.textContent = data.error || 'Failed to save';
      errEl.classList.add('show');
    }
  } catch {
    errEl.textContent = 'Server error';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function deleteMenuItem(id, btn) {
  if (!confirm('Delete this menu item?')) return;
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/menu/items/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) { showToast('Item deleted', 'success'); loadMenuSection(); }
    else showToast('Failed to delete', 'error');
  } catch { showToast('Server error', 'error'); }
  finally { btn.disabled = false; }
}

// ================================================================
// WAITER ASSIGNMENTS
// ================================================================
async function loadWaiters() {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    adminWaiters = data.filter(u => u.role === 'Waiter');
  } catch { }
}

async function loadAdminAssignments() {
  try {
    const res = await fetch(`${API_BASE}/assignments`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    renderAdminAssignments(data);
  } catch { }
}

function waiterSelectHtml(tableId, currentWaiterId) {
  const options = adminWaiters.map(w => {
    const sel = w.id == currentWaiterId ? ' selected' : '';
    return `<option value="${w.id}"${sel}>${w.name}</option>`;
  }).join('');
  return `<select class="input" style="padding:4px 8px;height:32px;font-size:.8rem;width:140px;" id="waiterSel-${tableId}">
    <option value="">— Select waiter —</option>
    ${options}
  </select>`;
}

function renderAdminAssignments(assignments) {
  const tbody = $('#assignmentsTableBody');
  if (!tbody) return;

  if (assignments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:24px;">No tables found</td></tr>`;
    return;
  }

  tbody.innerHTML = assignments.map(row => {
    const statusClass = row.status === 'available' ? 'badge-green'
                      : row.status === 'occupied'  ? 'badge-amber'
                      : 'badge-red';

    const assignedCell = row.waiter_name
      ? `<strong>${row.waiter_name}</strong><br>
         <small style="color:var(--text-3);font-size:.75rem;">${row.waiter_email}</small>`
      : `<span style="color:var(--text-3)">— Unassigned —</span>`;

    const since = row.assigned_at ? timeAgo(row.assigned_at) : '—';

    const unassignBtn = row.waiter_id
      ? `<button class="btn btn-ghost btn-sm"
                 onclick="removeAssignment(${row.table_id}, this)"
                 title="Remove assignment">✕</button>`
      : '';

    return `
      <tr>
        <td><strong>Table ${row.table_number}</strong></td>
        <td>${row.capacity} seats</td>
        <td><span class="badge ${statusClass}">${row.status}</span></td>
        <td>${assignedCell}</td>
        <td style="color:var(--text-3);font-size:.8rem;white-space:nowrap;">${since}</td>
        <td style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${waiterSelectHtml(row.table_id, row.waiter_id)}
          <button class="btn btn-neutral btn-sm"
                  onclick="saveAssignment(${row.table_id}, this)">Save</button>
          ${unassignBtn}
        </td>
      </tr>`;
  }).join('');
}

async function saveAssignment(tableId, btn) {
  const sel      = $(`#waiterSel-${tableId}`);
  const waiterId = sel?.value;
  if (!waiterId) {
    showToast('Select a waiter first', 'error');
    return;
  }
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res = await fetch(`${API_BASE}/tables/${tableId}/assign`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify({ waiter_id: parseInt(waiterId, 10) }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Waiter assigned', 'success');
      loadAdminAssignments();
    } else {
      showToast(data.error || 'Failed to assign', 'error');
    }
  } catch {
    showToast('Server error', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save';
  }
}

async function removeAssignment(tableId, btn) {
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res = await fetch(`${API_BASE}/tables/${tableId}/assign`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      showToast('Assignment removed', 'success');
      loadAdminAssignments();
    } else {
      showToast('Failed to remove assignment', 'error');
    }
  } catch {
    showToast('Server error', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '✕';
  }
}

// ================================================================
// USERS SECTION
// ================================================================
async function loadUsersSection() {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: authHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();
    renderUsers(data);
  } catch {}
}

function renderUsers(users) {
  const tbody = $('#usersTableBody');
  if (!tbody) return;

  const me = getUser();

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:24px;">No users found</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const roleSelect = `
      <select class="input" style="padding:4px 8px;height:32px;font-size:.8rem;width:120px;" id="roleSel-${u.id}">
        <option value="User"${u.role === 'User' ? ' selected' : ''}>User</option>
        <option value="Waiter"${u.role === 'Waiter' ? ' selected' : ''}>Waiter</option>
        <option value="Admin"${u.role === 'Admin' ? ' selected' : ''}>Admin</option>
      </select>`;

    const isSelf = u.id === me?.id;
    const actions = isSelf
      ? `<span style="color:var(--text-3);font-size:.8rem;">You</span>`
      : `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
           ${roleSelect}
           <button class="btn btn-neutral btn-sm" onclick="saveUserRole(${u.id}, this)">Save</button>
           <button class="btn btn-ghost btn-sm" onclick="deleteUser(${u.id}, this)">Delete</button>
         </div>`;

    const joined = new Date(u.created_at).toLocaleDateString();
    const roleBadge = u.role === 'Admin'  ? 'badge-blue'
                    : u.role === 'Waiter' ? 'badge-amber'
                    : 'badge-neutral';

    return `
      <tr id="user-row-${u.id}">
        <td><strong>${u.name}</strong></td>
        <td style="color:var(--text-2);font-size:.85rem;">${u.email}</td>
        <td><span class="badge ${roleBadge}">${u.role}</span></td>
        <td style="color:var(--text-3);font-size:.8rem;">${joined}</td>
        <td>${actions}</td>
      </tr>`;
  }).join('');
}

async function saveUserRole(userId, btn) {
  const sel  = $(`#roleSel-${userId}`);
  const role = sel?.value;
  if (!role) return;
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res = await fetch(`${API_BASE}/auth/users/${userId}/role`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify({ role }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Role updated', 'success');
      loadUsersSection();
      loadWaiters();
    } else {
      showToast(data.error || 'Failed to update role', 'error');
    }
  } catch {
    showToast('Server error', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save';
  }
}

function showConfirmModal(message) {
  return new Promise(resolve => {
    const modal   = $('#confirmModal');
    const msgEl   = $('#confirmModalMessage');
    const okBtn   = $('#confirmModalOk');
    const cancel  = $('#confirmModalCancel');
    const closeX  = $('#confirmModalClose');

    msgEl.textContent = message;
    modal.style.display = 'flex';

    function finish(result) {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      closeX.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk()     { finish(true);  }
    function onCancel() { finish(false); }

    okBtn.addEventListener('click',  onOk);
    cancel.addEventListener('click', onCancel);
    closeX.addEventListener('click', onCancel);
  });
}

async function deleteUser(userId, btn) {
  const confirmed = await showConfirmModal('Are you sure you want to delete this user? This action cannot be undone.');
  if (!confirmed) return;
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const row = $(`#user-row-${userId}`);
      if (row) { row.style.opacity = '.3'; setTimeout(() => row.remove(), 400); }
      showToast('User deleted', 'success');
      loadWaiters();
    } else {
      showToast(data.error || 'Failed to delete user', 'error');
      btn.disabled    = false;
      btn.textContent = 'Delete';
    }
  } catch {
    showToast('Server error', 'error');
    btn.disabled    = false;
    btn.textContent = 'Delete';
  }
}

// ================================================================
// ANALYTICS DASHBOARD (Serviqo 2.1)
//
// Design Pattern — Strategy (backend): each metric is a separate
//   PHP strategy class; the frontend simply fetches /analytics/summary.
//
// Design Pattern — Observer (frontend): AnalyticsEventBus.subscribe
//   wires this dashboard to the existing order-polling loop so the
//   charts auto-refresh when new orders arrive, with zero coupling
//   between the two features.
// ================================================================

let _chartRevenue      = null;
let _chartPeakHours    = null;
let _analyticsOpen     = false;
let _analyticsLastFetch = null;          // timestamp of last successful fetch
const ANALYTICS_TTL_MS  = 24 * 60 * 60 * 1000; // 24 hours

// Observer: refresh analytics only if data is older than 24 hours.
// This prevents charts from jumping on every 4-second order poll.
AnalyticsEventBus.subscribe('ordersUpdated', () => {
  if (!_analyticsOpen) return;
  const stale = !_analyticsLastFetch || (Date.now() - _analyticsLastFetch) >= ANALYTICS_TTL_MS;
  if (stale) loadAnalyticsDashboard();
});

function refreshAnalytics() {
  _analyticsLastFetch = null; // force re-fetch regardless of TTL
  loadAnalyticsDashboard();
}

async function loadAnalyticsDashboard() {
  _analyticsOpen = true;
  const days = parseInt($('#analyticsPeriod')?.value ?? '30', 10);

  const popularEl = $('#popularItemsList');

  try {
    const res = await fetch(`${API_BASE}/analytics/summary`, { headers: authHeaders() });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (popularEl) popularEl.innerHTML = `<div style="text-align:center;color:var(--red);padding:24px;">
        Failed to load analytics (${res.status}): ${err.error ?? 'Server error'}
      </div>`;
      return;
    }

    const { data } = await res.json();
    _analyticsLastFetch = Date.now();
    renderAnalyticsSummary(data, days);
    renderRevenueChart(data.revenue_trend);
    renderPeakHoursChart(data.peak_hours);
    renderPopularItems(data.popular_items);
  } catch (e) {
    if (popularEl) popularEl.innerHTML = `<div style="text-align:center;color:var(--red);padding:24px;">
      Cannot reach server. Make sure the backend is running.
    </div>`;
    showToast('Failed to load analytics', 'error');
  }
}

function renderAnalyticsSummary(data, days) {
  const ov = data.order_value;
  const ph = data.peak_hours;

  const revEl   = $('#aStatRevenue');
  const ordEl   = $('#aStatOrders');
  const avgEl   = $('#aStatAvg');
  const peakEl  = $('#aStatPeak');
  const lblEl   = $('#revTrendLabel');

  if (revEl)  revEl.textContent  = '$' + ov.total_revenue.toFixed(2);
  if (ordEl)  ordEl.textContent  = ov.total_orders;
  if (avgEl)  avgEl.textContent  = '$' + ov.avg_value.toFixed(2);
  if (peakEl) peakEl.textContent = ph.peak_label;
  if (lblEl)  lblEl.textContent  = `Last ${days} days`;
}

function renderRevenueChart(trend) {
  const ctx = $('#chartRevenue');
  if (!ctx) return;

  const labels   = trend.map(d => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const revenues = trend.map(d => d.revenue);

  // Update in-place to avoid animation jump on every poll cycle
  if (_chartRevenue) {
    _chartRevenue.data.labels                 = labels;
    _chartRevenue.data.datasets[0].data       = revenues;
    _chartRevenue.update('none'); // 'none' = skip animation
    return;
  }

  _chartRevenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue ($)',
        data: revenues,
        borderColor: '#C9A84C',
        backgroundColor: 'rgba(201,168,76,0.12)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#C9A84C',
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 600 },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8b8b', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8b8b', font: { size: 11 }, callback: v => '$' + v } },
      },
    },
  });
}

function renderPeakHoursChart(peakData) {
  const ctx = $('#chartPeakHours');
  if (!ctx) return;

  const labels = peakData.hours.map((_, i) => `${String(i).padStart(2,'0')}:00`);
  const values = peakData.hours;
  const maxVal = Math.max(...values);

  const colors = values.map(v =>
    v === maxVal && maxVal > 0 ? 'rgba(201,168,76,0.85)' : 'rgba(100,149,237,0.55)'
  );

  // Update in-place to avoid animation jump on every poll cycle
  if (_chartPeakHours) {
    _chartPeakHours.data.datasets[0].data            = values;
    _chartPeakHours.data.datasets[0].backgroundColor = colors;
    _chartPeakHours.update('none');
    return;
  }

  _chartPeakHours = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Orders',
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 600 },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8b8b8b', font: { size: 9 }, maxRotation: 45 } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8b8b', font: { size: 11 }, stepSize: 1 } },
      },
    },
  });
}

function renderPopularItems(items) {
  const container = $('#popularItemsList');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-3);padding:24px;">No order data yet — place some orders to see popular items.</div>`;
    return;
  }

  const maxOrdered = Math.max(...items.map(i => +i.total_ordered));

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Times Ordered</th>
          <th>In Orders</th>
          <th>Popularity</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => {
          const pct = maxOrdered > 0 ? Math.round((+item.total_ordered / maxOrdered) * 100) : 0;
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
          return `
            <tr>
              <td style="font-size:1.1rem;">${medal}</td>
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  ${item.image_url
                    ? `<img src="${item.image_url}" alt="${item.name}"
                            style="width:36px;height:36px;border-radius:6px;object-fit:cover;">`
                    : `<div style="width:36px;height:36px;border-radius:6px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🍽</div>`
                  }
                  <strong>${item.name}</strong>
                </div>
              </td>
              <td><span class="badge badge-amber">${item.total_ordered}×</span></td>
              <td style="color:var(--text-2);font-size:.85rem;">${item.order_appearances} order${item.order_appearances != 1 ? 's' : ''}</td>
              <td style="min-width:120px;">
                <div style="background:var(--surface-2);border-radius:99px;height:8px;overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:99px;transition:width .4s;"></div>
                </div>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// When the user navigates away from analytics, pause auto-refresh
document.addEventListener('click', e => {
  const navItem = e.target.closest('.nav-item');
  if (navItem && navItem.dataset.section !== 'analytics') {
    _analyticsOpen = false;
  }
});

// ================================================================
// QR MODAL
// ================================================================
function menuUrlForToken(token) {
  const base = window.location.href.replace(/admin\.html.*$/, '');
  return `${base}menu.html?table=${token}`;
}

function showQrModal(token, tableNum) {
  const modal = $('#qrModal');
  const title = $('#qrModalTitle');
  const img   = $('#qrImage');
  const urlEl = $('#qrUrl');
  if (!modal) return;

  const url = menuUrlForToken(token);
  title.textContent = `Table ${tableNum} — QR Code`;
  urlEl.textContent = url;
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  modal.style.display = 'flex';
}

function initQrModal() {
  const modal = $('#qrModal');
  const close = $('#qrModalClose');
  if (!modal) return;
  close?.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

// ================================================================
// BOOT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
  initMenuPage();
  initAdminPage();
  initQrModal();

  $('#categoryModal')?.addEventListener('click', e => { if (e.target === $('#categoryModal')) closeCategoryModal(); });
  $('#menuItemModal')?.addEventListener('click', e => { if (e.target === $('#menuItemModal')) closeMenuItemModal(); });
});
