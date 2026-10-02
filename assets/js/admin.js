(function () {
  const page = document.body.dataset.page;

  function loginNote(message) {
    const note = document.getElementById("loginNote");
    if (note) note.textContent = message;
  }

  async function loadLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    if (!a2zSupabase) {
      loginNote("Login is temporarily unavailable. Please try again later.");
      return;
    }
    const { data } = await a2zSupabase.auth.getUser();
    if (data.user) window.location.replace("index.html");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      loginNote("Signing in…");
      const { error } = await a2zSupabase.auth.signInWithPassword({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      });
      button.disabled = false;
      if (error) {
        loginNote("Invalid email or password.");
        return;
      }
      window.location.replace("index.html");
    });
  }

  function setAdminIdentity(profile) {
    const initials = profile.full_name.split(/\s+/).map((name) => name[0]).join("").slice(0, 2).toUpperCase();
    document.querySelectorAll(".admin-avatar").forEach((node) => { node.textContent = initials; });
    document.querySelectorAll(".admin-user > span:last-child").forEach((node) => {
      node.innerHTML = `${a2zEscape(profile.full_name)}<br><small>${a2zEscape(profile.role.replaceAll("_", " "))}</small>`;
    });
  }

  function renderRows(selector, html) {
    const body = document.querySelector(selector);
    if (body) body.innerHTML = html;
  }

  function productRows(products) {
    return products.map((row) => {
      const product = a2zDbProduct(row);
      return `<tr data-category="${a2zEscape(product.category)}">
        <td class="row-title">${a2zEscape(product.name)}</td><td>${a2zEscape(product.kicker)}</td><td>${a2zFormatPrice(product)}</td><td>${a2zEscape(product.sku)}</td><td>${product.stock ?? "—"}</td>
        <td><span class="badge ${product.active ? "badge-instock" : "badge-cancelled"}">${product.active ? "Active" : "Inactive"}</span></td>
        <td class="row-actions"><a class="btn btn-outline btn-sm" href="product-form.html?id=${encodeURIComponent(product.id)}">Edit</a></td>
      </tr>`;
    }).join("");
  }

  function inventoryRows(products) {
    return products.filter((row) => row.inventory_quantity !== null).map((row) => {
      const product = a2zDbProduct(row);
      const stock = a2zStockLabel(product);
      return `<tr data-category="${a2zEscape(product.category)}">
        <td class="row-title">${a2zEscape(product.name)}</td><td>${a2zEscape(product.sku)}</td>
        <td><span class="stepper" data-product-id="${product.id}"><button type="button" data-step="-1" aria-label="Decrease stock">−</button><output>${product.stock}</output><button type="button" data-step="1" aria-label="Increase stock">+</button></span></td>
        <td>${product.lowStockAt ?? "—"}</td><td><span class="badge ${stock.badge}">${a2zEscape(stock.text)}</span></td>
        <td><button type="button" class="star-toggle${product.featured ? " active" : ""}" data-feature-toggle="${product.id}" aria-pressed="${product.featured ? "true" : "false"}" aria-label="Toggle popular this week" title="Show in Popular this week on homepage">★</button></td>
      </tr>`;
    }).join("");
  }

  function repairRows(repairs) {
    return repairs.map((repair) => `<tr data-status="${a2zEscape(repair.status.toLowerCase())}">
      <td class="row-title">${a2zEscape(repair.job_number)}</td><td>${a2zEscape(`${repair.device_name} ${repair.model || ""}`.trim())}</td><td>${a2zEscape(repair.customer_name)}</td><td>${a2zEscape(repair.customer_phone)}</td>
      <td><span class="badge ${a2zStatusBadge(repair.status)}">${a2zEscape(repair.status)}</span></td><td>${a2zEscape(a2zFormatDate(repair.received_at, { day: "numeric", month: "short", year: "numeric" }))}</td>
      <td><a href="repair-detail.html?id=${encodeURIComponent(repair.id)}">Open</a></td>
    </tr>`).join("");
  }

  function renderCategoryChips(containerSelector, categories, activeCategory, onCategoryChange) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.innerHTML = [
      `<button class="category-btn${activeCategory === "all" ? " active" : ""}" data-category="all" type="button">All</button>`,
      ...categories.map((cat) =>
        `<button class="category-btn${activeCategory === cat.slug ? " active" : ""}" data-category="${a2zEscape(cat.slug)}" type="button">${a2zEscape(cat.name)}</button>`
      ),
    ].join("");
    container.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".category-btn").forEach((b) => b.classList.toggle("active", b === btn));
        onCategoryChange(btn.dataset.category);
      });
    });
  }

  function bindProductFilter(products, searchSelector, categorySelector, tableSelector, rowRenderer) {
    let activeCategory = "all";
    const searchInput = document.querySelector(searchSelector);
    const table = document.querySelector(tableSelector);

    function render() {
      const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
      const filtered = products.filter((row) => {
        const product = a2zDbProduct(row);
        const matchesCategory = activeCategory === "all" || product.category === activeCategory;
        const matchesSearch = !term || product.name.toLowerCase().includes(term) || (product.sku && product.sku.toLowerCase().includes(term));
        return matchesCategory && matchesSearch;
      });
      renderRows(`${tableSelector} tbody`, rowRenderer(filtered));
    }

    if (searchInput) searchInput.addEventListener("input", render);
    render();
    return { setCategory: (cat) => { activeCategory = cat; render(); } };
  }

  async function loadDashboard() {
    const [productsResult, repairsResult, approvalsResult] = await Promise.all([
      a2zSupabase.from("products").select("id, is_active, inventory_quantity, low_stock_threshold"),
      a2zSupabase.from("repairs").select("id, job_number, device_name, model, status, received_at").order("received_at", { ascending: false }),
      a2zSupabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    if (productsResult.error || repairsResult.error || approvalsResult.error) return;
    const products = productsResult.data;
    const repairs = repairsResult.data;
    const stats = [
      products.length,
      products.filter((item) => item.is_active).length,
      products.filter((item) => item.inventory_quantity !== null && item.inventory_quantity <= item.low_stock_threshold && item.inventory_quantity > 0).length,
      products.filter((item) => item.inventory_quantity === 0).length,
      repairs.filter((item) => !["DELIVERED / COLLECTED", "RETURNED", "CANCELLED"].includes(item.status)).length,
      repairs.filter((item) => item.status === "REPAIRING").length,
      repairs.filter((item) => item.status === "READY").length,
      approvalsResult.count || 0,
    ];
    document.querySelectorAll(".stat-card strong").forEach((node, index) => { node.textContent = stats[index] ?? "0"; });
    renderRows("#dashboardRepairs", repairs.slice(0, 5).map((repair) => `<tr><td class="row-title">${a2zEscape(repair.job_number)}</td><td>${a2zEscape(`${repair.device_name} ${repair.model || ""}`.trim())}</td><td><span class="badge ${a2zStatusBadge(repair.status)}">${a2zEscape(repair.status)}</span></td><td>${a2zEscape(a2zFormatDate(repair.received_at, { day: "numeric", month: "short", year: "numeric" }))}</td><td><a href="repair-detail.html?id=${encodeURIComponent(repair.id)}">Open</a></td></tr>`).join(""));
  }

  async function loadPage(profile) {
    if (page === "dashboard") return loadDashboard();
    if (page === "products") {
      const [{ data: categoryRows }, { data: productsData }] = await Promise.all([
        a2zSupabase.from("categories").select("name, slug").order("sort_order"),
        a2zSupabase.from("products").select("*, category:categories(slug, name)").order("created_at", { ascending: false }),
      ]);
      if (categoryRows && productsData) {
        const filter = bindProductFilter(productsData, "#productSearch", "#productCategoryList", "#productsTable", productRows);
        renderCategoryChips("#productCategoryList", categoryRows, "all", (cat) => filter.setCategory(cat));
      }
      return;
    }
    if (page === "inventory") {
      const [{ data: categoryRows }, { data: productsData }] = await Promise.all([
        a2zSupabase.from("categories").select("name, slug").order("sort_order"),
        a2zSupabase.from("products").select("*, category:categories(slug, name)").order("name"),
      ]);
      if (categoryRows && productsData) {
        const filter = bindProductFilter(productsData, "#inventorySearch", "#inventoryCategoryList", "#inventoryTable", inventoryRows);
        renderCategoryChips("#inventoryCategoryList", categoryRows, "all", (cat) => filter.setCategory(cat));
      }
      return;
    }
    if (page === "repairs") {
      const { data } = await a2zSupabase.from("repairs").select("*").order("received_at", { ascending: false });
      if (data) renderRows("#repairsTable tbody", repairRows(data));
      return;
    }
    if (page === "enquiries") {
      const { data, error } = await a2zSupabase.from("enquiries").select("id, customer_name, customer_phone, customer_email, subject, status, created_at").order("created_at", { ascending: false });
      if (error) {
        renderRows("#enquiriesTable tbody", `<tr><td colspan="7" class="form-note" style="padding:16px;">Could not load enquiries (${a2zEscape(error.message)}). If this mentions a missing column, run supabase/migrations/20261002_enquiry_status.sql in the Supabase SQL Editor.</td></tr>`);
        return;
      }
      if (data) renderRows("#enquiriesTable tbody", data.map((enquiry) => `<tr data-status="${a2zEscape(enquiry.status.toLowerCase())}">
        <td>${a2zEscape(a2zFormatDate(enquiry.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}</td>
        <td class="row-title">${a2zEscape(enquiry.customer_name)}</td>
        <td>${a2zEscape(enquiry.customer_phone)}</td>
        <td>${a2zEscape(enquiry.customer_email || "—")}</td>
        <td>${a2zEscape(enquiry.subject)}</td>
        <td><span class="badge ${enquiry.status === "NEW" ? "badge-received" : enquiry.status === "IN PROGRESS" ? "badge-repairing" : "badge-delivered"}">${a2zEscape(enquiry.status)}</span></td>
        <td><a href="enquiry-detail.html?id=${encodeURIComponent(enquiry.id)}">Open</a></td>
      </tr>`).join("") || '<tr><td colspan="7" class="form-note" style="padding:16px;">No enquiries yet.</td></tr>');
      return;
    }
    if (page === "categories") {
      const { data } = await a2zSupabase.from("categories").select("id, name, slug, sort_order, is_active, products(count)").order("sort_order");
      if (data) renderRows("#categoriesTable tbody", data.map((category) => `<tr><td>${category.sort_order ?? "—"}</td><td class="row-title">${a2zEscape(category.name)}</td><td>${a2zEscape(category.slug)}</td><td>${category.products?.[0]?.count || 0}</td><td><span class="badge ${category.is_active ? "badge-instock" : "badge-cancelled"}">${category.is_active ? "Active" : "Inactive"}</span></td><td class="row-actions"><a class="btn btn-outline btn-sm" href="category-form.html?id=${encodeURIComponent(category.id)}">Edit</a></td></tr>`).join(""));
      return;
    }
    if (page === "posters") {
      const { data } = await a2zSupabase.from("posters").select("id, image_url, item_name, price, sort_order, is_active").order("sort_order");
      if (data) renderRows("#postersTable tbody", data.map((poster) => `<tr><td>${poster.sort_order ?? "—"}</td><td><img src="${a2zEscape(poster.image_url)}" alt="${a2zEscape(poster.item_name)}" style="max-width:80px;max-height:60px;object-fit:cover;border-radius:4px;"></td><td class="row-title">${a2zEscape(poster.item_name)}</td><td>${poster.price !== null ? "₹" + Number(poster.price).toLocaleString("en-IN") : "—"}</td><td><span class="badge ${poster.is_active ? "badge-instock" : "badge-cancelled"}">${poster.is_active ? "Active" : "Inactive"}</span></td><td class="row-actions"><a class="btn btn-outline btn-sm" href="poster-form.html?id=${encodeURIComponent(poster.id)}">Edit</a></td></tr>`).join(""));
      return;
    }
    if (page === "admins") {
      const { data } = await a2zSupabase.from("profiles").select("id, full_name, email, role, is_active, created_at").order("created_at");
      if (data) renderRows("#adminsTable tbody", data.map((admin) => `<tr><td class="row-title">${a2zEscape(admin.full_name)}</td><td>${a2zEscape(admin.email || "—")}</td><td><span class="badge ${admin.role === "web_owner" ? "badge-approved" : admin.role === "shop_owner" ? "badge-repairing" : "badge-checking"}">${a2zEscape(admin.role.replaceAll("_", " "))}</span></td><td><span class="badge ${admin.is_active ? "badge-instock" : "badge-cancelled"}">${admin.is_active ? "Active" : "Inactive"}</span></td><td>${a2zEscape(a2zFormatDate(admin.created_at, { day: "numeric", month: "short", year: "numeric" }))}</td><td class="row-actions"><a class="btn btn-outline btn-sm" href="admin-form.html?id=${encodeURIComponent(admin.id)}">Edit</a></td></tr>`).join(""));
      return;
    }
    if (page === "audit") {
      const { data } = await a2zSupabase.from("audit_logs").select("action, entity_type, description, created_at").order("created_at", { ascending: false }).limit(100);
      if (data) renderRows("#auditTable tbody", data.map((log) => `<tr><td>${a2zEscape(a2zFormatDate(log.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}</td><td>${a2zEscape(log.action)}</td><td>${a2zEscape(log.entity_type)}</td><td>${a2zEscape(log.description)}</td></tr>`).join(""));
      return;
    }
    if (page === "approvals") {
      const { data } = await a2zSupabase.from("approval_requests").select("id, entity_type, action_type, old_data, new_data, comment, created_at, submitted:profiles!approval_requests_submitted_by_fkey(full_name)").eq("status", "pending").order("created_at");
      const list = document.getElementById("approvalList");
      if (data && list) list.innerHTML = data.map((request) => `<div class="approval-card" data-id="${request.id}"><div class="approval-meta"><span><strong>${a2zEscape(request.entity_type)}</strong> — ${a2zEscape(request.action_type)}</span><span>Submitted by ${a2zEscape(request.submitted?.full_name || "Staff")} · ${a2zEscape(a2zFormatDate(request.created_at))}</span></div><div class="approval-change"><span class="old">${a2zEscape(JSON.stringify(request.old_data || {}))}</span><span class="arrow">→</span><span class="new">${a2zEscape(JSON.stringify(request.new_data || {}))}</span><span class="badge badge-waiting">Pending</span></div><div class="approval-meta"><span>${a2zEscape(request.comment || "No comment")}</span></div><div class="row-actions"><button class="btn btn-dark btn-sm" data-approval-action="approved">Approve</button><button class="btn btn-outline btn-sm" data-approval-action="rejected">Reject</button></div></div>`).join("") || '<div class="result-empty"><strong>No pending approvals.</strong></div>';
    }
  }

  function bindEvents(profile) {
    document.querySelectorAll("[data-table-search]").forEach((input) => {
      input.addEventListener("input", () => {
        const body = document.querySelector(`${input.dataset.tableSearch} tbody`);
        if (!body) return;
        const term = input.value.trim().toLowerCase();
        body.querySelectorAll("tr").forEach((row) => { row.hidden = Boolean(term && !row.textContent.toLowerCase().includes(term)); });
      });
    });

    document.addEventListener("click", async (event) => {
      const logout = event.target.closest(".admin-logout");
      if (logout) {
        event.preventDefault();
        await a2zSupabase.auth.signOut();
        window.location.replace("login.html");
        return;
      }
      const step = event.target.closest(".stepper button");
      if (step) {
        const stepper = step.closest(".stepper");
        const output = stepper.querySelector("output");
        const next = Math.max(0, Number(output.textContent) + Number(step.dataset.step));
        step.disabled = true;
        const { error } = await a2zSupabase.from("products").update({ inventory_quantity: next }).eq("id", stepper.dataset.productId);
        step.disabled = false;
        if (!error) output.textContent = next;
        return;
      }
      const featureToggle = event.target.closest("[data-feature-toggle]");
      if (featureToggle) {
        const next = featureToggle.getAttribute("aria-pressed") !== "true";
        featureToggle.disabled = true;
        const { error } = await a2zSupabase.from("products").update({ is_featured: next }).eq("id", featureToggle.dataset.featureToggle);
        featureToggle.disabled = false;
        if (!error) {
          featureToggle.classList.toggle("active", next);
          featureToggle.setAttribute("aria-pressed", String(next));
        }
        return;
      }
      const approval = event.target.closest("[data-approval-action]");
      if (approval) {
        const card = approval.closest(".approval-card");
        approval.disabled = true;
        const { error } = await a2zSupabase.from("approval_requests").update({ status: approval.dataset.approvalAction, approved_by: profile.id, approved_at: new Date().toISOString() }).eq("id", card.dataset.id);
        if (!error) card.remove();
        else approval.disabled = false;
      }
    });

    if (page === "repairs" || page === "enquiries") {
      const tableSelector = page === "repairs" ? "#repairsTable" : "#enquiriesTable";
      document.querySelectorAll(".category-btn[data-status]").forEach((chip) => {
        chip.addEventListener("click", () => {
          document.querySelectorAll(".category-btn[data-status]").forEach((item) => item.classList.toggle("active", item === chip));
          document.querySelectorAll(`${tableSelector} tbody tr`).forEach((row) => { row.hidden = chip.dataset.status !== "all" && !row.dataset.status.startsWith(chip.dataset.status); });
        });
      });
    }
  }

  async function loadAdmin() {
    if (!a2zSupabase) {
      window.location.replace("login.html");
      return;
    }
    const { data: userData } = await a2zSupabase.auth.getUser();
    if (!userData.user) {
      window.location.replace("login.html");
      return;
    }
    const { data: profile, error } = await a2zSupabase.from("profiles").select("id, full_name, role, is_active").eq("id", userData.user.id).maybeSingle();
    if (error || !profile?.is_active) {
      await a2zSupabase.auth.signOut();
      window.location.replace("login.html");
      return;
    }
    setAdminIdentity(profile);
    bindEvents(profile);
    loadPage(profile);
  }

  if (page === "admin-login") loadLogin();
  else loadAdmin();
})();
