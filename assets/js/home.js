(function () {
  const grid = document.getElementById("featuredGrid");
  if (!grid || !a2zSupabase) return;

  function cardHtml(product) {
    return `
      <article class="product-card">
        <a href="product.html?p=${encodeURIComponent(product.slug)}" aria-label="View ${a2zEscape(product.name)}">
          <div class="product-art ${a2zEscape(product.art)}"><span class="art-icon">${a2zEscape(product.icon)}</span><span class="art-code">${a2zEscape(product.code)}</span></div>
        </a>
        <div class="product-card-body">
          <span class="card-kicker">${a2zEscape(product.kicker)}</span>
          <h3>${a2zEscape(product.name)}</h3>
          <p>${a2zEscape(product.desc)}</p>
          <div class="card-footer"><strong>${a2zFormatPrice(product)}</strong><a href="product.html?p=${encodeURIComponent(product.slug)}">View →</a></div>
        </div>
      </article>`;
  }

  async function load() {
    const { data, error } = await a2zSupabase
      .from("products")
      .select("*, category:categories(slug, name)")
      .eq("is_featured", true)
      .limit(4);
    if (error || !data?.length) return;
    grid.innerHTML = data.map(a2zDbProduct).map(cardHtml).join("");
  }

  load();
})();
