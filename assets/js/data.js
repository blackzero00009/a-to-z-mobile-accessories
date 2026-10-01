/* Demo data for A to Z Mobile Accessories.
   Static placeholder content — will be replaced by Supabase-backed APIs later. */

const A2Z_CATEGORIES = [
  { slug: "covers",      name: "Mobile Covers",        kicker: "Mobile Covers" },
  { slug: "tempered",    name: "Tempered Glass",       kicker: "Screen Protection" },
  { slug: "audio",       name: "Audio",                kicker: "Audio" },
  { slug: "spare-parts", name: "Spare Parts",          kicker: "Spare Parts" },
  { slug: "laptop",      name: "Laptop Accessories",   kicker: "Laptop Accessories" },
  { slug: "services",    name: "Repair Services",      kicker: "Repair Services" },
];

const A2Z_PRODUCTS = [
  {
    slug: "shockproof-mobile-cover",
    name: "Shockproof Mobile Cover",
    category: "covers",
    price: 249,
    desc: "Protective case with a clean matte finish.",
    longDesc: "Impact-resistant mobile cover with raised edges for screen and camera protection. Matte anti-fingerprint finish available for all popular models.",
    art: "art-cover",
    icon: "▣",
    code: "A2Z / 01",
    sku: "A2Z-CVR-001",
    stock: 24,
    lowStockAt: 6,
    showInventory: true,
    featured: false,
    specs: [
      ["Material", "TPU + polycarbonate"],
      ["Fit", "All popular models"],
      ["Finish", "Matte anti-fingerprint"],
    ],
  },
  {
    slug: "9h-tempered-glass",
    name: "9H Tempered Glass",
    category: "tempered",
    price: 149,
    desc: "Clear protection for everyday screen use.",
    longDesc: "9H hardness tempered glass with oleophobic coating. Bubble-free installation with precise cut-outs for camera and sensors.",
    art: "art-tempered",
    icon: "◇",
    code: "A2Z / 02",
    sku: "A2Z-TPG-002",
    stock: 58,
    lowStockAt: 15,
    showInventory: true,
    featured: false,
    specs: [
      ["Hardness", "9H"],
      ["Coating", "Oleophobic anti-smudge"],
      ["Thickness", "0.33 mm"],
    ],
  },
  {
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    category: "audio",
    price: 1499,
    desc: "Compact everyday audio with charging case.",
    longDesc: "True wireless earbuds with a lightweight charging case. Clear calls, touch controls and up to 18 hours of total playtime.",
    art: "art-earbuds",
    icon: "◉",
    code: "A2Z / 03",
    sku: "A2Z-AUD-003",
    stock: 12,
    lowStockAt: 5,
    showInventory: true,
    featured: true,
    specs: [
      ["Playtime", "Up to 18 hrs with case"],
      ["Charging", "USB-C"],
      ["Bluetooth", "5.3"],
    ],
  },
  {
    slug: "over-ear-headphones",
    name: "Over-Ear Headphones",
    category: "audio",
    price: 899,
    desc: "Comfort-focused headphones for work and travel.",
    longDesc: "Padded over-ear headphones with balanced sound for long sessions. Foldable design with an in-line microphone for calls.",
    art: "art-headphones",
    icon: "◡",
    code: "A2Z / 04",
    sku: "A2Z-AUD-004",
    stock: 9,
    lowStockAt: 4,
    showInventory: true,
    featured: true,
    specs: [
      ["Type", "Over-ear wired"],
      ["Microphone", "In-line"],
      ["Design", "Foldable"],
    ],
  },
  {
    slug: "charging-port-parts",
    name: "Charging Port Parts",
    category: "spare-parts",
    price: null,
    desc: "Replacement parts for supported mobile models.",
    longDesc: "Replacement charging ports, flex cables and connectors for supported mobile models. Bring your device in for fitting.",
    art: "art-parts",
    icon: "＋",
    code: "A2Z / 05",
    sku: "A2Z-SPR-005",
    stock: 6,
    lowStockAt: 3,
    showInventory: false,
    featured: false,
    specs: [
      ["Type", "Charging port / flex"],
      ["Fitting", "In-shop service"],
      ["Warranty", "As per part"],
    ],
  },
  {
    slug: "laptop-chargers",
    name: "Laptop Chargers",
    category: "laptop",
    price: 799,
    desc: "Compatible chargers for selected laptop models.",
    longDesc: "Reliable compatible chargers for selected laptop brands. Voltage and pin-type checked in store before sale.",
    art: "art-laptop",
    icon: "▱",
    code: "A2Z / 06",
    sku: "A2Z-LAP-006",
    stock: 15,
    lowStockAt: 5,
    showInventory: true,
    featured: false,
    specs: [
      ["Power", "45W / 65W options"],
      ["Pin types", "Common models covered"],
      ["Check", "Tested in store"],
    ],
  },
  {
    slug: "mobile-repair",
    name: "Mobile Repair",
    category: "services",
    price: null,
    desc: "Diagnosis, component replacement and repair support.",
    longDesc: "Screen, battery, charging port, camera and board-level repair support for supported mobile devices. Free check-up with repair estimate.",
    art: "art-repair",
    icon: "⚒",
    code: "A2Z / 07",
    sku: "A2Z-SRV-007",
    stock: null,
    lowStockAt: null,
    showInventory: false,
    featured: false,
    specs: [
      ["Devices", "All major brands"],
      ["Estimate", "Free with check-up"],
      ["Status tracking", "Job number provided"],
    ],
  },
  {
    slug: "laptop-repair",
    name: "Laptop Repair",
    category: "services",
    price: null,
    desc: "Hardware and accessory troubleshooting for laptops.",
    longDesc: "Keyboard, battery, screen, charger-port and general troubleshooting for laptops. Parts sourced on request.",
    art: "art-laptop-repair",
    icon: "⌘",
    code: "A2Z / 08",
    sku: "A2Z-SRV-008",
    stock: null,
    lowStockAt: null,
    showInventory: false,
    featured: false,
    specs: [
      ["Devices", "All major brands"],
      ["Estimate", "Free with check-up"],
      ["Status tracking", "Job number provided"],
    ],
  },
];

