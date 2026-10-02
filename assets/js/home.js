(function () {
  const grid = document.getElementById("featuredGrid");
  if (grid && a2zSupabase) {
    function artHtml(product) {
      if (product.imageUrl) {
        return `<div class="product-art product-art--img"><img src="${a2zEscape(product.imageUrl)}" alt="${a2zEscape(product.name)}" loading="lazy"></div>`;
      }
      return `<div class="product-art ${a2zEscape(product.art)}"><span class="art-icon">${a2zEscape(product.icon)}</span><span class="art-code">${a2zEscape(product.code)}</span></div>`;
    }

    function cardHtml(product) {
      return `
        <article class="product-card">
          <a href="product.html?p=${encodeURIComponent(product.slug)}" aria-label="View ${a2zEscape(product.name)}">
            ${artHtml(product)}
          </a>
          <div class="product-card-body">
            <span class="card-kicker">${a2zEscape(product.kicker)}</span>
            <h3>${a2zEscape(product.name)}</h3>
            <p>${a2zEscape(product.desc)}</p>
            <div class="card-footer"><strong>${a2zFormatPrice(product)}</strong><a href="product.html?p=${encodeURIComponent(product.slug)}">View →</a></div>
          </div>
        </article>`;
    }

    async function loadFeatured() {
      const { data, error } = await a2zSupabase
        .from("products")
        .select("*, category:categories(slug, name)")
        .eq("is_featured", true)
        .limit(4);
      if (error || !data?.length) return;
      grid.innerHTML = data.map(a2zDbProduct).map(cardHtml).join("");
    }

    loadFeatured();
  }

  const carousel = document.getElementById("posterCarousel");
  const track = document.getElementById("carouselTrack");
  const dots = document.getElementById("carouselDots");
  const heroFallback = document.getElementById("heroFallback");
  if (!carousel || !track || !a2zSupabase) return;

  let currentIndex = 0;
  let slideCount = 0;
  let autoTimer = null;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  function goTo(index) {
    if (slideCount === 0) return;
    currentIndex = ((index % slideCount) + slideCount) % slideCount;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }

  function startAuto() {
    stopAuto();
    if (slideCount <= 1) return;
    autoTimer = setInterval(() => goTo(currentIndex + 1), 5000);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  function onDragStart(x) {
    isDragging = true;
    startX = x;
    currentX = x;
    stopAuto();
    track.style.transition = "none";
  }

  function onDragMove(x) {
    if (!isDragging) return;
    currentX = x;
    const diff = currentX - startX;
    const pct = -currentIndex * 100 + (diff / carousel.offsetWidth) * 100;
    track.style.transform = `translateX(${pct}%)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "";
    const diff = currentX - startX;
    const threshold = carousel.offsetWidth * 0.2;
    if (diff < -threshold) goTo(currentIndex + 1);
    else if (diff > threshold) goTo(currentIndex - 1);
    else goTo(currentIndex);
    startAuto();
  }

  track.addEventListener("touchstart", (e) => onDragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchmove", (e) => onDragMove(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", onDragEnd);
  track.addEventListener("mousedown", (e) => { e.preventDefault(); onDragStart(e.clientX); });
  track.addEventListener("mousemove", (e) => onDragMove(e.clientX));
  track.addEventListener("mouseup", onDragEnd);
  track.addEventListener("mouseleave", () => { if (isDragging) onDragEnd(); });

  carousel.querySelector(".carousel-prev").addEventListener("click", () => { goTo(currentIndex - 1); startAuto(); });
  carousel.querySelector(".carousel-next").addEventListener("click", () => { goTo(currentIndex + 1); startAuto(); });

  async function loadPosters() {
    const { data, error } = await a2zSupabase
      .from("posters")
      .select("id, image_url, item_name, price, product_id")
      .eq("is_active", true)
      .order("sort_order");
    if (error || !data?.length) {
      carousel.style.display = "none";
      if (heroFallback) heroFallback.style.display = "";
      return;
    }

    if (heroFallback) heroFallback.style.display = "none";
    slideCount = data.length;

    track.innerHTML = data.map((poster) => {
      const priceHtml = poster.price != null
        ? `<span class="carousel-price">₹${Number(poster.price).toLocaleString("en-IN")}</span>`
        : "";
      const link = poster.product_id ? `product.html?id=${encodeURIComponent(poster.product_id)}` : "shop.html";
      return `<a class="carousel-slide" href="${link}">
        <img src="${a2zEscape(poster.image_url)}" alt="${a2zEscape(poster.item_name || "")}" loading="lazy">
        <div class="carousel-overlay">
          <h2>${a2zEscape(poster.item_name || "")}</h2>
          ${priceHtml}
        </div>
      </a>`;
    }).join("");

    dots.innerHTML = data.map((_, i) =>
      `<button class="carousel-dot${i === 0 ? " active" : ""}" type="button" aria-label="Go to slide ${i + 1}" data-index="${i}"></button>`
    ).join("");

    dots.querySelectorAll(".carousel-dot").forEach((dot) => {
      dot.addEventListener("click", () => { goTo(Number(dot.dataset.index)); startAuto(); });
    });

    goTo(0);
    startAuto();
  }

  loadPosters();
})();
