import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const [lang, setLang] = useState("ar");
  const navigate = useNavigate();
  const ar = lang === "ar";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: ar ? "'Tajawal',sans-serif" : "'Inter',sans-serif", background: "#f8f9ff", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ background: "#1a2b6b", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "none", color: "white", fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          {ar ? "→ رجوع" : "← Back"}
        </button>
        <span style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{ar ? "الشروط والأحكام" : "Terms & Conditions"}</span>
        <button onClick={() => setLang(ar ? "en" : "ar")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 6, padding: "4px 9px", fontSize: 11, cursor: "pointer" }}>
          {ar ? "EN" : "عربي"}
        </button>
      </div>

      <div style={{ maxWidth: 800, marginInline: "auto", padding: "30px 20px 60px" }}>

        {/* TITLE */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h1 style={{ fontSize: 24, fontWeight: "800", color: "#1a2b6b", marginBottom: 8 }}>
            {ar ? "عقد وشروط الاستخدام" : "Terms & Conditions Agreement"}
          </h1>
          <div style={{ background: "#f0f4ff", borderRadius: 10, padding: "10px 20px", display: "inline-block" }}>
            <span style={{ fontSize: 13, color: "#1a2b6b", fontWeight: "600" }}>
              {ar ? "منصة المختار للتجارة الإلكترونية — 2026" : "Al-Mukhtar E-Commerce Platform — 2026"}
            </span>
          </div>
        </div>

        {/* INTRO */}
        <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.8, margin: 0 }}>
            {ar
              ? "يُبرم هذا العقد والاتفاقية بين منصة المختار للتجارة الإلكترونية (المملوكة لشركة سمرا والشركات التابعة لها) والتاجر أو صاحب المتجر الذي يوافق على هذه الشروط عند إنشاء حسابه. تُعدّ الموافقة الإلكترونية على هذا العقد ملزمة قانونياً وتحمل نفس قوة العقد الموقّع بخط اليد."
              : "This agreement is entered into between Al-Mukhtar E-Commerce Platform (owned by Samara Holding and its affiliates) and the merchant who accepts these terms upon account creation. Electronic acceptance of this agreement is legally binding and carries the same force as a handwritten signature."
            }
          </p>
        </div>

        {/* ARTICLES */}
        {[
          {
            num: 1,
            title: ar ? "تعريفات وأطراف العقد" : "Definitions and Parties",
            items: ar ? [
              "المنصة: منصة المختار للتجارة الإلكترونية على الرابط almukhtar.io",
              "التاجر: أي شخص طبيعي أو اعتباري يسجّل حساباً بوصفه بائعاً",
              "المشتري: أي شخص يتصفح أو يطلب من المتاجر المسجّلة",
              "الخدمة: جميع المزايا والأدوات المتاحة عبر المنصة",
              "العمولة: النسبة المئوية التي تأخذها المنصة من قيمة كل طلب",
            ] : [
              "Platform: Al-Mukhtar E-Commerce platform at almukhtar.io",
              "Merchant: Any individual or entity registering as a seller",
              "Buyer: Any person browsing or ordering from registered stores",
              "Service: All features and tools available through the platform",
              "Commission: The percentage taken by the platform from each order value",
            ]
          },
          {
            num: 2,
            title: ar ? "الباقات والرسوم" : "Plans & Fees",
            items: ar ? [
              "الباقة المجانية: حتى 10 منتجات، عمولة 5% على كل طلب",
              "الباقة الأساسية: 15$ شهرياً، حتى 50 منتج، عمولة 2% على كل طلب",
              "الباقة المميزة: 30$ شهرياً، منتجات غير محدودة، عمولة 1% على كل طلب",
              "تُحسب العمولة على إجمالي قيمة الطلب شاملاً ضريبة القيمة المضافة إن وُجدت",
              "تُستقطع الرسوم تلقائياً من المبالغ المستحقة للتاجر",
            ] : [
              "Free Plan: Up to 10 products, 5% commission per order",
              "Basic Plan: $15/month, up to 50 products, 2% commission per order",
              "Premium Plan: $30/month, unlimited products, 1% commission per order",
              "Commission is calculated on the total order value including VAT if applicable",
              "Fees are automatically deducted from amounts due to the merchant",
            ]
          },
          {
            num: 3,
            title: ar ? "التزامات المنصة" : "Platform Obligations",
            items: ar ? [
              "توفير بيئة تقنية آمنة وموثوقة لعرض المنتجات واستقبال الطلبات",
              "الحفاظ على سرية بيانات التجار والمشترين وعدم مشاركتها مع أطراف ثالثة",
              "توفير دعم فني للتجار خلال ساعات العمل الرسمية",
              "الإشعار المسبق بمدة لا تقل عن 14 يوماً عند إجراء أي تعديلات جوهرية",
              "الاحتفاظ بنسخ احتياطية من بيانات التجار وإتاحتها عند الطلب",
            ] : [
              "Provide a secure and reliable technical environment for product listing and order management",
              "Maintain confidentiality of merchant and buyer data without sharing with third parties",
              "Provide technical support to merchants during official working hours",
              "Give at least 14 days advance notice for any material changes",
              "Maintain backups of merchant data and make them available upon request",
            ]
          },
          {
            num: 4,
            title: ar ? "التزامات التاجر" : "Merchant Obligations",
            items: ar ? [
              "تقديم معلومات صحيحة ودقيقة عن المنتجات المعروضة",
              "الالتزام بتنفيذ الطلبات خلال المدة المحددة والمتفق عليها مع المشتري",
              "عدم عرض منتجات مقلّدة أو مخالفة للقانون العراقي",
              "الإفصاح الصريح عن سياسة الإرجاع والاستبدال قبل إتمام البيع",
              "عدم استخدام المنصة لأغراض احتيالية أو مضلّلة",
              "الالتزام بدفع الرسوم والعمولات في مواعيدها المحددة",
            ] : [
              "Provide accurate and truthful information about listed products",
              "Commit to fulfilling orders within the agreed timeframe with buyers",
              "Not list counterfeit or illegal products under Iraqi law",
              "Clearly disclose return and exchange policies before completing sales",
              "Not use the platform for fraudulent or misleading purposes",
              "Pay fees and commissions on their specified due dates",
            ]
          },
          {
            num: 5,
            title: ar ? "الملكية الفكرية" : "Intellectual Property",
            items: ar ? [
              "تحتفظ المنصة بجميع حقوق الملكية الفكرية المتعلقة بالتصميم والكود والعلامة التجارية",
              "يحتفظ التاجر بملكية محتوى متجره من صور وأوصاف وبيانات",
              "يمنح التاجر المنصة ترخيصاً غير حصري لعرض محتواه لأغراض التسويق",
              "لا يحق نسخ أو استخدام أي جزء من المنصة دون إذن كتابي مسبق",
            ] : [
              "The platform retains all intellectual property rights related to design, code, and trademark",
              "The merchant retains ownership of their store content including images, descriptions, and data",
              "The merchant grants the platform a non-exclusive license to display their content for marketing",
              "No part of the platform may be copied or used without prior written permission",
            ]
          },
          {
            num: 6,
            title: ar ? "حماية البيانات والخصوصية" : "Data Protection & Privacy",
            items: ar ? [
              "تلتزم المنصة بمبادئ حماية البيانات وفق اللوائح الدولية المعمول بها",
              "لا تُباع بيانات المستخدمين لأطراف ثالثة بأي شكل من الأشكال",
              "يحق للتاجر طلب نسخة من بياناته أو حذفها في أي وقت",
              "تُستخدم البيانات فقط لتحسين الخدمة وتجربة المستخدم",
              "يتم تشفير جميع البيانات الحساسة باستخدام بروتوكولات الأمان القياسية",
            ] : [
              "The platform commits to data protection principles in accordance with applicable international regulations",
              "User data is not sold to third parties in any form",
              "Merchants have the right to request a copy of their data or delete it at any time",
              "Data is used only to improve service and user experience",
              "All sensitive data is encrypted using standard security protocols",
            ]
          },
          {
            num: 7,
            title: ar ? "إنهاء العقد" : "Contract Termination",
            items: ar ? [
              "يحق للتاجر إنهاء حسابه في أي وقت مع إشعار مسبق مدته 7 أيام",
              "يحق للمنصة إنهاء الحساب فوراً في حال مخالفة الشروط الجوهرية",
              "عند الإنهاء، يحق للتاجر استرداد بياناته خلال 30 يوماً",
              "لا تُستردّ الرسوم الشهرية المدفوعة مسبقاً عند الإنهاء المبكر",
              "تبقى الالتزامات المالية القائمة سارية حتى بعد إنهاء العقد",
            ] : [
              "The merchant may terminate their account at any time with 7 days advance notice",
              "The platform may terminate the account immediately for material breach of terms",
              "Upon termination, the merchant may retrieve their data within 30 days",
              "Pre-paid monthly fees are non-refundable upon early termination",
              "Existing financial obligations remain in effect even after contract termination",
            ]
          },
          {
            num: 8,
            title: ar ? "التوقيع الإلكتروني والموافقة" : "Electronic Signature & Acceptance",
            items: ar ? [
              "تُعدّ الموافقة على هذا العقد عند إنشاء الحساب توقيعاً إلكترونياً ملزماً قانونياً",
              "يُسجَّل توقيت الموافقة وعنوان IP والجهاز المستخدم كدليل إثبات",
              "ترسل المنصة نسخة من هذا العقد إلى البريد الإلكتروني المسجّل",
              "يُعدّ هذا العقد وثيقة قانونية معتمدة وفق التشريعات العراقية النافذة",
            ] : [
              "Acceptance of this agreement upon account creation constitutes a legally binding electronic signature",
              "The time of acceptance, IP address, and device used are recorded as proof",
              "The platform sends a copy of this agreement to the registered email",
              "This agreement is considered a legally approved document under Iraqi legislation",
            ]
          },
          {
            num: 9,
            title: ar ? "القانون المطبّق وحل النزاعات" : "Governing Law & Dispute Resolution",
            items: ar ? [
              "يخضع هذا العقد للقانون العراقي النافذ",
              "تُحسم النزاعات أولاً بالتفاوض الودّي خلال 30 يوماً",
              "في حال تعذّر التسوية الودية، تختص المحاكم العراقية بالنظر في النزاع",
              "محكمة بغداد هي الجهة القضائية المختصة بالنظر في أي نزاع",
            ] : [
              "This agreement is governed by applicable Iraqi law",
              "Disputes are first resolved through amicable negotiation within 30 days",
              "If amicable settlement fails, Iraqi courts have jurisdiction over the dispute",
              "Baghdad courts are the competent judicial authority for any dispute",
            ]
          },
          {
            num: 10,
            title: ar ? "تحديث الشروط" : "Terms Updates",
            items: ar ? [
              "تحتفظ المنصة بحق تعديل هذه الشروط في أي وقت",
              "يُشعَر التاجر بالتعديلات قبل 14 يوماً من تطبيقها",
              "استمرار استخدام المنصة بعد الإشعار يُعدّ قبولاً ضمنياً للتعديلات",
              "التعديلات الجوهرية تستلزم موافقة صريحة من التاجر",
            ] : [
              "The platform reserves the right to modify these terms at any time",
              "Merchants are notified of changes 14 days before implementation",
              "Continued use of the platform after notice constitutes implicit acceptance",
              "Material changes require explicit consent from the merchant",
            ]
          },
        ].map((article) => (
          <div key={article.num} style={{ background: "white", borderRadius: 16, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 16, fontWeight: "800", color: "#1a2b6b", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "#1a2b6b", color: "white", borderRadius: "50%", width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{article.num}</span>
              {article.title}
            </h2>
            <ol style={{ margin: 0, padding: ar ? "0 20px 0 0" : "0 0 0 20px" }}>
              {article.items.map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, marginBottom: 6 }}>{item}</li>
              ))}
            </ol>
          </div>
        ))}

        {/* FOOTER */}
        <div style={{ background: "#1a2b6b", borderRadius: 16, padding: "20px 24px", textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
            {ar ? "آخر تحديث: يناير 2026" : "Last updated: January 2026"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
            {ar ? "للتواصل والاستفسار: info@almukhtar.io" : "Contact: info@almukhtar.io"}
          </div>
          <button onClick={() => navigate("/register")} style={{ background: "#f0c040", color: "#1a2b6b", border: "none", borderRadius: 12, padding: "12px 30px", fontWeight: "800", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {ar ? "العودة للتسجيل" : "Back to Registration"}
          </button>
        </div>

      </div>
    </div>
  );
}
