import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LISTING_TYPES = [
  { key: "product", icon: "🛍️", ar: "منتج", en: "Product" },
  { key: "real_estate", icon: "🏠", ar: "عقار", en: "Real Estate" },
  { key: "vehicle", icon: "🚗", ar: "سيارة", en: "Vehicle" },
  { key: "service", icon: "🛠️", ar: "خدمة", en: "Service" },
];

const PRODUCT_CATEGORIES = [
  { key: "clothes", ar: "👕 ملابس وأزياء" }, { key: "shoes", ar: "👟 أحذية" },
  { key: "accessories", ar: "💍 إكسسوارات" }, { key: "beauty", ar: "💄 عطور وتجميل" },
  { key: "food", ar: "🍔 مواد غذائية" }, { key: "electronics", ar: "📱 إلكترونيات" },
  { key: "mobiles", ar: "📲 موبايلات" }, { key: "computers", ar: "💻 كمبيوترات" },
  { key: "furniture", ar: "🪑 أثاث" }, { key: "home", ar: "🏠 أدوات منزلية" },
  { key: "pharmacy", ar: "💊 صيدلية" }, { key: "books", ar: "📚 كتب وقرطاسية" },
  { key: "wholesale", ar: "📦 جملة" }, { key: "handmade", ar: "🎨 حرف يدوية" },
  { key: "restaurant", ar: "🍽️ مطاعم وكافيهات" }, { key: "other", ar: "📦 أخرى" },
];

const REAL_ESTATE_TYPES = [
  { key: "house", ar: "بيت" }, { key: "apartment", ar: "شقة" },
  { key: "shop", ar: "محل تجاري" }, { key: "land", ar: "أرض" },
  { key: "warehouse", ar: "مخزن" }, { key: "office", ar: "مكتب" },
  { key: "building", ar: "بناية" },
];

const OWNERSHIP_TYPES = ["طابو صرف", "طابو مشاع", "صك قديم", "قولبة", "إيجار"];

const CAR_BRANDS = ["Toyota", "Kia", "Hyundai", "Honda", "Nissan", "BMW", "Mercedes", "Audi",
  "Ford", "Chevrolet", "Mitsubishi", "Mazda", "Volkswagen", "Lexus", "Land Rover",
  "Jeep", "Porsche", "Volvo", "Isuzu", "Suzuki", "أخرى"];

const IRAQI_CITIES = ["بغداد", "البصرة", "الموصل", "أربيل", "النجف", "كربلاء", "كركوك",
  "السليمانية", "ديالى", "الأنبار", "واسط", "بابل", "ذي قار",
  "ميسان", "المثنى", "القادسية", "صلاح الدين", "دهوك", "حلبجة"];

