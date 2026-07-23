import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { track } from '../lib/analytics.js'
import { getCart, addToCart, cartCount } from '../lib/orders.js'
import { productUrl, variantId, shareText, shareLinks, qrUrl, nativeShare, copyLink } from '../lib/productLink.js'
import BrandIcon from '../components/BrandIcon.jsx'

// ================================================================
//  صفحة المنتج العامة — /product/:pid/:slug?
//  خفيفة وسريعة: الصورة الأولى فوراً، والبقية Lazy، وهيكل تحميل
//  القياس أولاً ← ألوان متوفرة فقط ← حالة توفر بلا أرقام داخلية
// ================================================================

const LIMITED_AT = 5 // 1..5 = بقيت كمية محدودة

function parseImages(p) {
  const imgs = []
  try {
    const arr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]')
    if (Array.isArray(arr)) imgs.push(...arr)
  } catch (e) { /* ignore */ }
  if (imgs.length === 0 && p.image_url) imgs.push(p.image_url)
  return imgs
}
function getV(p) {
  let v = p?.variants
  try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
  return v && typeof v === 'object' ? v : null
}
// كمية تركيبة (قياس/لون) من المصفوفة أو مخزون القياس أو الكمية العامة
function qtyFor(p, size, color) {
  const v = getV(p)
  if (size && v?.matrix?.[size]) {
    if (color) {
      const row = v.matrix[size].find((c) => c.name === color)
      return Number(row?.qty) || 0
    }
    return v.matrix[size].reduce((s, c) => s + (Number(c.qty) || 0), 0)
  }
  if (size && v?.sizeStock) return Number(v.sizeStock[size]) || 0
  const q = p.stock_quantity ?? p.quantity ?? p.stock
  return Number(q) || 0
}
function availLabel(q) {
  if (q <= 0) return { text: 'غير متوفر', cls: 'out' }
  if (q <= LIMITED_AT) return { text: 'بقيت كمية محدودة', cls: 'low' }
  return { text: 'متوفر', cls: 'ok' }
}
function fmtIQD(n) { return Number(n).toLocaleString('en-US') + ' د.ع' }

