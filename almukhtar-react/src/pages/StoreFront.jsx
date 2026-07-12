import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// ================================================================
//  نظام الثيمات — كل نوع متجر له هوية كاملة (ألوان + نصوص + فئات)
//  نوع المتجر يُقرأ تلقائياً من جدول stores (عمود store_type)
// ================================================================

const EXCHANGE_RATE = 1500 // سعر صرف الدولار مقابل الدينار

const THEMES = {
  // ---------- متجر أزياء وملابس ----------
  fashion: {
    primary: '#0A1D37',
    accent: '#F5B93E',
    accentText: '#111111',
    soft: '#FFF8E8',
    announceBg: '#3B82C4',
    tagline: 'أناقة تليق بكِ',
    announce: 'التوصيل لكافة محافظات العراق | Delivery across Iraq',
    heroKicker: 'وصلنا حديثاً ✨',
    heroTitle: 'أرقى الفساتين والأزياء لهذا الموسم',
    heroCta: 'تسوقي الآن',
    buyLabel: 'إضافة إلى السلة',
    inquireLabel: 'استفسر عن السعر',
    emptyMsg: 'لا توجد قطع في هذه الفئة حالياً',
    aspect: '3 / 4',
    catLabels: {
      clothes: { label: 'الأزياء', icon: '👗' },
      shoes: { label: 'الأحذية', icon: '👠' },
      accessories: { label: 'الإكسسوارات', icon: '💍' },
      beauty: { label: 'العناية والجمال', icon: '💄' },
      bags: { label: 'الحقائب', icon: '👜' },
      other: { label: 'أخرى', icon: '🛍️' },
    },
  },

  // ---------- مكتب عقارات ----------
  realestate: {
    primary: '#1B3A2D',
    accent: '#C9A227',
    accentText: '#111111',
    soft: '#F2F7F1',
    announceBg: '#2E5E46',
    tagline: 'عقارك الموثوق في العراق',
    announce: 'بيع • شراء • إيجار | خدمة معتمدة وموثوقة',
    heroKicker: 'عروض جديدة 🏠',
    heroTitle: 'أفضل العقارات المختارة بعناية',
    heroCta: 'تصفح العقارات',
    buyLabel: 'تفاصيل العقار',
    inquireLabel: 'استفسر عن السعر',
    emptyMsg: 'لا توجد عقارات معروضة حالياً',
    aspect: '4 / 3',
    catLabels: {
      realestate: { label: 'الكل', icon: '🏠' },
      apartment: { label: 'شقق', icon: '🏢' },
      house: { label: 'بيوت', icon: '🏡' },
      land: { label: 'أراضي', icon: '📐' },
      commercial: { label: 'تجاري', icon: '🏬' },
      other: { label: 'أخرى', icon: '📦' },
    },
  },

  // ---------- مقدم خدمات ----------
  services: {
    primary: '#123E4D',
    accent: '#2FB6A3',
    accentText: '#ffffff',
    soft: '#EEF8F6',
    announceBg: '#1C5D71',
    tagline: 'خدمة احترافية تستحقها',
    announce: 'نخدم جميع مناطق بغداد والمحافظات',
    heroKicker: 'خدماتنا 🛠️',
    heroTitle: 'خدمات موثوقة بأيدي محترفين',
    heroCta: 'استعرض الخدمات',
    buyLabel: 'احجز الخدمة',
    inquireLabel: 'اطلب عرض سعر',
    emptyMsg: 'لا توجد خدمات معروضة حالياً',
    aspect: '4 / 3',
    catLabels: {
      services: { label: 'الكل', icon: '🛠️' },
      maintenance: { label: 'صيانة', icon: '🔧' },
      cleaning: { label: 'تنظيف', icon: '🧹' },
      transport: { label: 'نقل', icon: '🚚' },
      design: { label: 'تصميم', icon: '🎨' },
      other: { label: 'أخرى', icon: '📦' },
    },
  },

  // ---------- متجر إلكترونيات ----------
  electronics: {
    primary: '#101828',
    accent: '#38BDF8',
    accentText: '#062033',
    soft: '#EFF8FF',
    announceBg: '#1D4ED8',
    tagline: 'أحدث التقنيات بين يديك',
    announce: 'ضمان حقيقي | توصيل لكافة المحافظات',
    heroKicker: 'وصل حديثاً ⚡',
    heroTitle: 'أحدث الأجهزة والإلكترونيات',
    heroCta: 'تسوق الآن',
    buyLabel: 'إضافة إلى السلة',
    inquireLabel: 'استفسر عن السعر',
    emptyMsg: 'لا توجد منتجات في هذه الفئة حالياً',
    aspect: '1 / 1',
    catLabels: {
      electronics: { label: 'الكل', icon: '📱' },
      phones: { label: 'موبايلات', icon: '📱' },
      computers: { label: 'كمبيوتر', icon: '💻' },
      audio: { label: 'سماعات', icon: '🎧' },
      gaming: { label: 'ألعاب', icon: '🎮' },
      other: { label: 'أخرى', icon: '📦' },
    },
  },

  // ---------- متجر عام (الافتراضي) ----------
  general: {
    primary: '#0A1D37',
    accent: '#F5B93E',
    accentText: '#111111',
    soft: '#FFF8E8',
    announceBg: '#3B82C4',
    tagline: 'سوقك العراقي الموثوق',
    announce: 'التوصيل لكافة محافظات العراق',
    heroKicker: 'وصلنا حديثاً ✨',
    heroTitle: 'أفضل المنتجات المختارة لك',
    heroCta: 'تسوق الآن',
    buyLabel: 'إضافة إلى السلة',
    inquireLabel: 'استفسر عن السعر',
    emptyMsg: 'لا توجد منتجات حالياً',
    aspect: '1 / 1',
    catLabels: {
      clothes: { label: 'ملابس', icon: '👗' },
      realestate: { label: 'عقارات', icon: '🏠' },
      services: { label: 'خدمات', icon: '🛠️' },
      electronics: { label: 'إلكترونيات', icon: '📱' },
      home: { label: 'منزل وأثاث', icon: '🛋️' },
      other: { label: 'أخرى', icon: '📦' },
    },
  },
}

