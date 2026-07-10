import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

// ============ إعدادات المتجر ============
const STORE_NAME_EN = 'AZYAA SAMAR'
const STORE_NAME_AR = 'أزياء سمر'
const ANNOUNCEMENT = 'Delivery across Iraq | التوصيل لكافة محافظات العراق'
const EXCHANGE_RATE = 1500 // سعر صرف الدولار — عدّله حسب السوق

// صورة الهيرو — بدّل الرابط بصورة فستان/موديل من Supabase Storage أو أي رابط مباشر
const HERO_IMAGE = ''

// ألوان الهوية
const NAVY = '#0A1D37'
const GOLD = '#F5B93E'
const LIGHTBLUE = '#3B82C4'
const WA_GREEN = '#25D366'

// الفئات — id يطابق قيمة category المحفوظة في قاعدة البيانات
const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '🛍️' },
  { id: 'clothes', label: 'الفساتين والأزياء', icon: '👗' },
  { id: 'shoes', label: 'الأحذية', icon: '👠' },
  { id: 'accessories', label: 'الإكسسوارات', icon: '💍' },
  { id: 'beauty', label: 'العناية والجمال', icon: '💄' },
  { id: 'realestate', label: 'عقارات', icon: '🏠' },
  { id: 'services', label: 'خدمات', icon: '🛠️' },
  { id: 'other', label: 'أخرى', icon: '📦' },
]

// ============ أدوات مساعدة ============
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

