(function () {
  const root = document.getElementById("productDetail");
  const relatedWrap = document.getElementById("relatedWrap");
  const relatedGrid = document.getElementById("relatedGrid");
  const slug = new URLSearchParams(location.search).get("p");
  if (!root) return;

  function showMissing(message) {
    root.innerHTML = `<div class="result-empty"><strong>${a2zEscape(message)}</strong><span>Browse the shop for current items.</span><div style="margin-top:16px;"><a class="btn btn-dark" href="shop.html">Back to Shop</a></div></div>`;
    relatedWrap.hidden = true;
  }

  function cardHtml(item) {
    const artBlock = item.imageUrl
      ? `<div class="product-art product-art--img"><img src="${a2zEscape(item.imageUrl)}" alt="${a2zEscape(item.name)}" loading="lazy"></div>`
      : `<div class="product-art ${a2zEscape(item.art)}"><span class="art-icon">${a2zEscape(item.icon)}</span><span class="art-code">${a2zEscape(item.code)}</span></div>`;
    return `
      <article class="product-card">
        <a href="product.html?p=${encodeURIComponent(item.slug)}" aria-label="View ${a2zEscape(item.name)}">${artBlock}</a>
        <div class="product-card-body">
          <span class="card-kicker">${a2zEscape(item.kicker)}</span>
          <h3>${a2zEscape(item.name)}</h3>
          <p>${a2zEscape(item.desc)}</p>
          <div class="card-footer"><strong>${a2zFormatPrice(item)}</strong><a href="product.html?p=${encodeURIComponent(item.slug)}">View →</a></div>
        </div>
      </article>`;
  }

  async function load() {
    if (!a2zSupabase) {
      showMissing("Product information is temporarily unavailable.");
      return;
    }
    if (!slug) {
      showMissing("Product not found.");
      return;
    }

    const { data: row, error } = await a2zSupabase
      .from("products")
      .select("*, category:categories(slug, name)")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !row) {
      showMissing(error ? "Product information is temporarily unavailable." : "Product not found.");
      return;
    }

    const product = a2zDbProduct(row);
    const stock = a2zStockLabel(product);
    const specs = product.specs.map(([key, value]) => `<li><span>${a2zEscape(key)}</span><strong>${a2zEscape(value)}</strong></li>`).join("");
    const galleryClass = product.imageUrl ? "product-gallery product-gallery--img" : `product-gallery ${a2zEscape(product.art)}`;
    const galleryInner = product.imageUrl
      ? `<img src="${a2zEscape(product.imageUrl)}" alt="${a2zEscape(product.name)}">`
      : `<span class="art-icon">${a2zEscape(product.icon)}</span><span class="art-code">${a2zEscape(product.code)}</span>`;
    document.title = `${product.name} — A to Z Mobile Accessories`;
    root.innerHTML = `
      <div class="product-layout">
        <div class="${galleryClass}">${galleryInner}</div>
        <div class="product-info">
          <span class="eyebrow">${a2zEscape(product.kicker)}</span>
          <h1>${a2zEscape(product.name)}</h1>
          <span class="badge ${stock.badge}">${a2zEscape(stock.text)}</span>
          <div class="price-large">${a2zFormatPrice(product)}</div>
          <p class="desc">${a2zEscape(product.longDesc)}</p>
          <ul class="spec-list">${specs}<li><span>SKU</span><strong>${a2zEscape(product.sku)}</strong></li></ul>
          <div class="product-actions"><a class="btn btn-coral" href="contact.html?product=${encodeURIComponent(product.slug)}">Enquire about this item</a><a class="btn btn-outline" href="shop.html">Back to Shop</a></div>
        </div>
      </div>`;

    const { data: relatedRows } = await a2zSupabase
      .from("products")
      .select("*, category:categories(slug, name)")
      .eq("category_id", product.categoryId)
      .neq("id", product.id)
      .limit(4);
    const related = (relatedRows || []).map(a2zDbProduct);
    if (related.length) relatedGrid.innerHTML = related.map(cardHtml).join("");
    else relatedWrap.hidden = true;
  }

  load();
})();
