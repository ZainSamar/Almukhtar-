import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Icon = ({ d, size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  orders: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0H9z",
  products: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 3H8L6 7h12l-2-4z",
  store: "M3 3h18 M3 3v18 M21 3v18 M3 21h18 M8 3v4 M16 3v4 M3 12h18",
  stats: "M18 20V10 M12 20V4 M6 20v-6",
  plus: "M12 5v14 M5 12h14",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
};

const mockOrders = [
  { id: "#1042", customer: "أحمد محمد", product: "ساعة كلاسيكية", price: "85,000", status: "new", time: "منذ 5 دقائق", phone: "07701234567" },
  { id: "#1041", customer: "سارة علي", product: "حقيبة جلدية", price: "120,000", status: "processing", time: "منذ 30 دقيقة", phone: "07709876543" },
  { id: "#1040", customer: "محمد حسين", product: "عطر فاخر", price: "65,000", status: "delivered", time: "أمس", phone: "07705551234" },
  { id: "#1039", customer: "فاطمة كريم", product: "إكسسوارات", price: "42,000", status: "delivered", time: "أمس", phone: "07703334444" },
];

const mockProducts = [
  { id: 1, name: "ساعة كلاسيكية", price: "85,000", stock: 12, status: "active", orders: 24 },
  { id: 2, name: "حقيبة جلدية", price: "120,000", stock: 5, status: "active", orders: 18 },
  { id: 3, name: "عطر فاخر", price: "65,000", stock: 0, status: "out", orders: 31 },
  { id: 4, name: "إكسسوارات ذهبية", price: "42,000", stock: 20, status: "active", orders: 9 },
];

const STATUS = {
  new: { label: "جديد", color: "#2563eb", bg: "#eff6ff" },
  processing: { label: "قيد التنفيذ", color: "#d97706", bg: "#fffbeb" },
  delivered: { label: "تم التوصيل", color: "#16a34a", bg: "#f0fdf4" },
};

export default function SellerDashboard() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("ar");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();
  const ar = lang === "ar";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "#f1f5f9", minHeight: "100vh", paddingBottom: 80 }}>

      <div style={{ background: "#1a2b6b", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="36" height="28" viewBox="0 0 120 44">
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="3"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <text x="60" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter">AL-MUKHTAR</text>
          </svg>
          <div>
            <div style={{ color: "white", fontSize: 13, fontWeight: "700" }}>{ar ? "متجر النور" : "Al-Noor Store"}</div>
            <div style={{ color: "#f0c040", fontSize: 10 }}>{ar ? "لوحة التحكم" : "Dashboard"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 6, padding: "4px 9px", fontSize: 11, cursor: "pointer" }}>
            {ar ? "EN" : "عربي"}
          </button>
          <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 4 }}>
            <Icon d={ICONS.logout} size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {page === "home" && <HomePage ar={ar} setPage={setPage} setShowAddProduct={setShowAddProduct} setSelectedOrder={setSelectedOrder} />}
        {page === "orders" && <OrdersPage ar={ar} setSelectedOrder={setSelectedOrder} />}
        {page === "products" && <ProductsPage ar={ar} setShowAddProduct={setShowAddProduct} />}
        {page === "store" && <StorePage ar={ar} />}
        {page === "stats" && <StatsPage ar={ar} />}
      </div>

      {showAddProduct && <AddProductModal ar={ar} onClose={() => setShowAddProduct(false)} />}
      {selectedOrder && <OrderModal ar={ar} order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

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
            {page === tab.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#f0c040", marginTop: 1 }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomePage({ ar, setPage, setShowAddProduct, setSelectedOrder }) {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#1a2b6b,#2d4499)", borderRadius: 16, padding: "20px 18px", marginBottom: 16, color: "white" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{ar ? "مرحباً بك 👋" : "Welcome back 👋"}</div>
        <div style={{ fontSize: 20, fontWeight: "800" }}>{ar ? "متجر النور" : "Al-Noor Store"}</div>
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          {[
            { label: ar ? "طلبات اليوم" : "Today's Orders", val: "7" },
            { label: ar ? "المبيعات" : "Sales", val: "432,000" },
            { label: ar ? "المنتجات" : "Products", val: "4" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: "800", color: "#f0c040" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

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

      <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 15 }}>{ar ? "آخر الطلبات" : "Recent Orders"}</span>
          <button onClick={() => setPage("orders")} style={{ background: "none", border: "none", color: "#1a2b6b", fontSize: 12, fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{ar ? "عرض الكل" : "View All"}</button>
        </div>
        {mockOrders.slice(0, 3).map(order => (
          <OrderCard key={order.id} order={order} ar={ar} onClick={() => setSelectedOrder(order)} />
        ))}
      </div>
    </div>
  );
}

function OrdersPage({ ar, setSelectedOrder }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? mockOrders : mockOrders.filter(o => o.status === filter);
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
      {filtered.map(order => (
        <OrderCard key={order.id} order={order} ar={ar} onClick={() => setSelectedOrder(order)} />
      ))}
    </div>
  );
}

function OrderCard({ order, ar, onClick }) {
  const s = STATUS[order.status];
  return (
    <div onClick={onClick} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", border: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 14 }}>{order.customer}</span>
          <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: "600" }}>{s.label}</span>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>{order.product}</div>
        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{order.time}</div>
      </div>
      <div style={{ textAlign: ar ? "left" : "right" }}>
        <div style={{ fontWeight: "800", color: "#1a2b6b", fontSize: 15 }}>{order.price}</div>
        <div style={{ color: "#94a3b8", fontSize: 10 }}>{ar ? "د.ع" : "IQD"}</div>
      </div>
    </div>
  );
}

