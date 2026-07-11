import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'

// ================================================================
//  لوحة تحكم البائع — مربوطة بالمتجر ونوعه
//  - الفئات تتغير تلقائياً حسب store_type (أزياء / عقارات / خدمات ...)
//  - كل منتج يُحفظ مربوطاً بـ store_id + seller_id تلقائياً
//  - Magic Toggle لإخفاء السعر وتحويله لواتساب
//  - رفع صور متعددة مع ضغط تلقائي
//  - SKU تلقائي حسب الفئة (CL-001 / SH-002 ...)
// ================================================================

// اسم الـ bucket في Supabase Storage — إذا فشل الرفع تُحفظ الصور بصيغة مضغوطة داخل قاعدة البيانات تلقائياً
const STORAGE_BUCKET = 'product-images'

// الفئات المتاحة حسب نوع المتجر
const CATS_BY_TYPE = {
  fashion: [
    { id: 'clothes', label: 'أزياء وملابس', icon: '👗', sku: 'CL' },
    { id: 'shoes', label: 'أحذية', icon: '👠', sku: 'SH' },
    { id: 'accessories', label: 'إكسسوارات', icon: '💍', sku: 'AC' },
    { id: 'bags', label: 'حقائب', icon: '👜', sku: 'BG' },
    { id: 'beauty', label: 'عناية وجمال', icon: '💄', sku: 'BE' },
    { id: 'other', label: 'أخرى', icon: '📦', sku: 'OT' },
  ],
  realestate: [
    { id: 'apartment', label: 'شقق', icon: '🏢', sku: 'AP' },
    { id: 'house', label: 'بيوت', icon: '🏡', sku: 'HS' },
    { id: 'land', label: 'أراضي', icon: '📐', sku: 'LN' },
    { id: 'commercial', label: 'تجاري', icon: '🏬', sku: 'CM' },
    { id: 'other', label: 'أخرى', icon: '📦', sku: 'OT' },
  ],
  services: [
    { id: 'maintenance', label: 'صيانة', icon: '🔧', sku: 'MN' },
    { id: 'cleaning', label: 'تنظيف', icon: '🧹', sku: 'CN' },
    { id: 'transport', label: 'نقل', icon: '🚚', sku: 'TR' },
    { id: 'design', label: 'تصميم', icon: '🎨', sku: 'DS' },
    { id: 'other', label: 'أخرى', icon: '📦', sku: 'OT' },
  ],
  electronics: [
    { id: 'phones', label: 'موبايلات', icon: '📱', sku: 'PH' },
    { id: 'computers', label: 'كمبيوتر', icon: '💻', sku: 'PC' },
    { id: 'audio', label: 'سماعات وصوتيات', icon: '🎧', sku: 'AU' },
    { id: 'gaming', label: 'ألعاب', icon: '🎮', sku: 'GM' },
    { id: 'other', label: 'أخرى', icon: '📦', sku: 'OT' },
  ],
  general: [
    { id: 'clothes', label: 'ملابس', icon: '👗', sku: 'CL' },
    { id: 'realestate', label: 'عقارات', icon: '🏠', sku: 'RE' },
    { id: 'services', label: 'خدمات', icon: '🛠️', sku: 'SR' },
    { id: 'electronics', label: 'إلكترونيات', icon: '📱', sku: 'EL' },
    { id: 'home', label: 'منزل وأثاث', icon: '🛋️', sku: 'HM' },
    { id: 'other', label: 'أخرى', icon: '📦', sku: 'OT' },
  ],
}

function resolveType(raw) {
  const v = (raw || '').toString().trim().toLowerCase()
  if (['fashion', 'clothes', 'clothing', 'ملابس', 'أزياء', 'ازياء'].includes(v)) return 'fashion'
  if (['realestate', 'real_estate', 'عقارات', 'عقار'].includes(v)) return 'realestate'
  if (['services', 'service', 'خدمات', 'خدمة'].includes(v)) return 'services'
  if (['electronics', 'إلكترونيات', 'الكترونيات'].includes(v)) return 'electronics'
  return 'general'
}

const SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42']
const COLOR_PRESETS = ['أسود', 'أبيض', 'أحمر', 'أزرق', 'أخضر', 'بيج', 'ذهبي', 'وردي']