/* Customer-safe repair records (demo). */
const A2Z_REPAIRS = {
  "AZ10027": {
    jobNumber: "AZ10027",
    item: "Samsung Galaxy A54",
    received: "27 September 2026 — 12:40 PM",
    problem: "Charging issue",
    status: "REPAIRING",
    condition: "Device opened for charging-port inspection.",
    action: "Charging port is being checked/repaired.",
    estimatedCompletion: "29 September 2026",
    history: [
      { time: "27 Sep, 12:40 PM", status: "Received", note: "Job card created at counter." },
      { time: "27 Sep, 02:10 PM", status: "Checking", note: "Initial diagnosis started." },
      { time: "27 Sep, 04:25 PM", status: "Waiting for Part", note: "Charging port connector required." },
      { time: "27 Sep, 06:00 PM", status: "Part Purchased", note: "Replacement connector received." },
      { time: "28 Sep, 11:30 AM", status: "Repairing", note: "Charging port is being replaced." },
    ],
  },
  "AZ10021": {
    jobNumber: "AZ10021",
    item: "iPhone 13",
    received: "26 September 2026 — 11:15 AM",
    problem: "Broken screen",
    status: "READY",
    condition: "Screen replaced and tested.",
    action: "Device ready for collection. Please bring your job receipt.",
    estimatedCompletion: "28 September 2026",
    history: [
      { time: "26 Sep, 11:15 AM", status: "Received", note: "Job card created at counter." },
      { time: "26 Sep, 01:30 PM", status: "Repairing", note: "Screen replacement in progress." },
      { time: "27 Sep, 05:45 PM", status: "Ready", note: "Quality check passed." },
    ],
  },
  "AZ10023": {
    jobNumber: "AZ10023",
    item: "HP Laptop",
    received: "27 September 2026 — 10:05 AM",
    problem: "Not powering on",
    status: "CHECKING",
    condition: "Under diagnosis. Board and battery being tested.",
    action: "Running hardware checks to find the fault.",
    estimatedCompletion: "30 September 2026",
    history: [
      { time: "27 Sep, 10:05 AM", status: "Received", note: "Job card created at counter." },
      { time: "27 Sep, 12:20 PM", status: "Checking", note: "Hardware diagnosis started." },
    ],
  },
};

/* Status → badge class */
const A2Z_STATUS_BADGE = {
  "RECEIVED": "badge-received",
  "CHECKING": "badge-checking",
  "WAITING FOR APPROVAL": "badge-waiting",
  "APPROVED": "badge-approved",
  "REPAIRING": "badge-repairing",
  "PART / ACCESSORY REQUIRED": "badge-part",
  "PART / ACCESSORY PURCHASED": "badge-part",
  "READY": "badge-ready",
  "DELIVERED / COLLECTED": "badge-delivered",
  "CANNOT REPAIR": "badge-cannot",
  "RETURNED": "badge-delivered",
  "CANCELLED": "badge-cancelled",
};

function a2zStatusBadge(status) {
  return A2Z_STATUS_BADGE[status] || "badge-received";
}

function a2zFormatPrice(product) {
  if (product.price == null) return "Ask for estimate";
  return "₹" + product.price.toLocaleString("en-IN");
}

function a2zStockLabel(product) {
  if (product.stock == null) return { text: "Available on Request", badge: "badge-checking" };
  if (product.stock <= 0) return { text: "Out of Stock", badge: "badge-out" };
  if (product.stock <= product.lowStockAt) {
    return product.showInventory
      ? { text: "Only " + product.stock + " Left", badge: "badge-low" }
      : { text: "In Stock", badge: "badge-instock" };
  }
  return product.showInventory
    ? { text: "In Stock (" + product.stock + " available)", badge: "badge-instock" }
    : { text: "In Stock", badge: "badge-instock" };
}