function waLink(product, intent) {
  const phone = (product.contact_phone || '').replace(/[^0-9]/g, '')
  if (!phone) return null
  const name = product.name || product.title || ''
  const sku = product.sku ? `\nكود المنتج: ${product.sku}` : ''
  const text =
    intent === 'order'
      ? `مرحباً 👋 أريد طلب هذا المنتج:\n${name}${sku}`
      : `مرحباً 👋 أريد الاستفسار عن سعر هذا المنتج:\n${name}${sku}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

// ============ المكوّن الرئيسي ============
export default function StoreFront() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(null)
  const [imgIndex, setImgIndex] = useState(0)
  const gridRef = useRef(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('fetch products error:', error)
      setError('تعذر تحميل المنتجات، حاولي تحديث الصفحة')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

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

  function openProduct(p) {
    setSelected(p)
    setImgIndex(0)
  }

  function scrollToProducts() {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div dir="rtl" style={s.page}>

      {/* ===== شريط التنقل العلوي ===== */}
      <nav style={s.nav}>
        <div style={s.navSide}>
          <button style={s.navIconBtn} aria-label="القائمة">☰</button>
        </div>
        <div style={s.navCenter}>
          <div style={s.logoEn}>{STORE_NAME_EN}</div>
          <div style={s.logoAr}>{STORE_NAME_AR}</div>
        </div>
        <div style={{ ...s.navSide, justifyContent: 'flex-end', gap: 14 }}>
          <button
            style={s.navIconBtn}
            aria-label="بحث"
            onClick={() => setShowSearch(!showSearch)}
          >🔍</button>
          <button style={s.navIconBtn} aria-label="السلة" onClick={scrollToProducts}>🛍️</button>
        </div>
      </nav>

      {/* ===== شريط الإعلان ===== */}
      <div style={s.announce}>{ANNOUNCEMENT}</div>

      {/* ===== حقل البحث (ينفتح من أيقونة 🔍) ===== */}
      {showSearch && (
        <div style={s.searchWrap}>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحثي بالاسم أو رقم SKU..."
            style={s.searchInput}
          />
        </div>
      )}

      {/* ===== قسم الهيرو ===== */}
      <section style={{
        ...s.hero,
        backgroundImage: HERO_IMAGE
          ? `linear-gradient(rgba(10,29,55,0.25), rgba(10,29,55,0.45)), url(${HERO_IMAGE})`
          : `linear-gradient(135deg, ${NAVY} 0%, #14325c 55%, #1d477e 100%)`,
      }}>
        <div style={s.heroCard}>
          <div style={s.heroKicker}>وصلنا حديثاً ✨</div>
          <h1 style={s.heroTitle}>أرقى الفساتين والأزياء لهذا الموسم</h1>
          <button style={s.heroBtn} onClick={scrollToProducts}>تسوقي الآن</button>
        </div>
      </section>

      {/* ===== الفئات الدائرية ===== */}
      <div style={s.catRow}>
        {CATEGORIES.map((c) => {
          const active = category === c.id
          return (
            <button key={c.id} onClick={() => setCategory(c.id)} style={s.catItem}>
              <span style={{
                ...s.catCircle,
                borderColor: active ? GOLD : '#e8dcc3',
                background: active ? '#fff8e8' : '#fff',
                boxShadow: active ? `0 0 0 2px ${GOLD}` : '0 1px 4px rgba(10,29,55,0.08)',
              }}>{c.icon}</span>
              <span style={{
                ...s.catLabel,
                color: active ? NAVY : '#5b6b80',
                fontWeight: active ? 800 : 500,
              }}>{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* ===== شبكة المنتجات ===== */}
      <main ref={gridRef} style={s.main}>
        {loading && <div style={s.stateBox}>⏳ جاري تحميل المنتجات...</div>}

        {error && (
          <div style={{ ...s.stateBox, color: '#dc2626' }}>
            {error}
            <br />
            <button onClick={fetchProducts} style={s.retryBtn}>إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={s.stateBox}>
            📦 لا توجد منتجات في هذه الفئة حالياً
          </div>
        )}

        <div style={s.grid}>
          {filtered.map((p) => {
            const imgs = parseImages(p)
            const hidden = p.hide_price
            const waInquire = waLink(p, 'inquire')
            const waOrder = waLink(p, 'order')
            return (
              <div key={p.id} style={s.card}>
                <div style={s.cardImgBox} onClick={() => openProduct(p)}>
                  {imgs[0] ? (
                    <img src={imgs[0]} alt={p.name || ''} style={s.cardImg} loading="lazy" />
                  ) : (
                    <div style={s.noImg}>🖼️</div>
                  )}
                  {hidden && <span style={s.premiumBadge}>Premium ✦</span>}
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardName} onClick={() => openProduct(p)}>
                    {p.name || p.title || 'منتج'}
                    {p.sku && <span style={s.cardSku}> | كود: {p.sku}</span>}
                  </div>

                  {hidden ? (
                    // ===== بطاقة السعر الخاص (واتساب) =====
                    waInquire ? (
                      <a href={waInquire} target="_blank" rel="noopener noreferrer" style={s.waBtn}>
                        <span style={s.waLogo}>✆</span> استفسر عن السعر
                      </a>
                    ) : (
                      <span style={s.askPrice}>اسألي عن السعر</span>
                    )
                  ) : (
                    // ===== بطاقة السعر العلني =====
                    <>
                      <div style={s.price}>{displayPrice(p)}</div>
                      {waOrder ? (
                        <a href={waOrder} target="_blank" rel="noopener noreferrer" style={s.cartBtn}>
                          إضافة إلى السلة
                        </a>
                      ) : (
                        <button style={s.cartBtn} onClick={() => openProduct(p)}>
                          عرض المنتج
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* ===== نافذة تفاصيل المنتج ===== */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>

            {(() => {
              const imgs = parseImages(selected)
              return (
                <div>
                  <div style={s.modalImgBox}>
                    {imgs.length > 0 ? (
                      <img src={imgs[imgIndex]} alt="" style={s.modalImg} />
                    ) : (
                      <div style={s.noImg}>🖼️</div>
                    )}
                  </div>
                  {imgs.length > 1 && (
                    <div style={s.thumbRow}>
                      {imgs.map((im, i) => (
                        <img
                          key={i}
                          src={im}
                          alt=""
                          onClick={() => setImgIndex(i)}
                          style={{
                            ...s.thumb,
                            border: i === imgIndex ? `2px solid ${GOLD}` : '2px solid transparent',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ padding: '6px 18px 20px' }}>
              <div style={s.modalTitle}>{selected.name || selected.title}</div>
              {selected.sku && <div style={s.modalSku}>كود المنتج: #{selected.sku}</div>}

              {!selected.hide_price && (
                <div style={{ ...s.price, fontSize: 22, margin: '10px 0' }}>
                  {displayPrice(selected)}
                </div>
              )}

              {selected.description && <p style={s.desc}>{selected.description}</p>}

              {(() => {
                const v = parseVariants(selected)
                if (!v) return null
                return (
                  <div style={{ marginTop: 10 }}>
                    {Array.isArray(v.sizes) && v.sizes.length > 0 && (
                      <div style={s.variantRow}>
                        <span style={s.variantLabel}>المقاسات:</span>
                        {v.sizes.map((x, i) => <span key={i} style={s.chip}>{x}</span>)}
                      </div>
                    )}
                    {Array.isArray(v.colors) && v.colors.length > 0 && (
                      <div style={s.variantRow}>
                        <span style={s.variantLabel}>الألوان:</span>
                        {v.colors.map((x, i) => <span key={i} style={s.chip}>{x}</span>)}
                      </div>
                    )}
                  </div>
                )
              })()}

              {waLink(selected, selected.hide_price ? 'inquire' : 'order') && (
                <a
                  href={waLink(selected, selected.hide_price ? 'inquire' : 'order')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.waBtn, display: 'block', textAlign: 'center', marginTop: 16, padding: '14px' }}
                >
                  <span style={s.waLogo}>✆</span> تواصلي مع البائع عبر واتساب
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== شريط التنقل السفلي ===== */}
      <footer style={s.bottomNav}>
        <button style={s.bnItem} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={s.bnIcon}>🏠</span><span style={s.bnLabel}>الرئيسية</span>
        </button>
        <button style={s.bnItem} onClick={scrollToProducts}>
          <span style={s.bnIcon}>👗</span><span style={s.bnLabel}>المجموعات</span>
        </button>
        <button style={s.bnItem} onClick={() => { setShowSearch(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <span style={s.bnIcon}>🔍</span><span style={s.bnLabel}>بحث</span>
        </button>
        <button style={s.bnItem} onClick={scrollToProducts}>
          <span style={s.bnIcon}>🛍️</span><span style={s.bnLabel}>السلة</span>
        </button>
        <button style={s.bnItem} onClick={scrollToProducts}>
          <span style={s.bnIcon}>💬</span><span style={s.bnLabel}>الدعم</span>
        </button>
      </footer>
    </div>
  )
}

// ============ التنسيقات ============
const s = {
  page: {
    minHeight: '100vh',
    background: '#fdfdfb',
    fontFamily: "'Tajawal', sans-serif",
    paddingBottom: 90,
  },

  // --- شريط التنقل ---
  nav: {
    background: NAVY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navSide: { display: 'flex', alignItems: 'center', flex: 1 },
  navCenter: { textAlign: 'center', flex: 2 },
  logoEn: {
    color: GOLD,
    fontSize: 19,
    fontWeight: 800,
    letterSpacing: 3,
  },
  logoAr: { color: '#cbd5e1', fontSize: 12, marginTop: 1 },
  navIconBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
  },

  // --- شريط الإعلان ---
  announce: {
    background: LIGHTBLUE,
    color: '#fff',
    textAlign: 'center',
    fontSize: 12.5,
    padding: '7px 12px',
    letterSpacing: 0.3,
  },

  // --- البحث ---
  searchWrap: { padding: '12px 16px 0', maxWidth: 1100, margin: '0 auto' },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: `1.5px solid ${GOLD}`,
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: '#fff',
  },

  // --- الهيرو ---
  hero: {
    minHeight: 300,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '40px 20px 28px',
  },
  heroCard: {
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: '20px 26px',
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 8px 30px rgba(10,29,55,0.25)',
  },
  heroKicker: { color: '#b8860b', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 },
  heroTitle: {
    color: NAVY,
    fontSize: 21,
    fontWeight: 800,
    margin: '8px 0 16px',
    lineHeight: 1.5,
  },
  heroBtn: {
    background: LIGHTBLUE,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 38px',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // --- الفئات الدائرية ---
  catRow: {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '18px 16px 6px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  catItem: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
    flexShrink: 0,
    padding: 0,
  },
  catCircle: {
    width: 62,
    height: 62,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    transition: 'all 0.15s',
  },
  catLabel: { fontSize: 12 },

  // --- المحتوى ---
  main: { maxWidth: 1100, margin: '14px auto 0', padding: '0 16px', scrollMarginTop: 70 },
  stateBox: { textAlign: 'center', padding: '50px 20px', color: '#64748b', fontSize: 16 },
  retryBtn: {
    marginTop: 12,
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: GOLD,
    color: NAVY,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // --- الشبكة (عمودين على الموبايل) ---
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))',
    gap: 14,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(10,29,55,0.07)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardImgBox: {
    position: 'relative',
    aspectRatio: '3 / 4',
    background: '#f4f2ee',
    cursor: 'pointer',
  },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  noImg: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    color: '#cbd5e1',
    minHeight: 160,
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: NAVY,
    color: GOLD,
    fontSize: 10.5,
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: 999,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: '10px 12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: NAVY,
    lineHeight: 1.5,
    cursor: 'pointer',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardSku: { color: '#8a97a8', fontWeight: 500, fontSize: 12 },
  price: { color: NAVY, fontWeight: 800, fontSize: 16.5 },

  // --- زر السلة الذهبي ---
  cartBtn: {
    display: 'block',
    width: '100%',
    background: GOLD,
    color: '#111',
    border: 'none',
    borderRadius: 10,
    padding: '10px 8px',
    fontSize: 13.5,
    fontWeight: 800,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    fontFamily: 'inherit',
    marginTop: 'auto',
    boxSizing: 'border-box',
  },

  // --- زر واتساب الأخضر ---
  waBtn: {
    display: 'block',
    width: '100%',
    background: WA_GREEN,
    color: '#fff',
    borderRadius: 10,
    padding: '10px 8px',
    fontSize: 13.5,
    fontWeight: 800,
    textDecoration: 'none',
    textAlign: 'center',
    marginTop: 'auto',
    boxSizing: 'border-box',
  },
  waLogo: { fontSize: 15, marginLeft: 5 },
  askPrice: { color: '#64748b', fontSize: 13 },

  // --- نافذة التفاصيل ---
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,29,55,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 460,
    maxHeight: '92vh',
    overflowY: 'auto',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(10,29,55,0.7)',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  modalImgBox: { width: '100%', aspectRatio: '3 / 4', background: '#f4f2ee' },
  modalImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbRow: { display: 'flex', gap: 8, padding: '10px 18px 0', overflowX: 'auto' },
  thumb: {
    width: 56,
    height: 56,
    objectFit: 'cover',
    borderRadius: 10,
    cursor: 'pointer',
    flexShrink: 0,
  },
  modalTitle: { fontSize: 19, fontWeight: 800, color: NAVY, marginTop: 12 },
  modalSku: { fontSize: 13, color: '#64748b', marginTop: 4 },
  desc: { fontSize: 14, color: '#334155', lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-wrap' },
  variantRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  variantLabel: { fontSize: 13, color: '#64748b', fontWeight: 700 },
  chip: {
    background: '#fff8e8',
    border: `1px solid ${GOLD}`,
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: 13,
    color: NAVY,
    fontWeight: 700,
  },

  // --- شريط التنقل السفلي ---
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: NAVY,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 4px 10px',
    zIndex: 60,
    boxShadow: '0 -3px 12px rgba(10,29,55,0.3)',
  },
  bnItem: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontFamily: 'inherit',
    padding: '2px 8px',
  },
  bnIcon: { fontSize: 19 },
  bnLabel: { color: GOLD, fontSize: 10.5, fontWeight: 700 },
}
