import { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockProducts = [
  { id: 1, name: "ساعة كلاسيكية", nameEn: "Classic Watch", price: 85000, category: "accessories", desc: "ساعة فاخرة بتصميم كلاسيكي أنيق", descEn: "Elegant classic luxury watch", emoji: "⌚", rating: 4.8, reviews: 24, inStock: true },
  { id: 2, name: "حقيبة جلدية", nameEn: "Leather Bag", price: 120000, category: "bags", desc: "حقيبة جلد طبيعي عالية الجودة", descEn: "High quality genuine leather bag", emoji: "👜", rating: 4.9, reviews: 18, inStock: true },
  { id: 3, name: "عطر فاخر", nameEn: "Luxury Perfume", price: 65000, category: "beauty", desc: "عطر شرقي فاخر يدوم طويلاً", descEn: "Long-lasting luxury oriental perfume", emoji: "🌸", rating: 4.7, reviews: 31, inStock: false },
  { id: 4, name: "إكسسوارات ذهبية", nameEn: "Gold Accessories", price: 42000, category: "accessories", desc: "مجموعة إكسسوارات ذهبية راقية", descEn: "Elegant gold accessories collection", emoji: "✨", rating: 4.6, reviews: 9, inStock: true },
  { id: 5, name: "عباءة فاخرة", nameEn: "Luxury Abaya", price: 95000, category: "clothes", desc: "عباءة بتصميم عصري وقماش فاخر", descEn: "Modern design luxury abaya", emoji: "👗", rating: 4.9, reviews: 42, inStock: true },
  { id: 6, name: "كريم العناية", nameEn: "Skin Care Cream", price: 35000, category: "beauty", desc: "كريم ترطيب طبيعي للبشرة", descEn: "Natural moisturizing skin cream", emoji: "🧴", rating: 4.5, reviews: 15, inStock: true },
];

const CATS = [
  { key: "all", ar: "الكل", en: "All" },
  { key: "clothes", ar: "ملابس", en: "Clothes" },
  { key: "bags", ar: "حقائب", en: "Bags" },
  { key: "accessories", ar: "إكسسوارات", en: "Accessories" },
  { key: "beauty", ar: "جمال", en: "Beauty" },
];

export default function Store() {
  const [lang, setLang] = useState("ar");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const navigate = useNavigate();
  const ar = lang === "ar";

  const filtered = cat === "all" ? mockProducts : mockProducts.filter(p => p.category === cat);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setSelected(null);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const fmt = (n) => n.toLocaleString();

  if (orderDone) return <OrderSuccess ar={ar} onBack={() => { setOrderDone(false); setCart([]); }} />;

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "#f8f9ff", minHeight: "100vh", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: "#1a2b6b", padding: "0 16px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="34" height="26" viewBox="0 0 120 44">
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="3"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="2.5"/>
            <text x="60" y="30" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Inter">AL-MUKHTAR</text>
          </svg>
          <div>
            <div style={{ color: "white", fontSize: 14, fontWeight: "800" }}>{ar ? "متجر النور" : "Al-Noor Store"}</div>
            <div style={{ color: "#f0c040", fontSize: 10 }}>{ar ? "تجارتك في ايدك" : "Your Business In Your Hands"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 6, padding: "4px 9px", fontSize: 11, cursor: "pointer" }}>
            {ar ? "EN" : "عربي"}
          </button>
          <button onClick={() => setShowCart(true)} style={{ background: cartCount > 0 ? "#f0c040" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            {cartCount > 0 && <span style={{ fontWeight: "800", color: "#1a2b6b", fontSize: 13 }}>{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* STORE BANNER */}
      <div style={{ background: "linear-gradient(135deg,#1a2b6b,#2d4499)", padding: "20px 16px", textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🏪</div>
        <div style={{ fontSize: 18, fontWeight: "800" }}>{ar ? "متجر النور" : "Al-Noor Store"}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{ar ? "ملابس وإكسسوارات راقية • بغداد" : "Luxury clothes & accessories • Baghdad"}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
          {[
            { val: mockProducts.length, label: ar ? "منتج" : "Products" },
            { val: "4.8★", label: ar ? "التقييم" : "Rating" },
            { val: ar ? "بغداد" : "Baghdad", label: ar ? "التوصيل" : "Delivery" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: "800", color: "#f0c040" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ padding: "14px 16px 0", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
          {CATS.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)} style={{ background: cat === c.key ? "#1a2b6b" : "white", color: cat === c.key ? "white" : "#64748b", border: "1.5px solid", borderColor: cat === c.key ? "#1a2b6b" : "#e2e8f0", borderRadius: 20, padding: "7px 18px", fontSize: 13, fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              {ar ? c.ar : c.en}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelected(p)} style={{ background: "white", borderRadius: 16, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1.5px solid #f1f5f9" }}>
            {/* Product image area */}
            <div style={{ background: "linear-gradient(135deg,#f0f4ff,#e8f0fe)", height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, position: "relative" }}>
              {p.emoji}
              {!p.inStock && (
                <div style={{ position: "absolute", top: 8, insetInlineStart: 8, background: "#ef4444", color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: "700" }}>
                  {ar ? "نفد" : "Out"}
                </div>
              )}
              {p.inStock && (
                <div style={{ position: "absolute", top: 8, insetInlineEnd: 8, background: "#f0c040", color: "#1a2b6b", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: "700" }}>
                  ★ {p.rating}
                </div>
              )}
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontWeight: "700", color: "#1e293b", fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{ar ? p.name : p.nameEn}</div>
              <div style={{ color: "#1a2b6b", fontWeight: "800", fontSize: 15 }}>{fmt(p.price)}</div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>{ar ? "د.ع" : "IQD"} • {p.reviews} {ar ? "تقييم" : "reviews"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* WHATSAPP FLOAT */}
      <a href="https://wa.me/07701234567" style={{ position: "fixed", bottom: 90, insetInlineEnd: 16, background: "#25D366", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.4)", zIndex: 50 }}>
        💬
      </a>

      {/* PRODUCT DETAIL MODAL */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? selected.name : selected.nameEn}</h3>
              <button onClick={() => setSelected(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <div style={{ background: "linear-gradient(135deg,#f0f4ff,#e8f0fe)", borderRadius: 16, height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, marginBottom: 16 }}>
              {selected.emoji}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 24, fontWeight: "800", color: "#1a2b6b" }}>{fmt(selected.price)} <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: "400" }}>{ar ? "د.ع" : "IQD"}</span></div>
              <div style={{ background: "#fffbeb", color: "#d97706", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: "700" }}>★ {selected.rating} ({selected.reviews})</div>
            </div>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{ar ? selected.desc : selected.descEn}</p>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{ar ? "التوصيل" : "Delivery"}</span>
                <span style={{ fontSize: 13, fontWeight: "600", color: "#16a34a" }}>{ar ? "متاح في بغداد" : "Available in Baghdad"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{ar ? "الدفع" : "Payment"}</span>
                <span style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>{ar ? "عند الاستلام" : "Cash on Delivery"}</span>
              </div>
            </div>
            {selected.inStock ? (
              <button onClick={() => addToCart(selected)} style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 14, padding: "14px", width: "100%", fontWeight: "800", fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
                🛒 {ar ? "أضف للسلة" : "Add to Cart"}
              </button>
            ) : (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 14, padding: "14px", textAlign: "center", fontWeight: "700", fontSize: 14 }}>
                {ar ? "نفد المخزون" : "Out of Stock"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART MODAL */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>🛒 {ar ? "سلة التسوق" : "Shopping Cart"}</h3>
              <button onClick={() => setShowCart(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 15 }}>{ar ? "السلة فارغة" : "Cart is empty"}</div>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: 13, color: "#1e293b" }}>{ar ? item.name : item.nameEn}</div>
                        <div style={{ fontSize: 12, color: "#1a2b6b", fontWeight: "700" }}>{fmt(item.price)} {ar ? "د.ع" : "IQD"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>x{item.qty}</span>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: "#dc2626", fontSize: 16 }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ background: "#f0f4ff", borderRadius: 12, padding: "14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "700", color: "#1e293b" }}>{ar ? "المجموع" : "Total"}</span>
                  <span style={{ fontWeight: "800", color: "#1a2b6b", fontSize: 18 }}>{fmt(cartTotal)} {ar ? "د.ع" : "IQD"}</span>
                </div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 14, padding: "14px", width: "100%", fontWeight: "800", fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
                  {ar ? "إتمام الطلب ←" : "Checkout ←"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "20px 16px 40px", fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{ar ? "إتمام الطلب" : "Checkout"}</h3>
              <button onClick={() => setShowCheckout(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {[
              [ar ? "الاسم الكامل *" : "Full Name *", ar ? "أدخل اسمك" : "Enter your name", "text"],
              [ar ? "رقم الهاتف *" : "Phone Number *", "07X XXXX XXXX", "tel"],
              [ar ? "المحافظة" : "Governorate", ar ? "بغداد" : "Baghdad", "text"],
              [ar ? "العنوان التفصيلي *" : "Detailed Address *", ar ? "الحي، الشارع، رقم البيت" : "District, Street, House No.", "text"],
              [ar ? "ملاحظات (اختياري)" : "Notes (optional)", ar ? "أي تعليمات للتوصيل..." : "Any delivery instructions...", "text"],
            ].map(([label, ph, type]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{label}</div>
                <input type={type} placeholder={ph} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}

            <div style={{ background: "#fffbeb", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontWeight: "700", color: "#92400e", marginBottom: 8, fontSize: 13 }}>💳 {ar ? "طريقة الدفع" : "Payment Method"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "10px 14px", border: "2px solid #f0c040" }}>
                <span style={{ fontSize: 20 }}>💵</span>
                <span style={{ fontWeight: "700", color: "#1e293b", fontSize: 14 }}>{ar ? "الدفع عند الاستلام" : "Cash on Delivery"}</span>
                <span style={{ marginInlineStart: "auto", color: "#16a34a", fontSize: 18 }}>✓</span>
              </div>
            </div>

            <div style={{ background: "#f0f4ff", borderRadius: 12, padding: "14px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{ar ? "عدد المنتجات" : "Items"}</span>
                <span style={{ fontSize: 13, fontWeight: "600" }}>{cartCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "700", color: "#1e293b" }}>{ar ? "المجموع الكلي" : "Total"}</span>
                <span style={{ fontWeight: "800", color: "#1a2b6b", fontSize: 18 }}>{fmt(cartTotal)} {ar ? "د.ع" : "IQD"}</span>
              </div>
            </div>

            <button onClick={() => { setShowCheckout(false); setOrderDone(true); }} style={{ background: "#1a2b6b", color: "white", border: "none", borderRadius: 14, padding: "14px", width: "100%", fontWeight: "800", fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
              ✓ {ar ? "تأكيد الطلب" : "Confirm Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSuccess({ ar, onBack }) {
  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "Tajawal,sans-serif" : "Inter,sans-serif", background: "#f8f9ff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: "800", color: "#1a2b6b", marginBottom: 12 }}>
          {ar ? "تم استلام طلبك!" : "Order Received!"}
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
          {ar ? "سيتواصل معك التاجر خلال دقائق لتأكيد طلبك وتحديد موعد التوصيل." : "The merchant will contact you within minutes to confirm your order and arrange delivery."}
        </p>
        <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 24, border: "1.5px solid #e2e8f0" }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{ar ? "رقم الطلب" : "Order ID"}</div>
          <div style={{ fontSize: 22, fontWeight: "800", color: "#1a2b6b" }}>#1043</div>
        </div>
        <a href="https://wa.me/07701234567" style={{ display: "block", background: "#25D366", color: "white", borderRadius: 14, padding: "13px", fontWeight: "700", fontSize: 15, textDecoration: "none", marginBottom: 12 }}>
          💬 {ar ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
        </a>
        <button onClick={onBack} style={{ background: "white", color: "#1a2b6b", border: "2px solid #1a2b6b", borderRadius: 14, padding: "13px", width: "100%", fontWeight: "700", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
          {ar ? "متابعة التسوق" : "Continue Shopping"}
        </button>
      </div>
    </div>
  );
}
