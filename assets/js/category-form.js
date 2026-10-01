(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const isEdit = Boolean(id);

  const form       = document.getElementById("categoryForm");
  const pageTitle  = document.getElementById("cfPageTitle");
  const panelTitle = document.getElementById("cfPanelTitle");
  const submitBtn  = document.getElementById("cfSubmit");
  const note       = document.getElementById("cfNote");

  const cfName      = document.getElementById("cfName");
  const cfSlug      = document.getElementById("cfSlug");
  const cfSortOrder = document.getElementById("cfSortOrder");
  const cfDesc      = document.getElementById("cfDesc");
  const cfStatus    = document.getElementById("cfStatus");

  if (isEdit) {
    document.title    = "Edit Category — A to Z Admin";
    pageTitle.textContent  = "Edit Category";
    panelTitle.textContent = "Update category details";
    submitBtn.textContent  = "Save Changes";
  }

  function slugify(name) {
    return name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* live slug preview while typing (add mode only) */
  if (!isEdit) {
    cfName.addEventListener("input", () => { cfSlug.value = slugify(cfName.value); });
  }

  async function loadForEdit() {
    note.textContent = "Loading…";
    const { data, error } = await a2zSupabase
      .from("categories").select("*").eq("id", id).maybeSingle();
    note.textContent = "";
    if (error || !data) {
      note.textContent = "Category not found.";
      submitBtn.disabled = true;
      return;
    }
    cfName.value      = data.name;
    cfSlug.value      = data.slug;
    cfSortOrder.value = data.sort_order ?? "";
    cfDesc.value      = data.description || "";
    cfStatus.value    = String(data.is_active);
  }

  async function nextSortOrder() {
    const { data } = await a2zSupabase
      .from("categories").select("sort_order")
      .order("sort_order", { ascending: false }).limit(1);
    return (data?.[0]?.sort_order ?? -1) + 1;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    note.textContent = isEdit ? "Saving changes…" : "Adding category…";

    const name = cfName.value.trim();
    const sortOrder = cfSortOrder.value !== "" ? Number(cfSortOrder.value) : null;
    const payload = {
      name,
      description: cfDesc.value.trim() || null,
      is_active:   cfStatus.value === "true",
    };
    if (sortOrder !== null || !isEdit) payload.sort_order = sortOrder;

    if (!isEdit) {
      payload.slug = slugify(name);
      if (payload.sort_order === null) payload.sort_order = await nextSortOrder();
    }

    const { error } = isEdit
      ? await a2zSupabase.from("categories").update(payload).eq("id", id)
      : await a2zSupabase.from("categories").insert(payload);

    if (error) {
      submitBtn.disabled = false;
      note.textContent = error.code === "23505"
        ? "A category with this name (or very similar) already exists. Please use a different name."
        : a2zSupabaseError(error);
      return;
    }

    window.location.href = "categories.html";
  });

  if (isEdit) loadForEdit();
})();
