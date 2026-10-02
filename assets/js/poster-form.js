(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const isEdit = Boolean(id);

  const form       = document.getElementById("posterForm");
  const pageTitle  = document.getElementById("pfPageTitle");
  const panelTitle = document.getElementById("pfPanelTitle");
  const submitBtn  = document.getElementById("pfSubmit");
  const note       = document.getElementById("pfNote");

  const pfImage       = document.getElementById("pfImage");
  const pfImageBox    = document.getElementById("pfImageBox");
  const pfImagePreview = document.getElementById("pfImagePreview");
  const pfUploadHint  = document.getElementById("pfUploadHint");
  const pfItemName    = document.getElementById("pfItemName");
  const pfPrice       = document.getElementById("pfPrice");
  const pfSortOrder   = document.getElementById("pfSortOrder");
  const pfProduct     = document.getElementById("pfProduct");
  const pfStatus      = document.getElementById("pfStatus");

  if (isEdit) {
    document.title         = "Edit Poster — A to Z Admin";
    pageTitle.textContent  = "Edit Poster";
    panelTitle.textContent = "Update poster details";
    submitBtn.textContent  = "Save Changes";
  }

  let currentImageUrl = null;

  pfImage.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      note.textContent = "Please select an image file.";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      note.textContent = "Image must be under 5MB.";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      pfImagePreview.src = e.target.result;
      pfImagePreview.style.display = "block";
      pfUploadHint.style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  async function loadProducts() {
    const { data } = await a2zSupabase
      .from("products")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (!data) return;
    pfProduct.innerHTML = '<option value="">— No link —</option>' +
      data.map((p) => `<option value="${p.id}">${a2zEscape(p.name)}</option>`).join("");
  }

  async function loadForEdit() {
    note.textContent = "Loading…";
    const { data, error } = await a2zSupabase
      .from("posters").select("*").eq("id", id).maybeSingle();
    note.textContent = "";
    if (error || !data) {
      note.textContent = "Poster not found.";
      submitBtn.disabled = true;
      return;
    }
    currentImageUrl = data.image_url;
    pfImagePreview.src = data.image_url;
    pfImagePreview.style.display = "block";
    pfUploadHint.style.display = "none";
    pfItemName.value  = data.item_name;
    pfPrice.value     = data.price ?? "";
    pfSortOrder.value = data.sort_order ?? "";
    pfProduct.value   = data.product_id || "";
    pfStatus.value    = String(data.is_active);
  }

  async function nextSortOrder() {
    const { data } = await a2zSupabase
      .from("posters").select("sort_order")
      .order("sort_order", { ascending: false }).limit(1);
    return (data?.[0]?.sort_order ?? -1) + 1;
  }

  async function uploadImage(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `posters/${fileName}`;

    const { error } = await a2zSupabase.storage
      .from("poster-images")
      .upload(filePath, file, { upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = a2zSupabase.storage
      .from("poster-images")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    note.textContent = isEdit ? "Saving changes…" : "Adding poster…";
    note.classList.remove("warn");

    const itemName  = pfItemName.value.trim();
    const price     = pfPrice.value !== "" ? Number(pfPrice.value) : null;
    const sortOrder = pfSortOrder.value !== "" ? Number(pfSortOrder.value) : null;
    const productId = pfProduct.value || null;

    let imageUrl = currentImageUrl;

    if (pfImage.files[0]) {
      try {
        note.textContent = "Uploading image…";
        imageUrl = await uploadImage(pfImage.files[0]);
      } catch (err) {
        submitBtn.disabled = false;
        note.textContent = "Image upload failed: " + err.message;
        return;
      }
    }

    if (!imageUrl) {
      submitBtn.disabled = false;
      note.textContent = "Please upload an image.";
      return;
    }

    const payload = {
      image_url:  imageUrl,
      item_name:  itemName,
      price:      price,
      product_id: productId,
      is_active:  pfStatus.value === "true",
    };
    if (sortOrder !== null || !isEdit) payload.sort_order = sortOrder;
    if (!isEdit && payload.sort_order === null) payload.sort_order = await nextSortOrder();

    const { error } = isEdit
      ? await a2zSupabase.from("posters").update(payload).eq("id", id)
      : await a2zSupabase.from("posters").insert(payload);

    if (error) {
      submitBtn.disabled = false;
      note.textContent = a2zSupabaseError(error);
      return;
    }

    window.location.href = "posters.html";
  });

  (async () => {
    await loadProducts();
    if (isEdit) await loadForEdit();
  })();
})();
