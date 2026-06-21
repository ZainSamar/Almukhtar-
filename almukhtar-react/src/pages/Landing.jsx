import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [lang, setLang] = useState("ar");
  const navigate = useNavigate();
  const ar = lang === "ar";

  const plans = [
    {
      name: ar ? "مجاني" : "Free",
      price: "$0",
      period: ar ? "/دائماً" : "/forever",
      emoji: "🆓",
      color: "#64748b",
      bg: "#f8fafc",
      border: "#e2e8f0",
      features: [
        ar ? "حتى 10 منتجات" : "Up to 10 products",
        ar ? "عمولة 5% لكل طلب" : "5% commission per order",
        ar ? "رابط متجر خاص" : "Custom store link",
        ar ? "دعم واتساب" : "WhatsApp support",
      ],
      cta: ar ? "ابدأ مجاناً" : "Start Free",
      highlight: false,
    },
    {
      name: ar ? "أساسي" : "Basic",
      price: "$15",
      period: ar ? "/شهر" : "/month",
      emoji: "⭐",
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#2563eb",
      features: [
        ar ? "حتى 50 منتج" : "Up to 50 products",
        ar ? "عمولة 2% لكل طلب" : "2% commission per order",
        ar ? "رابط متجر خاص" : "Custom store link",
        ar ? "إشعارات واتساب" : "WhatsApp notifications",
        ar ? "إحصائيات المبيعات" : "Sales statistics",
        ar ? "دعم أولوية" : "Priority support",
      ],
      cta: ar ? "اشترك الآن" : "Subscribe Now",
      highlight: false,
    },
    {
      name: ar ? "مميز" : "Premium",
      price: "$30",
      period: ar ? "/شهر" : "/month",
      emoji: "👑",
      color: "#1a2b6b",
      bg: "#1a2b6b",
      border: "#1a2b6b",
      features: [
        ar ? "منتجات غير محدودة" : "Unlimited products",
        ar ? "عمولة 1% فقط" : "Only 1% commission",
        ar ? "رابط متجر مخصص" : "Custom store link",
        ar ? "إشعارات واتساب فورية" : "Instant WhatsApp alerts",
        ar ? "إحصائيات متقدمة" : "Advanced analytics",
        ar ? "دعم على مدار الساعة" : "24/7 support",
        ar ? "أولوية في النتائج" : "Priority in search",
      ],
      cta: ar ? "اشترك الآن" : "Subscribe Now",
      highlight: true,
    },
  ];

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "#f8f9ff", minHeight: "100vh" }}>

      {/* NAVBAR */}
      <nav style={{ background: "#1a2b6b", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/")}>
          <svg width="120" height="44" viewBox="0 0 120 44" xmlns="http://www.w3.org/2000/svg">
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="2.5" strokeLinejoin="round"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="2"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="2"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="2"/>
            <text x="60" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="1">AL-MUKHTAR</text>
          </svg>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: -4 }}>
            <span style={{ color: "white", fontSize: 15, fontWeight: "800", fontFamily: "Tajawal, sans-serif" }}>المختار</span>
            <span style={{ color: "#f0c040", fontSize: 9 }}>تجارتك في ايدك</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/login")} style={{ background: "transparent", border: "1.5px solid white", color: "white", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "تسجيل الدخول" : "Login"}
          </button>
          <button onClick={() => navigate("/register")} style={{ background: "#f0c040", border: "none", color: "#1a2b6b", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "افتح متجرك" : "Open Your Store"}
          </button>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "EN" : "عربي"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg,#1a2b6b 0%,#2d4499 60%,#1a2b6b 100%)", color: "white", padding: "60px 20px 70px", textAlign: "center" }}>
        <p style={{ color: "#f0c040", fontSize: 14, marginBottom: 16, letterSpacing: 2, textTransform: "uppercase" }}>
          {ar ? "منصة تجارتك ومنصة تسوقك" : "Your Commerce & Shopping Platform"}
        </p>
        <h1 style={{ fontSize: "clamp(24px,5vw,42px)", fontWeight: "800", margin: "0 0 20px", lineHeight: 1.3, maxWidth: 700, marginInline: "auto" }}>
          {ar ? "افتح متجرك وبيع — بدون تعقيد" : "Open Your Store & Sell — Without Complexity"}
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.82)", maxWidth: 560, marginInline: "auto", marginBottom: 36, lineHeight: 1.8 }}>
          {ar
            ? "بدون خبرة تقنية. بدون رسوم مسبقة. شارك رابط متجرك على واتساب، إنستغرام، تيك توك، وفيسبوك — وابدأ البيع اليوم."
            : "No technical experience. No upfront fees. Share your store link on WhatsApp, Instagram, TikTok, and Facebook — and start selling today."}
        </p>
        <button onClick={() => navigate("/register")} style={{ background: "#f0c040", color: "#1a2b6b", border: "none", borderRadius: 12, padding: "14px 36px", fontSize: 17, fontWeight: "800", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(240,192,64,0.4)" }}>
          {ar ? "افتح متجرك ←" : "Open Your Store →"}
        </button>
      </section>

      {/* STATS */}
      <section style={{ background: "white", padding: "32px 20px", display: "flex", justifyContent: "center", gap: "clamp(24px,5vw,60px)", flexWrap: "wrap", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {[
          { num: "8,900+", label: ar ? "تاجر نشط" : "Active Merchants" },
          { num: "124,000+", label: ar ? "طلب منجز" : "Orders Completed" },
          { num: "99%", label: ar ? "نسبة رضا" : "Satisfaction Rate" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: "800", color: "#1a2b6b" }}>{s.num}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "50px 20px", maxWidth: 800, marginInline: "auto" }}>
        <h2 style={{ textAlign: "center", color: "#1a2b6b", fontSize: 22, fontWeight: "700", marginBottom: 36 }}>
          {ar ? "كيف تبدأ؟" : "How to Start?"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 20 }}>
          {[
            { icon: "🏪", title: ar ? "أنشئ متجرك" : "Create Your Store", desc: ar ? "سجّل وأنشئ متجرك في دقائق" : "Register and create your store in minutes", num: "1" },
            { icon: "📸", title: ar ? "أضف منتجاتك" : "Add Your Products", desc: ar ? "رفع الصور والأسعار بسهولة" : "Upload photos and prices easily", num: "2" },
            { icon: "📲", title: ar ? "شارك الرابط" : "Share the Link", desc: ar ? "أرسله على واتساب وإنستغرام" : "Send it on WhatsApp and Instagram", num: "3" },
            { icon: "📦", title: ar ? "استلم الطلبات" : "Receive Orders", desc: ar ? "الزبون يطلب والدفع عند التوصيل" : "Customer orders, payment on delivery", num: "4" },
          ].map((step, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: "24px 16px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", position: "relative" }}>
              <div style={{ position: "absolute", top: 12, insetInlineEnd: 14, background: "#1a2b6b", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "700" }}>{step.num}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{step.icon}</div>
              <div style={{ fontWeight: "700", color: "#1a2b6b", marginBottom: 8, fontSize: 15 }}>{step.title}</div>
              <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "50px 20px 60px", background: "white" }}>
        <h2 style={{ textAlign: "center", color: "#1a2b6b", fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
          {ar ? "الباقات والأسعار" : "Plans & Pricing"}
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 36 }}>
          {ar ? "ابدأ مجاناً — ادفع فقط عندما تكبر" : "Start free — pay only when you grow"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, maxWidth: 900, marginInline: "auto" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: plan.highlight ? "#1a2b6b" : "white", border: `2px solid ${plan.border}`, borderRadius: 20, padding: "28px 24px", position: "relative", boxShadow: plan.highlight ? "0 8px 32px rgba(26,43,107,0.25)" : "0 2px 12px rgba(0,0,0,0.07)" }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: -14, insetInlineStart: "50%", transform: "translateX(-50%)", background: "#f0c040", color: "#1a2b6b", borderRadius: 20, padding: "4px 18px", fontSize: 12, fontWeight: "800", whiteSpace: "nowrap" }}>
                  {ar ? "الأكثر طلباً 🔥" : "Most Popular 🔥"}
                </div>
              )}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{plan.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: "800", color: plan.highlight ? "white" : "#1e293b", marginBottom: 4 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: "800", color: plan.highlight ? "#f0c040" : "#1a2b6b" }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>{plan.period}</span>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: plan.highlight ? "#f0c040" : "#16a34a", fontSize: 16, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/register")} style={{ background: plan.highlight ? "#f0c040" : "#1a2b6b", color: plan.highlight ? "#1a2b6b" : "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 24 }}>
          {ar ? "* العمولة تُحسب على إجمالي قيمة الطلب" : "* Commission calculated on total order value"}
        </p>
      </section>

      {/* CTA */}
      <section style={{ background: "#1a2b6b", padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
          {ar ? "ابدأ مجاناً اليوم" : "Start Free Today"}
        </h2>
        <button onClick={() => navigate("/register")} style={{ background: "#f0c040", color: "#1a2b6b", border: "none", borderRadius: 12, padding: "14px 36px", fontSize: 16, fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
          {ar ? "افتح متجرك" : "Open Your Store"}
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px", fontSize: 12 }}>
        <div>{ar ? "منصة المختار للتجارة الإلكترونية © 2026" : "Al-Mukhtar E-Commerce Platform © 2026"}</div>
        <div style={{ marginTop: 8 }}>
          <a href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{ar ? "الشروط والأحكام" : "Terms & Conditions"}</a>
        </div>
      </footer>
    </div>
  );
}
