import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register | otp
  const [role, setRole] = useState("seller"); // seller | buyer
  const [lang, setLang] = useState("ar");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const ar = lang === "ar";

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatPhone = (val) => {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "964" + cleaned.slice(1);
    if (!cleaned.startsWith("964")) cleaned = "964" + cleaned;
    return "+" + cleaned;
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError(ar ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number");
      return;
    }
    if (mode === "register" && !name) {
      setError(ar ? "أدخل اسمك الكامل" : "Enter your full name");
      return;
    }
    if (mode === "register" && role === "seller" && !storeName) {
      setError(ar ? "أدخل اسم متجرك" : "Enter your store name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      setMode("otp");
      startCountdown();
    } catch (err) {
      setError(ar ? "حدث خطأ، حاول مرة ثانية" : "An error occurred, please try again");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError(ar ? "أدخل الرمز المكون من 6 أرقام" : "Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formattedPhone = formatPhone(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;

      // Save user profile
      if (data.user) {
        const slugName = storeName
          ? storeName.replace(/\s+/g, "-").toLowerCase()
          : "store-" + Date.now();

        await supabase.from("users").upsert({
          id: data.user.id,
          phone: formattedPhone,
          full_name: name,
          role: role,
          created_at: new Date().toISOString(),
        });

        if (role === "seller") {
          await supabase.from("stores").upsert({
            owner_id: data.user.id,
            name: storeName,
            slug: slugName,
            city: "Baghdad",
            is_active: true,
            plan: "free",
            created_at: new Date().toISOString(),
          });
          navigate("/dashboard");
        } else {
          navigate("/store");
        }
      }
    } catch (err) {
      setError(ar ? "الرمز غير صحيح، حاول مرة ثانية" : "Invalid code, please try again");
    }
    setLoading(false);
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "linear-gradient(135deg,#1a2b6b,#2d4499)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>

      <div style={{ background: "white", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <svg width="100" height="38" viewBox="0 0 120 44" style={{ margin: "0 auto" }}>
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#1a2b6b" strokeWidth="2.5"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#1a2b6b" strokeWidth="2"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#1a2b6b" strokeWidth="2"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#1a2b6b" strokeWidth="2"/>
            <text x="60" y="30" textAnchor="middle" fill="#1a2b6b" fontSize="10" fontWeight="700" fontFamily="Inter">AL-MUKHTAR</text>
          </svg>
          <div style={{ fontSize: 18, fontWeight: "800", color: "#1a2b6b", marginTop: 4 }}>المختار</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{ar ? "تجارتك في ايدك" : "Your Business In Your Hands"}</div>
        </div>

        {/* LANG TOGGLE */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}>
            {ar ? "EN" : "عربي"}
          </button>
        </div>

        {mode !== "otp" ? (
          <>
            {/* MODE TABS */}
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {[["login", ar ? "تسجيل الدخول" : "Login"], ["register", ar ? "إنشاء حساب" : "Register"]].map(([m, l]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, background: mode === m ? "white" : "transparent", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: mode === m ? "700" : "400", color: mode === m ? "#1a2b6b" : "#64748b", cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
                  {l}
                </button>
              ))}
            </div>

            {/* ROLE SELECT */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 8 }}>
                {ar ? "أنا..." : "I am..."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* SELLER */}
                <button onClick={() => setRole("seller")} style={{ background: role === "seller" ? "#f0f4ff" : "#f8fafc", border: `2px solid ${role === "seller" ? "#1a2b6b" : "#e2e8f0"}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                  <svg width="40" height="40" viewBox="0 0 100 80" style={{ margin: "0 auto 6px" }}>
                    <rect x="10" y="30" width="80" height="45" rx="4" fill={role === "seller" ? "#1a2b6b" : "#94a3b8"}/>
                    <rect x="25" y="20" width="50" height="15" rx="2" fill={role === "seller" ? "#2d4499" : "#b0bec5"}/>
                    <rect x="35" y="8" width="30" height="14" rx="2" fill={role === "seller" ? "#f0c040" : "#cfd8dc"}/>
                    <rect x="38" y="45" width="24" height="30" rx="2" fill="white" opacity="0.3"/>
                    <rect x="20" y="40" width="14" height="12" rx="1" fill="white" opacity="0.5"/>
                    <rect x="66" y="40" width="14" height="12" rx="1" fill="white" opacity="0.5"/>
                  </svg>
                  <div style={{ fontWeight: "700", color: role === "seller" ? "#1a2b6b" : "#64748b", fontSize: 13 }}>{ar ? "بائع" : "Seller"}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{ar ? "أدر متجرك" : "Manage store"}</div>
                </button>

                {/* BUYER */}
                <button onClick={() => setRole("buyer")} style={{ background: role === "buyer" ? "#f0f4ff" : "#f8fafc", border: `2px solid ${role === "buyer" ? "#1a2b6b" : "#e2e8f0"}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                  <svg width="40" height="40" viewBox="0 0 100 80" style={{ margin: "0 auto 6px" }}>
                    <path d="M20 15 Q18 10 10 10" stroke={role === "buyer" ? "#1a2b6b" : "#94a3b8"} strokeWidth="4" fill="none" strokeLinecap="round"/>
                    <path d="M20 15 L30 55 Q32 62 40 62 L75 62 Q82 62 84 55 L90 28 Q91 22 85 22 L28 22 Z" fill={role === "buyer" ? "#1a2b6b" : "#94a3b8"}/>
                    <circle cx="42" cy="70" r="7" fill={role === "buyer" ? "#f0c040" : "#b0bec5"}/>
                    <circle cx="68" cy="70" r="7" fill={role === "buyer" ? "#f0c040" : "#b0bec5"}/>
                    <path d="M45 38 L55 48 L70 30" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontWeight: "700", color: role === "buyer" ? "#1a2b6b" : "#64748b", fontSize: 13 }}>{ar ? "مشتري" : "Buyer"}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{ar ? "تسوق الآن" : "Shop now"}</div>
                </button>
              </div>
            </div>

            {/* REGISTER FIELDS */}
            {mode === "register" && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "الاسم الكامل *" : "Full Name *"}</div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder={ar ? "أدخل اسمك الكامل" : "Enter your full name"} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                </div>
                {role === "seller" && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "اسم المتجر *" : "Store Name *"}</div>
                    <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={ar ? "مثال: متجر النور" : "e.g. Al-Noor Store"} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                    {storeName && (
                      <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>
                        🔗 almukhtar.io/store/{storeName.replace(/\s+/g, "-").toLowerCase()}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* PHONE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "رقم الهاتف *" : "Phone Number *"}</div>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXXX XXXX" type="tel" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", direction: "ltr" }} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{ar ? "سنرسل لك رمز تحقق على هذا الرقم" : "We'll send a verification code to this number"}</div>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleSendOTP} disabled={loading} style={{ background: loading ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 14 }}>
              {loading ? (ar ? "جاري الإرسال..." : "Sending...") : (ar ? "إرسال رمز التحقق ←" : "Send Verification Code →")}
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "← العودة للرئيسية" : "← Back to Home"}
              </button>
            </div>
          </>
        ) : (
          /* OTP SCREEN */
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📱</div>
              <h3 style={{ fontSize: 17, fontWeight: "800", color: "#1e293b", margin: "0 0 8px" }}>
                {ar ? "أدخل رمز التحقق" : "Enter Verification Code"}
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {ar ? `أرسلنا رمز إلى ${phone}` : `We sent a code to ${phone}`}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" maxLength={6} type="tel" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px", fontSize: 28, fontFamily: "monospace", boxSizing: "border-box", outline: "none", textAlign: "center", letterSpacing: 12, direction: "ltr" }} />
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6} style={{ background: loading || otp.length < 6 ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: loading || otp.length < 6 ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 14 }}>
              {loading ? (ar ? "جاري التحقق..." : "Verifying...") : (ar ? "تأكيد الرمز ✓" : "Verify Code ✓")}
            </button>

            <div style={{ textAlign: "center" }}>
              {countdown > 0 ? (
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{ar ? `إعادة الإرسال بعد ${countdown}ث` : `Resend in ${countdown}s`}</span>
              ) : (
                <button onClick={() => { setMode("login"); setOtp(""); setError(""); }} style={{ background: "none", border: "none", color: "#1a2b6b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                  {ar ? "إعادة إرسال الرمز" : "Resend Code"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
