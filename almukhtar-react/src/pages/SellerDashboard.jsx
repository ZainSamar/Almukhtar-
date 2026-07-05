import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const Icon = ({ d, size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  orders: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0H9z",
  products: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 3H8L6 7h12l-2-4z",
  store: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  stats: "M18 20V10 M12 20V4 M6 20v-6",
  plus: "M12 5v14 M5 12h14",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13",
  copy: "M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z",
};

const STATUS = {
  new: { label: "جديد", color: "#2563eb", bg: "#eff6ff" },
  processing: { label: "قيد التنفيذ", color: "#d97706", bg: "#fffbeb" },
  delivered: { label: "تم التوصيل", color: "#16a34a", bg: "#f0fdf4" },
  cancelled: { label: "ملغي", color: "#dc2626", bg: "#fef2f2" },
};

export default function SellerDashboard() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("ar");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const ar = lang === "ar";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate("/login"); return; }

      // Get user profile
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setUser(userData);

      // Get store
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", authUser.id)
        .single();
      setStore(storeData);

      if (storeData) {
        // Get orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setOrders(ordersData || []);

        // Get products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });
        setProducts(productsData || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const copyStoreLink = () => {
    const link = `almukhtar.io/store/${store?.store_slug || store?.slug || ""}`;
    navigator.clipboard.writeText(link).catch(() => {});
    alert(ar ? "تم نسخ الرابط! 📋" : "Link copied! 📋");
  };

  const storeName = store?.name_ar || store?.name || (ar ? "متجري" : "My Store");
  const storeSlug = store?.store_slug || store?.slug || "";
  const userName = user?.name || user?.full_name || (ar ? "مرحباً" : "Welcome");

  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });

  const totalSales = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ color: "#64748b", fontFamily: "Tajawal,sans-serif" }}>{ar ? "جاري التحميل..." : "Loading..."}</div>
      </div>
    </div>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "#f1f5f9", minHeight: "100vh", paddingBottom: 80 }}>

      {/* TOP BAR */}
      <div style={{ background: "#1a2b6b", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="34" height="26" viewBox="0 0 120 44">
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="3"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <text x="60" y="30" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Inter">AL-MUKHTAR</text>
          </svg>
          <div>
            <div style={{ color: "white", fontSize: 13, fontWeight: "700" }}>{storeName}</div>
            <div style={{ color: "#f0c040", fontSize: 10 }}>{ar ? "لوحة التحكم" : "Dashboard"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 6, padding: "4px 9px", fontSize: 11, cursor: "pointer" }}>
            {ar ? "EN" : "عربي"}
          </button>
          <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 4 }}>
            <Icon d={ICONS.logout} size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "16px 16px 0" }}>
        {page === "home" && (
          <HomePage ar={ar} userName={userName} storeName={storeName} storeSlug={storeSlug} orders={orders} products={products} todayOrders={todayOrders} totalSales={totalSales} setPage={setPage} setShowAddProduct={setShowAddProduct} setSelectedOrder={setSelectedOrder} copyStoreLink={copyStoreLink} />
        )}
        {page === "orders" && <OrdersPage ar={ar} orders={orders} setSelectedOrder={setSelectedOrder} reload={loadData} />}
        {page === "products" && <ProductsPage ar={ar} products={products} storeId={store?.id} setShowAddProduct={setShowAddProduct} reload={loadData} />}
        {page === "store" && <StorePage ar={ar} store={store} user={user} storeSlug={storeSlug} copyStoreLink={copyStoreLink} reload={loadData} />}
        {page === "stats" && <StatsPage ar={ar} orders={orders} products={products} totalSales={totalSales} />}
      </div>

      {showAddProduct && <AddProductModal ar={ar} storeId={store?.id} onClose={() => setShowAddProduct(false)} onSave={() => { setShowAddProduct(false); loadData(); }} />}
      {selectedOrder && <OrderModal ar={ar} order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={() => { setSelectedOrder(null); loadData(); }} />}

      {/* BOTTOM NAV */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e2e8f0", display: "flex", zIndex: 100, boxShadow: "0 -2px 12px rgba(0,0,0,0.08)" }}>
        {[
          { key: "home", icon: ICONS.home, label: ar ? "الرئيسية" : "Home" },
          { key: "orders", icon: ICONS.orders, label: ar ? "الطلبات" : "Orders" },
          { key: "products", icon: ICONS.products, label: ar ? "المنتجات" : "Products" },
          { key: "store", icon: ICONS.store, label: ar ? "متجري" : "My Store" },
          { key: "stats", icon: ICONS.stats, label: ar ? "الإحصائيات" : "Stats" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setPage(tab.key)} style={{ flex: 1, background: "none", border: "none", padding: "10px 4px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <Icon d={tab.icon} size={20} color={page === tab.key ? "#1a2b6b" : "#94a3b8"} />
            <span style={{ fontSize: 10, color: page === tab.key ? "#1a2b6b" : "#94a3b8", fontWeight: page === tab.key ? "700" : "400", fontFamily: "inherit" }}>{tab.label}</span>
            {page === tab.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#f0c040" }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomePage({ ar, userName, storeName, storeSlug, orders, products, todayOrders, totalSales, setPage, setShowAddProduct, setSelectedOrder, copyStoreLink }) {
  const fmt = (n) => n?.toLocaleString() || "0";
  return (
    <div>
      {/* Welcome */}
      <div style={{ background: "linear-gradient(135deg,#1a2b6b,#2d4499)", borderRadius: 16, padding: "20px 18px", marginBottom: 16, color: "white" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{ar ? `مرحباً ${userName} 👋` : `Welcome ${userName} 👋`}</div>
        <div style={{ fontSize: 20, fontWeight: "800" }}>{storeName}</div>
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          {[
            { label: ar ? "طلبات اليوم" : "Today", val: todayOrders.length },
            { label: ar ? "إجمالي المبيعات" : "Total Sales", val: fmt(totalSales) },
            { label: ar ? "المنتجات" : "Products", val: products.length },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: "800", color: "#f0c040" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Store link */}
      {storeSlug && (
        <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{ar ? "رابط متجرك" : "Your store link"}</div>
            <div style={{ fontSize: 13, color: "#1a2b6b", fontWeight: "600" }}>almukhtar.io/store/{storeSlug}</div>
          </div>
          <button onClick={copyStoreLink} style={{ background: "#f0c040", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: "700", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#1a2b6b" }}>
            {ar ? "نسخ" : "Copy"}
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <button onClick={() => setShowAddProduct(true)} style={{ background: "#f0c040", border: "none", borderRadius: 14, padding: "16px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
          <div style={{ background: "#1a2b6b", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={ICONS.plus} size={18} color="white" />
          </div>
          <span style={{ fontWeight: "700", color: "#1a2b6b", fontSize: 13 }}>{ar ? "إضافة منتج" : "Add Product"}</span>
        </button>
        <button onClick={() => setPage("orders")} style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 14, padding: "16px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
          <div style={{ background: "#eff6ff", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={ICONS.orders} size={18} color="#2563eb" />
          </div>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 13 }}>{ar ? "الطلبات" : "Orders"}</span>
        </button>
      </div>

      {/* Recent orders */}
      <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 15 }}>{ar ? "آخر الطلبات" : "Recent Orders"}</span>
          <button onClick={() => setPage("orders")} style={{ background: "none", border: "none", color: "#1a2b6b", fontSize: 12, fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{ar ? "عرض الكل" : "View All"}</button>
        </div>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 13 }}>{ar ? "لا يوجد طلبات بعد" : "No orders yet"}</div>
          </div>
        ) : (
          orders.slice(0, 3).map(order => (
            <OrderCard key={order.id} order={order} ar={ar} onClick={() => setSelectedOrder(order)} />
          ))
        )}
      </div>
    </div>
  );
}

function OrdersPage({ ar, orders, setSelectedOrder, reload }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "الطلبات" : "Orders"}</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[["all", ar ? "الكل" : "All"], ["new", ar ? "جديد" : "New"], ["processing", ar ? "جاري" : "Processing"], ["delivered", ar ? "تم" : "Delivered"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ background: filter === k ? "#1a2b6b" : "white", color: filter === k ? "white" : "#64748b", border: "1.5px solid", borderColor: filter === k ? "#1a2b6b" : "#e2e8f0", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {l}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div>{ar ? "لا يوجد طلبات" : "No orders"}</div>
        </div>
      ) : (
        filtered.map(order => <OrderCard key={order.id} order={order} ar={ar} onClick={() => setSelectedOrder(order)} />)
      )}
    </div>
  );
}

function OrderCard({ order, ar, onClick }) {
  const s = STATUS[order.status] || STATUS.new;
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return ar ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return ar ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
    return ar ? `منذ ${Math.floor(hrs/24)} يوم` : `${Math.floor(hrs/24)}d ago`;
  };
  return (
    <div onClick={onClick} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", border: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 14 }}>{order.customer_name || (ar ? "زبون" : "Customer")}</span>
          <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: "600" }}>{s.label}</span>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{order.customer_phone || ""}</div>
        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{timeAgo(order.created_at)}</div>
      </div>
      <div style={{ textAlign: ar ? "left" : "right" }}>
        <div style={{ fontWeight: "800", color: "#1a2b6b", fontSize: 15 }}>{(order.total || 0).toLocaleString()}</div>
        <div style={{ color: "#94a3b8", fontSize: 10 }}>{ar ? "د.ع" : "IQD"}</div>
      </div>
    </div>
  );
}

function ProductsPage({ ar, products, storeId, setShowAddProduct, reload }) {
  const deleteProduct = async (id) => {
    if (!confirm(ar ? "هل تريد حذف هذا المنتج؟" : "Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    reload();
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", margin: 0 }}>{ar ? "المنتجات" : "Products"}</h2>
        <button onClick={() => setShowAddProduct(true)} style={{ background: "#f0c040", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: "700", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", color: "#1a2b6b" }}>
          <Icon d={ICONS.plus} size={16} color="#1a2b6b" /> {ar ? "إضافة" : "Add"}
        </button>
      </div>
      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
          <div style={{ marginBottom: 16 }}>{ar ? "لا يوجد منتجات بعد" : "No products yet"}</div>
          <button onClick={() => setShowAddProduct(true)} style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: "700", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "+ أضف أول منتج" : "+ Add First Product"}
          </button>
        </div>
      ) : (
        products.map(p => (
          <div key={p.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1.5px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", color: "#1e293b", fontSize: 15, marginBottom: 4 }}>{ar ? p.name_ar : p.name_en || p.name_ar}</div>
                <div style={{ color: "#1a2b6b", fontWeight: "800", fontSize: 16 }}>{(p.price || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: "400", color: "#94a3b8" }}>{ar ? "د.ع" : "IQD"}</span></div>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>📦 {ar ? "المخزون:" : "Stock:"} <b>{p.stock_quantity || 0}</b></span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>🏷️ {p.product_type || (ar ? "عام" : "General")}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <span style={{ background: p.is_active ? "#f0fdf4" : "#fef2f2", color: p.is_active ? "#16a34a" : "#dc2626", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: "600" }}>
                  {p.is_active ? (ar ? "نشط" : "Active") : (ar ? "مخفي" : "Hidden")}
                </span>
                <button onClick={() => deleteProduct(p.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>
                  {ar ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StorePage({ ar, store, user, storeSlug, copyStoreLink, reload }) {
  const [saving, setSaving] = useState(false);
  const [nameAr, setNameAr] = useState(store?.name_ar || store?.name || "");
  const [city, setCity] = useState(store?.city || "بغداد");
  const [desc, setDesc] = useState(store?.description || "");

  const saveStore = async () => {
    setSaving(true);
    await supabase.from("stores").update({ name_ar: nameAr, city, description: desc }).eq("id", store?.id);
    setSaving(false);
    reload();
    alert(ar ? "تم الحفظ ✅" : "Saved ✅");
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "متجري" : "My Store"}</h2>
      <div style={{ background: "linear-gradient(135deg,#1a2b6b,#2d4499)", borderRadius: 16, padding: "20px 18px", marginBottom: 16, color: "white", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
        <div style={{ fontSize: 20, fontWeight: "800" }}>{store?.name_ar || store?.name || (ar ? "متجري" : "My Store")}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>almukhtar.io/store/{storeSlug}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          <button onClick={copyStoreLink} style={{ background: "#f0c040", border: "none", color: "#1a2b6b", borderRadius: 8, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: "700" }}>
            {ar ? "📋 نسخ الرابط" : "📋 Copy Link"}
          </button>
          {["واتساب", "إنستغرام", "تيك توك"].map(p => (
            <button key={p} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 8, padding: "8px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontWeight: "700", marginBottom: 14, color: "#1e293b" }}>{ar ? "إعدادات المتجر" : "Store Settings"}</div>
        {[
          [ar ? "اسم المتجر" : "Store Name", nameAr, setNameAr],
          [ar ? "المدينة" : "City", city, setCity],
          [ar ? "وصف المتجر" : "Description", desc, setDesc],
        ].map(([label, val, setter]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", background: "#f8fafc", borderRadius: 10, padding: "10px 14px", fontSize: 14, border: "1.5px solid #e2e8f0", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{ar ? "الباقة الحالية" : "Current Plan"}</div>
          <div style={{ background: "#f0f4ff", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1a2b6b", fontWeight: "700" }}>
            {store?.plan === "premium" ? "👑 " + (ar ? "مميز" : "Premium") : store?.plan === "basic" ? "⭐ " + (ar ? "أساسي" : "Basic") : "🆓 " + (ar ? "مجاني" : "Free")}
          </div>
        </div>
        <button onClick={saveStore} disabled={saving} style={{ background: saving ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "12px", width: "100%", fontWeight: "700", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
        </button>
      </div>
    </div>
  );
}

function StatsPage({ ar, orders, products, totalSales }) {
  const delivered = orders.filter(o => o.status === "delivered").length;
  const pending = orders.filter(o => o.status === "new" || o.status === "processing").length;
  const rate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;
  const bars = [0,1,2,3,4,5,6].map(i => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
    return { day: d.toLocaleDateString(ar ? "ar" : "en", { weekday: "short" }), val: dayOrders.length };
  });
  const maxVal = Math.max(...bars.map(b => b.val), 1);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "الإحصائيات" : "Statistics"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: ar ? "إجمالي المبيعات" : "Total Sales", val: totalSales.toLocaleString(), unit: ar ? "د.ع" : "IQD", color: "#1a2b6b" },
          { label: ar ? "عدد الطلبات" : "Orders", val: orders.length, unit: ar ? "طلب" : "orders", color: "#2563eb" },
          { label: ar ? "تم التوصيل" : "Delivered", val: delivered, unit: ar ? "طلب" : "orders", color: "#16a34a" },
          { label: ar ? "معدل التوصيل" : "Delivery Rate", val: rate + "%", unit: "", color: "#d97706" },
        ].map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px", border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: "800", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: 16, padding: "16px" }}>
        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>{ar ? "الطلبات هذا الأسبوع" : "Orders This Week"}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", background: i === 6 ? "#f0c040" : "#e2e8f0", borderRadius: "4px 4px 0 0", height: Math.max((b.val / maxVal) * 100, 4) + "%", minHeight: 4 }} />
              <span style={{ fontSize: 9, color: "#94a3b8" }}>{b.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddProductModal({ ar, storeId, onClose, onSave }) {
  const [type, setType] = useState("general");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const types = [
    { key: "clothes", label: ar ? "👕 ملابس" : "👕 Clothes" },
    { key: "electronics", label: ar ? "📱 إلكترونيات" : "📱 Electronics" },
    { key: "food", label: ar ? "🍔 طعام" : "🍔 Food" },
    { key: "home", label: ar ? "🏠 منزل" : "🏠 Home" },
    { key: "beauty", label: ar ? "💄 جمال" : "💄 Beauty" },
    { key: "general", label: ar ? "📦 عام" : "📦 Other" },
  ];

  const saveProduct = async () => {
    if (!nameAr) { setError(ar ? "أدخل اسم المنتج" : "Enter product name"); return; }
    if (!price) { setError(ar ? "أدخل السعر" : "Enter price"); return; }
    if (!storeId) { setError(ar ? "خطأ في المتجر" : "Store error"); return; }
    setSaving(true); setError("");
    try {
      const { error } = await supabase.from("products").insert({
        store_id: storeId,
        name_ar: nameAr,
        name_en: nameEn || nameAr,
        description: desc,
        price: parseFloat(price),
        stock_quantity: parseInt(stock) || 0,
        barcode: barcode || null,
        product_type: type,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      onSave();
    } catch (err) {
      setError(ar ? "حدث خطأ، حاول مرة ثانية" : "An error occurred");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "إضافة منتج جديد" : "Add New Product"}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "نوع المنتج" : "Product Type"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {types.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} style={{ background: type === t.key ? "#1a2b6b" : "#f8fafc", color: type === t.key ? "white" : "#374151", border: "1.5px solid", borderColor: type === t.key ? "#1a2b6b" : "#e2e8f0", borderRadius: 10, padding: "10px 6px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: type === t.key ? "700" : "400" }}>
              {t.label}
            </button>
          ))}
        </div>

        {[
          [ar ? "اسم المنتج (عربي) *" : "Product Name (Arabic) *", nameAr, setNameAr, ar ? "مثال: حقيبة جلدية" : "e.g. Leather Bag"],
          [ar ? "اسم المنتج (إنكليزي)" : "Product Name (English)", nameEn, setNameEn, "e.g. Leather Bag"],
          [ar ? "الوصف" : "Description", desc, setDesc, ar ? "تفاصيل المنتج..." : "Product details..."],
        ].map(([label, val, setter, ph]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{label}</div>
            <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[[ar ? "السعر (د.ع) *" : "Price (IQD) *", price, setPrice], [ar ? "الكمية" : "Stock", stock, setStock]].map(([label, val, setter]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{label}</div>
              <input value={val} onChange={e => setter(e.target.value)} type="number" placeholder="0" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "الباركود (اختياري)" : "Barcode (optional)"}</div>
          <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="000000000" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
        </div>

        {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={saveProduct} disabled={saving} style={{ background: saving ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 14, padding: "14px", width: "100%", fontWeight: "800", fontSize: 15, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ المنتج ✓" : "Save Product ✓")}
        </button>
      </div>
    </div>
  );
}

function OrderModal({ ar, order, onClose, onUpdate }) {
  const s = STATUS[order.status] || STATUS.new;
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    setUpdating(false);
    onUpdate();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "تفاصيل الطلب" : "Order Details"}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px", marginBottom: 14 }}>
          {[
            [ar ? "العميل" : "Customer", order.customer_name || "-"],
            [ar ? "الهاتف" : "Phone", order.customer_phone || "-"],
            [ar ? "العنوان" : "Address", order.delivery_address || "-"],
            [ar ? "المجموع" : "Total", (order.total || 0).toLocaleString() + " " + (ar ? "د.ع" : "IQD")],
            [ar ? "الدفع" : "Payment", ar ? "عند الاستلام" : "Cash on Delivery"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>{k}</span>
              <span style={{ fontWeight: "600", color: "#1e293b", fontSize: 13 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>{ar ? "الحالة" : "Status"}</span>
            <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: "700" }}>{s.label}</span>
          </div>
        </div>

        {/* Status update buttons */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{ar ? "تحديث الحالة:" : "Update Status:"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["new", ar ? "جديد" : "New"], ["processing", ar ? "قيد التنفيذ" : "Processing"], ["delivered", ar ? "تم التوصيل" : "Delivered"], ["cancelled", ar ? "ملغي" : "Cancelled"]].map(([status, label]) => (
              <button key={status} onClick={() => updateStatus(status)} disabled={updating || order.status === status} style={{ background: order.status === status ? "#1a2b6b" : "#f1f5f9", color: order.status === status ? "white" : "#374151", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {order.customer_phone && (
          <a href={"https://wa.me/" + order.customer_phone.replace(/\D/g, "")} style={{ display: "block", background: "#25D366", color: "white", borderRadius: 12, padding: "12px", fontWeight: "700", fontSize: 14, textDecoration: "none", textAlign: "center" }}>
            💬 {ar ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
          </a>
        )}
      </div>
    </div>
  );
}
