(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const isEdit = Boolean(id);

  const form        = document.getElementById("productForm");
  const pageTitle   = document.getElementById("pfPageTitle");
  const panelTitle  = document.getElementById("pfPanelTitle");
  const submitBtn   = document.getElementById("pfSubmit");
  const note        = document.getElementById("pfNote");

  const pfName      = document.getElementById("pfName");
  const pfCategory  = document.getElementById("pfCategory");
  const pfSku       = document.getElementById("pfSku");
  const pfDesc      = document.getElementById("pfDesc");
  const pfPrice     = document.getElementById("pfPrice");
  const pfNoPrice   = document.getElementById("pfNoPrice");
  const pfStock     = document.getElementById("pfStock");
  const pfLowStock  = document.getElementById("pfLowStock");
  const pfShowStock = document.getElementById("pfShowStock");
  const pfStatus    = document.getElementById("pfStatus");

  const pfImage       = document.getElementById("pfImage");
  const pfImgBtn      = document.getElementById("pfImgBtn");
  const pfImgRemove   = document.getElementById("pfImgRemove");
  const pfImgPreview  = document.getElementById("pfImgPreview");
  const pfImgPlaceholder = document.getElementById("pfImgPlaceholder");
  const pfImgFileName = document.getElementById("pfImgFileName");

  if (isEdit) {
    document.title   = "Edit Product — A to Z Admin";
    pageTitle.textContent  = "Edit Product";
    panelTitle.textContent = "Update product details";
    submitBtn.textContent  = "Save Changes";
  }

  /* ── image state ─────────────────────────────────── */
  let currentImageUrl = null;
  let newImageFile    = null;
  let removeImage     = false;

  function showPreview(src, filename) {
    pfImgPreview.src = src;
    pfImgPreview.style.display = "block";
    pfImgPlaceholder.style.display = "none";
    pfImgRemove.style.display = "";
    if (filename) pfImgFileName.textContent = filename;
  }

  function clearPreview() {
    pfImgPreview.src = "";
    pfImgPreview.style.display = "none";
    pfImgPlaceholder.style.display = "";
    pfImgRemove.style.display = "none";
    pfImgFileName.textContent = "";
    newImageFile = null;
    pfImage.value = "";
  }

  pfImgBtn.addEventListener("click", () => pfImage.click());

  pfImage.addEventListener("change", () => {
    const file = pfImage.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      note.textContent = "Image must be under 2 MB. Please choose a smaller file.";
      pfImage.value = "";
      return;
    }
    note.textContent = "";
    newImageFile = file;
    removeImage  = false;
    const reader = new FileReader();
    reader.onload = (e) => showPreview(e.target.result, file.name);
    reader.readAsDataURL(file);
  });

  pfImgRemove.addEventListener("click", () => {
    clearPreview();
    currentImageUrl = null;
    removeImage     = true;
  });

  /* ── price toggle ────────────────────────────────── */
  pfNoPrice.addEventListener("change", () => {
    pfPrice.disabled = pfNoPrice.checked;
    if (pfNoPrice.checked) pfPrice.value = "";
  });

  /* ── category select ─────────────────────────────── */
  async function buildCategorySelect(selectedId) {
    const { data, error } = await a2zSupabase
      .from("categories").select("id, name").order("sort_order");
    if (error || !data) { note.textContent = "Could not load categories."; return; }
    pfCategory.innerHTML =
      '<option value="">— Select category —</option>' +
      data.map((c) =>
        `<option value="${a2zEscape(c.id)}"${c.id === selectedId ? " selected" : ""}>${a2zEscape(c.name)}</option>`
      ).join("");
  }

  /* ── load existing product (edit mode) ───────────── */
  async function loadForEdit() {
    note.textContent = "Loading…";
    const { data, error } = await a2zSupabase
      .from("products").select("*").eq("id", id).maybeSingle();
    note.textContent = "";
    if (error || !data) {
      note.textContent = "Product not found.";
      submitBtn.disabled = true;
      return;
    }

    pfName.value        = data.name;
    pfSku.value         = data.sku || "";
    pfDesc.value        = data.description || "";
    pfNoPrice.checked   = data.price === null;
    pfPrice.disabled    = data.price === null;
    if (data.price !== null) pfPrice.value = data.price;
    pfStock.value       = data.inventory_quantity ?? "";
    pfLowStock.value    = data.low_stock_threshold ?? "";
    pfShowStock.checked = Boolean(data.show_inventory_public);
    pfStatus.value      = String(data.is_active);

    if (data.image_url) {
      currentImageUrl = data.image_url;
      showPreview(data.image_url, "");
      pfImgFileName.textContent = "Current image";
    }

    await buildCategorySelect(data.category_id);
  }

  /* ── upload image to Supabase Storage ────────────── */
  async function uploadImage(file, slug) {
    const ext  = file.name.split(".").pop().toLowerCase() || "jpg";
    const path = `${slug}/${Date.now()}.${ext}`;
    const { data: upload, error } = await a2zSupabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = a2zSupabase.storage
      .from("product-images")
      .getPublicUrl(upload.path);
    return publicUrl;
  }

  function slugify(name) {
    return name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* ── submit ──────────────────────────────────────── */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!pfCategory.value) {
      note.textContent = "Please select a category.";
      return;
    }

    submitBtn.disabled = true;
    note.textContent = isEdit ? "Saving changes…" : "Adding product…";

    const name = pfName.value.trim();
    const slug = isEdit
      ? null  // don't change slug on edit
      : slugify(name);

    /* handle image */
    let imageUrl = currentImageUrl;
    if (removeImage) imageUrl = null;
    if (newImageFile) {
      try {
        note.textContent = "Uploading image…";
        imageUrl = await uploadImage(newImageFile, slug || slugify(name));
      } catch (err) {
        submitBtn.disabled = false;
        note.textContent = `Image upload failed: ${err.message}`;
        return;
      }
    }

    const payload = {
      name,
      category_id:           pfCategory.value,
      description:           pfDesc.value.trim() || name,
      sku:                   pfSku.value.trim() || null,
      price:                 pfNoPrice.checked ? null : (pfPrice.value !== "" ? Number(pfPrice.value) : null),
      inventory_quantity:    pfStock.value !== "" ? Number(pfStock.value) : null,
      low_stock_threshold:   pfLowStock.value !== "" ? Number(pfLowStock.value) : null,
      show_inventory_public: pfShowStock.checked,
      is_active:             pfStatus.value === "true",
      image_url:             imageUrl,
    };
    if (!isEdit) payload.slug = slug;

    note.textContent = isEdit ? "Saving changes…" : "Adding product…";
    const { error } = isEdit
      ? await a2zSupabase.from("products").update(payload).eq("id", id)
      : await a2zSupabase.from("products").insert(payload);

    if (error) {
      submitBtn.disabled = false;
      note.textContent = a2zSupabaseError(error);
      return;
    }

    window.location.href = "products.html";
  });

  /* ── init ────────────────────────────────────────── */
  if (isEdit) loadForEdit();
  else buildCategorySelect(null);
})();
