import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("seller");
  const [lang, setLang] = useState("ar");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    const cleaned = val.trim();
    if (cleaned.startsWith("+")) return cleaned;
    const digits = cleaned.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+964" + digits.slice(1);
    return "+" + digits;
  };

  // STEP 1 — Send OTP
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) { setError(ar ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number"); return; }
    if (!name) { setError(ar ? "أدخل اسمك الكامل" : "Enter your full name"); return; }
    if (!email || !email.includes("@")) { setError(ar ? "أدخل بريد إلكتروني صحيح" : "Enter a valid email"); return; }
    if (role === "seller" && !storeName) { setError(ar ? "أدخل اسم متجرك" : "Enter your store name"); return; }
    if (!agreedToTerms) { setError(ar ? "يجب الموافقة على الشروط والأحكام للمتابعة" : "You must agree to the terms to continue"); return; }
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
      const { data, error } = await supabase.auth.updateUser({ 
        password,
        email,
      });
      if (error) throw error;

      const user = data.user;
      if (user) {
        const fp = formatPhone(phone);
        const slugName = storeName ? storeName.replace(/\s+/g, "-").toLowerCase() : "store-" + Date.now();
        const signedAt = new Date().toISOString();

        await supabase.from("users").upsert({
          id: user.id,
          phone: fp,
          email,
          full_name: name,
          role,
          terms_agreed: true,
          terms_agreed_at: signedAt,
          created_at: signedAt,
        });

        if (role === "seller") {
          await supabase.from("stores").upsert({
            owner_id: user.id,
            name: storeName,
            slug: slugName,
            city: "Baghdad",
            is_active: true,
            plan: "free",
            created_at: signedAt,
          });

          // Send terms email
          await supabase.functions.invoke("send-terms-email", {
            body: { email, name, storeName, signedAt }
          }).catch(() => {}); // Don't block if email fails

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

  // LOGIN
  const handleLogin = async () => {
    if (!phone || phone.length < 10) { setError(ar ? "أدخل رقم الهاتف" : "Enter phone number"); return; }
    if (!password) { setError(ar ? "أدخل كلمة المرور" : "Enter password"); return; }
    setLoading(true); setError("");
    try {
      const fp = formatPhone(phone);
      const { data, error } = await supabase.auth.signInWithPassword({ phone: fp, password });
      if (error) throw error;
      const { data: userData } = await supabase.from("users").select("role").eq("id", data.user.id).single();
      if (userData?.role === "seller") navigate("/dashboard");
      else navigate("/store");
    } catch (err) {
      setError(ar ? "رقم الهاتف أو كلمة المرور غير صحيحة" : "Incorrect phone or password");
    }
    setLoading(false);
  };

  // Styles
  const inputStyle = { width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const labelStyle = { fontSize: 12, color: "#64748b", fontWeight: "600", marginBottom: 6, display: "block" };
  const btnPrimary = (disabled) => ({ background: disabled ? "#94a3b8" : "#1a2b6b", color: "white", border: "none", borderRadius: 12, padding: "13px", width: "100%", fontWeight: "800", fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 14 });

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "linear-gradient(135deg,#1a2b6b,#2d4499)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <svg width="90" height="34" viewBox="0 0 120 44" style={{ margin: "0 auto" }}>
            <polygon points="10,22 60,4 110,22" fill="none" stroke="#1a2b6b" strokeWidth="2.5"/>
            <line x1="14" y1="22" x2="14" y2="36" stroke="#1a2b6b" strokeWidth="2"/>
            <line x1="106" y1="22" x2="106" y2="36" stroke="#1a2b6b" strokeWidth="2"/>
            <line x1="14" y1="36" x2="106" y2="36" stroke="#1a2b6b" strokeWidth="2"/>
            <text x="60" y="30" textAnchor="middle" fill="#1a2b6b" fontSize="10" fontWeight="700" fontFamily="Inter">AL-MUKHTAR</text>
          </svg>
          <div style={{ fontSize: 17, fontWeight: "800", color: "#1a2b6b", marginTop: 2 }}>المختار</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{ar ? "تجارتك في ايدك" : "Your Business In Your Hands"}</div>
        </div>

        {/* LANG */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}>
            {ar ? "EN" : "عربي"}
          </button>
        </div>

        {/* TABS */}
        {(mode === "login" || mode === "register") && (
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 18 }}>
            {[["login", ar ? "تسجيل الدخول" : "Login"], ["register", ar ? "إنشاء حساب" : "Register"]].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, background: mode === m ? "white" : "transparent", border: "none", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: mode === m ? "700" : "400", color: mode === m ? "#1a2b6b" : "#64748b", cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* ===== LOGIN ===== */}
        {mode === "login" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "رقم الهاتف" : "Phone Number"}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXXX XXXX" type="tel" style={{ ...inputStyle, direction: "ltr" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{ar ? "كلمة المرور" : "Password"}</label>
              <div style={{ position: "relative" }}>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type={showLoginPass ? "text" : "password"} style={inputStyle} />
                <button onClick={() => setShowLoginPass(!showLoginPass)} style={{ position: "absolute", top: "50%", insetInlineEnd: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94a3b8" }}>
                  {showLoginPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading} style={btnPrimary(loading)}>
              {loading ? (ar ? "جاري الدخول..." : "Logging in...") : (ar ? "تسجيل الدخول ←" : "Login →")}
            </button>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "← الرئيسية" : "← Home"}
              </button>
            </div>
          </>
        )}

        {/* ===== REGISTER ===== */}
        {mode === "register" && (
          <>
            {/* ROLE */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "أنا..." : "I am..."}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["seller", "🏪", ar ? "بائع" : "Seller", ar ? "أدر متجرك" : "Manage store"], ["buyer", "🛒", ar ? "مشتري" : "Buyer", ar ? "تسوق الآن" : "Shop now"]].map(([r, icon, label, sub]) => (
                  <button key={r} onClick={() => setRole(r)} style={{ background: role === r ? "#f0f4ff" : "#f8fafc", border: `2px solid ${role === r ? "#1a2b6b" : "#e2e8f0"}`, borderRadius: 12, padding: "12px 8px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontWeight: "700", color: role === r ? "#1a2b6b" : "#64748b", fontSize: 13 }}>{label}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{ar ? "الاسم الكامل *" : "Full Name *"}</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={ar ? "أدخل اسمك" : "Enter your name"} style={inputStyle} />
            </div>

            {role === "seller" && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{ar ? "اسم المتجر *" : "Store Name *"}</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={ar ? "مثال: متجر النور" : "e.g. Al-Noor Store"} style={inputStyle} />
                {storeName && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>🔗 almukhtar.io/store/{storeName.replace(/\s+/g, "-").toLowerCase()}</div>}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{ar ? "البريد الإلكتروني *" : "Email *"}</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" type="email" style={{ ...inputStyle, direction: "ltr" }} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{ar ? "ستصلك نسخة من عقد الشروط والأحكام" : "You'll receive a copy of the terms & conditions"}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "رقم الهاتف *" : "Phone Number *"}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXXX XXXX" type="tel" style={{ ...inputStyle, direction: "ltr" }} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{ar ? "سنرسل رمز تحقق لتأكيد هويتك" : "We'll send a verification code"}</div>
            </div>

            {/* TERMS */}
            <div onClick={() => setAgreedToTerms(!agreedToTerms)} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: agreedToTerms ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${agreedToTerms ? "#16a34a" : "#e2e8f0"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 16, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${agreedToTerms ? "#16a34a" : "#cbd5e1"}`, background: agreedToTerms ? "#16a34a" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                {agreedToTerms && <span style={{ color: "white", fontSize: 13, fontWeight: "700" }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                {ar ? "أوافق على " : "I agree to the "}
                <a href="/terms" target="_blank" style={{ color: "#1a2b6b", fontWeight: "700" }}>
                  {ar ? "الشروط والأحكام وعقد الاستخدام" : "Terms & Conditions"}
                </a>
                {ar ? " — بالضغط هنا أوقّع العقد إلكترونياً" : " — by checking this I sign the contract electronically"}
              </div>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleSendOTP} disabled={loading} style={btnPrimary(loading)}>
              {loading ? (ar ? "جاري الإرسال..." : "Sending...") : (ar ? "إرسال رمز التحقق ←" : "Send Code →")}
            </button>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {ar ? "← الرئيسية" : "← Home"}
              </button>
            </div>
          </>
        )}

        {/* ===== OTP ===== */}
        {mode === "otp" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>📱</div>
              <h3 style={{ fontSize: 16, fontWeight: "800", color: "#1e293b", margin: "0 0 6px" }}>{ar ? "أدخل رمز التحقق" : "Enter Verification Code"}</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{ar ? `أرسلنا رمز إلى ${phone}` : `Sent to ${phone}`}</p>
            </div>

            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" maxLength={6} type="tel" style={{ ...inputStyle, fontSize: 26, fontFamily: "monospace", textAlign: "center", letterSpacing: 12, direction: "ltr", marginBottom: 16, padding: "14px" }} />

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6} style={btnPrimary(loading || otp.length < 6)}>
              {loading ? (ar ? "جاري التحقق..." : "Verifying...") : (ar ? "تأكيد الرمز ✓" : "Verify ✓")}
            </button>
            <div style={{ textAlign: "center" }}>
              {countdown > 0
                ? <span style={{ fontSize: 12, color: "#94a3b8" }}>{ar ? `إعادة الإرسال بعد ${countdown}ث` : `Resend in ${countdown}s`}</span>
                : <button onClick={handleSendOTP} style={{ background: "none", border: "none", color: "#1a2b6b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>{ar ? "إعادة إرسال الرمز" : "Resend"}</button>
              }
            </div>
          </>
        )}

        {/* ===== SET PASSWORD ===== */}
        {mode === "setpassword" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
              <h3 style={{ fontSize: 16, fontWeight: "800", color: "#1e293b", margin: "0 0 6px" }}>{ar ? "اختر كلمة المرور" : "Set Your Password"}</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{ar ? "ستستخدمها في كل مرة تدخل فيها" : "You'll use this every time you login"}</p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{ar ? "كلمة المرور" : "Password"}</label>
              <div style={{ position: "relative" }}>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type={showPass ? "text" : "password"} style={inputStyle} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", top: "50%", insetInlineEnd: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94a3b8" }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{ar ? "6 أحرف على الأقل" : "At least 6 characters"}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{ar ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
              <div style={{ position: "relative" }}>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" type={showConfirmPass ? "text" : "password"} style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? "#ef4444" : "#e2e8f0" }} />
                <button onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: "absolute", top: "50%", insetInlineEnd: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94a3b8" }}>
                  {showConfirmPass ? "🙈" : "👁️"}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{ar ? "كلمتا المرور غير متطابقتين" : "Passwords don't match"}</div>}
              {confirmPassword && confirmPassword === password && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>✓ {ar ? "متطابقتان" : "Match"}</div>}
            </div>

            {/* Terms reminder */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#15803d" }}>
              ✓ {ar ? `وقّعت على عقد الشروط والأحكام — سيُرسل نسخة إلى ${email}` : `You signed the terms — a copy will be sent to ${email}`}
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button onClick={handleSetPassword} disabled={loading || !password || password !== confirmPassword} style={btnPrimary(loading || !password || password !== confirmPassword)}>
              {loading ? (ar ? "جاري إنشاء الحساب..." : "Creating...") : (ar ? "إنشاء الحساب ✓" : "Create Account ✓")}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
