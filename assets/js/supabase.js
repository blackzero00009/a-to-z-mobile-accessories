const A2Z_SUPABASE_URL = "https://vorhynlpfquqgektbvpn.supabase.co";
const A2Z_SUPABASE_KEY = "sb_publishable_5sKgI_U8S_U6jyERR_GZhA_bJJ-WpUb";
const a2zSupabase = window.supabase
  ? window.supabase.createClient(A2Z_SUPABASE_URL, A2Z_SUPABASE_KEY)
  : null;

function a2zEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function a2zFormatDate(value, options) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", options || {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function a2zDbProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    category: row.category?.slug || "",
    kicker: row.category?.name || "",
    price: row.price == null ? null : Number(row.price),
    desc: row.description,
    longDesc: row.long_description || row.description,
    art: row.art_class,
    icon: row.art_icon,
    code: row.product_code || row.sku || "",
    sku: row.sku || "—",
    stock: row.inventory_quantity,
    lowStockAt: row.low_stock_threshold,
    showInventory: row.show_inventory_public,
    featured: row.is_featured,
    specs: Array.isArray(row.specs) ? row.specs : [],
    active: row.is_active,
    imageUrl: row.image_url || null,
  };
}

function a2zSupabaseError(error) {
  return error?.message || "Unable to connect to the service. Please try again.";
}
