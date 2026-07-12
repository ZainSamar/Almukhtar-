import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// ================================================================
//  الصفحة الرئيسية لمنصة المختار — دليل المتاجر
//  - تعرض كل المتاجر المكتملة الإعداد
//  - بحث بالاسم + فلترة حسب نوع النشاط والمحافظة
//  - حالة "مفتوح الآن" تلقائياً حسب ساعات العمل
//  - دعوة للتجار لفتح متاجرهم
// ================================================================

const TYPE_META = {
  fashion: { label: 'أزياء وجمال', icon: '👗', color: '#0A1D37' },
  realestate: { label: 'عقارات', icon: '🏠', color: '#1B3A2D' },
  services: { label: 'خدمات', icon: '🛠️', color: '#123E4D' },
  electronics: { label: 'إلكترونيات', icon: '📱', color: '#101828' },
  general: { label: 'متجر عام', icon: '🛍️', color: '#0A1D37' },
}

const PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء', 'كركوك', 'الأنبار',
  'ديالى', 'صلاح الدين', 'بابل', 'واسط', 'ذي قار', 'ميسان', 'المثنى',
  'القادسية', 'دهوك', 'السليمانية',
]

// حالة "مفتوح الآن" حسب ساعات العمل المحفوظة
const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
function isOpenNow(store) {
  const wh = store.working_hours
  if (!wh || !Array.isArray(wh.days) || wh.days.length === 0 || !wh.from || !wh.to) return null
  const now = new Date()
  const today = DAY_NAMES[now.getDay()]
  if (!wh.days.includes(today)) return false
  const [fh, fm] = wh.from.split(':').map(Number)
  const [th, tm] = wh.to.split(':').map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  const from = fh * 60 + (fm || 0)
  const to = th * 60 + (tm || 0)
  return to > from ? mins >= from && mins <= to : mins >= from || mins <= to
}

function typeOf(store) {
  const v = (store.store_type || '').toLowerCase()
  return TYPE_META[v] ? v : 'general'
}

export default function Home() {
  const [stores, setStores] = useState([])
  const [counts, setCounts] = useState({}) // store_id -> عدد المنتجات
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [province, setProvince] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user || null)

    const { data: storeRows } = await supabase
      .from('stores').select('*')
      .order('created_at', { ascending: false })
    const list = (storeRows || []).filter((s) => s.is_setup_complete && s.store_slug)
    setStores(list)

    // عدد المنتجات لكل متجر
    const { data: prods } = await supabase
      .from('products').select('id, store_id').eq('is_active', true)
    const c = {}
    for (const p of prods || []) {
      if (p.store_id) c[p.store_id] = (c[p.store_id] || 0) + 1
    }
    setCounts(c)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stores.filter((s) => {
      const matchType = type === 'all' || typeOf(s) === type
      const matchProv = province === 'all' || s.province === province
      const matchQ =
        !q ||
        (s.name_ar || '').toLowerCase().includes(q) ||
        (s.name_en || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      return matchType && matchProv && matchQ
    })
  }, [stores, search, type, province])

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  return (
    <div dir="rtl" className="hm-page">
      <style>{CSS}</style>

      {/* ===== الهيدر ===== */}
      <header className="hm-nav">
        <div className="hm-nav-inner">
          <div className="hm-brand">
            <span className="hm-brand-name">المختار</span>
            <span className="hm-brand-tag">سوقك العراقي الموثوق</span>
          </div>
          <div className="hm-nav-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="hm-btn-outline">لوحة التحكم</Link>
                <button onClick={logout} className="hm-logout">تسجيل خروج</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hm-link">تسجيل الدخول</Link>
                <Link to="/register" className="hm-btn-gold">افتح متجرك مجاناً</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== الهيرو + البحث ===== */}
      <section className="hm-hero">
        <h1 className="hm-hero-title">كل المتاجر العراقية الموثوقة<br />في مكان واحد 🇮🇶</h1>
        <p className="hm-hero-sub">أزياء · عقارات · خدمات · إلكترونيات — تسوق مباشرة وتواصل عبر واتساب</p>
        <div className="hm-search-box">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث عن متجر بالاسم..."
            className="hm-search"
          />
        </div>
      </section>

      {/* ===== الفلاتر ===== */}
      <div className="hm-filters">
        <div className="hm-type-row">
          <button
            className={`hm-type ${type === 'all' ? 'active' : ''}`}
            onClick={() => setType('all')}
          >✨ الكل</button>
          {Object.entries(TYPE_META).map(([id, t]) => (
            <button
              key={id}
              className={`hm-type ${type === id ? 'active' : ''}`}
              onClick={() => setType(id)}
            >{t.icon} {t.label}</button>
          ))}
        </div>
        <select
          className="hm-province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="all">📍 كل المحافظات</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* ===== شبكة المتاجر ===== */}
      <main className="hm-main">
        {loading && <div className="hm-state">⏳ جاري تحميل المتاجر...</div>}

        {!loading && filtered.length === 0 && (
          <div className="hm-state">
            🏪 لا توجد متاجر مطابقة
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
              جرب تغيير الفلتر أو كلمة البحث
            </div>
          </div>
        )}

        <div className="hm-grid">
          {filtered.map((s) => {
            const t = TYPE_META[typeOf(s)]
            const open = isOpenNow(s)
            const count = counts[s.id] || 0
            return (
              <Link key={s.id} to={`/store/${s.store_slug}`} className="hm-card">
                {/* الغلاف */}
                <div className="hm-cover" style={{ background: t.color }}>
                  {s.cover_url && <img src={s.cover_url} alt="" />}
                  <span className="hm-type-badge">{t.icon} {t.label}</span>
                  {open !== null && (
                    <span className={`hm-open ${open ? 'yes' : 'no'}`}>
                      {open ? '● مفتوح الآن' : '● مغلق'}
                    </span>
                  )}
                </div>
                {/* الشعار والاسم */}
                <div className="hm-card-body">
                  <div className="hm-logo">
                    {s.logo_url
                      ? <img src={s.logo_url} alt="" />
                      : <span>{t.icon}</span>}
                  </div>
                  <div className="hm-card-info">
                    <div className="hm-store-name">{s.name_ar || s.name_en}</div>
                    {s.description && <div className="hm-store-desc">{s.description}</div>}
                    <div className="hm-meta">
                      {s.province && <span>📍 {s.province}</span>}
                      <span>🛍️ {count} {count === 1 ? 'منتج' : 'منتجات'}</span>
                    </div>
                  </div>
                </div>
                <div className="hm-visit">زيارة المتجر ←</div>
              </Link>
            )
          })}
        </div>
      </main>

      {/* ===== دعوة التجار ===== */}
      <section className="hm-cta">
        <h2>عندك تجارة؟ 📦</h2>
        <p>افتح متجرك الإلكتروني على المختار خلال دقيقتين — مجاناً، مع واجهة تناسب نشاطك وتواصل واتساب مباشر مع زبائنك</p>
        <Link to="/register" className="hm-btn-gold hm-cta-btn">🚀 افتح متجرك الآن</Link>
      </section>

      {/* ===== الفوتر ===== */}
      <footer className="hm-footer">
        <div className="hm-footer-brand">المختار</div>
        <div className="hm-footer-links">
          <Link to="/terms">الشروط والأحكام</Link>
          <Link to="/register">للتجار</Link>
          <Link to="/login">تسجيل الدخول</Link>
        </div>
        <div className="hm-footer-copy">© {new Date().getFullYear()} المختار — سوقك العراقي الموثوق 🇮🇶</div>
      </footer>
    </div>
  )
}