// تطبيع قيمة نوع المتجر القادمة من قاعدة البيانات إلى مفتاح ثيم
function resolveThemeKey(raw) {
  const v = (raw || '').toString().trim().toLowerCase()
  if (['fashion', 'clothes', 'clothing', 'ملابس', 'أزياء', 'ازياء'].includes(v)) return 'fashion'
  if (['realestate', 'real_estate', 'عقارات', 'عقار'].includes(v)) return 'realestate'
  if (['services', 'service', 'خدمات', 'خدمة'].includes(v)) return 'services'
  if (['electronics', 'إلكترونيات', 'الكترونيات'].includes(v)) return 'electronics'
  return 'general'
}

// ================= أدوات مساعدة =================
function formatIQD(n) {
  if (n === null || n === undefined || isNaN(n)) return ''
  return Number(n).toLocaleString('en-US') + ' د.ع'
}

function displayPrice(product) {
  const price = Number(product.price)
  if (!price) return ''
  if (product.currency === 'USD' || product.currency === '$') {
    return formatIQD(price * EXCHANGE_RATE)
  }
  return formatIQD(price)
}

function parseImages(product) {
  const imgs = []
  try {
    const arr = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')
    if (Array.isArray(arr)) imgs.push(...arr)
  } catch (e) { /* ignore */ }
  if (imgs.length === 0 && product.image_url) imgs.push(product.image_url)
  return imgs
}

function parseVariants(product) {
  let v = product.variants
  try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
  return v && typeof v === 'object' ? v : null
}

