import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [lang, setLang] = useState("ar");
  const navigate = useNavigate();
  const ar = lang === "ar";

  const t = {
    hero: ar ? "افتح متجرك وبيع — بدون تعقيد" : "Open Your Store & Sell — Without Complexity",
    sub: ar
      ? "بدون خبرة تقنية. بدون رسوم مسبقة. شارك رابط متجرك على واتساب، إنستغرام، تيك توك، وفيسبوك — وابدأ البيع اليوم."
      : "No technical experience. No upfront fees. Share your store link on WhatsApp, Instagram, TikTok, and Facebook — and start selling today.",
    open: ar ? "افتح متجرك" : "Open Your Store",
    login: ar ? "تسجيل الدخول" : "Login",
    tagline: ar ? "تجارتك في ايدك" : "Your Business In Your Hands",
    platform: ar ? "منصة تجارتك ومنصة تسوقك" : "Your Commerce & Shopping Platform",
    stats1: ar ? "تاجر نشط" : "Active Merchants",
    stats2: ar ? "طلب منجز" : "Orders Completed",
    stats3: ar ? "نسبة رضا" : "Satisfaction Rate",
    how: ar ? "كيف تبدأ؟" : "How to Start?",
    step1t: ar ? "أنشئ متجرك" : "Create Your Store",
    step1d: ar ? "سجّل وأنشئ متجرك في دقائق" : "Register and create your store in minutes",
    step2t: ar ? "أضف منتجاتك" : "Add Your Products",
    step2d: ar ? "رفع الصور والأسعار بسهولة" : "Upload photos and prices easily",
    step3t: ar ? "شارك الرابط" : "Share the Link",
    step3d: ar ? "أرسله على واتساب وإنستغرام" : "Send it on WhatsApp and Instagram",
    step4t: ar ? "استلم الطلبات" : "Receive Orders",
    step4d: ar ? "الزبون يطلب والدفع عند التوصيل" : "Customer orders, payment on delivery",
    footer: ar ? "منصة المختار للتجارة الإلكترونية © 2026" : "Al-Mukhtar E-Commerce Platform © 2026",
    terms: ar ? "الشروط والأحكام" : "Terms & Conditions",
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal', sans-serif" : "'Inter', sans-serif", background: "#f8f9ff", minHeight: "100vh" }}>

      {/* NAVBAR */}
      <nav style={{ background: "#1a2b6b", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        {/* LOGO */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/")}>
          <svg width="120" height="44" viewBox="0 0 120 44" xmlns="http://www.w3.org/2000/svg">
            {/* Roof */}
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#f0c040" strokeWidth="2.5" strokeLinejoin="round"/>
            {/* Left wall */}
            <line x1="14" y1="22" x2="14" y2="36" stroke="#f0c040" strokeWidth="2"/>
            {/* Right wall */}
            <line x1="106" y1="22" x2="106" y2="36" stroke="#f0c040" strokeWidth="2"/>
            {/* Floor */}
            <line x1="14" y1="36" x2="106" y2="36" stroke="#f0c040" strokeWidth="2"/>
            {/* AL-MUKHTAR text inside house */}
            <text x="60" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="1">AL-MUKHTAR</text>
          </svg>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: -4 }}>
            <span style={{ color: "white", fontSize: 15, fontWeight: "800", fontFamily: "Tajawal, sans-serif" }}>المختار</span>
            <span style={{ color: "#f0c040", fontSize: 9, fontFamily: "Tajawal, sans-serif" }}>تجارتك في ايدك</span>
          </div>
        </div>

        {/* NAV BUTTONS */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/login")} style={{ background: "transparent", border: "1.5px solid white", color: "white", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
            {t.login}
          </button>
          <button onClick={() => navigate("/register")} style={{ background: "#f0c040", border: "none", color: "#1a2b6b", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
            {t.open}
          </button>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "EN" : "عربي"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #1a2b6b 0%, #2d4499 60%, #1a2b6b 100%)", color: "white", padding: "60px 20px 70px", textAlign: "center" }}>
        <p style={{ color: "#f0c040", fontSize: 14, marginBottom: 16, letterSpacing: 2, textTransform: "uppercase" }}>{t.platform}</p>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 42px)", fontWeight: "800", margin: "0 0 20px", lineHeight: 1.3, maxWidth: 700, marginInline: "auto" }}>
          {t.hero}
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.82)", maxWidth: 560, marginInline: "auto", marginBottom: 36, lineHeight: 1.8 }}>
          {t.sub}
        </p>
        <button onClick={() => navigate("/register")} style={{ background: "#f0c040", color: "#1a2b6b", border: "none", borderRadius: 12, padding: "14px 36px", fontSize: 17, fontWeight: "800", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(240,192,64,0.4)" }}>
          {t.open} ←
        </button>
      </section>

      {/* STATS */}
      <section style={{ background: "white", padding: "32px 20px", display: "flex", justifyContent: "center", gap: "clamp(24px, 5vw, 60px)", flexWrap: "wrap", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {[
          { num: "8,900+", label: t.stats1 },
          { num: "124,000+", label: t.stats2 },
          { num: "99%", label: t.stats3 },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: "800", color: "#1a2b6b" }}>{s.num}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "50px 20px", maxWidth: 800, marginInline: "auto" }}>
        <h2 style={{ textAlign: "center", color: "#1a2b6b", fontSize: 22, fontWeight: "700", marginBottom: 36 }}>{t.how}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20 }}>
          {[
            { icon: "🏪", title: t.step1t, desc: t.step1d, num: "1" },
            { icon: "📸", title: t.step2t, desc: t.step2d, num: "2" },
            { icon: "📲", title: t.step3t, desc: t.step3d, num: "3" },
            { icon: "📦", title: t.step4t, desc: t.step4d, num: "4" },
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

      {/* CTA BOTTOM */}
      <section style={{ background: "#1a2b6b", padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
          {ar ? "ابدأ مجاناً اليوم" : "Start Free Today"}
        </h2>
        <button onClick={() => navigate("/register")} style={{ background: "#f0c040", color: "#1a2b6b", border: "none", borderRadius: 12, padding: "14px 36px", fontSize: 16, fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
          {t.open}
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px", fontSize: 12 }}>
        <div>{t.footer}</div>
        <div style={{ marginTop: 8 }}>
          <a href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{t.terms}</a>
        </div>
      </footer>
    </div>
  );
}
