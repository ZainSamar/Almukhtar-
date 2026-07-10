import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'

// ====== إعدادات عامة ======
const EXCHANGE_RATE = 1500 // سعر صرف الدولار مقابل الدينار — عدّله حسب السوق

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '🛍️' },
  { id: 'clothes', label: 'ملابس وأزياء', icon: '👗' },
  { id: 'realestate', label: 'عقارات', icon: '🏠' },
  { id: 'services', label: 'خدمات', icon: '🛠️' },
  { id: 'electronics', label: 'إلكترونيات', icon: '📱' },
  { id: 'home', label: 'منزل وأثاث', icon: '🛋️' },
  { id: 'other', label: 'أخرى', icon: '📦' },
]

// تنسيق السعر بالدينار العراقي
function formatIQD(n) {
  if (n === null || n === undefined || isNaN(n)) return ''
  return Number(n).toLocaleString('en-US') + ' د.ع'
}

// السعر النهائي للعرض (تحويل الدولار للدينار)
function displayPrice(product) {
  const price = Number(product.price)
  if (!price) return ''
  if (product.currency === 'USD' || product.currency === '$') {
    return formatIQD(price * EXCHANGE_RATE)
  }
  return formatIQD(price)
}

// استخراج أول صورة من المنتج (يدعم images JSONB أو image_url القديم)
function firstImage(product) {
  try {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images[0]
    if (typeof product.images === 'string') {
      const arr = JSON.parse(product.images)
      if (Array.isArray(arr) && arr.length > 0) return arr[0]
    }
  } catch (e) { /* ignore */ }
  return product.image_url || null
}

// كل صور المنتج
function allImages(product) {
  const imgs = []
  try {
    const arr = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]')
    if (Array.isArray(arr)) imgs.push(...arr)
  } catch (e) { /* ignore */ }
  if (imgs.length === 0 && product.image_url) imgs.push(product.image_url)
  return imgs
}

// رابط واتساب مع رسالة تلقائية تحتوي كود المنتج
function whatsappLink(product) {
  const phone = (product.contact_phone || '').replace(/[^0-9]/g, '')
  const msg = encodeURIComponent(
    `مرحباً 👋 أريد الاستفسار عن هذا المنتج:\n${product.name || product.title || ''}\nكود المنتج: ${product.sku || ''}`
  )
  return phone ? `https://wa.me/${phone}?text=${msg}` : null
}