function ProductsPage({ ar, setShowAddProduct }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", margin: 0 }}>{ar ? "المنتجات" : "Products"}</h2>
        <button onClick={() => setShowAddProduct(true)} style={{ background: "#f0c040", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: "700", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", color: "#1a2b6b" }}>
          <Icon d={ICONS.plus} size={16} color="#1a2b6b" /> {ar ? "إضافة" : "Add"}
        </button>
      </div>
      {mockProducts.map(p => (
        <div key={p.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: "700", color: "#1e293b", fontSize: 15, marginBottom: 4 }}>{p.name}</div>
              <div style={{ color: "#1a2b6b", fontWeight: "800", fontSize: 16 }}>{p.price} <span style={{ fontSize: 11, fontWeight: "400", color: "#94a3b8" }}>{ar ? "د.ع" : "IQD"}</span></div>
            </div>
            <span style={{ background: p.status === "active" ? "#f0fdf4" : "#fef2f2", color: p.status === "active" ? "#16a34a" : "#dc2626", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: "600" }}>
              {p.status === "active" ? (ar ? "نشط" : "Active") : (ar ? "نفد" : "Out")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>📦 {ar ? "المخزون:" : "Stock:"} <b>{p.stock}</b></span>
            <span style={{ fontSize: 12, color: "#64748b" }}>🛒 {ar ? "الطلبات:" : "Orders:"} <b>{p.orders}</b></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StorePage({ ar }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "متجري" : "My Store"}</h2>
      <div style={{ background: "linear-gradient(135deg,#1a2b6b,#2d4499)", borderRadius: 16, padding: "20px 18px", marginBottom: 16, color: "white", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
        <div style={{ fontSize: 20, fontWeight: "800" }}>{ar ? "متجر النور" : "Al-Noor Store"}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>almukhtar.io/store/al-noor</div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {["واتساب", "إنستغرام", "تيك توك", "فيسبوك"].map(p => (
            <button key={p} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{ background: "white", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontWeight: "700", marginBottom: 14, color: "#1e293b" }}>{ar ? "إعدادات المتجر" : "Store Settings"}</div>
        {[
          [ar ? "اسم المتجر" : "Store Name", ar ? "متجر النور" : "Al-Noor Store"],
          [ar ? "رقم الهاتف" : "Phone", "0770 123 4567"],
          [ar ? "المدينة" : "City", ar ? "بغداد" : "Baghdad"],
          [ar ? "وصف المتجر" : "Description", ar ? "ملابس وإكسسوارات راقية" : "Luxury clothes & accessories"],
        ].map(([k, v]) => (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{k}</div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1e293b", border: "1.5px solid #e2e8f0" }}>{v}</div>
          </div>
        ))}
        <button style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "12px", width: "100%", fontWeight: "700", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {ar ? "حفظ التغييرات" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function StatsPage({ ar }) {
  const bars = [
    { day: ar ? "السبت" : "Sat", val: 60 },
    { day: ar ? "الأحد" : "Sun", val: 80 },
    { day: ar ? "الاثنين" : "Mon", val: 45 },
    { day: ar ? "الثلاثاء" : "Tue", val: 90 },
    { day: ar ? "الأربعاء" : "Wed", val: 70 },
    { day: ar ? "الخميس" : "Thu", val: 100 },
    { day: ar ? "الجمعة" : "Fri", val: 55 },
  ];
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 14 }}>{ar ? "الإحصائيات" : "Statistics"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: ar ? "إجمالي المبيعات" : "Total Sales", val: "1,240,000", unit: ar ? "د.ع" : "IQD", color: "#1a2b6b" },
          { label: ar ? "عدد الطلبات" : "Total Orders", val: "87", unit: ar ? "طلب" : "orders", color: "#2563eb" },
          { label: ar ? "متوسط الطلب" : "Avg Order", val: "72,000", unit: ar ? "د.ع" : "IQD", color: "#16a34a" },
          { label: ar ? "معدل التوصيل" : "Delivery Rate", val: "96%", unit: "", color: "#d97706" },
        ].map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px", border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: "800", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: 16, padding: "16px" }}>
        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>{ar ? "المبيعات هذا الأسبوع" : "Sales This Week"}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", background: i === 5 ? "#f0c040" : "#e2e8f0", borderRadius: "4px 4px 0 0", height: b.val + "%", minHeight: 4 }} />
              <span style={{ fontSize: 9, color: "#94a3b8" }}>{b.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddProductModal({ ar, onClose }) {
  const [type, setType] = useState("clothes");
  const types = [
    { key: "clothes", label: ar ? "👕 ملابس" : "👕 Clothes" },
    { key: "electronics", label: ar ? "📱 إلكترونيات" : "📱 Electronics" },
    { key: "food", label: ar ? "🍔 طعام" : "🍔 Food" },
    { key: "home", label: ar ? "🏠 منزل" : "🏠 Home" },
    { key: "beauty", label: ar ? "💄 جمال" : "💄 Beauty" },
    { key: "other", label: ar ? "📦 عام" : "📦 Other" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "إضافة منتج جديد" : "Add New Product"}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "نوع المنتج" : "Product Type"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {types.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} style={{ background: type === t.key ? "#1a2b6b" : "#f8fafc", color: type === t.key ? "white" : "#374151", border: "1.5px solid", borderColor: type === t.key ? "#1a2b6b" : "#e2e8f0", borderRadius: 10, padding: "10px 6px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: type === t.key ? "700" : "400" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "صور المنتج" : "Product Photos"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ aspectRatio: "1", background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer" }}>
              {i === 0 ? "📷" : "+"}
            </div>
          ))}
        </div>
        {[
          [ar ? "اسم المنتج (عربي)" : "Product Name (Arabic)", ar ? "مثال: حقيبة جلدية" : "e.g. Leather Bag", "text", false],
          [ar ? "اسم المنتج (إنكليزي)" : "Product Name (English)", "e.g. Leather Bag", "text", false],
          [ar ? "الوصف" : "Description", ar ? "تفاصيل المنتج..." : "Product details...", "text", true],
        ].map(([label, ph, type, ml]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{label}</div>
            {ml
              ? <textarea placeholder={ph} rows={3} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", resize: "none", boxSizing: "border-box", outline: "none" }} />
              : <input type={type} placeholder={ph} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            }
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[[ar ? "السعر (د.ع)" : "Price (IQD)", "0"], [ar ? "الكمية" : "Stock", "0"]].map(([label, ph]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{label}</div>
              <input type="number" placeholder={ph} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "الباركود (اختياري)" : "Barcode (optional)"}</div>
          <input type="text" placeholder="000000000" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
        </div>
        {type === "clothes" && (
          <>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "المقاسات" : "Sizes"}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {["XS","S","M","L","XL","XXL"].map(s => (
                <button key={s} style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
              ))}
            </div>
          </>
        )}
        <button style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 14, padding: "14px", width: "100%", fontWeight: "800", fontSize: 15, cursor: "pointer", marginTop: 8, fontFamily: "inherit" }}>
          {ar ? "حفظ المنتج ✓" : "Save Product ✓"}
        </button>
      </div>
    </div>
  );
}

function OrderModal({ ar, order, onClose }) {
  const s = STATUS[order.status];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "تفاصيل الطلب" : "Order Details"} {order.id}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px", marginBottom: 14 }}>
          {[
            [ar ? "العميل" : "Customer", order.customer],
            [ar ? "المنتج" : "Product", order.product],
            [ar ? "السعر" : "Price", order.price + " " + (ar ? "د.ع" : "IQD")],
            [ar ? "الهاتف" : "Phone", order.phone],
            [ar ? "الوقت" : "Time", order.time],
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <a href={"https://wa.me/" + order.phone} style={{ background: "#25D366", color: "white", borderRadius: 12, padding: "12px", fontWeight: "700", fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}>
            واتساب 📱
          </a>
          <button style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: "700", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "تحديث الحالة" : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