function waLink(product, intent, themeLabels) {
  const phone = (product.contact_phone || '').replace(/[^0-9]/g, '')
  if (!phone) return null
  const name = product.name || product.title || ''
  const sku = product.sku ? `\nكود المنتج: ${product.sku}` : ''
  const text =
    intent === 'order'
      ? `مرحباً 👋 أريد طلب:\n${name}${sku}`
      : `مرحباً 👋 أريد الاستفسار عن السعر:\n${name}${sku}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

// ===== حالة "مفتوح الآن" حسب ساعات العمل =====
const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
function isOpenNow(store) {
  const wh = store?.working_hours
  if (!wh || !Array.isArray(wh.days) || wh.days.length === 0 || !wh.from || !wh.to) return null
  const now = new Date()
  if (!wh.days.includes(DAY_NAMES[now.getDay()])) return false
  const [fh, fm] = wh.from.split(':').map(Number)
  const [th, tm] = wh.to.split(':').map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  const from = fh * 60 + (fm || 0)
  const to = th * 60 + (tm || 0)
  return to > from ? mins >= from && mins <= to : mins >= from || mins <= to
}

// ===== روابط التواصل الاجتماعي =====
const SOCIAL_ICONS = {
  facebook: '📘', instagram: '📸', tiktok: '🎵',
  telegram: '✈️', snapchat: '👻', youtube: '▶️', x: '✖️',
}

// رابط واتساب المتجر نفسه (استفسار عام)
function storeWaLink(store) {
  const phone = (store?.whatsapp || store?.phone || '').replace(/[^0-9]/g, '')
  if (!phone) return null
  const text = encodeURIComponent(`مرحباً 👋 وصلتكم من صفحة متجركم "${store.name_ar || ''}" على المختار`)
  return `https://wa.me/${phone}?text=${text}`
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" style={{ verticalAlign: '-3px', marginLeft: 6 }}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 1.9.8 2 .1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.6.8 1.9.9.3.2.5.2.5.4.1.1.1.7-.1 1.3Z"/>
  </svg>
)