export default function ProductPage() {
  const { pid } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [store, setStore] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [gone, setGone] = useState(false)
  const [img, setImg] = useState(0)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [qty, setQty] = useState(1)
  const [err, setErr] = useState(null)
  const [added, setAdded] = useState(false)
  const [sharePanel, setSharePanel] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { load() }, [pid])

  async function load() {
    setLoading(true)
    setGone(false)
    const { data: prod } = await supabase
      .from('products').select('*').eq('id', pid).maybeSingle()
    if (!prod || prod.is_active === false) {
      setP(prod || null)
      setGone(true)
      // متجر المنتج المتوقف لعرض البدائل
      if (prod?.store_id) {
        const { data: st } = await supabase.from('stores').select('*').eq('id', prod.store_id).maybeSingle()
        setStore(st || null)
        loadSimilar(prod, st)
      }
      setLoading(false)
      return
    }
    setP(prod)
    const { data: st } = await supabase
      .from('stores').select('*').eq('id', prod.store_id).maybeSingle()
    setStore(st || null)
    loadSimilar(prod, st)
    setLoading(false)
    // تتبع: مشاهدة + فتح من رابط مشترك إن وُجد مصدر
    track('product_view', { storeId: prod.store_id, productId: prod.id, ownerId: st?.owner_id })
    const utm = new URLSearchParams(window.location.search).get('utm_source')
    if (utm) track('shared_link_open', { storeId: prod.store_id, productId: prod.id, ownerId: st?.owner_id })
  }

  async function loadSimilar(prod, st) {
    if (!prod?.store_id) return
    const { data } = await supabase
      .from('products').select('*')
      .eq('store_id', prod.store_id)
      .eq('is_active', true)
      .neq('id', prod.id)
      .limit(8)
    const list = (data || [])
      .sort((a, b) => (a.category === prod.category ? -1 : 1) - (b.category === prod.category ? -1 : 1))
      .slice(0, 4)
    setSimilar(list)
  }

  const v = p ? getV(p) : null
  const sizes = Array.isArray(v?.sizes) ? v.sizes : []
  const hasMatrix = !!(v?.matrix && Object.keys(v.matrix).length)
  // الألوان المتاحة: حسب القياس المختار (فقط كمية > 0)
  const colors = useMemo(() => {
    if (!p) return []
    if (size && v?.matrix?.[size]) {
      return v.matrix[size].filter((c) => (Number(c.qty) || 0) > 0)
    }
    if (!size && !sizes.length && Array.isArray(v?.colors)) {
      return v.colors.map((n) => ({ name: n, hex: null, qty: 999 }))
    }
    return []
  }, [p, size])

  // الكمية المتاحة للاختيار الحالي
  const availableQty = p ? qtyFor(p, size, color) : 0
  const avail = availLabel(gone ? 0 : availableQty)
  const needSize = sizes.length > 0
  const needColor = hasMatrix && size && colors.length > 0
  const canAdd = !gone && !p?.hide_price
    ? (!needSize || size) && (!needColor || color) && availableQty > 0
    : false

  function pickSize(s) {
    setSize(size === s ? null : s)
    setColor(null)
    setQty(1)
    setErr(null)
  }

  function doAdd() {
    if (needSize && !size) { setErr('اختر القياس أولاً'); return null }
    if (needColor && !color) { setErr('اختر اللون'); return null }
    if (availableQty <= 0) { setErr('هذا الخيار غير متوفر حالياً'); return null }
    setErr(null)
    const item = {
      productId: p.id,
      variantId: variantId(p.id, size, color),
      name: p.name || p.title || 'منتج',
      sku: p.sku || null,
      img: parseImages(p)[0] || null,
      price: Number(p.price) || 0,
      currency: p.currency || 'IQD',
      size: size || null,
      color: color || null,
      qty: Math.min(qty, availableQty),
    }
    addToCart(p.store_id, item)
    track('add_to_cart', { storeId: p.store_id, productId: p.id, ownerId: store?.owner_id })
    const utm = new URLSearchParams(window.location.search).get('utm_source')
    if (utm) track('add_to_cart_from_shared_link', { storeId: p.store_id, productId: p.id, ownerId: store?.owner_id })
    return item
  }

  function onAddToCart() {
    if (doAdd()) setAdded(true)
  }
  function onBuyNow() {
    if (doAdd() && store?.store_slug) {
      navigate(`/store/${store.store_slug}?checkout=1`)
    }
  }

  async function onShare() {
    const ok = await nativeShare(p, store)
    if (!ok) setSharePanel(true)
  }
  async function onCopy() {
    await copyLink(p, store)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const waSeller = (store?.whatsapp || store?.phone || '').replace(/[^0-9]/g, '')

  // ---------- هيكل التحميل ----------
  if (loading) {
    return (
      <div dir="rtl" className="pp-page"><style>{CSS}</style>
        <div className="pp-wrap">
          <div className="pp-skel pp-skel-img" />
          <div className="pp-skel pp-skel-line" style={{ width: '60%' }} />
          <div className="pp-skel pp-skel-line" style={{ width: '35%' }} />
          <div className="pp-skel pp-skel-line" style={{ width: '80%' }} />
        </div>
      </div>
    )
  }

  // ---------- المنتج محذوف نهائياً ----------
  if (!p) {
    return (
      <div dir="rtl" className="pp-page"><style>{CSS}</style>
        <div className="pp-wrap pp-center">
          <div style={{ fontSize: 46 }}>🔍</div>
          <h2>هذا المنتج لم يعد موجوداً</h2>
          <p className="pp-muted">ربما حذفه المتجر — تصفح منتجات أخرى من منصة المختار</p>
          <Link to="/" className="pp-btn-main" style={{ maxWidth: 260 }}>الصفحة الرئيسية</Link>
        </div>
      </div>
    )
  }

  const imgs = parseImages(p)

  return (
    <div dir="rtl" className="pp-page">
      <style>{CSS}</style>

      {/* شريط علوي: المتجر */}
      <header className="pp-nav">
        {store ? (
          <Link to={`/store/${store.store_slug}`} className="pp-store-link">
            <span className="pp-store-logo">
              {store.logo_url ? <img src={store.logo_url} alt="" /> : '🏪'}
            </span>
            <span>
              <b>{store.name_ar || store.name_en}</b>
              <small>على منصة المختار</small>
            </span>
          </Link>
        ) : <span />}
        <button className="pp-share-top" onClick={onShare} title="مشاركة">🔗</button>
      </header>

      <div className="pp-wrap">
        {/* ===== الصور ===== */}
        <div className="pp-gallery">
          {imgs[0]
            ? <img src={imgs[img]} alt={p.name || ''} className="pp-main-img" />
            : <div className="pp-noimg">🖼️</div>}
          {imgs.length > 1 && (
            <div className="pp-thumbs">
              {imgs.map((im, i) => (
                <img key={i} src={im} alt="" loading="lazy"
                  className={i === img ? 'active' : ''}
                  onClick={() => setImg(i)} />
              ))}
            </div>
          )}
        </div>

        {/* ===== المعلومات ===== */}
        <div className="pp-info">
          <h1 className="pp-name">{p.name || p.title}</h1>
          {p.sku && <div className="pp-sku">كود المنتج: {p.sku}#</div>}

          <div className="pp-price-row">
            {p.hide_price
              ? <span className="pp-ask">💬 السعر عبر التواصل مع المتجر</span>
              : <span className="pp-price">{fmtIQD(p.price || 0)}</span>}
            <span className={`pp-avail ${avail.cls}`}>{avail.text}</span>
          </div>

          {gone && (
            <div className="pp-gone">هذا المنتج غير متوفر حالياً — شاهد منتجات مشابهة بالأسفل 👇</div>
          )}

          {p.description && <p className="pp-desc">{p.description}</p>}

          {/* ===== القياس ===== */}
          {!gone && sizes.length > 0 && (
            <>
              <div className="pp-label">اختر القياس</div>
              <div className="pp-chips">
                {sizes.map((s) => {
                  const sq = qtyFor(p, s, null)
                  return (
                    <button key={s}
                      className={`pp-chip ${size === s ? 'sel' : ''} ${sq <= 0 ? 'dis' : ''}`}
                      disabled={sq <= 0}
                      onClick={() => pickSize(s)}>{s}</button>
                  )
                })}
              </div>
            </>
          )}

          {/* ===== الألوان المتوفرة لهذا القياس فقط ===== */}
          {!gone && needColor && (
            <>
              <div className="pp-label">اختر اللون المتوفر</div>
              <div className="pp-chips">
                {colors.map((c) => (
                  <button key={c.name}
                    className={`pp-chip pp-color ${color === c.name ? 'sel' : ''}`}
                    onClick={() => { setColor(color === c.name ? null : c.name); setErr(null) }}>
                    {c.hex && (
                      <span className="pp-swatch" style={c.hex === 'linear'
                        ? { background: 'linear-gradient(45deg,#f00,#ff0,#0f0,#00f)' }
                        : { background: c.hex }} />
                    )}
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* حالة التوفر بعد اكتمال الاختيار */}
          {!gone && ((needSize && size && (!needColor || color)) || (!needSize)) && !p.hide_price && (
            <div className={`pp-avail-line ${avail.cls}`}>
              {avail.cls === 'ok' && '✔ '}{avail.text}
            </div>
          )}

          {err && <div className="pp-err">{err}</div>}

          {/* ===== الكمية والأزرار ===== */}
          {!gone && !p.hide_price && (
            <div className="pp-buy-row">
              <div className="pp-qty">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span>{qty}</span>
                <button
                  onClick={() => setQty(Math.min(availableQty || 1, qty + 1))}
                  disabled={canAdd && qty >= availableQty}>+</button>
              </div>
              <button className="pp-btn-cart" disabled={!canAdd} onClick={onAddToCart}>
                🛒 أضف للسلة
              </button>
            </div>
          )}
          {!gone && !p.hide_price && (
            <button className="pp-btn-main" disabled={!canAdd} onClick={onBuyNow}>
              ⚡ اشترِ الآن
            </button>
          )}

          {/* التواصل والمشاركة */}
          <div className="pp-actions">
            {waSeller && (
              <a
                className="pp-act pp-act-wa"
                href={`https://wa.me/${waSeller}?text=${encodeURIComponent(`مرحباً 👋 أستفسر عن:\n${p.name}\n${productUrl(p)}`)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { storeId: p.store_id, productId: p.id, ownerId: store?.owner_id })}
              >💬 تواصل مع البائع</a>
            )}
            <button className="pp-act" onClick={onShare}>🔗 مشاركة المنتج</button>
          </div>

          {/* التوصيل */}
          <div className="pp-delivery">🚚 التوصيل لجميع محافظات العراق — الدفع عند الاستلام</div>
        </div>

        {/* ===== منتجات مشابهة ===== */}
        {similar.length > 0 && (
          <div className="pp-similar">
            <h3>منتجات أخرى من المتجر</h3>
            <div className="pp-sim-grid">
              {similar.map((sp) => {
                const si = parseImages(sp)[0]
                return (
                  <Link key={sp.id} to={`/product/${sp.id}`} className="pp-sim-card">
                    {si ? <img src={si} alt="" loading="lazy" /> : <div className="pp-noimg sm">🖼️</div>}
                    <div className="pp-sim-name">{sp.name || sp.title}</div>
                    {!sp.hide_price && <div className="pp-sim-price">{fmtIQD(sp.price || 0)}</div>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== نجاح الإضافة ===== */}
      {added && (
        <div className="pp-overlay" onClick={() => setAdded(false)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 44 }}>✅</div>
            <h3>أُضيف إلى السلة</h3>
            <p className="pp-muted">{cartCount(getCart(p.store_id))} قطعة بالسلة الآن</p>
            <button className="pp-btn-main" onClick={() => navigate(`/store/${store?.store_slug}?checkout=1`)}>
              إتمام الطلب ←
            </button>
            <button className="pp-btn-ghost" onClick={() => setAdded(false)}>متابعة التسوق</button>
          </div>
        </div>
      )}

      {/* ===== لوحة المشاركة اليدوية + QR ===== */}
      {sharePanel && (
        <div className="pp-overlay" onClick={() => { setSharePanel(false); setShowQr(false) }}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>مشاركة المنتج</h3>
            {(() => {
              const links = shareLinks(productUrl(p), shareText(p, store))
              return (
                <div className="pp-share-grid">
                  <a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><BrandIcon id="whatsapp" size={20} /> واتساب</a>
                  <a href={links.facebook} target="_blank" rel="noopener noreferrer"><BrandIcon id="facebook" size={20} /> فيسبوك</a>
                  <a href={links.telegram} target="_blank" rel="noopener noreferrer"><BrandIcon id="telegram" size={20} /> تيليغرام</a>
                  <a href={links.x} target="_blank" rel="noopener noreferrer"><BrandIcon id="x" size={20} /> X</a>
                </div>
              )
            })()}
            <button className="pp-btn-cart" style={{ width: '100%' }} onClick={onCopy}>
              {copied ? '✓ تم نسخ الرابط' : '📋 نسخ الرابط'}
            </button>
            <button className="pp-btn-ghost" onClick={() => setShowQr(!showQr)}>
              {showQr ? 'إخفاء QR' : '⬛ عرض QR Code'}
            </button>
            {showQr && (
              <div className="pp-qr">
                <img src={qrUrl(productUrl(p))} alt="QR" />
                <a href={qrUrl(productUrl(p), 800)} download={`qr-${p.sku || p.id}.png`}
                  target="_blank" rel="noopener noreferrer" className="pp-btn-ghost">⬇ تنزيل الصورة</a>
              </div>
            )}
            <button className="pp-btn-ghost" onClick={() => { setSharePanel(false); setShowQr(false) }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  )
}

const CSS = `
.pp-page { min-height: 100vh; background: #fdfdfb; font-family: 'Tajawal', sans-serif; padding-bottom: 40px; }
.pp-nav {
  background: #0A1D37; padding: 10px 16px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 40;
}
.pp-store-link { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #fff; }
.pp-store-logo {
  width: 38px; height: 38px; border-radius: 50%; background: #fff;
  overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 17px;
}
.pp-store-logo img { width: 100%; height: 100%; object-fit: cover; }
.pp-store-link b { display: block; font-size: 14.5px; color: #F5B93E; }
.pp-store-link small { font-size: 10.5px; color: #cbd5e1; }
.pp-share-top { background: none; border: none; font-size: 20px; cursor: pointer; color: #fff; }

.pp-wrap { max-width: 900px; margin: 0 auto; padding: 14px 16px; }
.pp-center { text-align: center; padding-top: 60px; }
.pp-muted { color: #64748b; font-size: 13.5px; }

/* هيكل التحميل */
.pp-skel { background: linear-gradient(90deg,#eef1f5 25%,#f7f9fb 50%,#eef1f5 75%); background-size: 200% 100%; animation: pp-sh 1.1s infinite; border-radius: 14px; }
@keyframes pp-sh { to { background-position: -200% 0; } }
.pp-skel-img { width: 100%; aspect-ratio: 1/1; max-width: 460px; margin: 0 auto 16px; }
.pp-skel-line { height: 18px; margin: 10px 0; }

.pp-gallery { max-width: 460px; margin: 0 auto; }
.pp-main-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 18px; display: block; background: #f4f2ee; }
.pp-noimg { width: 100%; aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; font-size: 46px; color: #cbd5e1; background: #f4f2ee; border-radius: 18px; }
.pp-noimg.sm { aspect-ratio: 1/1; font-size: 28px; border-radius: 12px; }
.pp-thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; }
.pp-thumbs img { width: 58px; height: 58px; object-fit: cover; border-radius: 10px; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; }
.pp-thumbs img.active { border-color: #F5B93E; }

.pp-info { max-width: 560px; margin: 16px auto 0; }
.pp-name { font-size: 21px; font-weight: 800; color: #0A1D37; margin: 0; line-height: 1.5; }
.pp-sku { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.pp-price-row { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
.pp-price { font-size: 23px; font-weight: 800; color: #0A1D37; }
.pp-ask { font-size: 15px; color: #b48114; font-weight: 700; }
.pp-avail { font-size: 11.5px; font-weight: 800; padding: 4px 12px; border-radius: 999px; }
.pp-avail.ok { background: #ecfdf5; color: #16a34a; }
.pp-avail.low { background: #fef3c7; color: #b45309; }
.pp-avail.out { background: #fee2e2; color: #dc2626; }
.pp-gone { background: #fef3c7; color: #92400e; border-radius: 12px; padding: 11px 14px; font-size: 13.5px; font-weight: 700; margin-top: 12px; }
.pp-desc { font-size: 14px; color: #334155; line-height: 1.8; margin-top: 12px; white-space: pre-wrap; }

.pp-label { font-size: 13.5px; font-weight: 800; color: #334155; margin: 16px 0 8px; }
.pp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.pp-chip {
  border: 1.5px solid #e2e8f0; background: #fff; border-radius: 999px;
  padding: 9px 17px; font-size: 14px; cursor: pointer; font-family: inherit; color: #0A1D37;
  display: inline-flex; align-items: center; gap: 7px;
}
.pp-chip.sel { background: #0A1D37; border-color: #0A1D37; color: #F5B93E; font-weight: 800; }
.pp-chip.dis { opacity: .35; text-decoration: line-through; cursor: default; }
.pp-swatch { width: 16px; height: 16px; border-radius: 5px; border: 1px solid #e2e8f0; }
.pp-avail-line { font-size: 13.5px; font-weight: 800; margin-top: 12px; }
.pp-avail-line.ok { color: #16a34a; }
.pp-avail-line.low { color: #b45309; }
.pp-avail-line.out { color: #dc2626; }
.pp-err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 10px; padding: 9px 12px; font-size: 13px; font-weight: 700; margin-top: 10px; }

.pp-buy-row { display: flex; gap: 10px; margin-top: 16px; }
.pp-qty { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 4px 8px; }
.pp-qty button { width: 32px; height: 32px; border: none; background: #fff; border-radius: 9px; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; color: #0A1D37; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.pp-qty button:disabled { opacity: .35; }
.pp-qty span { min-width: 24px; text-align: center; font-weight: 800; color: #0A1D37; }
.pp-btn-cart { flex: 1; background: #F5B93E; color: #111; border: none; border-radius: 12px; padding: 13px; font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; }
.pp-btn-cart:disabled { opacity: .45; cursor: default; }
.pp-btn-main { display: block; width: 100%; box-sizing: border-box; background: #16a34a; color: #fff; border: none; border-radius: 13px; padding: 14px; font-size: 15.5px; font-weight: 800; cursor: pointer; font-family: inherit; margin-top: 10px; text-align: center; text-decoration: none; }
.pp-btn-main:disabled { opacity: .45; cursor: default; }
.pp-btn-ghost { display: block; width: 100%; background: none; border: none; color: #64748b; font-size: 13px; cursor: pointer; font-family: inherit; margin-top: 10px; text-decoration: underline; }
.pp-actions { display: flex; gap: 10px; margin-top: 14px; }
.pp-act { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background: #FFF8E8; color: #0A1D37; border: 1.5px solid #F5B93E; border-radius: 12px; padding: 11px; font-size: 13.5px; font-weight: 800; text-decoration: none; cursor: pointer; font-family: inherit; }
.pp-act-wa { background: #25D366; border-color: #25D366; color: #fff; }
.pp-delivery { margin-top: 14px; background: #f8fafc; border-radius: 12px; padding: 11px 14px; font-size: 13px; color: #334155; }

.pp-similar { max-width: 560px; margin: 28px auto 0; }
.pp-similar h3 { font-size: 16px; color: #0A1D37; }
.pp-sim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
.pp-sim-card { background: #fff; border-radius: 14px; overflow: hidden; text-decoration: none; box-shadow: 0 1px 5px rgba(10,29,55,.08); }
.pp-sim-card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
.pp-sim-name { font-size: 12px; font-weight: 700; color: #0A1D37; padding: 7px 9px 2px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
.pp-sim-price { font-size: 12px; color: #b48114; font-weight: 800; padding: 0 9px 9px; }

.pp-overlay { position: fixed; inset: 0; background: rgba(10,29,55,.55); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.pp-modal { background: #fff; border-radius: 20px; padding: 22px; width: 100%; max-width: 380px; text-align: center; max-height: 90vh; overflow-y: auto; }
.pp-modal h3 { margin: 6px 0 12px; color: #0A1D37; }
.pp-share-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.pp-share-grid a { display: flex; align-items: center; gap: 9px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; font-size: 13.5px; font-weight: 800; color: #0A1D37; text-decoration: none; }
.pp-qr { margin-top: 12px; }
.pp-qr img { width: 200px; height: 200px; border-radius: 14px; border: 1px solid #e2e8f0; }
`