const STATUS_CONFIG = {
  new: { ar: "جديد 🔔", color: "#2563eb", bg: "#eff6ff" },
  processing: { ar: "جاري ⚡", color: "#d97706", bg: "#fffbeb" },
  delivered: { ar: "تم ✅", color: "#16a34a", bg: "#f0fdf4" },
  cancelled: { ar: "ملغي ❌", color: "#dc2626", bg: "#fef2f2" },
};

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function SellerDashboard() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("ar");
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const ar = lang === "ar";

  useEffect(() => { loadData(); }, []);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate("/login"); return; }
      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single();
      setUser(userData);
      const { data: storeData } = await supabase.from("stores").select("*").eq("owner_id", authUser.id).single();
      setStore(storeData);
      if (storeData) {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from("orders").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("products").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false })
        ]);
        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const storeName = store?.name_ar || (ar ? "متجري" : "My Store");
  const storeSlug = store?.store_slug || "";
  const userName = user?.name || "";
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const totalSales = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
  const newOrders = orders.filter(o => o.status === "new");

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", gap: 16 }}>
      <svg width="60" height="46" viewBox="0 0 120 44">
        <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="3"/>
        <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
        <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
        <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
        <text x="60" y="30" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Inter">AL-MUKHTAR</text>
      </svg>
      <div style={{ color: "#64748b", fontFamily: "Tajawal,sans-serif" }}>جاري التحميل...</div>
    </div>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "#f1f5f9", minHeight: "100vh", paddingBottom: 80 }}>
      {notification && (
        <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: notification.type === "success" ? "#16a34a" : "#dc2626", color: "white", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: "700", zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          {notification.msg}
        </div>
      )}

      <header style={{ background: "#0f172a", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="24" viewBox="0 0 120 44">
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="3.5"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="3"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="3"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="3"/>
            <text x="60" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="Inter">AL-MUKHTAR</text>
          </svg>
          <div>
            <div style={{ color: "white", fontSize: 13, fontWeight: "700" }}>{storeName}</div>
            <div style={{ color: "#f0c040", fontSize: 10 }}>{ar ? "لوحة التحكم" : "Dashboard"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {newOrders.length > 0 && (
            <button onClick={() => setPage("orders")} style={{ background: "#dc2626", border: "none", borderRadius: 20, padding: "4px 10px", color: "white", fontSize: 11, fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
              🔔 {newOrders.length}
            </button>
          )}
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>
            {ar ? "EN" : "ع"}
          </button>
          <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>⏻</button>
        </div>
      </header>

      <main style={{ padding: "16px 16px 0" }}>
        {page === "home" && <HomePage ar={ar} userName={userName} storeName={storeName} storeSlug={storeSlug} orders={orders} products={products} todayOrders={todayOrders} totalSales={totalSales} newOrders={newOrders} setPage={setPage} setShowAddListing={setShowAddListing} setSelectedOrder={setSelectedOrder} />}
        {page === "orders" && <OrdersPage ar={ar} orders={orders} setSelectedOrder={setSelectedOrder} />}
        {page === "listings" && <ListingsPage ar={ar} products={products} setShowAddListing={setShowAddListing} reload={loadData} showNotif={showNotif} />}
        {page === "store" && <StorePage ar={ar} store={store} user={user} storeSlug={storeSlug} reload={loadData} showNotif={showNotif} />}
        {page === "stats" && <StatsPage ar={ar} orders={orders} products={products} totalSales={totalSales} />}
      </main>

      {showAddListing && (
        <AddListingModal ar={ar} onClose={() => setShowAddListing(false)} onSave={() => { setShowAddListing(false); loadData(); showNotif(ar ? "✅ تم حفظ المنتج بنجاح!" : "✅ Product saved!"); }} />
      )}
      {selectedOrder && (
        <OrderModal ar={ar} order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={() => { setSelectedOrder(null); loadData(); }} showNotif={showNotif} />
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", zIndex: 100 }}>
        {[
          { key: "home", icon: "🏠", ar: "الرئيسية" },
          { key: "orders", icon: "📦", ar: "الطلبات", badge: newOrders.length },
          { key: "listings", icon: "🛍️", ar: "منتجاتي" },
          { key: "store", icon: "🏪", ar: "متجري" },
          { key: "stats", icon: "📊", ar: "الإحصائيات" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setPage(tab.key)} style={{ flex: 1, background: "none", border: "none", padding: "8px 4px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, color: page === tab.key ? "#f0c040" : "#475569", fontWeight: page === tab.key ? "700" : "400", fontFamily: "inherit" }}>{ar ? tab.ar : tab.key}</span>
            {tab.badge > 0 && <div style={{ position: "absolute", top: 4, right: "calc(50% - 18px)", background: "#dc2626", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: "700" }}>{tab.badge}</div>}
            {page === tab.key && <div style={{ width: 20, height: 2, background: "#f0c040", borderRadius: 2 }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============================================================
// HOME PAGE
// ============================================================
function HomePage({ ar, userName, storeName, storeSlug, orders, products, todayOrders, totalSales, newOrders, setPage, setShowAddListing, setSelectedOrder }) {
  const fmt = n => (n || 0).toLocaleString();
  const copyLink = () => { navigator.clipboard.writeText(`almukhtar.io/store/${storeSlug}`).catch(() => {}); alert(ar ? "✅ تم نسخ الرابط!" : "✅ Link copied!"); };
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", borderRadius: 20, padding: "20px 18px", marginBottom: 16, color: "white", border: "1px solid #1e293b" }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>👋 {ar ? `أهلاً ${userName}` : `Hello ${userName}`}</div>
        <div style={{ fontSize: 20, fontWeight: "800", marginBottom: 16 }}>{storeName}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[{ val: todayOrders.length, label: ar ? "طلبات اليوم" : "Today" }, { val: fmt(totalSales), label: ar ? "المبيعات" : "Sales" }, { val: products.length, label: ar ? "المنتجات" : "Products" }].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: "800", color: "#f0c040" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {storeSlug && (
        <div style={{ background: "white", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{ar ? "رابط متجرك" : "Store Link"}</div>
            <div style={{ fontSize: 12, color: "#1a2b6b", fontWeight: "600" }}>almukhtar.io/store/{storeSlug}</div>
          </div>
          <button onClick={copyLink} style={{ background: "#f0c040", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: "700", cursor: "pointer", color: "#0f172a", fontFamily: "inherit" }}>📋 {ar ? "نسخ" : "Copy"}</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <button onClick={() => setShowAddListing(true)} style={{ background: "#f0c040", border: "none", borderRadius: 16, padding: "16px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
          <div style={{ background: "#0f172a", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>➕</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: 13 }}>{ar ? "إضافة منتج" : "Add Product"}</div>
            <div style={{ fontSize: 10, color: "#374151" }}>{ar ? "منتج، عقار، سيارة..." : "Product, Estate, Car..."}</div>
          </div>
        </button>
        <button onClick={() => setPage("orders")} style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 16, padding: "16px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
          <div style={{ background: newOrders.length > 0 ? "#fef2f2" : "#f1f5f9", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "800", color: "#1e293b", fontSize: 13 }}>{ar ? "الطلبات" : "Orders"}</div>
            <div style={{ fontSize: 10, color: newOrders.length > 0 ? "#dc2626" : "#94a3b8", fontWeight: newOrders.length > 0 ? "700" : "400" }}>
              {newOrders.length > 0 ? `🔔 ${newOrders.length} ${ar ? "جديد" : "new"}` : ar ? "لا يوجد جديد" : "No new"}
            </div>
          </div>
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 10 }}>{ar ? "شارك متجرك" : "Share Store"}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ icon: "💬", name: "واتساب", color: "#25D366", url: `https://wa.me/?text=تفضل متجرنا: almukhtar.io/store/${storeSlug}` },
            { icon: "📘", name: "فيسبوك", color: "#1877F2", url: `https://www.facebook.com/sharer/sharer.php?u=almukhtar.io/store/${storeSlug}` },
            { icon: "📸", name: "إنستغرام", color: "#E1306C", url: "#" },
            { icon: "🎵", name: "تيك توك", color: "#000", url: "#" }
          ].map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{ background: p.color, color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: "700", textDecoration: "none" }}>
              {p.icon} {p.name}
            </a>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 15 }}>{ar ? "آخر الطلبات" : "Recent Orders"}</span>
          <button onClick={() => setPage("orders")} style={{ background: "none", border: "none", color: "#1a2b6b", fontSize: 12, fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{ar ? "عرض الكل ←" : "View All →"}</button>
        </div>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 13 }}>{ar ? "لا يوجد طلبات بعد" : "No orders yet"}</div>
          </div>
        ) : orders.slice(0, 4).map(order => <OrderCard key={order.id} order={order} ar={ar} onClick={() => setSelectedOrder(order)} />)}
      </div>
    </div>
  );
}

// ============================================================
// ORDERS PAGE
// ============================================================
function OrdersPage({ ar, orders, setSelectedOrder }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "الطلبات" : "Orders"}</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[["all", ar ? "الكل" : "All"], ["new", ar ? "جديد" : "New"], ["processing", ar ? "جاري" : "Processing"], ["delivered", ar ? "تم" : "Delivered"], ["cancelled", ar ? "ملغي" : "Cancelled"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ background: filter === k ? "#0f172a" : "white", color: filter === k ? "white" : "#64748b", border: "1.5px solid", borderColor: filter === k ? "#0f172a" : "#e2e8f0", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {l}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div>{ar ? "لا يوجد طلبات" : "No orders"}</div>
        </div>
      ) : filtered.map(order => <OrderCard key={order.id} order={order} ar={ar} onClick={() => setSelectedOrder(order)} />)}
    </div>
  );
}

function OrderCard({ order, ar, onClick }) {
  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const ago = (date) => { const m = Math.floor((Date.now() - new Date(date)) / 60000); if (m < 60) return `${m}د`; if (m < 1440) return `${Math.floor(m/60)}س`; return `${Math.floor(m/1440)}ي`; };
  return (
    <div onClick={onClick} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", border: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 14 }}>{order.customer_name || (ar ? "زبون" : "Customer")}</span>
          <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: "700" }}>{s.ar}</span>
        </div>
        <div style={{ color: "#64748b", fontSize: 11 }}>{order.customer_phone || ""}</div>
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: "800", color: "#1a2b6b", fontSize: 15 }}>{(order.total || 0).toLocaleString()}</div>
        <div style={{ color: "#94a3b8", fontSize: 9 }}>{ar ? "د.ع" : "IQD"} • {ago(order.created_at)}</div>
      </div>
    </div>
  );
}

// ============================================================
// LISTINGS PAGE
// ============================================================
function ListingsPage({ ar, products, setShowAddListing, reload, showNotif }) {
  const [search, setSearch] = useState("");
  const filtered = products.filter(p => (p.name_ar || "").includes(search));

  const deleteProduct = async (id) => {
    if (!confirm(ar ? "هل تريد حذف هذا المنتج؟" : "Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    reload();
    showNotif(ar ? "تم الحذف" : "Deleted", "error");
  };

  const getTypeIcon = (type) => LISTING_TYPES.find(t => t.key === type)?.icon || "🛍️";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", margin: 0 }}>{ar ? "منتجاتي" : "My Products"} ({products.length})</h2>
        <button onClick={() => setShowAddListing(true)} style={{ background: "#f0c040", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: "700", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#0f172a" }}>
          ➕ {ar ? "إضافة" : "Add"}
        </button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "🔍 ابحث..." : "🔍 Search..."} style={{ width: "100%", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", marginBottom: 14 }} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <div style={{ fontSize: 15, marginBottom: 16 }}>{ar ? "لا يوجد منتجات بعد" : "No products yet"}</div>
          <button onClick={() => setShowAddListing(true)} style={{ background: "#0f172a", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: "700", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            ➕ {ar ? "أضف أول منتج" : "Add First Product"}
          </button>
        </div>
      ) : filtered.map(p => (
        <div key={p.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            {/* Image preview */}
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0]} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                {getTypeIcon(p.product_type)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#1e293b", fontSize: 14 }}>{p.name_ar}</div>
                  <div style={{ color: "#1a2b6b", fontWeight: "800", fontSize: 15, marginTop: 2 }}>
                    {(p.price || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: "400", color: "#94a3b8" }}>{ar ? "د.ع" : "IQD"}</span>
                    {p.negotiable && <span style={{ fontSize: 10, color: "#16a34a", marginRight: 6 }}>• قابل للتفاوض</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{getTypeIcon(p.product_type)} {LISTING_TYPES.find(t => t.key === p.product_type)?.ar || "منتج"}</span>
                    <span style={{ fontSize: 10, color: p.is_active ? "#16a34a" : "#dc2626", fontWeight: "600" }}>{p.is_active ? "✅ نشط" : "⏸️ مخفي"}</span>
                  </div>
                </div>
                <button onClick={() => deleteProduct(p.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer" }}>🗑️</button>
              </div>
              {p.images && p.images.length > 1 && (
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  {p.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                  ))}
                  {p.images.length > 4 && <div style={{ width: 36, height: 36, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#64748b", fontWeight: "700" }}>+{p.images.length - 4}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STORE PAGE
// ============================================================
function StorePage({ ar, store, user, storeSlug, reload, showNotif }) {
  const [nameAr, setNameAr] = useState(store?.name_ar || "");
  const [city, setCity] = useState(store?.city || "");
  const [phone, setPhone] = useState(store?.phone || user?.phone || "");
  const [desc, setDesc] = useState(store?.description || "");
  const [saving, setSaving] = useState(false);

  const saveStore = async () => {
    setSaving(true);
    await supabase.from("stores").update({ name_ar: nameAr, city, phone, description: desc }).eq("id", store?.id);
    setSaving(false); reload();
    showNotif(ar ? "✅ تم حفظ التغييرات" : "✅ Saved");
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "متجري" : "My Store"}</h2>
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius: 16, padding: "20px", marginBottom: 16, color: "white", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🏪</div>
        <div style={{ fontSize: 20, fontWeight: "800" }}>{store?.name_ar || "متجري"}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>almukhtar.io/store/{storeSlug}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
          <button onClick={() => { navigator.clipboard.writeText(`almukhtar.io/store/${storeSlug}`).catch(() => {}); showNotif("✅ تم نسخ الرابط"); }} style={{ background: "#f0c040", border: "none", color: "#0f172a", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: "700" }}>
            📋 {ar ? "نسخ الرابط" : "Copy Link"}
          </button>
          <a href={`https://wa.me/?text=almukhtar.io/store/${storeSlug}`} target="_blank" style={{ background: "#25D366", color: "white", borderRadius: 8, padding: "7px 14px", fontSize: 12, textDecoration: "none", fontWeight: "700" }}>
            💬 واتساب
          </a>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{ar ? "باقتك الحالية" : "Current Plan"}</div>
          <div style={{ fontWeight: "800", fontSize: 16, color: "#1a2b6b" }}>
            {store?.plan === "premium" ? "👑 مميز" : store?.plan === "basic" ? "⭐ أساسي" : "🆓 مجاني"}
          </div>
        </div>
        <button style={{ background: "#f0c040", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: "700", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#0f172a" }}>
          {ar ? "ترقية ⬆️" : "Upgrade ⬆️"}
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "16px", border: "1.5px solid #e2e8f0" }}>
        <div style={{ fontWeight: "700", marginBottom: 14, color: "#1e293b" }}>{ar ? "إعدادات المتجر" : "Store Settings"}</div>
        {[[ar ? "اسم المتجر" : "Store Name", nameAr, setNameAr, "text"], [ar ? "رقم الهاتف" : "Phone", phone, setPhone, "tel"], [ar ? "وصف المتجر" : "Description", desc, setDesc, "text"]].map(([label, val, setter, type]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
            <input type={type} value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{ar ? "المحافظة" : "Governorate"}</div>
          <select value={city} onChange={e => setCity(e.target.value)} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}>
            <option value="">{ar ? "اختر المحافظة" : "Select"}</option>
            {IRAQI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={saveStore} disabled={saving} style={{ background: saving ? "#94a3b8" : "#0f172a", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "700", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "💾 حفظ التغييرات" : "💾 Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STATS PAGE
// ============================================================
function StatsPage({ ar, orders, products, totalSales }) {
  const delivered = orders.filter(o => o.status === "delivered").length;
  const rate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString("ar", { weekday: "short" }), count: orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString()).length };
  });
  const maxCount = Math.max(...last7.map(d => d.count), 1);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "الإحصائيات" : "Statistics"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[{ label: ar ? "إجمالي المبيعات" : "Total Sales", val: totalSales.toLocaleString(), unit: ar ? "د.ع" : "IQD", color: "#1a2b6b" }, { label: ar ? "الطلبات" : "Orders", val: orders.length, unit: "", color: "#2563eb" }, { label: ar ? "تم التوصيل" : "Delivered", val: delivered, unit: "", color: "#16a34a" }, { label: ar ? "نسبة النجاح" : "Success Rate", val: rate + "%", unit: "", color: "#d97706" }].map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px", border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: "800", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: 16, padding: "16px", border: "1.5px solid #e2e8f0" }}>
        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: 16, fontSize: 14 }}>{ar ? "الطلبات - آخر 7 أيام" : "Orders - Last 7 Days"}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {d.count > 0 && <span style={{ fontSize: 9, color: "#1a2b6b", fontWeight: "700" }}>{d.count}</span>}
              <div style={{ width: "100%", background: i === 6 ? "#f0c040" : "#e2e8f0", borderRadius: "4px 4px 0 0", height: Math.max((d.count / maxCount) * 80, 4), minHeight: 4 }} />
              <span style={{ fontSize: 9, color: "#94a3b8" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADD LISTING MODAL
// ============================================================
function AddListingModal({ ar, onClose, onSave }) {
  const [listingType, setListingType] = useState("product");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Media
  const [images, setImages] = useState([]); // base64 or URLs
  const [videoUrl, setVideoUrl] = useState("");

  // Common
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [contactPhone, setContactPhone] = useState("");

  // Real estate
  const [reType, setReType] = useState("");
  const [reFor, setReFor] = useState("sale");
  const [reCity, setReCity] = useState("");
  const [reArea, setReArea] = useState("");
  const [reAddress, setReAddress] = useState("");
  const [reSize, setReSize] = useState("");
  const [reRooms, setReRooms] = useState("");
  const [reBaths, setBaths] = useState("");
  const [reFloors, setReFloors] = useState("");
  const [reAge, setReAge] = useState("");
  const [reOwnership, setReOwnership] = useState("");

  // Vehicle
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carFuel, setCarFuel] = useState("");
  const [carGear, setCarGear] = useState("");
  const [carKm, setCarKm] = useState("");
  const [carCondition, setCarCondition] = useState("");

  // Service
  const [serviceType, setServiceType] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [serviceHours, setServiceHours] = useState("");
  const [serviceContact, setServiceContact] = useState("");

  const maxSteps = listingType === "product" ? 3 : 2;

  // Handle image upload - convert to base64
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) { setError(ar ? "الحد الأقصى 8 صور" : "Max 8 images"); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const generateAI = async () => {
    if (!nameAr && !nameEn) { setError(ar ? "أدخل اسم المنتج أولاً" : "Enter product name first"); return; }
    setAiLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: `أنت خبير في كتابة محتوى التجارة الإلكترونية للسوق العراقي. اكتب وصفاً احترافياً للمنتج: "${nameAr || nameEn}" الفئة: "${category || "عام"}". أجب بـ JSON فقط: {"nameAr":"اسم محسّن","nameEn":"Improved name","description":"وصف احترافي جذاب 3-4 جمل بالعربي"}` }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (parsed.nameAr) setNameAr(parsed.nameAr);
      if (parsed.nameEn) setNameEn(parsed.nameEn);
      if (parsed.description) setDesc(parsed.description);
    } catch { setError(ar ? "تعذر توليد البيانات" : "AI generation failed"); }
    setAiLoading(false);
  };

  const handleSave = async () => {
    if (listingType === "product" && !nameAr) { setError(ar ? "أدخل اسم المنتج" : "Enter product name"); return; }
    if (listingType === "real_estate" && !reType) { setError(ar ? "اختر نوع العقار" : "Select property type"); return; }
    if (listingType === "vehicle" && !carBrand) { setError(ar ? "اختر ماركة السيارة" : "Select car brand"); return; }
    if (!price) { setError(ar ? "أدخل السعر" : "Enter price"); return; }

    setSaving(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      const { data: storeData } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
      if (!storeData) { setError(ar ? "لم يتم العثور على المتجر" : "Store not found"); setSaving(false); return; }

      const productName = listingType === "product" ? nameAr
        : listingType === "real_estate" ? `${REAL_ESTATE_TYPES.find(t=>t.key===reType)?.ar || reType} ${reFor === "sale" ? "للبيع" : "للإيجار"} - ${reCity}`
        : listingType === "vehicle" ? `${carBrand} ${carModel} ${carYear}`
        : serviceType;

      const { error: err } = await supabase.from("products").insert({
        store_id: storeData.id,
        product_type: listingType,
        name_ar: productName,
        name_en: nameEn || productName,
        description: desc,
        price: parseFloat(price) || 0,
        stock_quantity: parseInt(stock) || 1,
        barcode: barcode || null,
        category: category || null,
        is_active: true,
        negotiable: negotiable,
        contact_phone: contactPhone || null,
        images: images,
        video_url: videoUrl || null,
        metadata: listingType === "real_estate"
          ? { reType, reFor, reCity, reArea, reAddress, reSize, reRooms, reBaths, reFloors, reAge, reOwnership }
          : listingType === "vehicle"
          ? { carBrand, carModel, carYear, carColor, carFuel, carGear, carKm, carCondition }
          : listingType === "service"
          ? { serviceType, serviceCity, serviceArea, serviceHours, serviceContact }
          : {},
        created_at: new Date().toISOString(),
      });
      if (err) throw err;
      onSave();
    } catch (err) {
      console.error(err);
      setError(ar ? "حدث خطأ، حاول مرة ثانية" : "An error occurred");
    }
    setSaving(false);
  };

  const inputStyle = { width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const labelStyle = { fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "20px 16px 60px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "إضافة منتج جديد" : "Add New Product"}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* TYPE SELECTOR */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{ar ? "نوع المنتج" : "Product Type"}</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {LISTING_TYPES.map(t => (
              <button key={t.key} onClick={() => { setListingType(t.key); setStep(1); setError(""); }} style={{ background: listingType === t.key ? "#0f172a" : "#f8fafc", color: listingType === t.key ? "white" : "#374151", border: `2px solid ${listingType === t.key ? "#0f172a" : "#e2e8f0"}`, borderRadius: 12, padding: "10px 4px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                <div style={{ fontSize: 22 }}>{t.icon}</div>
                <div style={{ fontSize: 10, fontWeight: "700", marginTop: 2 }}>{ar ? t.ar : t.en}</div>
              </button>
            ))}
          </div>
        </div>

        {/* STEP BAR - product only */}
        {listingType === "product" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {Array.from({ length: maxSteps }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < step ? "#f0c040" : "#e2e8f0" }} />
            ))}
          </div>
        )}

        {/* ===== MEDIA UPLOAD (all types) ===== */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{ar ? "📸 الصور (حتى 8 صور)" : "📸 Photos (up to 8)"}</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", borderRadius: 10, objectFit: "cover", border: "1.5px solid #e2e8f0" }} />
                <button onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, background: "#dc2626", border: "none", borderRadius: "50%", width: 20, height: 20, color: "white", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                {i === 0 && <div style={{ position: "absolute", bottom: 2, left: 2, background: "#f0c040", color: "#0f172a", borderRadius: 4, padding: "1px 4px", fontSize: 8, fontWeight: "700" }}>{ar ? "رئيسية" : "Main"}</div>}
              </div>
            ))}
            {images.length < 8 && (
              <label style={{ aspectRatio: "1", background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 22 }}>
                📷
                <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{ar ? "إضافة" : "Add"}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {/* Video URL */}
          <label style={labelStyle}>{ar ? "🎥 رابط الفيديو (يوتيوب أو تيك توك - اختياري)" : "🎥 Video URL (YouTube/TikTok - optional)"}</label>
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." style={{ ...inputStyle, direction: "ltr" }} />
          {videoUrl && (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", marginTop: 6, fontSize: 12, color: "#16a34a" }}>
              ✅ {ar ? "تم إضافة الفيديو" : "Video added"}
            </div>
          )}
        </div>

        {/* ===== PRODUCT FORM ===== */}
        {listingType === "product" && (
          <>
            {step === 1 && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{ar ? "اسم المنتج (عربي) *" : "Product Name (Arabic) *"}</label>
                  <input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={ar ? "مثال: حقيبة جلدية فاخرة" : "e.g. Luxury Leather Bag"} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{ar ? "اسم المنتج (إنكليزي)" : "Product Name (English)"}</label>
                  <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Luxury Leather Bag" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{ar ? "الفئة" : "Category"}</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
                    <option value="">{ar ? "اختر الفئة" : "Select Category"}</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.ar}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>{ar ? "الوصف" : "Description"}</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder={ar ? "اكتب وصفاً مفصلاً..." : "Describe your product..."} rows={3} style={{ ...inputStyle, resize: "none" }} />
                </div>
                <button onClick={generateAI} disabled={aiLoading} style={{ background: aiLoading ? "#e2e8f0" : "linear-gradient(135deg,#667eea,#764ba2)", color: aiLoading ? "#94a3b8" : "white", border: "none", borderRadius: 12, padding: "12px", width: "100%", fontWeight: "700", fontSize: 14, cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 4 }}>
                  {aiLoading ? "⏳ " + (ar ? "جاري التوليد..." : "Generating...") : "✨ " + (ar ? "توليد الوصف بالذكاء الاصطناعي" : "Generate with AI")}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>{ar ? "السعر (د.ع) *" : "Price (IQD) *"}</label>
                    <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{ar ? "الكمية" : "Stock"}</label>
                    <input value={stock} onChange={e => setStock(e.target.value)} type="number" placeholder="1" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{ar ? "الباركود (اختياري)" : "Barcode (optional)"}</label>
                  <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="000000000" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{ar ? "رقم التواصل (اختياري)" : "Contact Phone (optional)"}</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} type="tel" placeholder="07X XXXX XXXX" style={{ ...inputStyle, direction: "ltr" }} />
                </div>
                <div onClick={() => setNegotiable(!negotiable)} style={{ display: "flex", alignItems: "center", gap: 10, background: negotiable ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${negotiable ? "#16a34a" : "#e2e8f0"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 4, cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${negotiable ? "#16a34a" : "#cbd5e1"}`, background: negotiable ? "#16a34a" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {negotiable && <span style={{ color: "white", fontSize: 13 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>{ar ? "قابل للتفاوض" : "Price Negotiable"}</span>
                </div>
              </>
            )}

            {step === 3 && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 17, fontWeight: "800", color: "#1e293b", marginBottom: 12 }}>{ar ? "مراجعة المنتج" : "Review Product"}</h3>
                <div style={{ background: "#f8fafc", borderRadius: 14, padding: "16px", textAlign: ar ? "right" : "left", marginBottom: 16 }}>
                  {[["الاسم", nameAr], ["الفئة", PRODUCT_CATEGORIES.find(c => c.key === category)?.ar || "-"], ["السعر", `${parseInt(price || 0).toLocaleString()} د.ع`], ["الكمية", stock], ["الصور", `${images.length} صورة`], ["قابل للتفاوض", negotiable ? "نعم" : "لا"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>{k}</span>
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>{v || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== REAL ESTATE FORM ===== */}
        {listingType === "real_estate" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "نوع العقار *" : "Property Type *"}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {REAL_ESTATE_TYPES.map(t => (
                  <button key={t.key} onClick={() => setReType(t.key)} style={{ background: reType === t.key ? "#0f172a" : "#f8fafc", color: reType === t.key ? "white" : "#374151", border: `1.5px solid ${reType === t.key ? "#0f172a" : "#e2e8f0"}`, borderRadius: 10, padding: "10px 6px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: reType === t.key ? "700" : "400" }}>
                    {t.ar}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "للبيع أم للإيجار؟" : "For Sale or Rent?"}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["sale", "🏷️ للبيع"], ["rent", "🔑 للإيجار"]].map(([k, l]) => (
                  <button key={k} onClick={() => setReFor(k)} style={{ background: reFor === k ? "#0f172a" : "#f8fafc", color: reFor === k ? "white" : "#374151", border: `1.5px solid ${reFor === k ? "#0f172a" : "#e2e8f0"}`, borderRadius: 10, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "المحافظة" : "Governorate"}</label>
                <select value={reCity} onChange={e => setReCity(e.target.value)} style={selectStyle}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {IRAQI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{ar ? "المنطقة" : "District"}</label>
                <input value={reArea} onChange={e => setReArea(e.target.value)} placeholder={ar ? "مثال: المنصور" : "e.g. Mansour"} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "العنوان التقريبي" : "Approximate Address"}</label>
              <input value={reAddress} onChange={e => setReAddress(e.target.value)} placeholder={ar ? "وصف موقع العقار..." : "Property location..."} style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[[ar ? "المساحة م²" : "Area m²", reSize, setReSize], [ar ? "الغرف" : "Rooms", reRooms, setReRooms], [ar ? "الحمامات" : "Baths", reBaths, setBaths]].map(([l, v, s]) => (
                <div key={l}>
                  <label style={labelStyle}>{l}</label>
                  <input value={v} onChange={e => s(e.target.value)} type="number" placeholder="0" style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "عدد الطوابق" : "Floors"}</label>
                <input value={reFloors} onChange={e => setReFloors(e.target.value)} type="number" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "عمر البناء (سنة)" : "Building Age"}</label>
                <input value={reAge} onChange={e => setReAge(e.target.value)} type="number" placeholder="0" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "نوع الملكية" : "Ownership Type"}</label>
              <select value={reOwnership} onChange={e => setReOwnership(e.target.value)} style={selectStyle}>
                <option value="">{ar ? "اختر" : "Select"}</option>
                {OWNERSHIP_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "السعر *" : "Price *"}</label>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "رقم التواصل *" : "Contact *"}</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} type="tel" placeholder="07X..." style={{ ...inputStyle, direction: "ltr" }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "ملاحظات إضافية" : "Additional Notes"}</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder={ar ? "أي تفاصيل إضافية..." : "Any additional details..."} rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>

            <div onClick={() => setNegotiable(!negotiable)} style={{ display: "flex", alignItems: "center", gap: 10, background: negotiable ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${negotiable ? "#16a34a" : "#e2e8f0"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 4, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${negotiable ? "#16a34a" : "#cbd5e1"}`, background: negotiable ? "#16a34a" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {negotiable && <span style={{ color: "white", fontSize: 13 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>{ar ? "السعر قابل للتفاوض" : "Price Negotiable"}</span>
            </div>
          </>
        )}

        {/* ===== VEHICLE FORM ===== */}
        {listingType === "vehicle" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "الماركة *" : "Brand *"}</label>
                <select value={carBrand} onChange={e => setCarBrand(e.target.value)} style={selectStyle}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{ar ? "الموديل" : "Model"}</label>
                <input value={carModel} onChange={e => setCarModel(e.target.value)} placeholder={ar ? "مثال: كامري" : "e.g. Camry"} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "سنة الصنع" : "Year"}</label>
                <input value={carYear} onChange={e => setCarYear(e.target.value)} type="number" placeholder="2020" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "اللون" : "Color"}</label>
                <input value={carColor} onChange={e => setCarColor(e.target.value)} placeholder={ar ? "أبيض" : "White"} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "نوع الوقود" : "Fuel"}</label>
                <select value={carFuel} onChange={e => setCarFuel(e.target.value)} style={selectStyle}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {["بنزين", "ديزل", "هجين", "كهربائي", "غاز"].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{ar ? "نوع القير" : "Transmission"}</label>
                <select value={carGear} onChange={e => setCarGear(e.target.value)} style={selectStyle}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {["أوتوماتيك", "يدوي"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "الكيلومترات" : "Mileage"}</label>
                <input value={carKm} onChange={e => setCarKm(e.target.value)} type="number" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "الحالة" : "Condition"}</label>
                <select value={carCondition} onChange={e => setCarCondition(e.target.value)} style={selectStyle}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {["جديد", "ممتاز", "جيد جداً", "جيد", "يحتاج صيانة"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "السعر (د.ع) *" : "Price *"}</label>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "رقم التواصل *" : "Contact *"}</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} type="tel" placeholder="07X..." style={{ ...inputStyle, direction: "ltr" }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "ملاحظات إضافية" : "Notes"}</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} placeholder={ar ? "أي تفاصيل عن السيارة..." : "Any car details..."} />
            </div>
            <div onClick={() => setNegotiable(!negotiable)} style={{ display: "flex", alignItems: "center", gap: 10, background: negotiable ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${negotiable ? "#16a34a" : "#e2e8f0"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 4, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${negotiable ? "#16a34a" : "#cbd5e1"}`, background: negotiable ? "#16a34a" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {negotiable && <span style={{ color: "white", fontSize: 13 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>{ar ? "السعر قابل للتفاوض" : "Price Negotiable"}</span>
            </div>
          </>
        )}

        {/* ===== SERVICE FORM ===== */}
        {listingType === "service" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "نوع الخدمة *" : "Service Type *"}</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={selectStyle}>
                <option value="">{ar ? "اختر نوع الخدمة" : "Select"}</option>
                {["تصوير وإنتاج", "تنظيم حفلات", "تدريس وكورسات", "صيانة منزلية", "تجميل وحلاقة", "عيادة وطب", "توصيل ونقل", "تصميم جرافيك", "برمجة ومواقع", "خياطة وتفصيل", "طبخ وكيترينغ", "تنظيف منازل", "أخرى"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "المدينة" : "City"}</label>
                <select value={serviceCity} onChange={e => setServiceCity(e.target.value)} style={selectStyle}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {IRAQI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{ar ? "منطقة العمل" : "Work Area"}</label>
                <input value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder={ar ? "المنصور، الكرادة..." : "Area..."} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>{ar ? "السعر يبدأ من" : "Price From"}</label>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "رقم التواصل *" : "Contact *"}</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} type="tel" placeholder="07X..." style={{ ...inputStyle, direction: "ltr" }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "أوقات العمل" : "Working Hours"}</label>
              <input value={serviceHours} onChange={e => setServiceHours(e.target.value)} placeholder={ar ? "9 صباحاً - 9 مساءً" : "9AM - 9PM"} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{ar ? "وصف الخدمة" : "Service Description"}</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder={ar ? "اكتب وصفاً مفصلاً للخدمة..." : "Describe your service..."} rows={4} style={{ ...inputStyle, resize: "none" }} />
            </div>
          </>
        )}

        {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {listingType === "product" && step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 14, padding: "14px 20px", fontWeight: "700", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
              {ar ? "→" : "←"}
            </button>
          )}
          {listingType === "product" && step < maxSteps ? (
            <button onClick={() => setStep(step + 1)} style={{ flex: 1, background: "#0f172a", color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: "800", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
              {ar ? "التالي ←" : "Next →"}
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? "#94a3b8" : "#16a34a", color: "white", border: "none", borderRadius: 14, padding: "14px", fontWeight: "800", fontSize: 15, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {saving ? (ar ? "⏳ جاري الحفظ..." : "⏳ Saving...") : (ar ? "✅ حفظ المنتج" : "✅ Save Product")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ORDER MODAL
// ============================================================
function OrderModal({ ar, order, onClose, onUpdate, showNotif }) {
  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    setUpdating(false);
    showNotif(ar ? "✅ تم تحديث الحالة" : "✅ Status updated");
    onUpdate();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", padding: "20px 16px 50px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "تفاصيل الطلب" : "Order Details"}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px", marginBottom: 16 }}>
          {[[ar ? "العميل" : "Customer", order.customer_name || "-"], [ar ? "الهاتف" : "Phone", order.customer_phone || "-"], [ar ? "العنوان" : "Address", order.delivery_address || "-"], [ar ? "المجموع" : "Total", `${(order.total || 0).toLocaleString()} ${ar ? "د.ع" : "IQD"}`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>{k}</span>
              <span style={{ fontWeight: "600", color: "#1e293b" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#64748b" }}>{ar ? "الحالة" : "Status"}</span>
            <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: "700" }}>{s.ar}</span>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: "600" }}>{ar ? "تحديث الحالة:" : "Update Status:"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button key={status} onClick={() => updateStatus(status)} disabled={updating || order.status === status} style={{ background: order.status === status ? "#0f172a" : "#f1f5f9", color: order.status === status ? "white" : "#374151", border: "none", borderRadius: 10, padding: "10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                {config.ar}
              </button>
            ))}
          </div>
        </div>
        {order.customer_phone && (
          <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`} style={{ display: "block", background: "#25D366", color: "white", borderRadius: 14, padding: "13px", fontWeight: "700", fontSize: 15, textDecoration: "none", textAlign: "center" }}>
            💬 {ar ? "تواصل عبر واتساب" : "WhatsApp"}
          </a>
        )}
      </div>
    </div>
  );
}
