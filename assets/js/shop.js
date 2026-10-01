(function () {
  const grid = document.getElementById("productGrid");
  const categoryList = document.querySelector(".category-list");
  const searchInput = document.getElementById("productSearch");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");
  if (!grid || !a2zSupabase) {
    if (grid) grid.innerHTML = '<div class="result-empty"><strong>Shop is temporarily unavailable.</strong><span>Please try again shortly.</span></div>';
    return;
  }

  let products = [];
  let activeCategory = new URLSearchParams(location.search).get("cat") || "all";

  function artHtml(product, cssClass) {
    if (product.imageUrl) {
      return `<div class="${cssClass} product-art--img"><img src="${a2zEscape(product.imageUrl)}" alt="${a2zEscape(product.name)}" loading="lazy"></div>`;
    }
    return `<div class="${cssClass} ${a2zEscape(product.art)}"><span class="art-icon">${a2zEscape(product.icon)}</span><span class="art-code">${a2zEscape(product.code)}</span></div>`;
  }

  function cardHtml(product) {
    const stock = a2zStockLabel(product);
    return `
      <article class="product-card" data-category="${a2zEscape(product.category)}">
        <a href="product.html?p=${encodeURIComponent(product.slug)}" aria-label="View ${a2zEscape(product.name)}">
          ${artHtml(product, "product-art")}
        </a>
        <div class="product-card-body">
          <span class="card-kicker">${a2zEscape(product.kicker)}</span>
          <h3>${a2zEscape(product.name)}</h3>
          <p>${a2zEscape(product.desc)}</p>
          <div class="card-footer">
            <strong>${a2zFormatPrice(product)}</strong>
            <a href="product.html?p=${encodeURIComponent(product.slug)}" aria-label="View ${a2zEscape(product.name)}">View →</a>
          </div>
          <div class="card-footer" style="margin-top:8px;padding-top:10px;">
            <span class="badge ${stock.badge}">${a2zEscape(stock.text)}</span>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const term = searchInput.value.trim().toLowerCase();
    const items = products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      return matchesCategory && (!term || product.name.toLowerCase().includes(term));
    });
    grid.innerHTML = items.map(cardHtml).join("");
    resultCount.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
    emptyState.hidden = items.length !== 0;
  }

  function bindFilters() {
    const buttons = categoryList.querySelectorAll(".category-btn");
    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.category === activeCategory);
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        history.replaceState(null, "", activeCategory === "all" ? "shop.html" : `shop.html?cat=${encodeURIComponent(activeCategory)}`);
        buttons.forEach((item) => item.classList.toggle("active", item === button));
        render();
      });
    });
  }

  async function load() {
    const [{ data: categoryRows, error: categoryError }, { data: productRows, error: productError }] = await Promise.all([
      a2zSupabase.from("categories").select("name, slug").order("sort_order"),
      a2zSupabase.from("products").select("*, category:categories(slug, name)").order("created_at"),
    ]);

    if (categoryError || productError) {
      grid.innerHTML = `<div class="result-empty"><strong>Shop is temporarily unavailable.</strong><span>${a2zEscape(a2zSupabaseError(categoryError || productError))}</span></div>`;
      resultCount.textContent = "";
      return;
    }

    categoryList.innerHTML = [
      '<button class="category-btn" data-category="all" type="button">All</button>',
      ...categoryRows.map((category) => `<button class="category-btn" data-category="${a2zEscape(category.slug)}" type="button">${a2zEscape(category.name)}</button>`),
    ].join("");
    products = productRows.map(a2zDbProduct);
    bindFilters();
    render();
  }

  searchInput.addEventListener("input", render);
  load();
})();