// ================= المكوّن الرئيسي =================
export default function StoreFront() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(null)
  const [imgIndex, setImgIndex] = useState(0)
  const gridRef = useRef(null)

  useEffect(() => { loadAll() }, [slug])

  async function loadAll() {
    setLoading(true)
    setError(null)

    // 1) جلب بيانات المتجر حسب store_slug من الرابط
    let storeRow = null
    if (slug) {
      const bySlug = await supabase
        .from('stores').select('*').eq('store_slug', slug).maybeSingle()
      if (bySlug.data) storeRow = bySlug.data
    }
    setStore(storeRow)

    // 2) جلب كل المنتجات الفعالة ثم فلترة منتجات هذا المتجر
    const { data, error } = await supabase
      .from('products').select('*').eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError('تعذر تحميل المنتجات، حاول تحديث الصفحة')
      setLoading(false)
      return
    }

    let list = data || []
    if (storeRow) {
      const ids = [storeRow.id, storeRow.owner_id].filter(Boolean)
      const mine = list.filter((p) =>
        ids.includes(p.store_id) || ids.includes(p.seller_id) || ids.includes(p.user_id)
      )
      list = mine
    }
    setProducts(list)
    setLoading(false)
  }

  // ===== الثيم حسب نوع المتجر =====
  const themeKey = resolveThemeKey(store?.store_type || store?.type || store?.category)
  const T = THEMES[themeKey]

  const storeName =
    store?.name_ar || store?.name_en || (slug ? decodeURIComponent(slug) : 'المتجر')

  // ===== الفئات: تُبنى فقط من الفئات الموجودة فعلاً بمنتجات هذا المتجر =====
  const cats = useMemo(() => {
    const present = [...new Set(products.map((p) => p.category).filter(Boolean))]
    const list = present.map((id) => ({
      id,
      label: T.catLabels[id]?.label || id,
      icon: T.catLabels[id]?.icon || '📦',
    }))
    return [{ id: 'all', label: 'الكل', icon: '✨' }, ...list]
  }, [products, themeKey])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'all' || p.category === category
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [products, search, category])

  function openProduct(p) { setSelected(p); setImgIndex(0) }
  function scrollToProducts() { gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return (
    <div dir="rtl" className="sf-page" style={{
      '--primary': T.primary,
      '--accent': T.accent,
      '--accent-text': T.accentText,
      '--soft': T.soft,
      '--announce': T.announceBg,
      '--aspect': T.aspect,
    }}>
      <style>{CSS}</style>

      {/* ===== الشريط العلوي ===== */}
      <nav className="sf-nav">
        <button className="sf-icon-btn" aria-label="القائمة">☰</button>
        <div className="sf-logo">
          <div className="sf-logo-name">{storeName}</div>
          <div className="sf-logo-tag">{T.tagline}</div>
        </div>
        <div className="sf-nav-icons">
          <button className="sf-icon-btn" aria-label="بحث" onClick={() => setShowSearch(!showSearch)}>🔍</button>
          <button className="sf-icon-btn" aria-label="السلة" onClick={scrollToProducts}>🛍️</button>
        </div>
      </nav>

      {/* ===== شريط الإعلان ===== */}
      <div className="sf-announce">{T.announce}</div>

      {/* ===== البحث ===== */}
      {showSearch && (
        <div className="sf-search-wrap">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم SKU..."
            className="sf-search"
          />
        </div>
      )}

      {/* ===== هوية المتجر (غلاف + شعار + أزرار) ===== */}
      {store ? (
        <section className="sf-profile">
          <div className="sf-cover">
            {store.cover_url
              ? <img src={store.cover_url} alt="" />
              : <div className="sf-cover-fallback" />}
          </div>
          <div className="sf-profile-body">
            <div className="sf-profile-top">
              <div className="sf-plogo">
                {store.logo_url
                  ? <img src={store.logo_url} alt="" />
                  : <span>🏪</span>}
              </div>
              <div className="sf-pinfo">
                <div className="sf-pname">
                  {store.name_ar || store.name_en}
                  {(() => {
                    const open = isOpenNow(store)
                    if (open === null) return null
                    return (
                      <span className={`sf-popen ${open ? 'yes' : 'no'}`}>
                        {open ? '● مفتوح الآن' : '● مغلق'}
                      </span>
                    )
                  })()}
                </div>
                {store.description && <div className="sf-pdesc">{store.description}</div>}
                <div className="sf-pmeta">
                  {store.show_location !== false && (store.province || store.city) && (
                    <span>📍 {[store.province, store.city, store.area].filter(Boolean).join('، ')}</span>
                  )}
                  {store.working_hours?.from && store.working_hours?.to && (
                    <span>🕐 {store.working_hours.from} - {store.working_hours.to}</span>
                  )}
                </div>
              </div>
            </div>

            {/* أزرار التواصل */}
            <div className="sf-pactions">
              {storeWaLink(store) && (
                <a href={storeWaLink(store)} target="_blank" rel="noopener noreferrer" className="sf-pact sf-pact-wa">
                  <WaIcon /> واتساب
                </a>
              )}
              {store.phone && (
                <a href={`tel:${store.phone}`} className="sf-pact">📞 اتصال</a>
              )}
              <button
                className="sf-pact"
                onClick={async () => {
                  const url = window.location.href
                  const title = store.name_ar || 'متجر على المختار'
                  try {
                    if (navigator.share) await navigator.share({ title, url })
                    else {
                      await navigator.clipboard.writeText(url)
                      alert('✅ تم نسخ رابط المتجر')
                    }
                  } catch (e) { /* المستخدم ألغى المشاركة */ }
                }}
              >🔗 مشاركة</button>
            </div>

            {/* روابط التواصل الاجتماعي */}
            {store.socials && Object.entries(store.socials).some(([, v]) => v) && (
              <div className="sf-socials">
                {Object.entries(store.socials).map(([id, url]) =>
                  url ? (
                    <a key={id} href={url} target="_blank" rel="noopener noreferrer" className="sf-social" title={id}>
                      {SOCIAL_ICONS[id] || '🔗'}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* الهيرو العام عند عدم وجود متجر */
        <section className="sf-hero">
          <div className="sf-hero-inner">
            <div className="sf-hero-kicker">{T.heroKicker}</div>
            <h1 className="sf-hero-title">{T.heroTitle}</h1>
            <button className="sf-hero-cta" onClick={scrollToProducts}>{T.heroCta}</button>
          </div>
        </section>
      )}

      {/* ===== الفئات (فقط الموجودة فعلاً بهذا المتجر) ===== */}
      {cats.length > 1 && (
        <div className="sf-cats">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`sf-cat ${category === c.id ? 'active' : ''}`}
            >
              <span className="sf-cat-circle">{c.icon}</span>
              <span className="sf-cat-label">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ===== المنتجات ===== */}
      <main ref={gridRef} className="sf-main">
        {loading && <div className="sf-state">⏳ جاري التحميل...</div>}

        {error && (
          <div className="sf-state" style={{ color: '#dc2626' }}>
            {error}<br />
            <button onClick={loadAll} className="sf-retry">إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="sf-state">📦 {T.emptyMsg}</div>
        )}

        <div className="sf-grid">
          {filtered.map((p) => {
            const imgs = parseImages(p)
            const hidden = p.hide_price
            const waInq = waLink(p, 'inquire', T)
            const waOrd = waLink(p, 'order', T)
            return (
              <div key={p.id} className="sf-card">
                <div className="sf-card-img" onClick={() => openProduct(p)}>
                  {imgs[0]
                    ? <img src={imgs[0]} alt={p.name || ''} loading="lazy" />
                    : <div className="sf-noimg">🖼️</div>}
                  {hidden && <span className="sf-badge">Premium ✦</span>}
                </div>
                <div className="sf-card-body">
                  <div className="sf-card-name" onClick={() => openProduct(p)}>
                    {p.name || p.title || 'منتج'}
                    {p.sku && <span className="sf-card-sku"> | {p.sku}</span>}
                  </div>
                  {hidden ? (
                    waInq
                      ? <a href={waInq} target="_blank" rel="noopener noreferrer" className="sf-wa-btn"><WaIcon />{T.inquireLabel}</a>
                      : <span className="sf-ask">اسأل عن السعر</span>
                  ) : (
                    <>
                      <div className="sf-price">{displayPrice(p)}</div>
                      {waOrd
                        ? <a href={waOrd} target="_blank" rel="noopener noreferrer" className="sf-buy-btn">{T.buyLabel}</a>
                        : <button className="sf-buy-btn" onClick={() => openProduct(p)}>{T.buyLabel}</button>}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* ===== نافذة التفاصيل ===== */}
      {selected && (
        <div className="sf-overlay" onClick={() => setSelected(null)}>
          <div className="sf-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sf-close" onClick={() => setSelected(null)}>✕</button>
            {(() => {
              const imgs = parseImages(selected)
              return (
                <div>
                  <div className="sf-modal-img">
                    {imgs.length > 0
                      ? <img src={imgs[imgIndex]} alt="" />
                      : <div className="sf-noimg">🖼️</div>}
                  </div>
                  {imgs.length > 1 && (
                    <div className="sf-thumbs">
                      {imgs.map((im, i) => (
                        <img
                          key={i} src={im} alt=""
                          onClick={() => setImgIndex(i)}
                          className={i === imgIndex ? 'active' : ''}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
            <div className="sf-modal-body">
              <div className="sf-modal-title">{selected.name || selected.title}</div>
              {selected.sku && <div className="sf-modal-sku">كود المنتج: #{selected.sku}</div>}
              {!selected.hide_price && (
                <div className="sf-price sf-price-lg">{displayPrice(selected)}</div>
              )}
              {selected.description && <p className="sf-desc">{selected.description}</p>}
              {(() => {
                const v = parseVariants(selected)
                if (!v) return null
                return (
                  <div style={{ marginTop: 10 }}>
                    {Array.isArray(v.sizes) && v.sizes.length > 0 && (
                      <div className="sf-variant-row">
                        <span className="sf-variant-label">المقاسات:</span>
                        {v.sizes.map((x, i) => <span key={i} className="sf-chip">{x}</span>)}
                      </div>
                    )}
                    {Array.isArray(v.colors) && v.colors.length > 0 && (
                      <div className="sf-variant-row">
                        <span className="sf-variant-label">الألوان:</span>
                        {v.colors.map((x, i) => <span key={i} className="sf-chip">{x}</span>)}
                      </div>
                    )}
                  </div>
                )
              })()}
              {waLink(selected, selected.hide_price ? 'inquire' : 'order', T) && (
                <a
                  href={waLink(selected, selected.hide_price ? 'inquire' : 'order', T)}
                  target="_blank" rel="noopener noreferrer"
                  className="sf-wa-btn sf-wa-lg"
                ><WaIcon /> تواصل مع البائع عبر واتساب</a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== التنقل السفلي (موبايل فقط) ===== */}
      <footer className="sf-bottom-nav">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span>🏠</span>الرئيسية</button>
        <button onClick={scrollToProducts}><span>🗂️</span>المجموعات</button>
        <button onClick={() => { setShowSearch(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span>🔍</span>بحث</button>
        <button onClick={scrollToProducts}><span>🛍️</span>السلة</button>
        <button onClick={scrollToProducts}><span>💬</span>الدعم</button>
      </footer>
    </div>
  )
}

// ================= التنسيقات (CSS حقيقي مع استجابة كاملة) =================
const CSS = `
.sf-page {
  min-height: 100vh;
  background: #fdfdfb;
  font-family: 'Tajawal', sans-serif;
  padding-bottom: 86px;
}

/* ---- الشريط العلوي ---- */
.sf-nav {
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.sf-logo { text-align: center; }
.sf-logo-name {
  color: var(--accent);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
}
.sf-logo-tag { color: #cbd5e1; font-size: 12px; margin-top: 1px; }
.sf-nav-icons { display: flex; gap: 12px; }
.sf-icon-btn {
  background: none; border: none; color: #fff;
  font-size: 20px; cursor: pointer; padding: 4px;
}

/* ---- شريط الإعلان ---- */
.sf-announce {
  background: var(--announce);
  color: #fff;
  text-align: center;
  font-size: 12.5px;
  padding: 7px 12px;
}

/* ---- البحث ---- */
.sf-search-wrap { padding: 12px 16px 0; max-width: 1100px; margin: 0 auto; }
.sf-search {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid var(--accent);
  font-size: 15px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  background: #fff;
}

/* ---- هوية المتجر ---- */
.sf-profile { background: #fff; padding-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
.sf-cover { height: 160px; overflow: hidden; }
.sf-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sf-cover-fallback {
  width: 100%; height: 100%;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.12), transparent 55%),
    linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, #3a5a8c));
}
.sf-profile-body { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
.sf-profile-top { display: flex; gap: 14px; margin-top: -34px; position: relative; }
.sf-plogo {
  width: 84px; height: 84px; border-radius: 50%;
  background: #fff; border: 4px solid #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,.18);
  overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 34px;
}
.sf-plogo img { width: 100%; height: 100%; object-fit: cover; }
.sf-pinfo { padding-top: 40px; min-width: 0; }
.sf-pname {
  font-size: 20px; font-weight: 800; color: var(--primary);
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.sf-popen { font-size: 11.5px; font-weight: 800; padding: 4px 11px; border-radius: 999px; background: #f1f5f9; }
.sf-popen.yes { color: #16a34a; background: #ecfdf5; }
.sf-popen.no  { color: #94a3b8; }
.sf-pdesc { font-size: 13.5px; color: #64748b; margin-top: 3px; }
.sf-pmeta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12.5px; color: #94a3b8; margin-top: 6px; }

.sf-pactions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.sf-pact {
  flex: 1; min-width: 100px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--soft); color: var(--primary);
  border: 1.5px solid var(--accent);
  border-radius: 12px; padding: 11px 10px;
  font-size: 13.5px; font-weight: 800;
  text-decoration: none; cursor: pointer; font-family: inherit;
  transition: transform .12s;
}
.sf-pact:hover { transform: translateY(-1px); }
.sf-pact-wa { background: #25D366; border-color: #25D366; color: #fff; }

.sf-socials { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.sf-social {
  width: 40px; height: 40px; border-radius: 50%;
  background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  font-size: 18px; text-decoration: none;
  transition: transform .12s;
}
.sf-social:hover { transform: translateY(-2px); }

/* ---- الهيرو ---- */
.sf-hero {
  background:
    radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.10), transparent 55%),
    radial-gradient(ellipse at 15% 85%, rgba(255,255,255,0.07), transparent 50%),
    linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, #3a5a8c));
  padding: 54px 20px;
  display: flex;
  justify-content: center;
}
.sf-hero-inner { text-align: center; max-width: 620px; }
.sf-hero-kicker {
  color: var(--accent);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.sf-hero-title {
  color: #ffffff;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.55;
  margin: 10px 0 20px;
}
.sf-hero-cta {
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 12px;
  padding: 13px 42px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: transform .15s, box-shadow .15s;
}
.sf-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.25); }

/* ---- الفئات ---- */
.sf-cats {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 16px 6px;
  max-width: 1100px;
  margin: 0 auto;
  justify-content: flex-start;
}
.sf-cat {
  background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-family: inherit; flex-shrink: 0; padding: 0;
}
.sf-cat-circle {
  width: 64px; height: 64px; border-radius: 50%;
  border: 2px solid #e6e2d8; background: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  box-shadow: 0 1px 5px rgba(0,0,0,.07);
  transition: all .15s;
}
.sf-cat:hover .sf-cat-circle { transform: translateY(-2px); }
.sf-cat.active .sf-cat-circle {
  border-color: var(--accent);
  background: var(--soft);
  box-shadow: 0 0 0 2px var(--accent);
}
.sf-cat-label { font-size: 12px; color: #5b6b80; }
.sf-cat.active .sf-cat-label { color: var(--primary); font-weight: 800; }

/* ---- الشبكة ---- */
.sf-main { max-width: 1100px; margin: 16px auto 0; padding: 0 16px; scroll-margin-top: 70px; }
.sf-state { text-align: center; padding: 50px 20px; color: #64748b; font-size: 16px; }
.sf-retry {
  margin-top: 12px; padding: 10px 24px; border-radius: 10px; border: none;
  background: var(--accent); color: var(--accent-text);
  font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit;
}
.sf-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (min-width: 700px)  { .sf-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }
@media (min-width: 1000px) { .sf-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }

.sf-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,.07);
  display: flex; flex-direction: column;
  transition: transform .15s, box-shadow .15s;
}
.sf-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.12); }
.sf-card-img {
  position: relative;
  aspect-ratio: var(--aspect);
  background: #f4f2ee;
  cursor: pointer;
}
.sf-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sf-noimg {
  width: 100%; height: 100%; min-height: 150px;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px; color: #cbd5e1;
}
.sf-badge {
  position: absolute; top: 10px; right: 10px;
  background: var(--primary); color: var(--accent);
  font-size: 10.5px; font-weight: 800;
  padding: 4px 10px; border-radius: 999px; letter-spacing: .5px;
}
.sf-card-body {
  padding: 10px 12px 14px;
  display: flex; flex-direction: column; gap: 8px; flex: 1;
}
.sf-card-name {
  font-size: 13.5px; font-weight: 700; color: var(--primary);
  line-height: 1.5; cursor: pointer;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.sf-card-sku { color: #8a97a8; font-weight: 500; font-size: 12px; }
.sf-price { color: var(--primary); font-weight: 800; font-size: 16.5px; }
.sf-price-lg { font-size: 22px; margin: 10px 0; }
.sf-ask { color: #64748b; font-size: 13px; }

.sf-buy-btn {
  display: block; width: 100%; box-sizing: border-box;
  background: var(--accent); color: var(--accent-text);
  border: none; border-radius: 10px;
  padding: 10px 8px; font-size: 13.5px; font-weight: 800;
  cursor: pointer; text-align: center; text-decoration: none;
  font-family: inherit; margin-top: auto;
  transition: filter .15s;
}
.sf-buy-btn:hover { filter: brightness(1.07); }

.sf-wa-btn {
  display: block; width: 100%; box-sizing: border-box;
  background: #25D366; color: #fff;
  border-radius: 10px; padding: 10px 8px;
  font-size: 13.5px; font-weight: 800;
  text-decoration: none; text-align: center; margin-top: auto;
  transition: filter .15s;
}
.sf-wa-btn:hover { filter: brightness(1.06); }
.sf-wa-lg { margin-top: 16px; padding: 14px; }

/* ---- النافذة ---- */
.sf-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 16px;
}
.sf-modal {
  background: #fff; border-radius: 20px;
  width: 100%; max-width: 460px; max-height: 92vh;
  overflow-y: auto; position: relative;
}
.sf-close {
  position: absolute; top: 10px; left: 10px; z-index: 2;
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(0,0,0,.55); color: #fff; font-size: 16px; cursor: pointer;
}
.sf-modal-img { width: 100%; aspect-ratio: var(--aspect); background: #f4f2ee; }
.sf-modal-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sf-thumbs { display: flex; gap: 8px; padding: 10px 18px 0; overflow-x: auto; }
.sf-thumbs img {
  width: 56px; height: 56px; object-fit: cover; border-radius: 10px;
  cursor: pointer; flex-shrink: 0; border: 2px solid transparent;
}
.sf-thumbs img.active { border-color: var(--accent); }
.sf-modal-body { padding: 6px 18px 20px; }
.sf-modal-title { font-size: 19px; font-weight: 800; color: var(--primary); margin-top: 12px; }
.sf-modal-sku { font-size: 13px; color: #64748b; margin-top: 4px; }
.sf-desc { font-size: 14px; color: #334155; line-height: 1.7; margin-top: 10px; white-space: pre-wrap; }
.sf-variant-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.sf-variant-label { font-size: 13px; color: #64748b; font-weight: 700; }
.sf-chip {
  background: var(--soft); border: 1px solid var(--accent);
  border-radius: 999px; padding: 4px 12px;
  font-size: 13px; color: var(--primary); font-weight: 700;
}

/* ---- التنقل السفلي ---- */
.sf-bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: var(--primary);
  display: flex; justify-content: space-around;
  padding: 8px 4px 10px; z-index: 60;
  box-shadow: 0 -3px 12px rgba(0,0,0,.3);
}
.sf-bottom-nav button {
  background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-family: inherit; padding: 2px 8px;
  color: var(--accent); font-size: 10.5px; font-weight: 700;
}
.sf-bottom-nav button span { font-size: 19px; }

/* ---- سطح المكتب ---- */
@media (min-width: 900px) {
  .sf-bottom-nav { display: none; }
  .sf-page { padding-bottom: 40px; }
  .sf-hero { padding: 80px 20px; }
  .sf-hero-title { font-size: 34px; }
  .sf-cats { justify-content: center; }
}
`