export default function StoreFront() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(null) // المنتج المفتوح بنافذة التفاصيل
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    fetchProducts()
  }, [])

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
      setError('تعذر تحميل المنتجات، حاول تحديث الصفحة')
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

  return (
    <div dir="rtl" style={styles.page}>
      {/* ====== الهيدر ====== */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoBox}>
            <span style={styles.logoText}>المختار</span>
            <span style={styles.logoSub}>سوقك العراقي الموثوق</span>
          </div>
        </div>
      </header>

      {/* ====== البحث ====== */}
      <div style={styles.searchWrap}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 ابحث بالاسم أو رقم SKU..."
          style={styles.searchInput}
        />
      </div>

      {/* ====== الفئات ====== */}
      <div style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              ...styles.catBtn,
              ...(category === c.id ? styles.catBtnActive : {}),
            }}
          >
            <span style={{ fontSize: 18 }}>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* ====== المحتوى ====== */}
      <main style={styles.main}>
        {loading && <div style={styles.stateBox}>⏳ جاري تحميل المنتجات...</div>}

        {error && (
          <div style={{ ...styles.stateBox, color: '#dc2626' }}>
            {error}
            <br />
            <button onClick={fetchProducts} style={styles.retryBtn}>إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={styles.stateBox}>
            📦 لا توجد منتجات حالياً
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
              جرب فئة أخرى أو امسح كلمة البحث
            </div>
          </div>
        )}

        <div style={styles.grid}>
          {filtered.map((p) => {
            const img = firstImage(p)
            const hidden = p.hide_price
            const wa = whatsappLink(p)
            return (
              <div key={p.id} style={styles.card} onClick={() => openProduct(p)}>
                <div style={styles.cardImgBox}>
                  {img ? (
                    <img src={img} alt={p.name || ''} style={styles.cardImg} loading="lazy" />
                  ) : (
                    <div style={styles.noImg}>🖼️</div>
                  )}
                  {p.sku && <span style={styles.skuBadge}>#{p.sku}</span>}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardName}>{p.name || p.title || 'منتج'}</div>
                  {hidden ? (
                    wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={styles.waBtn}
                      >
                        💬 استفسر عن السعر
                      </a>
                    ) : (
                      <span style={styles.askPrice}>اسأل عن السعر</span>
                    )
                  ) : (
                    <div style={styles.price}>{displayPrice(p)}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* ====== نافذة تفاصيل المنتج ====== */}
      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>

            {/* الصور */}
            {(() => {
              const imgs = allImages(selected)
              return (
                <div>
                  <div style={styles.modalImgBox}>
                    {imgs.length > 0 ? (
                      <img src={imgs[imgIndex]} alt="" style={styles.modalImg} />
                    ) : (
                      <div style={styles.noImg}>🖼️</div>
                    )}
                  </div>
                  {imgs.length > 1 && (
                    <div style={styles.thumbRow}>
                      {imgs.map((im, i) => (
                        <img
                          key={i}
                          src={im}
                          alt=""
                          onClick={() => setImgIndex(i)}
                          style={{
                            ...styles.thumb,
                            border: i === imgIndex ? '2px solid #f59e0b' : '2px solid transparent',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ padding: '4px 18px 18px' }}>
              <div style={styles.modalTitle}>{selected.name || selected.title}</div>
              {selected.sku && <div style={styles.modalSku}>كود المنتج: #{selected.sku}</div>}

              {selected.hide_price ? null : (
                <div style={{ ...styles.price, fontSize: 22, margin: '8px 0' }}>
                  {displayPrice(selected)}
                </div>
              )}

              {selected.description && (
                <p style={styles.desc}>{selected.description}</p>
              )}

              {/* المقاسات والألوان */}
              {(() => {
                let v = selected.variants
                try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
                if (!v) return null
                return (
                  <div style={{ marginTop: 10 }}>
                    {Array.isArray(v.sizes) && v.sizes.length > 0 && (
                      <div style={styles.variantRow}>
                        <span style={styles.variantLabel}>المقاسات:</span>
                        {v.sizes.map((s, i) => (
                          <span key={i} style={styles.chip}>{s}</span>
                        ))}
                      </div>
                    )}
                    {Array.isArray(v.colors) && v.colors.length > 0 && (
                      <div style={styles.variantRow}>
                        <span style={styles.variantLabel}>الألوان:</span>
                        {v.colors.map((c, i) => (
                          <span key={i} style={styles.chip}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* زر واتساب دائماً بالتفاصيل */}
              {whatsappLink(selected) && (
                <a
                  href={whatsappLink(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.waBtn, display: 'block', textAlign: 'center', marginTop: 16, padding: '13px' }}
                >
                  💬 تواصل مع البائع عبر واتساب
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ====== التنسيقات ======
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Tajawal', sans-serif",
    paddingBottom: 60,
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    padding: '18px 16px',
  },
  headerInner: { maxWidth: 1100, margin: '0 auto' },
  logoBox: { display: 'flex', flexDirection: 'column', gap: 2 },
  logoText: { color: '#f59e0b', fontSize: 26, fontWeight: 800 },
  logoSub: { color: '#cbd5e1', fontSize: 13 },
  searchWrap: { maxWidth: 1100, margin: '16px auto 0', padding: '0 16px' },
  searchInput: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: '#fff',
  },
  catRow: {
    maxWidth: 1100,
    margin: '12px auto 0',
    padding: '0 16px',
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  catBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#334155',
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  catBtnActive: {
    background: '#f59e0b',
    borderColor: '#f59e0b',
    color: '#fff',
    fontWeight: 700,
  },
  main: { maxWidth: 1100, margin: '18px auto 0', padding: '0 16px' },
  stateBox: {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#64748b',
    fontSize: 16,
  },
  retryBtn: {
    marginTop: 12,
    padding: '9px 22px',
    borderRadius: 10,
    border: 'none',
    background: '#f59e0b',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
    gap: 14,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  cardImgBox: { position: 'relative', aspectRatio: '1 / 1', background: '#f1f5f9' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  noImg: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    color: '#cbd5e1',
    minHeight: 140,
  },
  skuBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(15,23,42,0.75)',
    color: '#fff',
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 8,
  },
  cardBody: { padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  cardName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  price: { color: '#f59e0b', fontWeight: 800, fontSize: 16 },
  askPrice: { color: '#64748b', fontSize: 13 },
  waBtn: {
    background: '#25D366',
    color: '#fff',
    padding: '8px 10px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.55)',
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
    background: 'rgba(15,23,42,0.65)',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  modalImgBox: { width: '100%', aspectRatio: '1 / 1', background: '#f1f5f9' },
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
  modalTitle: { fontSize: 19, fontWeight: 800, color: '#0f172a', marginTop: 12 },
  modalSku: { fontSize: 13, color: '#64748b', marginTop: 4 },
  desc: { fontSize: 14, color: '#334155', lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-wrap' },
  variantRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  variantLabel: { fontSize: 13, color: '#64748b', fontWeight: 700 },
  chip: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: 13,
    color: '#0f172a',
  },
}