// ضغط صورة عبر canvas — الحد الأقصى 1000px وجودة 0.72
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1000
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('compress failed'))),
          'image/jpeg',
          0.72
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export default function SellerDashboard() {
  const [user, setUser] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // {type:'ok'|'err', text}

  // ---- حقول النموذج ----
  const empty = {
    name: '', description: '', category: '',
    price: '', currency: 'IQD', quantity: '1',
    hide_price: false, contact_phone: '', video_url: '',
    sizes: [], colors: [], images: [], // images: [{dataUrl, blob}] أو روابط نصية عند التعديل
  }
  const [f, setF] = useState(empty)

  const storeType = resolveType(store?.store_type)
  const CATS = CATS_BY_TYPE[storeType]
  const isService = storeType === 'services'
  const isRealestate = storeType === 'realestate'
  const showVariants = storeType === 'fashion' || storeType === 'general'

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)

    const { data: storeRow } = await supabase
      .from('stores').select('*').eq('owner_id', user.id).maybeSingle()
    if (!storeRow || !storeRow.is_setup_complete) {
      window.location.href = '/setup'
      return
    }
    setStore(storeRow)

    await fetchProducts(user, storeRow)
    setLoading(false)
  }
    setStore(storeRow)

    await fetchProducts(user, storeRow)
    setLoading(false)
  }

  async function fetchProducts(u = user, st = store) {
    const { data, error } = await supabase
      .from('products').select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    const mine = (data || []).filter((p) =>
      (st && p.store_id === st.id) ||
      p.seller_id === u?.id ||
      p.user_id === u?.id
    )
    setProducts(mine)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    )
  }, [products, search])

  // ---- SKU تلقائي: بادئة الفئة + رقم متسلسل ----
  function nextSku(categoryId) {
    const prefix = CATS.find((c) => c.id === categoryId)?.sku || 'PR'
    const nums = products
      .filter((p) => (p.sku || '').startsWith(prefix + '-'))
      .map((p) => parseInt((p.sku || '').split('-')[1], 10))
      .filter((n) => !isNaN(n))
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    return `${prefix}-${String(next).padStart(3, '0')}`
  }

  const previewSku = f.category ? nextSku(f.category) : null

  // ---- الصور ----
  async function onPickImages(e) {
    const files = Array.from(e.target.files || []).slice(0, 6 - f.images.length)
    for (const file of files) {
      try {
        const blob = await compressImage(file)
        const dataUrl = await blobToDataURL(blob)
        setF((prev) => ({ ...prev, images: [...prev.images, { dataUrl, blob }] }))
      } catch (err) { console.error('compress error', err) }
    }
    e.target.value = ''
  }

  function removeImage(i) {
    setF((prev) => ({ ...prev, images: prev.images.filter((_, x) => x !== i) }))
  }

  // رفع الصور: Storage أولاً، وإذا فشل → data URL مضغوط مباشرة
  async function uploadImages() {
    const urls = []
    for (const img of f.images) {
      if (typeof img === 'string') { urls.push(img); continue } // صورة قديمة عند التعديل
      let uploaded = null
      try {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET).upload(path, img.blob, { contentType: 'image/jpeg' })
        if (!error) {
          const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
          uploaded = data?.publicUrl || null
        }
      } catch (e) { /* يفشل بصمت وننتقل للخطة البديلة */ }
      urls.push(uploaded || img.dataUrl)
    }
    return urls
  }

  function toggleChip(field, value) {
    setF((prev) => {
      const has = prev[field].includes(value)
      return { ...prev, [field]: has ? prev[field].filter((x) => x !== value) : [...prev[field], value] }
    })
  }

  function startAdd() {
    setF({ ...empty, category: CATS[0].id })
    setEditingId(null)
    setShowForm(true)
    setMsg(null)
  }

  function startEdit(p) {
    let v = p.variants
    try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
    let imgs = []
    try { imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]') } catch (e) { imgs = [] }
    setF({
      name: p.name || '', description: p.description || '',
      category: p.category || CATS[0].id,
      price: p.price ?? '', currency: p.currency || 'IQD',
      quantity: String(p.stock_quantity ?? p.quantity ?? 1),
      hide_price: !!p.hide_price,
      contact_phone: p.contact_phone || '',
      video_url: p.video_url || '',
      sizes: Array.isArray(v?.sizes) ? v.sizes : [],
      colors: Array.isArray(v?.colors) ? v.colors : [],
      images: imgs,
    })
    setEditingId(p.id)
    setShowForm(true)
    setMsg(null)
  }

  async function save() {
    setMsg(null)
    // ---- تحقق ----
    if (!f.name.trim()) return setMsg({ type: 'err', text: 'اكتب اسم المنتج' })
    if (!f.category) return setMsg({ type: 'err', text: 'اختر الفئة' })
    if (!f.hide_price && !f.price) return setMsg({ type: 'err', text: 'اكتب السعر أو فعّل إخفاء السعر' })
    if (f.hide_price && !f.contact_phone.trim())
      return setMsg({ type: 'err', text: 'إخفاء السعر يتطلب رقم واتساب للتواصل' })

    setSaving(true)
    try {
      const imageUrls = await uploadImages()
      const sku = editingId
        ? products.find((p) => p.id === editingId)?.sku || nextSku(f.category)
        : nextSku(f.category)

      const row = {
        name: f.name.trim(),
        title: f.name.trim(),
        description: f.description.trim() || null,
        category: f.category,
        price: f.price === '' ? null : Number(f.price),
        currency: f.currency,
        hide_price: f.hide_price,
        contact_phone: f.contact_phone.trim() || null,
        video_url: f.video_url.trim() || null,
        quantity: Number(f.quantity) || 0,
        stock_quantity: Number(f.quantity) || 0,
        stock: Number(f.quantity) || 0,
        variants: (f.sizes.length || f.colors.length)
          ? { sizes: f.sizes, colors: f.colors }
          : null,
        images: imageUrls,
        image_url: imageUrls[0] || null,
        sku,
        is_active: true,
        status: 'active',
        // ---- الربط التلقائي بالمتجر والبائع ----
        store_id: store?.id || null,
        seller_id: user.id,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      let error
      if (editingId) {
        ;({ error } = await supabase.from('products').update(row).eq('id', editingId))
      } else {
        ;({ error } = await supabase.from('products').insert(row))
      }
      if (error) throw error

      setMsg({ type: 'ok', text: editingId ? '✅ تم تحديث المنتج' : `✅ تم حفظ المنتج — الكود ${sku}#` })
      setShowForm(false)
      setF(empty)
      setEditingId(null)
      await fetchProducts()
    } catch (err) {
      console.error(err)
      setMsg({ type: 'err', text: 'حدث خطأ: ' + (err.message || 'حاول مرة ثانية') })
    }
    setSaving(false)
  }

  async function remove(p) {
    if (!window.confirm(`حذف "${p.name || 'المنتج'}" نهائياً؟`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) { setMsg({ type: 'err', text: 'تعذر الحذف' }); return }
    await fetchProducts()
  }

  function firstImg(p) {
    try {
      const arr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]')
      if (arr[0]) return arr[0]
    } catch (e) { /* ignore */ }
    return p.image_url || null
  }

  const priceLabel = isService ? 'سعر الخدمة' : isRealestate ? 'السعر المطلوب' : 'السعر'
  const nameLabel = isService ? 'اسم الخدمة' : isRealestate ? 'عنوان العقار' : 'اسم المنتج'
  const addLabel = isService ? '+ إضافة خدمة' : isRealestate ? '+ إضافة عقار' : '+ إضافة منتج'

  return (
    <div dir="rtl" className="sd-page">
      <style>{CSS}</style>

      {/* ===== الهيدر ===== */}
      <header className="sd-header">
        <div>
          <div className="sd-store-name">{store?.name_ar || store?.name_en || 'متجري'}</div>
          <div className="sd-store-type">
            لوحة التحكم · {CATS_BY_TYPE[storeType] === CATS_BY_TYPE.general ? 'متجر عام' :
              storeType === 'fashion' ? 'متجر أزياء 👗' :
              storeType === 'realestate' ? 'مكتب عقارات 🏠' :
              storeType === 'services' ? 'خدمات 🛠️' : 'إلكترونيات 📱'}
          </div>
        </div>
        {store?.store_slug && (
          <a className="sd-view-store" href={`/store/${store.store_slug}`} target="_blank" rel="noopener noreferrer">
            عرض متجري ↗
          </a>
        )}
      </header>

      {msg && <div className={`sd-msg ${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="sd-state">⏳ جاري التحميل...</div>
      ) : showForm ? (
        /* ================= نموذج الإضافة / التعديل ================= */
        <div className="sd-form">
          <div className="sd-form-title">
            {editingId ? '✏️ تعديل' : addLabel.replace('+ ', '➕ ')}
            {previewSku && !editingId && (
              <span className="sd-sku-preview">الكود التلقائي: <b>{previewSku}#</b></span>
            )}
          </div>

          <label className="sd-label">{nameLabel} *</label>
          <input className="sd-input" value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder={isRealestate ? 'مثال: شقة 150م في المنصور' : 'مثال: فستان سهرة مطرز'} />

          <label className="sd-label">الفئة *</label>
          <div className="sd-cat-row">
            {CATS.map((c) => (
              <button key={c.id} type="button"
                className={`sd-cat ${f.category === c.id ? 'active' : ''}`}
                onClick={() => setF({ ...f, category: c.id })}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* ===== Magic Toggle ===== */}
          <div className="sd-toggle-box">
            <label className="sd-toggle">
              <input type="checkbox" checked={f.hide_price}
                onChange={(e) => setF({ ...f, hide_price: e.target.checked })} />
              <span className="sd-slider" />
            </label>
            <div>
              <div className="sd-toggle-title">🔓 إخفاء السعر وتفعيل الاستفسار عبر واتساب</div>
              <div className="sd-toggle-sub">
                {f.hide_price
                  ? 'الزبون سيرى زر واتساب أخضر بدل السعر — والكود يُرسل تلقائياً بالرسالة'
                  : 'السعر يظهر علناً للزبائن'}
              </div>
            </div>
          </div>

          <div className="sd-row">
            <div style={{ flex: 2 }}>
              <label className="sd-label">
                {priceLabel} {f.hide_price ? '(اختياري — للتوثيق الداخلي)' : '*'}
              </label>
              <input className="sd-input" type="number" inputMode="numeric" value={f.price}
                onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="20000" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="sd-label">العملة</label>
              <select className="sd-input" value={f.currency}
                onChange={(e) => setF({ ...f, currency: e.target.value })}>
                <option value="IQD">د.ع</option>
                <option value="USD">$ دولار</option>
              </select>
            </div>
            {!isService && !isRealestate && (
              <div style={{ flex: 1 }}>
                <label className="sd-label">الكمية</label>
                <input className="sd-input" type="number" inputMode="numeric" value={f.quantity}
                  onChange={(e) => setF({ ...f, quantity: e.target.value })} />
              </div>
            )}
          </div>
          {f.currency === 'USD' && (
            <div className="sd-hint">💵 السعر بالدولار سيُعرض للزبون بالدينار حسب سعر الصرف تلقائياً</div>
          )}

          <label className="sd-label">رقم واتساب للتواصل {f.hide_price && '*'}</label>
          <input className="sd-input" dir="ltr" value={f.contact_phone}
            onChange={(e) => setF({ ...f, contact_phone: e.target.value })}
            placeholder="9647701234567" />

          <label className="sd-label">الوصف</label>
          <textarea className="sd-input" rows={3} value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder={isRealestate ? 'المساحة، عدد الغرف، الطابق، الموقع...' : 'تفاصيل المنتج...'} />

          {/* ===== المقاسات والألوان (للأزياء) ===== */}
          {showVariants && (
            <>
              <label className="sd-label">المقاسات المتوفرة</label>
              <div className="sd-chips">
                {SIZE_PRESETS.map((s) => (
                  <button key={s} type="button"
                    className={`sd-chip ${f.sizes.includes(s) ? 'active' : ''}`}
                    onClick={() => toggleChip('sizes', s)}>{s}</button>
                ))}
              </div>
              <label className="sd-label">الألوان المتوفرة</label>
              <div className="sd-chips">
                {COLOR_PRESETS.map((c) => (
                  <button key={c} type="button"
                    className={`sd-chip ${f.colors.includes(c) ? 'active' : ''}`}
                    onClick={() => toggleChip('colors', c)}>{c}</button>
                ))}
              </div>
            </>
          )}

          {/* ===== الصور ===== */}
          <label className="sd-label">الصور (حتى 6 — تُضغط تلقائياً للتحميل السريع) 📸</label>
          <div className="sd-imgs">
            {f.images.map((img, i) => (
              <div key={i} className="sd-img-thumb">
                <img src={typeof img === 'string' ? img : img.dataUrl} alt="" />
                <button type="button" onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}
            {f.images.length < 6 && (
              <label className="sd-img-add">
                +
                <input type="file" accept="image/*" multiple hidden onChange={onPickImages} />
              </label>
            )}
          </div>

          <label className="sd-label">رابط فيديو (يوتيوب / تيك توك — اختياري) 🎥</label>
          <input className="sd-input" dir="ltr" value={f.video_url}
            onChange={(e) => setF({ ...f, video_url: e.target.value })}
            placeholder="https://youtube.com/..." />

          <div className="sd-form-actions">
            <button className="sd-save" onClick={save} disabled={saving}>
              {saving ? '⏳ جاري الحفظ...' : editingId ? '✔ حفظ التعديلات' : '✔ حفظ المنتج'}
            </button>
            <button className="sd-cancel" onClick={() => { setShowForm(false); setEditingId(null) }}>
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        /* ================= قائمة المنتجات ================= */
        <div className="sd-list-wrap">
          <div className="sd-list-head">
            <h2>منتجاتي ({products.length})</h2>
            <button className="sd-add" onClick={startAdd}>{addLabel}</button>
          </div>

          <input className="sd-input sd-search" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث بالاسم أو رقم SKU..." />

          {filtered.length === 0 ? (
            <div className="sd-state">📦 لا توجد منتجات — ابدأ بالإضافة!</div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="sd-item">
                <div className="sd-item-img">
                  {firstImg(p) ? <img src={firstImg(p)} alt="" /> : <span>🖼️</span>}
                </div>
                <div className="sd-item-info">
                  <div className="sd-item-name">
                    {p.name || p.title}
                    {p.sku && <span className="sd-item-sku"> {p.sku}#</span>}
                  </div>
                  <div className="sd-item-price">
                    {p.hide_price
                      ? '🔒 السعر مخفي (واتساب)'
                      : `${Number(p.price || 0).toLocaleString('en-US')} ${p.currency === 'USD' ? '$' : 'د.ع'}`}
                  </div>
                </div>
                <div className="sd-item-actions">
                  <button onClick={() => startEdit(p)} title="تعديل">✏️</button>
                  <button onClick={() => remove(p)} title="حذف">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ================= التنسيقات =================
const CSS = `
.sd-page {
  min-height: 100vh;
  background: #f6f7f9;
  font-family: 'Tajawal', sans-serif;
  padding-bottom: 60px;
}
.sd-header {
  background: linear-gradient(135deg, #0A1D37, #14325c);
  color: #fff;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sd-store-name { color: #F5B93E; font-size: 21px; font-weight: 800; }
.sd-store-type { color: #cbd5e1; font-size: 12.5px; margin-top: 2px; }
.sd-view-store {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(245,185,62,0.6);
  color: #F5B93E;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
}
.sd-msg {
  max-width: 760px;
  margin: 14px auto 0;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}
.sd-msg.ok  { background: #ecfdf5; color: #067647; border: 1px solid #a7f3d0; }
.sd-msg.err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.sd-state { text-align: center; padding: 50px 20px; color: #64748b; font-size: 16px; }

.sd-list-wrap, .sd-form { max-width: 760px; margin: 16px auto 0; padding: 0 16px; }
.sd-list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.sd-list-head h2 { font-size: 19px; color: #0A1D37; margin: 0; }
.sd-add {
  background: #F5B93E; color: #111; border: none;
  border-radius: 11px; padding: 10px 18px;
  font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit;
}
.sd-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px; border-radius: 11px;
  border: 1px solid #e2e8f0; background: #fff;
  font-size: 14.5px; font-family: inherit; outline: none;
  margin-bottom: 4px;
}
.sd-input:focus { border-color: #F5B93E; }
.sd-search { margin-bottom: 14px; }

.sd-item {
  background: #fff; border-radius: 14px;
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(10,29,55,.07);
}
.sd-item-img {
  width: 62px; height: 62px; border-radius: 11px;
  background: #f1f5f9; overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.sd-item-img img { width: 100%; height: 100%; object-fit: cover; }
.sd-item-info { flex: 1; min-width: 0; }
.sd-item-name { font-size: 14.5px; font-weight: 800; color: #0A1D37; }
.sd-item-sku { color: #94a3b8; font-weight: 600; font-size: 12px; }
.sd-item-price { font-size: 13.5px; color: #b48114; font-weight: 700; margin-top: 3px; }
.sd-item-actions { display: flex; gap: 6px; }
.sd-item-actions button {
  background: #f1f5f9; border: none; border-radius: 9px;
  width: 38px; height: 38px; font-size: 16px; cursor: pointer;
}

.sd-form { background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 2px 10px rgba(10,29,55,.08); }
.sd-form-title { font-size: 18px; font-weight: 800; color: #0A1D37; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sd-sku-preview {
  background: #eff6ff; color: #1d4ed8;
  font-size: 12.5px; font-weight: 700;
  padding: 5px 12px; border-radius: 999px;
}
.sd-label { display: block; font-size: 13.5px; font-weight: 800; color: #334155; margin: 12px 0 6px; }
.sd-row { display: flex; gap: 10px; }
.sd-hint { font-size: 12.5px; color: #1d4ed8; background: #eff6ff; border-radius: 9px; padding: 8px 12px; margin-top: 6px; }

.sd-cat-row { display: flex; flex-wrap: wrap; gap: 8px; }
.sd-cat {
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 999px; padding: 8px 14px;
  font-size: 13.5px; cursor: pointer; font-family: inherit; color: #334155;
}
.sd-cat.active { background: #0A1D37; border-color: #0A1D37; color: #F5B93E; font-weight: 800; }

.sd-toggle-box {
  display: flex; gap: 12px; align-items: flex-start;
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 13px; padding: 13px; margin-top: 14px;
}
.sd-toggle { position: relative; display: inline-block; width: 46px; height: 26px; flex-shrink: 0; margin-top: 2px; }
.sd-toggle input { opacity: 0; width: 0; height: 0; }
.sd-slider {
  position: absolute; inset: 0; cursor: pointer;
  background: #cbd5e1; border-radius: 999px; transition: .2s;
}
.sd-slider:before {
  content: ""; position: absolute;
  width: 20px; height: 20px; right: 3px; top: 3px;
  background: #fff; border-radius: 50%; transition: .2s;
}
.sd-toggle input:checked + .sd-slider { background: #16a34a; }
.sd-toggle input:checked + .sd-slider:before { transform: translateX(-20px); }
.sd-toggle-title { font-size: 14px; font-weight: 800; color: #0A1D37; }
.sd-toggle-sub { font-size: 12.5px; color: #64748b; margin-top: 3px; }

.sd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.sd-chip {
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 999px; padding: 7px 15px;
  font-size: 13.5px; cursor: pointer; font-family: inherit; color: #334155;
}
.sd-chip.active { background: #F5B93E; border-color: #F5B93E; color: #111; font-weight: 800; }

.sd-imgs { display: flex; flex-wrap: wrap; gap: 10px; }
.sd-img-thumb { position: relative; width: 76px; height: 76px; border-radius: 12px; overflow: hidden; }
.sd-img-thumb img { width: 100%; height: 100%; object-fit: cover; }
.sd-img-thumb button {
  position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px; border: none; border-radius: 50%;
  background: rgba(0,0,0,.6); color: #fff; font-size: 11px; cursor: pointer;
}
.sd-img-add {
  width: 76px; height: 76px; border-radius: 12px;
  border: 2px dashed #cbd5e1; background: #f8fafc;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #94a3b8; cursor: pointer;
}

.sd-form-actions { display: flex; gap: 10px; margin-top: 20px; }
.sd-save {
  flex: 1; background: #16a34a; color: #fff;
  border: none; border-radius: 12px; padding: 14px;
  font-size: 15.5px; font-weight: 800; cursor: pointer; font-family: inherit;
}
.sd-save:disabled { opacity: .6; }
.sd-cancel {
  background: #f1f5f9; color: #334155;
  border: none; border-radius: 12px; padding: 14px 22px;
  font-size: 14.5px; font-weight: 700; cursor: pointer; font-family: inherit;
}
`