// ================= التنسيقات =================
const CSS = `
.hm-page {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Tajawal', sans-serif;
}

/* ---- الهيدر ---- */
.hm-nav { background: #0A1D37; position: sticky; top: 0; z-index: 50; }
.hm-nav-inner {
  max-width: 1100px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; gap: 10px;
}
.hm-brand { display: flex; flex-direction: column; }
.hm-brand-name { color: #F5B93E; font-size: 22px; font-weight: 800; }
.hm-brand-tag { color: #cbd5e1; font-size: 11.5px; }
.hm-nav-actions { display: flex; align-items: center; gap: 12px; }
.hm-link { color: #cbd5e1; font-size: 14px; text-decoration: none; font-weight: 700; }
.hm-link:hover { color: #fff; }
.hm-btn-gold {
  background: #F5B93E; color: #111;
  padding: 10px 18px; border-radius: 11px;
  font-size: 14px; font-weight: 800; text-decoration: none;
  transition: transform .15s;
}
.hm-btn-gold:hover { transform: translateY(-1px); }
.hm-btn-outline {
  border: 1.5px solid #F5B93E; color: #F5B93E;
  padding: 9px 18px; border-radius: 11px;
  font-size: 14px; font-weight: 800; text-decoration: none;
}
.hm-logout {
  background: none; border: none;
  color: #94a3b8; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; padding: 6px 4px;
}
.hm-logout:hover { color: #fff; }

/* ---- الهيرو ---- */
.hm-hero {
  background:
    radial-gradient(ellipse at 85% 15%, rgba(245,185,62,0.12), transparent 50%),
    radial-gradient(ellipse at 10% 90%, rgba(255,255,255,0.06), transparent 45%),
    linear-gradient(160deg, #0A1D37 0%, #14325c 100%);
  text-align: center;
  padding: 52px 18px 60px;
}
.hm-hero-title { color: #fff; font-size: 30px; font-weight: 800; line-height: 1.6; margin: 0 0 12px; }
.hm-hero-sub { color: #cbd5e1; font-size: 15px; margin: 0 0 26px; }
.hm-search-box { max-width: 560px; margin: 0 auto; }
.hm-search {
  width: 100%; box-sizing: border-box;
  padding: 15px 20px; border-radius: 999px;
  border: 2px solid #F5B93E; outline: none;
  font-size: 15px; font-family: inherit;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}

/* ---- الفلاتر ---- */
.hm-filters {
  max-width: 1100px; margin: -24px auto 0; padding: 0 18px;
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  position: relative; z-index: 2;
}
.hm-type-row {
  display: flex; gap: 8px; overflow-x: auto;
  -webkit-overflow-scrolling: touch; flex: 1;
  background: #fff; border-radius: 999px;
  padding: 8px; box-shadow: 0 4px 16px rgba(10,29,55,.1);
}
.hm-type {
  border: none; background: none;
  border-radius: 999px; padding: 8px 15px;
  font-size: 13.5px; cursor: pointer; font-family: inherit;
  color: #334155; white-space: nowrap;
}
.hm-type.active { background: #0A1D37; color: #F5B93E; font-weight: 800; }
.hm-province {
  background: #fff; border: none;
  border-radius: 999px; padding: 13px 18px;
  font-size: 13.5px; font-family: inherit; color: #334155;
  box-shadow: 0 4px 16px rgba(10,29,55,.1);
  cursor: pointer; outline: none;
}

/* ---- الشبكة ---- */
.hm-main { max-width: 1100px; margin: 26px auto 0; padding: 0 18px 10px; }
.hm-state { text-align: center; padding: 60px 20px; color: #64748b; font-size: 16px; }
.hm-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}
@media (min-width: 640px)  { .hm-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 980px)  { .hm-grid { grid-template-columns: repeat(3, 1fr); } }

.hm-card {
  background: #fff; border-radius: 18px; overflow: hidden;
  text-decoration: none; color: inherit;
  box-shadow: 0 2px 10px rgba(10,29,55,.08);
  display: flex; flex-direction: column;
  transition: transform .15s, box-shadow .15s;
}
.hm-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(10,29,55,.16); }

.hm-cover { position: relative; height: 110px; overflow: hidden; }
.hm-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hm-type-badge {
  position: absolute; top: 10px; right: 10px;
  background: rgba(255,255,255,.94); color: #0A1D37;
  font-size: 11.5px; font-weight: 800;
  padding: 5px 11px; border-radius: 999px;
}
.hm-open {
  position: absolute; top: 10px; left: 10px;
  font-size: 11px; font-weight: 800;
  padding: 5px 10px; border-radius: 999px;
  background: rgba(255,255,255,.94);
}
.hm-open.yes { color: #16a34a; }
.hm-open.no  { color: #94a3b8; }

.hm-card-body { display: flex; gap: 12px; padding: 0 14px; margin-top: -26px; position: relative; }
.hm-logo {
  width: 62px; height: 62px; border-radius: 50%;
  background: #fff; border: 3px solid #fff;
  box-shadow: 0 3px 10px rgba(10,29,55,.15);
  overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 26px;
}
.hm-logo img { width: 100%; height: 100%; object-fit: cover; }
.hm-card-info { padding-top: 30px; min-width: 0; }
.hm-store-name { font-size: 16.5px; font-weight: 800; color: #0A1D37; }
.hm-store-desc {
  font-size: 12.5px; color: #64748b; margin-top: 2px;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 1; -webkit-box-orient: vertical;
}
.hm-meta { display: flex; gap: 12px; font-size: 12px; color: #94a3b8; margin-top: 6px; flex-wrap: wrap; }

.hm-visit {
  margin-top: auto; text-align: left;
  padding: 12px 16px 14px;
  color: #b8860b; font-size: 13px; font-weight: 800;
}

/* ---- دعوة التجار ---- */
.hm-cta {
  max-width: 1100px; margin: 44px auto 0; padding: 0 18px;
  text-align: center;
  background: linear-gradient(135deg, #0A1D37, #14325c);
  border-radius: 24px; padding: 44px 24px;
  margin-left: 18px; margin-right: 18px;
}
@media (min-width: 1136px) { .hm-cta { margin-left: auto; margin-right: auto; } }
.hm-cta h2 { color: #F5B93E; font-size: 25px; margin: 0 0 10px; }
.hm-cta p { color: #cbd5e1; font-size: 14.5px; line-height: 1.8; max-width: 520px; margin: 0 auto 22px; }
.hm-cta-btn { font-size: 16px; padding: 14px 34px; display: inline-block; }

/* ---- الفوتر ---- */
.hm-footer { text-align: center; padding: 40px 18px 30px; }
.hm-footer-brand { color: #0A1D37; font-size: 19px; font-weight: 800; }
.hm-footer-links { display: flex; justify-content: center; gap: 20px; margin: 12px 0; flex-wrap: wrap; }
.hm-footer-links a { color: #64748b; font-size: 13.5px; text-decoration: none; }
.hm-footer-links a:hover { color: #0A1D37; }
.hm-footer-copy { color: #94a3b8; font-size: 12.5px; }
`
