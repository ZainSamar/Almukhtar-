import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register | otp | setpassword
  const [role, setRole] = useState("seller");
  const [lang, setLang] = useState("ar");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
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
    const cleaned = val.trim();
    if (cleaned.startsWith("+")) return cleaned;
    const digits = cleaned.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+964" + digits.slice(1);
    return "+" + digits;
  };

  // STEP 1 — Send OTP for registration
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) { setError(ar ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number"); return; }
    if (!name) { setError(ar ? "أدخل اسمك الكامل" : "Enter your full name"); return; }
    if (role === "seller" && !storeName) { setError(ar ? "أدخل اسم متجرك" : "Enter your store name"); return; }
    setLoading(true); setError("");
    try {
      const fp = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: fp });
      if (error) throw error;
      setMode("otp");
      startCountdown();
    } catch (err) {
      setError(ar ? "حدث خطأ، تأكد من رقم الهاتف" : "Error, check your phone number");
    }
    setLoading(false);
  };

  // STEP 2 — Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) { setError(ar ? "أدخل الرمز المكون من 6 أرقام" : "Enter the 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const fp = formatPhone(phone);
      const { error } = await supabase.auth.verifyOtp({ phone: fp, token: otp, type: "sms" });
      if (error) throw error;
      setMode("setpassword");
    } catch (err) {
      setError(ar ? "الرمز غير صحيح" : "Invalid code");
    }
    setLoading(false);
  };

  // STEP 3 — Set password and save profile
  const handleSetPassword = async () => {
    if (!password || password.length < 6) { setError(ar ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError(ar ? "كلمتا المرور غير متطابقتين" : "Passwords don't match"); return; }
    setLoading(true); setError("");
    try {
      // Update password
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      const user = data.user;
      if (user) {
        const slugName = storeName ? storeName.replace(/\s+/g, "-").toLowerCase() : "store-" + Date.now();

        await supabase.from("users").upsert({
          id: user.id,
          phone: formatPhone(phone),
          full_name: name,
          role,
          created_at: new Date().toISOString(),
        });

        if (role === "seller") {
          await supabase.from("stores").upsert({
            owner_id: user.id,
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
      setError(ar ? "حدث خطأ، حاول مرة ثانية" : "An error occurred");
    }
    setLoading(false);
  };

  // LOGIN with phone + password
  const handleLogin = async () => {
    if (!phone || phone.length < 10) { setError(ar ? "أدخل رقم الهاتف" : "Enter phone number"); return; }
    if (!password) { setError(ar ? "أدخل كلمة المرور" : "Enter password"); return; }
    setLoading(true); setError("");
    try {
      const fp = formatPhone(phone);
      const { data, error } = await supabase.auth.signInWithPassword({ phone: fp, password });
      if (error) throw error;

      // Check role
      const { data: userData } = await supabase.from("users").select("role").eq("id", data.user.id).single();
      if (userData?.role === "seller") navigate("/dashboard");
      else navigate("/store");
    } catch (err) {
      setError(ar ? "رقم الهاتف أو كلمة المرور غير صحيحة" : "Incorrect phone or password");
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

        {/* LANG */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}>
            {ar ? "EN" : "عربي"}
          </button>
        </div>

        {/* ===== LOGIN MODE ===== */}
        {mode === "login" && (
          <>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20 }}>
              <button onClick={() => { setMode("login"); setError(""); }} style={{ flex: 1, background: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: "700", color: "#1a2b6b", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                {ar ? "تسجيل الدخول" : "Login"}
              </button>
              <button onClick={() => { setMode("register"); setError(""); }} style={{ flex: 1, background: "transparent", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: "400", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "إنشاء حساب" : "Register"}
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "رقم الهاتف" : "Phone Number"}</div>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXXX XXXX" type="tel" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", direction: "ltr" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "كلمة المرور" : "Password"}</div>
              <div style={{ position: "relative" }}>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type={showPass ? "text" : "password"} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", top: "50%", insetInlineEnd: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading} style={{ background: loading ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 14 }}>
              {loading ? (ar ? "جاري الدخول..." : "Logging in...") : (ar ? "تسجيل الدخول ←" : "Login →")}
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "← العودة للرئيسية" : "← Back to Home"}
              </button>
            </div>
          </>
        )}

        {/* ===== REGISTER MODE ===== */}
        {mode === "register" && (
          <>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20 }}>
              <button onClick={() => { setMode("login"); setError(""); }} style={{ flex: 1, background: "transparent", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: "400", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "تسجيل الدخول" : "Login"}
              </button>
              <button onClick={() => { setMode("register"); setError(""); }} style={{ flex: 1, background: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: "700", color: "#1a2b6b", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                {ar ? "إنشاء حساب" : "Register"}
              </button>
            </div>

            {/* ROLE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 8 }}>{ar ? "أنا..." : "I am..."}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={() => setRole("seller")} style={{ background: role === "seller" ? "#f0f4ff" : "#f8fafc", border: `2px solid ${role === "seller" ? "#1a2b6b" : "#e2e8f0"}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>🏪</div>
                  <div style={{ fontWeight: "700", color: role === "seller" ? "#1a2b6b" : "#64748b", fontSize: 13 }}>{ar ? "بائع" : "Seller"}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{ar ? "أدر متجرك" : "Manage store"}</div>
                </button>
                <button onClick={() => setRole("buyer")} style={{ background: role === "buyer" ? "#f0f4ff" : "#f8fafc", border: `2px solid ${role === "buyer" ? "#1a2b6b" : "#e2e8f0"}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>🛒</div>
                  <div style={{ fontWeight: "700", color: role === "buyer" ? "#1a2b6b" : "#64748b", fontSize: 13 }}>{ar ? "مشتري" : "Buyer"}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{ar ? "تسوق الآن" : "Shop now"}</div>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "الاسم الكامل *" : "Full Name *"}</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={ar ? "أدخل اسمك" : "Enter your name"} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            </div>

            {role === "seller" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "اسم المتجر *" : "Store Name *"}</div>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={ar ? "مثال: متجر النور" : "e.g. Al-Noor Store"} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                {storeName && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>🔗 almukhtar.io/store/{storeName.replace(/\s+/g, "-").toLowerCase()}</div>}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "رقم الهاتف *" : "Phone Number *"}</div>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXXX XXXX" type="tel" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", direction: "ltr" }} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{ar ? "سنرسل رمز تحقق لتأكيد هويتك" : "We'll send a verification code"}</div>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleSendOTP} disabled={loading} style={{ background: loading ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 14 }}>
              {loading ? (ar ? "جاري الإرسال..." : "Sending...") : (ar ? "إرسال رمز التحقق ←" : "Send Code →")}
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "← العودة للرئيسية" : "← Back to Home"}
              </button>
            </div>
          </>
        )}

        {/* ===== OTP MODE ===== */}
        {mode === "otp" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📱</div>
              <h3 style={{ fontSize: 17, fontWeight: "800", color: "#1e293b", margin: "0 0 8px" }}>{ar ? "أدخل رمز التحقق" : "Enter Verification Code"}</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{ar ? `أرسلنا رمز إلى ${phone}` : `Sent to ${phone}`}</p>
            </div>

            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" maxLength={6} type="tel" style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px", fontSize: 28, fontFamily: "monospace", boxSizing: "border-box", outline: "none", textAlign: "center", letterSpacing: 12, direction: "ltr", marginBottom: 16 }} />

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6} style={{ background: loading || otp.length < 6 ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: loading || otp.length < 6 ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 14 }}>
              {loading ? (ar ? "جاري التحقق..." : "Verifying...") : (ar ? "تأكيد الرمز ✓" : "Verify ✓")}
            </button>

            <div style={{ textAlign: "center" }}>
              {countdown > 0
                ? <span style={{ fontSize: 13, color: "#94a3b8" }}>{ar ? `إعادة الإرسال بعد ${countdown}ث` : `Resend in ${countdown}s`}</span>
                : <button onClick={handleSendOTP} style={{ background: "none", border: "none", color: "#1a2b6b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>{ar ? "إعادة إرسال الرمز" : "Resend Code"}</button>
              }
            </div>
          </>
        )}

        {/* ===== SET PASSWORD MODE ===== */}
        {mode === "setpassword" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
              <h3 style={{ fontSize: 17, fontWeight: "800", color: "#1e293b", margin: "0 0 8px" }}>{ar ? "اختر كلمة المرور" : "Set Your Password"}</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{ar ? "ستستخدمها في كل مرة تدخل فيها" : "You'll use this every time you login"}</p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "كلمة المرور" : "Password"}</div>
              <div style={{ position: "relative" }}>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type={showPass ? "text" : "password"} style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", top: "50%", insetInlineEnd: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{ar ? "6 أحرف على الأقل" : "At least 6 characters"}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6 }}>{ar ? "تأكيد كلمة المرور" : "Confirm Password"}</div>
              <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" type={showPass ? "text" : "password"} style={{ width: "100%", background: "#f8fafc", border: `1.5px solid ${confirmPassword && confirmPassword !== password ? "#ef4444" : "#e2e8f0"}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
              {confirmPassword && confirmPassword !== password && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{ar ? "كلمتا المرور غير متطابقتين" : "Passwords don't match"}</div>}
              {confirmPassword && confirmPassword === password && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>✓ {ar ? "متطابقتان" : "Match"}</div>}
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleSetPassword} disabled={loading || !password || password !== confirmPassword} style={{ background: loading || !password || password !== confirmPassword ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "إنشاء الحساب ✓" : "Create Account ✓")}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
