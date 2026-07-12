import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'

// ================================================================
//  لوحة تحكم البائع — مع إدارة مخزون احترافية
//  - بطاقات إحصائية: المنتجات، القطع، المنخفض، النافد
//  - تعديل الكمية بضغطة واحدة [−] [+] من القائمة مباشرة
//  - تنبيه أصفر للمنتجات القاربة على النفاد + شارات ملونة
//  - فلترة سريعة: الكل / منخفض / نافد
//  - الفئات والحقول تتغير حسب نوع المتجر (أزياء/عقارات/خدمات..)
// ================================================================

const STORAGE_BUCKET = 'product-images'
const LOW_STOCK = 3 // حد التنبيه: الكمية 3 أو أقل تعتبر "قاربت على النفاد"

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

// المقاسات الحرفية (ملابس)
const SIZE_LETTERS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']
// المقاسات الرقمية (أحذية وملابس): 34 حتى 56
const SIZE_NUMBERS = Array.from({ length: 23 }, (_, i) => String(34 + i))
// الفئة المستهدفة
const AUDIENCES = [
  { id: 'women', label: 'نسائي', icon: '👩' },
  { id: 'men', label: 'رجالي', icon: '👨' },
  { id: 'boys', label: 'ولادي', icon: '👦' },
  { id: 'girls', label: 'بناتي', icon: '👧' },
]
// قائمة الألوان الأساسية: اسم + لون حقيقي + رمز للـ SKU
const COLOR_LIST = [
  { name: 'أسود', hex: '#111111', code: 'BLK' },
  { name: 'أبيض', hex: '#FFFFFF', code: 'WHT' },
  { name: 'أحمر', hex: '#DC2626', code: 'RED' },
  { name: 'أزرق', hex: '#2563EB', code: 'BLU' },
  { name: 'أخضر', hex: '#16A34A', code: 'GRN' },
  { name: 'أصفر', hex: '#EAB308', code: 'YLW' },
  { name: 'برتقالي', hex: '#F97316', code: 'ORG' },
  { name: 'وردي', hex: '#EC4899', code: 'PNK' },
  { name: 'بنفسجي', hex: '#8B5CF6', code: 'PRP' },
  { name: 'بني', hex: '#92400E', code: 'BRN' },
  { name: 'رمادي', hex: '#6B7280', code: 'GRY' },
  { name: 'بيج', hex: '#D6C7A1', code: 'BEG' },
  { name: 'كحلي', hex: '#0A1D37', code: 'NVY' },
  { name: 'ذهبي', hex: '#F5B93E', code: 'GLD' },
  { name: 'فضي', hex: '#C0C0C0', code: 'SLV' },
  { name: 'متعدد الألوان', hex: 'linear', code: 'MLT' },
]
const COLOR_PRESETS = COLOR_LIST.slice(0, 8).map((c) => c.name)

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

// مخزون المقاسات إن وجد: { S: 3, M: 5 }
function sizeStockOf(p) {
  let v = p.variants
  try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
  const ss = v?.sizeStock
  if (ss && typeof ss === 'object' && Object.keys(ss).length > 0) return ss
  return null
}

// كمية المنتج: مجموع مخزون المقاسات إن وجد، وإلا الأعمدة القديمة
function qtyOf(p) {
  const ss = sizeStockOf(p)
  if (ss) return Object.values(ss).reduce((s, n) => s + (Number(n) || 0), 0)
  const q = p.stock_quantity ?? p.quantity ?? p.stock
  return Number(q) || 0
}

// ===== مصفوفة (قياس × لون) =====
// variants.matrix = { L: [{name, hex, qty, sku}], XL: [...] }
function matrixOf(p) {
  let v = p.variants
  try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
  const m = v?.matrix
  return (m && typeof m === 'object' && Object.keys(m).length > 0) ? m : null
}
function sizeTotal(matrix, sizeStock, size) {
  if (matrix?.[size]) return matrix[size].reduce((s, c) => s + (Number(c.qty) || 0), 0)
  return Number(sizeStock?.[size]) || 0
}
// إعادة بناء الحقول المتزامنة (sizeStock والألوان والإجمالي) من المصفوفة
function rebuildVariants(v) {
  const out = { ...(v || {}) }
  const matrix = out.matrix || {}
  const ss = { ...(out.sizeStock || {}) }
  const colorSet = new Set(Array.isArray(out.colors) ? out.colors : [])
  for (const [size, rows] of Object.entries(matrix)) {
    ss[size] = rows.reduce((s, c) => s + (Number(c.qty) || 0), 0)
    rows.forEach((c) => colorSet.add(c.name))
  }
  out.sizeStock = ss
  out.colors = [...colorSet]
  const total = Object.values(ss).reduce((s, n) => s + (Number(n) || 0), 0)
  return { variants: out, total }
}

// ===== حفظ تلقائي مع دعم انقطاع الإنترنت =====
const PENDING_KEY = 'almukhtar_pending_stock'
function queuePending(productId, payload) {
  try {
    const q = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
    q[productId] = payload
    localStorage.setItem(PENDING_KEY, JSON.stringify(q))
  } catch (e) { /* ignore */ }
}
function clearPending(productId) {
  try {
    const q = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
    delete q[productId]
    localStorage.setItem(PENDING_KEY, JSON.stringify(q))
  } catch (e) { /* ignore */ }
}
function getPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}') } catch (e) { return {} }
}

export default function SellerDashboard() {
  const [user, setUser] = useState(null)
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all') // all | low | out
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [savingQty, setSavingQty] = useState(null) // id المنتج الجاري تحديث كميته
  const [expanded, setExpanded] = useState({}) // {productId: {size: true}} بطاقات المقاسات المفتوحة
  const [toast, setToast] = useState(null) // تنبيه الحفظ الصغير
  const [colorPicker, setColorPicker] = useState(null) // {pid, size} قائمة إضافة لون مفتوحة
  const [customColor, setCustomColor] = useState({ name: '', hex: '#888888' })

  function showToast(text) {
    setToast(text)
    setTimeout(() => setToast(null), 1600)
  }

  // ===== الإحصائيات والأداء =====
  const [view, setView] = useState('products') // products | stats
  const [period, setPeriod] = useState(7) // بالأيام: 1 | 7 | 30 | 90
  const [statsData, setStatsData] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [chartOn, setChartOn] = useState({ store_view: true, product_view: true, whatsapp_click: true, order_created: false })

  const empty = {
    name: '', description: '', category: '',
    price: '', currency: 'IQD', quantity: '1',
    hide_price: false, contact_phone: '', video_url: '',
    audience: '', // الفئة المستهدفة: نسائي/رجالي/ولادي/بناتي
    low_stock_threshold: '3', // حد تنبيه المخزون المنخفض
    sizes: [], colors: [], images: [],
    sizeStock: {}, // مخزون كل مقاس: { S: 3, M: 5 }
  }
  const [f, setF] = useState(empty)

  const storeType = resolveType(store?.store_type)
  const CATS = CATS_BY_TYPE[storeType]
  const isService = storeType === 'services'
  const isRealestate = storeType === 'realestate'
  const showVariants = storeType === 'fashion' || storeType === 'general'
  // المخزون منطقي فقط للمتاجر السلعية (مو خدمات ولا عقارات)
  const trackStock = !isService && !isRealestate

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

  // ===== الإحصائيات =====
  const stats = useMemo(() => {
    const total = products.length
    const pieces = products.reduce((s, p) => s + qtyOf(p), 0)
    const thr = (p) => {
      const t = Number(p.low_stock_threshold)
      return Number.isFinite(t) && t > 0 ? t : LOW_STOCK
    }
    const low = products.filter((p) => qtyOf(p) > 0 && qtyOf(p) <= thr(p))
    const out = products.filter((p) => qtyOf(p) === 0)
    return { total, pieces, low, out }
  }, [products])

  // ===== الفلترة =====
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchQ =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      const qty = qtyOf(p)
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && qty > 0 && qty <= LOW_STOCK) ||
        (stockFilter === 'out' && qty === 0)
      return matchQ && matchStock
    })
  }, [products, search, stockFilter])

  // ===== الحفظ المركزي للمتغيرات (تفاؤلي + دعم الأوفلاين) =====
  async function persistVariants(p, newVariantsRaw) {
    const { variants: newVariants, total } = rebuildVariants(newVariantsRaw)
    // تحديث فوري بالواجهة
    setProducts((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, variants: newVariants, stock_quantity: total, quantity: total, stock: total }
          : x
      )
    )
    const payload = {
      variants: newVariants,
      stock_quantity: total,
      quantity: total,
      stock: total,
      updated_at: new Date().toISOString(),
    }
    setSavingQty(p.id)
    const { error } = await supabase.from('products').update(payload).eq('id', p.id)
    setSavingQty(null)
    if (error) {
      // انقطاع اتصال؟ نحفظ محلياً ونرسل عند العودة
      console.error(error)
      queuePending(p.id, payload)
      showToast('📴 حُفظ محلياً — سيُرسل عند عودة الاتصال')
    } else {
      clearPending(p.id)
      showToast('✓ تم الحفظ')
    }
  }

  // إرسال التعديلات المعلقة عند عودة الاتصال
  useEffect(() => {
    async function flushPending() {
      const q = getPending()
      for (const [pid, payload] of Object.entries(q)) {
        const { error } = await supabase.from('products').update(payload).eq('id', pid)
        if (!error) clearPending(pid)
      }
    }
    flushPending()
    window.addEventListener('online', flushPending)
    return () => window.removeEventListener('online', flushPending)
  }, [])

  // ===== عمليات المصفوفة (قياس × لون) =====
  function getV(p) {
    let v = p.variants
    try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = {} }
    return v && typeof v === 'object' ? { ...v } : {}
  }

  function addColorToSize(p, size, colorName, colorHex) {
    const v = getV(p)
    const matrix = { ...(v.matrix || {}) }
    const rows = [...(matrix[size] || [])]
    // منع تكرار نفس اللون تحت نفس القياس
    if (rows.some((c) => c.name === colorName)) {
      setMsg({ type: 'err', text: `اللون "${colorName}" موجود مسبقاً تحت مقاس ${size}` })
      return
    }
    // أول لون يرث مخزون المقاس القديم حتى لا يضيع
    const inherit = rows.length === 0 ? (Number(v.sizeStock?.[size]) || 0) : 0
    const colorCode = COLOR_LIST.find((c) => c.name === colorName)?.code || 'CUS'
    rows.push({
      name: colorName,
      hex: colorHex,
      qty: inherit,
      sku: `${p.sku || 'PR'}-${colorCode}-${size}`,
    })
    matrix[size] = rows
    persistVariants(p, { ...v, matrix })
    setColorPicker(null)
    setCustomColor({ name: '', hex: '#888888' })
  }

  function changeColorQty(p, size, colorName, delta) {
    const v = getV(p)
    const matrix = { ...(v.matrix || {}) }
    matrix[size] = (matrix[size] || []).map((c) =>
      c.name === colorName ? { ...c, qty: Math.max(0, (Number(c.qty) || 0) + delta) } : c
    )
    persistVariants(p, { ...v, matrix })
  }

  function removeColorFromSize(p, size, colorName) {
    if (!window.confirm(`حذف اللون "${colorName}" من مقاس ${size}؟`)) return
    const v = getV(p)
    const matrix = { ...(v.matrix || {}) }
    matrix[size] = (matrix[size] || []).filter((c) => c.name !== colorName)
    if (matrix[size].length === 0) delete matrix[size]
    persistVariants(p, { ...v, matrix })
  }

  function toggleSizeCard(pid, size) {
    setExpanded((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [size]: !prev[pid]?.[size] },
    }))
  }

  // حد التنبيه لكل منتج (قابل للتعديل من نموذج المنتج)
  function thresholdOf(p) {
    const t = Number(p.low_stock_threshold)
    return Number.isFinite(t) && t > 0 ? t : LOW_STOCK
  }

  // ===== تحميل وتجميع الإحصائيات (بيانات حقيقية فقط) =====
  useEffect(() => {
    if (view === 'stats' && store) loadStats()
  }, [view, period, store])

  async function loadStats() {
    setLoadingStats(true)
    try {
      const now = Date.now()
      const start = new Date(now - period * 864e5)
      const prevStart = new Date(now - 2 * period * 864e5)

      // الأحداث: الفترة الحالية + السابقة للمقارنة
      const { data: evAll } = await supabase
        .from('analytics_events').select('*')
        .eq('store_id', store.id)
        .gte('created_at', prevStart.toISOString())
      const events = evAll || []
      const cur = events.filter((e) => new Date(e.created_at) >= start)
      const prev = events.filter((e) => new Date(e.created_at) < start)

      const count = (list, type) => list.filter((e) => e.event_type === type).length
      const uniq = (list) => new Set(list.filter((e) => e.event_type === 'store_view').map((e) => e.session_id)).size

      // المتابعون (جدول قد يكون فارغاً — أرقام حقيقية)
      let followers = 0
      try {
        const { count: fc } = await supabase
          .from('store_followers').select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
        followers = fc || 0
      } catch (e) { /* الجدول غير منشأ بعد */ }

      // الطلبات وقيمتها
      let ordersCur = 0, ordersPrev = 0, sales = 0
      try {
        const { data: ords } = await supabase
          .from('orders').select('*')
          .eq('store_id', store.id)
          .gte('created_at', prevStart.toISOString())
        for (const o of ords || []) {
          const inCur = new Date(o.created_at) >= start
          if (inCur) {
            ordersCur++
            sales += Number(o.total ?? o.total_amount ?? o.amount ?? 0) || 0
          } else ordersPrev++
        }
      } catch (e) { /* لا يوجد جدول/أعمدة بعد */ }

      // السلاسل اليومية للرسم البياني
      const days = []
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date(now - i * 864e5)
        days.push(d.toISOString().slice(0, 10))
      }
      const daily = days.map((day) => {
        const dayEv = cur.filter((e) => (e.created_at || '').slice(0, 10) === day)
        return {
          day,
          store_view: count(dayEv, 'store_view'),
          product_view: count(dayEv, 'product_view'),
          whatsapp_click: count(dayEv, 'whatsapp_click'),
          order_created: count(dayEv, 'order_created'),
        }
      })

      // أفضل المنتجات أداءً
      const perProduct = {}
      for (const e of cur) {
        if (!e.product_id) continue
        perProduct[e.product_id] = perProduct[e.product_id] || { views: 0, wa: 0 }
        if (e.event_type === 'product_view') perProduct[e.product_id].views++
        if (e.event_type === 'whatsapp_click') perProduct[e.product_id].wa++
      }
      const topProducts = Object.entries(perProduct)
        .map(([pid, s]) => {
          const p = products.find((x) => x.id === pid)
          return p ? { p, ...s, conv: s.views ? Math.round((s.wa / s.views) * 100) : 0 } : null
        })
        .filter(Boolean)
        .sort((a, b) => b.views - a.views)
        .slice(0, 8)

      // مصادر الزيارات
      const srcMap = {}
      for (const e of cur.filter((x) => x.event_type === 'store_view')) {
        const s = e.source || 'direct'
        srcMap[s] = (srcMap[s] || 0) + 1
      }
      const sources = Object.entries(srcMap).sort((a, b) => b[1] - a[1])

      setStatsData({
        cur: {
          store_view: count(cur, 'store_view'),
          product_view: count(cur, 'product_view'),
          unique: uniq(cur),
          whatsapp_click: count(cur, 'whatsapp_click'),
          phone_click: count(cur, 'phone_click'),
          shares: count(cur, 'store_share') + count(cur, 'product_share'),
          orders: ordersCur,
          sales,
          followers,
        },
        prev: {
          store_view: count(prev, 'store_view'),
          product_view: count(prev, 'product_view'),
          unique: uniq(prev),
          whatsapp_click: count(prev, 'whatsapp_click'),
          phone_click: count(prev, 'phone_click'),
          shares: count(prev, 'store_share') + count(prev, 'product_share'),
          orders: ordersPrev,
        },
        daily, topProducts, sources,
      })
    } catch (err) {
      console.error(err)
      setMsg({ type: 'err', text: 'تعذر تحميل الإحصائيات' })
    }
    setLoadingStats(false)
  }

  // نسبة التغير مقارنة بالفترة السابقة
  function delta(cur, prev) {
    if (prev === 0) return cur > 0 ? 100 : null
    return Math.round(((cur - prev) / prev) * 100)
  }

  // ===== تعديل الكمية السريع [−] [+] =====
  async function changeQty(p, delta) {
    const newQty = Math.max(0, qtyOf(p) + delta)
    setSavingQty(p.id)
    setProducts((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, stock_quantity: newQty, quantity: newQty, stock: newQty }
          : x
      )
    )
    const { error } = await supabase
      .from('products')
      .update({
        stock_quantity: newQty,
        quantity: newQty,
        stock: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.id)
    if (error) {
      console.error(error)
      setMsg({ type: 'err', text: 'تعذر تحديث الكمية — حاول مرة ثانية' })
      await fetchProducts()
    }
    setSavingQty(null)
  }

  // ===== تعديل مخزون مقاس محدد [−] [+] =====
  async function changeSizeQty(p, size, delta) {
    let v = p.variants
    try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = {} }
    const ss = { ...(v?.sizeStock || {}) }
    ss[size] = Math.max(0, (Number(ss[size]) || 0) + delta)
    const newVariants = { ...v, sizeStock: ss }
    const total = Object.values(ss).reduce((s, n) => s + (Number(n) || 0), 0)

    setSavingQty(p.id)
    setProducts((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, variants: newVariants, stock_quantity: total, quantity: total, stock: total }
          : x
      )
    )
    const { error } = await supabase
      .from('products')
      .update({
        variants: newVariants,
        stock_quantity: total,
        quantity: total,
        stock: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.id)
    if (error) {
      console.error(error)
      setMsg({ type: 'err', text: 'تعذر تحديث مخزون المقاس — حاول مرة ثانية' })
      await fetchProducts()
    }
    setSavingQty(null)
  }

  // ===== SKU تلقائي =====
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

  // ===== الصور =====
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

  async function uploadImages() {
    const urls = []
    for (const img of f.images) {
      if (typeof img === 'string') { urls.push(img); continue }
      let uploaded = null
      try {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET).upload(path, img.blob, { contentType: 'image/jpeg' })
        if (!error) {
          const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
          uploaded = data?.publicUrl || null
        }
      } catch (e) { /* الخطة البديلة */ }
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
      quantity: String(qtyOf(p)),
      hide_price: !!p.hide_price,
      contact_phone: p.contact_phone || '',
      video_url: p.video_url || '',
      sizes: Array.isArray(v?.sizes) ? v.sizes : [],
      colors: Array.isArray(v?.colors) ? v.colors : [],
      audience: v?.audience || '',
      low_stock_threshold: String(p.low_stock_threshold ?? 3),
      sizeStock: (v?.sizeStock && typeof v.sizeStock === 'object') ? { ...v.sizeStock } : {},
      images: imgs,
    })
    setEditingId(p.id)
    setShowForm(true)
    setMsg(null)
  }

  async function save() {
    setMsg(null)
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

      // مخزون المقاسات: فقط للمقاسات المختارة
      const cleanSizeStock = {}
      for (const s of f.sizes) {
        cleanSizeStock[s] = Number(f.sizeStock[s]) || 0
      }
      const hasSizeStock = f.sizes.length > 0
      const totalQty = hasSizeStock
        ? Object.values(cleanSizeStock).reduce((s, n) => s + n, 0)
        : Number(f.quantity) || 0

      const row = {
        name: f.name.trim(),
        name_ar: f.name.trim(),
        name_en: f.name.trim(),
        title: f.name.trim(),
        description: f.description.trim() || null,
        category: f.category,
        price: f.price === '' ? null : Number(f.price),
        currency: f.currency,
        hide_price: f.hide_price,
        contact_phone: f.contact_phone.trim() || null,
        video_url: f.video_url.trim() || null,
        quantity: totalQty,
        stock_quantity: totalQty,
        stock: totalQty,
        low_stock_threshold: Math.max(1, Number(f.low_stock_threshold) || 3),
        variants: (f.sizes.length || f.colors.length || f.audience)
          ? (() => {
              // نحافظ على مصفوفة الألوان الموجودة للمقاسات المتبقية
              let oldMatrix = null
              if (editingId) {
                const oldP = products.find((x) => x.id === editingId)
                oldMatrix = oldP ? matrixOf(oldP) : null
              }
              const keptMatrix = {}
              if (oldMatrix) {
                for (const s of f.sizes) {
                  if (oldMatrix[s]) keptMatrix[s] = oldMatrix[s]
                }
              }
              return {
                sizes: f.sizes,
                colors: f.colors,
                ...(f.audience ? { audience: f.audience } : {}),
                ...(hasSizeStock ? { sizeStock: cleanSizeStock } : {}),
                ...(Object.keys(keptMatrix).length ? { matrix: keptMatrix } : {}),
              }
            })()
          : null,
        images: imageUrls,
        image_url: imageUrls[0] || null,
        sku,
        is_active: true,
        status: 'active',
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
            لوحة التحكم · {storeType === 'fashion' ? 'متجر أزياء 👗' :
              storeType === 'realestate' ? 'مكتب عقارات 🏠' :
              storeType === 'services' ? 'خدمات 🛠️' :
              storeType === 'electronics' ? 'إلكترونيات 📱' : 'متجر عام'}
          </div>
        </div>
        <div className="sd-header-actions">
          {store?.store_slug && (
            <a className="sd-view-store" href={`/store/${store.store_slug}`} target="_blank" rel="noopener noreferrer">
              عرض متجري ↗
            </a>
          )}
          <a className="sd-view-store sd-edit-store" href="/setup">✏️ تعديل المتجر</a>
          <button
            className="sd-view-store sd-logout"
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
          >
            خروج
          </button>
        </div>
      </header>

      {msg && <div className={`sd-msg ${msg.type}`}>{msg.text}</div>}
      {toast && <div className="sd-toast">{toast}</div>}

      {/* ===== التبويبات ===== */}
      {!loading && !showForm && (
        <div className="sd-tabs">
          <button className={`sd-tab ${view === 'products' ? 'active' : ''}`}
            onClick={() => setView('products')}>
            📦 {isRealestate ? 'عقاراتي' : isService ? 'خدماتي' : 'منتجاتي'}
          </button>
          <button className={`sd-tab ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}>
            📊 الإحصائيات والأداء
          </button>
        </div>
      )}

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
            {trackStock && f.sizes.length === 0 && (
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

          {trackStock && (
            <>
              <label className="sd-label">⚠️ حد تنبيه المخزون المنخفض</label>
              <input className="sd-input" type="number" inputMode="numeric" min="1"
                value={f.low_stock_threshold}
                onChange={(e) => setF({ ...f, low_stock_threshold: e.target.value })}
                placeholder="3" />
              <div className="sd-hint">🔔 عندما تصل كمية أي لون/مقاس لهذا الحد أو أقل، يظهر تنبيه "منخفض"</div>
            </>
          )}

          <label className="sd-label">الوصف</label>
          <textarea className="sd-input" rows={3} value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder={isRealestate ? 'المساحة، عدد الغرف، الطابق، الموقع...' : 'تفاصيل المنتج...'} />

          {showVariants && (
            <>
              {/* ===== الفئة المستهدفة ===== */}
              <label className="sd-label">الفئة المستهدفة</label>
              <div className="sd-chips">
                {AUDIENCES.map((a) => (
                  <button key={a.id} type="button"
                    className={`sd-chip ${f.audience === a.id ? 'active' : ''}`}
                    onClick={() => setF({ ...f, audience: f.audience === a.id ? '' : a.id })}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>

              {/* ===== المقاسات الحرفية ===== */}
              <label className="sd-label">المقاسات الحرفية (ملابس)</label>
              <div className="sd-chips">
                {SIZE_LETTERS.map((s) => (
                  <button key={s} type="button"
                    className={`sd-chip ${f.sizes.includes(s) ? 'active' : ''}`}
                    onClick={() => toggleChip('sizes', s)}>{s}</button>
                ))}
              </div>

              {/* ===== المقاسات الرقمية ===== */}
              <label className="sd-label">المقاسات الرقمية (أحذية وملابس) 34-56</label>
              <div className="sd-chips sd-chips-nums">
                {SIZE_NUMBERS.map((s) => (
                  <button key={s} type="button"
                    className={`sd-chip sd-chip-num ${f.sizes.includes(s) ? 'active' : ''}`}
                    onClick={() => toggleChip('sizes', s)}>{s}</button>
                ))}
              </div>

              {/* ===== مخزون كل مقاس ===== */}
              {trackStock && f.sizes.length > 0 && (
                <div className="sd-sizestock">
                  <div className="sd-sizestock-title">📦 الكمية المتوفرة لكل مقاس:</div>
                  <div className="sd-sizestock-grid">
                    {f.sizes.map((s) => (
                      <div key={s} className="sd-sizestock-item">
                        <span className="sd-sizestock-size">{s}</span>
                        <input
                          className="sd-input sd-sizestock-input"
                          type="number" inputMode="numeric" min="0"
                          value={f.sizeStock[s] ?? ''}
                          onChange={(e) =>
                            setF({ ...f, sizeStock: { ...f.sizeStock, [s]: e.target.value } })
                          }
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="sd-sizestock-total">
                    الإجمالي: <b>{f.sizes.reduce((sum, s) => sum + (Number(f.sizeStock[s]) || 0), 0)}</b> قطعة
                    <span className="sd-sizestock-note"> — يُحسب تلقائياً</span>
                  </div>
                </div>
              )}

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
      ) : view === 'stats' ? (
        /* ================= الإحصائيات والأداء ================= */
        <div className="sd-list-wrap">

          {/* فلترة الفترة الزمنية */}
          <div className="sd-filters" style={{ marginBottom: 16 }}>
            {[{ d: 1, l: 'اليوم' }, { d: 7, l: 'آخر 7 أيام' }, { d: 30, l: 'آخر 30 يوم' }, { d: 90, l: 'آخر 3 أشهر' }].map((o) => (
              <button key={o.d}
                className={`sd-filter ${period === o.d ? 'active' : ''}`}
                onClick={() => setPeriod(o.d)}>{o.l}</button>
            ))}
          </div>

          {loadingStats || !statsData ? (
            <div className="sd-state">⏳ جاري تحميل الإحصائيات...</div>
          ) : (() => {
            const S = statsData
            const conv = S.cur.store_view ? Math.round((S.cur.whatsapp_click / S.cur.store_view) * 100) : 0
            const convPrev = S.prev.store_view ? Math.round((S.prev.whatsapp_click / S.prev.store_view) * 100) : 0
            const noData = S.cur.store_view === 0 && S.cur.product_view === 0 && S.cur.whatsapp_click === 0

            const CARDS = [
              { label: 'زيارات المتجر', val: S.cur.store_view, d: delta(S.cur.store_view, S.prev.store_view) },
              { label: 'زوار فريدون', val: S.cur.unique, d: delta(S.cur.unique, S.prev.unique) },
              { label: 'مشاهدات المنتجات', val: S.cur.product_view, d: delta(S.cur.product_view, S.prev.product_view) },
              { label: 'نقرات واتساب 💬', val: S.cur.whatsapp_click, d: delta(S.cur.whatsapp_click, S.prev.whatsapp_click), hot: true },
              { label: 'نقرات الهاتف 📞', val: S.cur.phone_click, d: delta(S.cur.phone_click, S.prev.phone_click) },
              { label: 'مشاركات المتجر 🔗', val: S.cur.shares, d: delta(S.cur.shares, S.prev.shares) },
              { label: 'معدل التحويل', val: conv + '%', d: delta(conv, convPrev), hint: 'واتساب ÷ زيارات' },
              { label: 'الطلبات', val: S.cur.orders, d: delta(S.cur.orders, S.prev.orders) },
              { label: 'قيمة المبيعات', val: S.cur.sales.toLocaleString('en-US') + ' د.ع', d: null },
              { label: 'المتابعون ⭐', val: S.cur.followers, d: null },
            ]

            const SRC_LABELS = {
              direct: '🔗 مباشر', internal: '🏠 من داخل المنصة', facebook: '📘 فيسبوك',
              instagram: '📸 انستغرام', tiktok: '🎵 تيك توك', whatsapp: '💬 واتساب',
              telegram: '✈️ تيليغرام', search: '🔍 محركات البحث', other: '🌐 أخرى',
            }
            const srcTotal = S.sources.reduce((s, [, n]) => s + n, 0) || 1

            const SERIES = [
              { id: 'store_view', label: 'زيارات', color: '#2563EB' },
              { id: 'product_view', label: 'مشاهدات', color: '#8B5CF6' },
              { id: 'whatsapp_click', label: 'واتساب', color: '#16A34A' },
              { id: 'order_created', label: 'طلبات', color: '#F59E0B' },
            ]
            const activeSeries = SERIES.filter((s) => chartOn[s.id])
            const maxY = Math.max(1, ...S.daily.flatMap((d) => activeSeries.map((s) => d[s.id])))
            const W = 600, H = 150, PAD = 8
            const xOf = (i) => S.daily.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (S.daily.length - 1)
            const yOf = (v) => H - PAD - (v / maxY) * (H - PAD * 2)

            return (
              <>
                {noData && (
                  <div className="sd-hint" style={{ marginBottom: 14 }}>
                    📣 لا توجد بيانات لهذه الفترة بعد — شارك رابط متجرك على السوشيال ميديا وستظهر الزيارات هنا فوراً
                  </div>
                )}

                {/* بطاقات المؤشرات */}
                <div className="sd-an-cards">
                  {CARDS.map((c) => (
                    <div key={c.label} className={`sd-an-card ${c.hot ? 'hot' : ''}`}>
                      <div className="sd-an-val">{c.val}</div>
                      <div className="sd-an-label">{c.label}</div>
                      {c.d !== null && c.d !== undefined ? (
                        <div className={`sd-an-delta ${c.d >= 0 ? 'up' : 'down'}`}>
                          {c.d >= 0 ? '↑' : '↓'} {Math.abs(c.d)}%
                          <span className="sd-an-vs"> عن الفترة السابقة</span>
                        </div>
                      ) : c.hint ? (
                        <div className="sd-an-vs">{c.hint}</div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* الرسم البياني */}
                <div className="sd-an-box">
                  <div className="sd-an-box-title">📈 الأداء اليومي</div>
                  <div className="sd-an-legend">
                    {SERIES.map((s) => (
                      <button key={s.id}
                        className={`sd-an-leg ${chartOn[s.id] ? 'on' : ''}`}
                        style={chartOn[s.id] ? { borderColor: s.color, color: s.color } : {}}
                        onClick={() => setChartOn({ ...chartOn, [s.id]: !chartOn[s.id] })}>
                        <span className="sd-an-dot" style={{ background: s.color }} /> {s.label}
                      </button>
                    ))}
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="sd-an-chart" preserveAspectRatio="none">
                    {[0.25, 0.5, 0.75].map((f) => (
                      <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="#f1f5f9" strokeWidth="1" />
                    ))}
                    {activeSeries.map((s) => (
                      <polyline key={s.id}
                        fill="none" stroke={s.color} strokeWidth="2.5"
                        strokeLinejoin="round" strokeLinecap="round"
                        points={S.daily.map((d, i) => `${xOf(i)},${yOf(d[s.id])}`).join(' ')} />
                    ))}
                  </svg>
                  <div className="sd-an-xaxis">
                    <span>{S.daily[0]?.day.slice(5)}</span>
                    <span>{S.daily[S.daily.length - 1]?.day.slice(5)}</span>
                  </div>
                </div>

                {/* أفضل المنتجات أداءً */}
                <div className="sd-an-box">
                  <div className="sd-an-box-title">🏆 أفضل المنتجات أداءً</div>
                  {S.topProducts.length === 0 ? (
                    <div className="sd-an-empty">لا توجد مشاهدات منتجات بهذه الفترة بعد</div>
                  ) : (
                    S.topProducts.map((t, i) => (
                      <div key={t.p.id} className="sd-an-toprow">
                        <span className="sd-an-rank">{i + 1}</span>
                        <div className="sd-item-img" style={{ width: 44, height: 44 }}>
                          {firstImg(t.p) ? <img src={firstImg(t.p)} alt="" /> : <span>🖼️</span>}
                        </div>
                        <div className="sd-an-topinfo">
                          <div className="sd-an-topname">{t.p.name}</div>
                          <div className="sd-an-topmeta">
                            👁 {t.views} مشاهدة · 💬 {t.wa} واتساب · تحويل {t.conv}% · 📦 متبقي {qtyOf(t.p)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* مصادر الزيارات */}
                <div className="sd-an-box">
                  <div className="sd-an-box-title">🧭 من أين يأتي زوارك؟</div>
                  {S.sources.length === 0 ? (
                    <div className="sd-an-empty">لا توجد زيارات بهذه الفترة بعد</div>
                  ) : (
                    S.sources.map(([src, n]) => (
                      <div key={src} className="sd-an-srcrow">
                        <span className="sd-an-srclabel">{SRC_LABELS[src] || src}</span>
                        <div className="sd-an-srcbar">
                          <div className="sd-an-srcfill" style={{ width: `${Math.round((n / srcTotal) * 100)}%` }} />
                        </div>
                        <span className="sd-an-srcnum">{n} ({Math.round((n / srcTotal) * 100)}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )
          })()}
        </div>
      ) : (
        /* ================= اللوحة الرئيسية ================= */
        <div className="sd-list-wrap">

          {/* ===== بطاقات الإحصائيات ===== */}
          <div className="sd-stats">
            <div className="sd-stat">
              <div className="sd-stat-num">{stats.total}</div>
              <div className="sd-stat-label">{isRealestate ? 'العقارات' : isService ? 'الخدمات' : 'المنتجات'}</div>
            </div>
            {trackStock && (
              <>
                <div className="sd-stat">
                  <div className="sd-stat-num">{stats.pieces}</div>
                  <div className="sd-stat-label">قطعة بالمخزون</div>
                </div>
                <div className={`sd-stat ${stats.low.length ? 'warn' : ''}`}>
                  <div className="sd-stat-num">{stats.low.length}</div>
                  <div className="sd-stat-label">قارب على النفاد</div>
                </div>
                <div className={`sd-stat ${stats.out.length ? 'danger' : ''}`}>
                  <div className="sd-stat-num">{stats.out.length}</div>
                  <div className="sd-stat-label">نفد من المخزون</div>
                </div>
              </>
            )}
          </div>

          {/* ===== تنبيه المخزون المنخفض ===== */}
          {trackStock && (stats.low.length > 0 || stats.out.length > 0) && (
            <div className="sd-alert">
              <div className="sd-alert-title">⚠️ انتبه لمخزونك</div>
              <div className="sd-alert-body">
                {stats.out.length > 0 && (
                  <span>🔴 نفد: {stats.out.map((p) => p.name).join('، ')}</span>
                )}
                {stats.low.length > 0 && (
                  <span>🟠 قارب على النفاد: {stats.low.map((p) => `${p.name} (${qtyOf(p)})`).join('، ')}</span>
                )}
              </div>
              <button className="sd-alert-btn" onClick={() => setStockFilter(stats.out.length ? 'out' : 'low')}>
                عرضها الآن ←
              </button>
            </div>
          )}

          <div className="sd-list-head">
            <h2>{isRealestate ? 'عقاراتي' : isService ? 'خدماتي' : 'منتجاتي'} ({products.length})</h2>
            <button className="sd-add" onClick={startAdd}>{addLabel}</button>
          </div>

          <input className="sd-input sd-search" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث بالاسم أو رقم SKU..." />

          {/* ===== فلترة المخزون ===== */}
          {trackStock && products.length > 0 && (
            <div className="sd-filters">
              <button className={`sd-filter ${stockFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStockFilter('all')}>الكل ({products.length})</button>
              <button className={`sd-filter warn ${stockFilter === 'low' ? 'active' : ''}`}
                onClick={() => setStockFilter('low')}>🟠 منخفض ({stats.low.length})</button>
              <button className={`sd-filter danger ${stockFilter === 'out' ? 'active' : ''}`}
                onClick={() => setStockFilter('out')}>🔴 نافد ({stats.out.length})</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="sd-state">
              {products.length === 0
                ? '📦 لا توجد منتجات — ابدأ بالإضافة!'
                : '🔍 لا توجد نتائج لهذا الفلتر'}
            </div>
          ) : (
            filtered.map((p) => {
              const qty = qtyOf(p)
              const thr = thresholdOf(p)
              const stockClass = qty === 0 ? 'out' : qty <= thr ? 'low' : 'ok'
              return (
                <div key={p.id} className={`sd-item ${trackStock ? stockClass : ''}`}>
                  <div className="sd-item-img">
                    {firstImg(p) ? <img src={firstImg(p)} alt="" /> : <span>🖼️</span>}
                  </div>
                  <div className="sd-item-info">
                    <div className="sd-item-name">
                      {p.name || p.title}
                      {p.sku && <span className="sd-item-sku"> {p.sku}#</span>}
                      {(() => {
                        let v = p.variants
                        try { if (typeof v === 'string') v = JSON.parse(v) } catch (e) { v = null }
                        const a = AUDIENCES.find((x) => x.id === v?.audience)
                        return a ? <span className="sd-badge-aud">{a.icon} {a.label}</span> : null
                      })()}
                      {trackStock && qty === 0 && <span className="sd-badge-out">نفد</span>}
                      {trackStock && qty > 0 && qty <= thr && <span className="sd-badge-low">منخفض</span>}
                    </div>
                    <div className="sd-item-price">
                      {p.hide_price
                        ? '🔒 السعر مخفي (واتساب)'
                        : `${Number(p.price || 0).toLocaleString('en-US')} ${p.currency === 'USD' ? '$' : 'د.ع'}`}
                    </div>
                  </div>

                  {/* ===== عداد المخزون ===== */}
                  {trackStock && (() => {
                    const thr = thresholdOf(p)
                    const v = getV(p)
                    const matrix = v.matrix || {}
                    const sizes = Array.isArray(v.sizes) ? v.sizes : []
                    if (sizes.length > 0) {
                      // بطاقات المقاسات القابلة للطي (قياس × لون)
                      return (
                        <div className="sd-matrix">
                          {sizes.map((size) => {
                            const rows = matrix[size] || []
                            const st = sizeTotal(matrix, v.sizeStock, size)
                            const cls = st === 0 ? 'out' : st <= thr ? 'low' : ''
                            const isOpen = !!expanded[p.id]?.[size]
                            const pickerOpen = colorPicker?.pid === p.id && colorPicker?.size === size
                            const usedNames = rows.map((c) => c.name)
                            return (
                              <div key={size} className={`sd-mx-card ${cls}`}>
                                {/* رأس البطاقة: القياس + الإجمالي — اضغط للتوسيع */}
                                <button className="sd-mx-head" onClick={() => toggleSizeCard(p.id, size)}>
                                  <span className="sd-mx-size">{size}</span>
                                  <span className={`sd-mx-total ${cls}`}>{st}</span>
                                  <span className="sd-mx-arrow">{isOpen ? '▲' : '▼'}</span>
                                </button>

                                {isOpen && (
                                  <div className="sd-mx-body">
                                    {/* صفوف الألوان */}
                                    {rows.map((c) => {
                                      const cq = Number(c.qty) || 0
                                      const cCls = cq === 0 ? 'out' : cq <= thr ? 'low' : 'ok'
                                      return (
                                        <div key={c.name} className="sd-mx-row">
                                          <span
                                            className="sd-mx-swatch"
                                            style={c.hex === 'linear'
                                              ? { background: 'linear-gradient(45deg,#f00,#ff0,#0f0,#00f)' }
                                              : { background: c.hex || '#888' }}
                                          />
                                          <span className="sd-mx-cname">{c.name}</span>
                                          <span className={`sd-mx-status ${cCls}`}>
                                            {cq === 0 ? 'نافد' : cq <= thr ? 'منخفض' : 'متوفر'}
                                          </span>
                                          <div className="sd-size-controls">
                                            <button
                                              disabled={savingQty === p.id || cq === 0}
                                              onClick={() => changeColorQty(p, size, c.name, -1)}
                                            >−</button>
                                            <span>{cq}</span>
                                            <button
                                              className="plus"
                                              disabled={savingQty === p.id}
                                              onClick={() => changeColorQty(p, size, c.name, +1)}
                                            >+</button>
                                          </div>
                                          <button
                                            className="sd-mx-del"
                                            onClick={() => removeColorFromSize(p, size, c.name)}
                                            title="حذف اللون من هذا القياس"
                                          >🗑️</button>
                                        </div>
                                      )
                                    })}

                                    {/* بدون ألوان: عداد المقاس الإجمالي القديم */}
                                    {rows.length === 0 && (
                                      <div className="sd-mx-row sd-mx-plain">
                                        <span className="sd-mx-cname">إجمالي المقاس (بدون تفصيل ألوان)</span>
                                        <div className="sd-size-controls">
                                          <button
                                            disabled={savingQty === p.id || st === 0}
                                            onClick={() => changeSizeQty(p, size, -1)}
                                          >−</button>
                                          <span>{st}</span>
                                          <button
                                            className="plus"
                                            disabled={savingQty === p.id}
                                            onClick={() => changeSizeQty(p, size, +1)}
                                          >+</button>
                                        </div>
                                      </div>
                                    )}

                                    {/* إضافة لون */}
                                    {pickerOpen ? (
                                      <div className="sd-mx-picker">
                                        <div className="sd-mx-picker-grid">
                                          {COLOR_LIST.filter((c) => !usedNames.includes(c.name)).map((c) => (
                                            <button key={c.name} className="sd-mx-pick"
                                              onClick={() => addColorToSize(p, size, c.name, c.hex)}>
                                              <span className="sd-mx-swatch"
                                                style={c.hex === 'linear'
                                                  ? { background: 'linear-gradient(45deg,#f00,#ff0,#0f0,#00f)' }
                                                  : { background: c.hex }} />
                                              {c.name}
                                            </button>
                                          ))}
                                        </div>
                                        {/* لون آخر مخصص */}
                                        <div className="sd-mx-custom">
                                          <input
                                            type="color"
                                            value={customColor.hex}
                                            onChange={(e) => setCustomColor({ ...customColor, hex: e.target.value })}
                                            className="sd-mx-colorpick"
                                          />
                                          <input
                                            className="sd-input sd-mx-custom-name"
                                            placeholder="لون آخر — اكتب اسمه"
                                            value={customColor.name}
                                            onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
                                          />
                                          <button
                                            className="sd-mx-add-custom"
                                            disabled={!customColor.name.trim()}
                                            onClick={() => addColorToSize(p, size, customColor.name.trim(), customColor.hex)}
                                          >إضافة</button>
                                        </div>
                                        <button className="sd-mx-cancel" onClick={() => setColorPicker(null)}>إلغاء</button>
                                      </div>
                                    ) : (
                                      <button
                                        className="sd-mx-addcolor"
                                        onClick={() => setColorPicker({ pid: p.id, size })}
                                      >+ إضافة لون</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                    // عداد إجمالي (منتج بدون مقاسات)
                    return (
                      <div className="sd-qty">
                        <button
                          className="sd-qty-btn"
                          disabled={savingQty === p.id || qty === 0}
                          onClick={() => changeQty(p, -1)}
                          title="بيع / إنقاص قطعة"
                        >−</button>
                        <span className={`sd-qty-num ${stockClass}`}>
                          {savingQty === p.id ? '⋯' : qty}
                        </span>
                        <button
                          className="sd-qty-btn plus"
                          disabled={savingQty === p.id}
                          onClick={() => changeQty(p, +1)}
                          title="إضافة قطعة للمخزون"
                        >+</button>
                      </div>
                    )
                  })()}

                  <div className="sd-item-actions">
                    <button onClick={() => startEdit(p)} title="تعديل">✏️</button>
                    <button onClick={() => remove(p)} title="حذف">🗑️</button>
                  </div>
                </div>
              )
            })
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
.sd-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sd-view-store {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(245,185,62,0.6);
  color: #F5B93E;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
}
.sd-edit-store { border-color: rgba(255,255,255,0.3); color: #e2e8f0; }
.sd-logout { background: none; border-color: rgba(255,255,255,0.25); color: #cbd5e1; }

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

/* ---- بطاقات الإحصائيات ---- */
.sd-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.sd-stat {
  background: #fff;
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(10,29,55,.07);
}
.sd-stat-num { font-size: 26px; font-weight: 800; color: #0A1D37; }
.sd-stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }
.sd-stat.warn .sd-stat-num { color: #d97706; }
.sd-stat.danger .sd-stat-num { color: #dc2626; }

/* ---- تنبيه المخزون ---- */
.sd-alert {
  background: #fffbeb;
  border: 1.5px solid #fbbf24;
  border-radius: 14px;
  padding: 13px 15px;
  margin-bottom: 14px;
}
.sd-alert-title { font-size: 14.5px; font-weight: 800; color: #92400e; }
.sd-alert-body {
  font-size: 13px; color: #78350f; margin-top: 6px;
  display: flex; flex-direction: column; gap: 4px; line-height: 1.7;
}
.sd-alert-btn {
  margin-top: 8px;
  background: #f59e0b; color: #fff;
  border: none; border-radius: 9px;
  padding: 7px 16px; font-size: 12.5px; font-weight: 800;
  cursor: pointer; font-family: inherit;
}

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
.sd-search { margin-bottom: 10px; }

/* ---- فلترة المخزون ---- */
.sd-filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.sd-filter {
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 999px; padding: 8px 15px;
  font-size: 13px; cursor: pointer; font-family: inherit;
  color: #334155; font-weight: 700;
}
.sd-filter.active { background: #0A1D37; border-color: #0A1D37; color: #F5B93E; }
.sd-filter.warn.active { background: #d97706; border-color: #d97706; color: #fff; }
.sd-filter.danger.active { background: #dc2626; border-color: #dc2626; color: #fff; }

/* ---- عناصر المنتجات ---- */
.sd-item {
  background: #fff; border-radius: 14px;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(10,29,55,.07);
  border-right: 4px solid transparent;
}
.sd-item.low { border-right-color: #f59e0b; }
.sd-item.out { border-right-color: #dc2626; }
.sd-item-img {
  width: 58px; height: 58px; border-radius: 11px;
  background: #f1f5f9; overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.sd-item-img img { width: 100%; height: 100%; object-fit: cover; }
.sd-item-info { flex: 1; min-width: 0; }
.sd-item-name {
  font-size: 14px; font-weight: 800; color: #0A1D37;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.sd-item-sku { color: #94a3b8; font-weight: 600; font-size: 11.5px; }
.sd-badge-out {
  background: #fee2e2; color: #dc2626;
  font-size: 10.5px; font-weight: 800;
  padding: 2px 9px; border-radius: 999px;
}
.sd-badge-low {
  background: #fef3c7; color: #b45309;
  font-size: 10.5px; font-weight: 800;
  padding: 2px 9px; border-radius: 999px;
}
.sd-badge-aud {
  background: #eff6ff; color: #1d4ed8;
  font-size: 10.5px; font-weight: 800;
  padding: 2px 9px; border-radius: 999px;
}

/* ---- المقاسات الرقمية (شبكة مضغوطة) ---- */
.sd-chips-nums { gap: 6px; }
.sd-chip-num { padding: 6px 0; min-width: 44px; text-align: center; font-size: 13px; }
.sd-item-price { font-size: 13px; color: #b48114; font-weight: 700; margin-top: 3px; }

/* ---- عداد الكمية ---- */
.sd-qty {
  display: flex; align-items: center; gap: 6px;
  background: #f8fafc; border-radius: 11px; padding: 5px 7px;
  flex-shrink: 0;
}

/* ---- مخزون المقاسات بالنموذج ---- */
.sd-sizestock {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 13px;
  padding: 13px;
  margin-top: 10px;
}
.sd-sizestock-title { font-size: 13px; font-weight: 800; color: #334155; margin-bottom: 10px; }
.sd-sizestock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
}
.sd-sizestock-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.sd-sizestock-size {
  background: #0A1D37; color: #F5B93E;
  font-size: 12.5px; font-weight: 800;
  padding: 3px 14px; border-radius: 999px;
}
.sd-sizestock-input { text-align: center; padding: 9px 6px; margin: 0; }
.sd-sizestock-total { font-size: 13px; color: #0A1D37; margin-top: 10px; }
.sd-sizestock-note { color: #94a3b8; font-size: 11.5px; }

/* ---- عدادات المقاسات بالقائمة ---- */
.sd-sizes-qty {
  display: flex; gap: 6px; flex-wrap: wrap;
  flex-shrink: 0; max-width: 300px;
  justify-content: flex-end;
}

/* ---- مصفوفة قياس × لون ---- */
.sd-matrix {
  display: flex; flex-direction: column; gap: 6px;
  flex-shrink: 0; width: 100%; max-width: 340px;
}
.sd-mx-card {
  border: 1.5px solid #e2e8f0; border-radius: 11px;
  background: #f8fafc; overflow: hidden;
}
.sd-mx-card.low { border-color: #f59e0b; }
.sd-mx-card.out { border-color: #fca5a5; }
.sd-mx-head {
  width: 100%; display: flex; align-items: center; gap: 8px;
  background: none; border: none; cursor: pointer;
  padding: 8px 12px; font-family: inherit;
}
.sd-mx-size {
  background: #0A1D37; color: #F5B93E;
  font-size: 12px; font-weight: 800;
  padding: 3px 12px; border-radius: 999px;
}
.sd-mx-total { font-size: 15px; font-weight: 800; color: #0A1D37; margin-right: auto; }
.sd-mx-total.low { color: #d97706; }
.sd-mx-total.out { color: #dc2626; }
.sd-mx-arrow { font-size: 10px; color: #94a3b8; }
.sd-mx-body { padding: 4px 10px 10px; background: #fff; }
.sd-mx-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 4px; border-bottom: 1px dashed #f1f5f9;
}
.sd-mx-row:last-of-type { border-bottom: none; }
.sd-mx-swatch {
  width: 20px; height: 20px; border-radius: 6px;
  border: 1.5px solid #e2e8f0; flex-shrink: 0;
}
.sd-mx-cname { font-size: 13px; font-weight: 700; color: #0A1D37; flex: 1; min-width: 0; }
.sd-mx-status {
  font-size: 10px; font-weight: 800;
  padding: 2px 8px; border-radius: 999px;
}
.sd-mx-status.ok  { background: #ecfdf5; color: #16a34a; }
.sd-mx-status.low { background: #fef3c7; color: #b45309; }
.sd-mx-status.out { background: #fee2e2; color: #dc2626; }
.sd-mx-del {
  background: none; border: none; font-size: 13px;
  cursor: pointer; padding: 2px; opacity: .7;
}
.sd-mx-plain .sd-mx-cname { color: #64748b; font-weight: 500; font-size: 12px; }
.sd-mx-addcolor {
  width: 100%; margin-top: 6px;
  background: #eff6ff; color: #1d4ed8;
  border: 1.5px dashed #93c5fd; border-radius: 9px;
  padding: 8px; font-size: 12.5px; font-weight: 800;
  cursor: pointer; font-family: inherit;
}
.sd-mx-picker { margin-top: 8px; }
.sd-mx-picker-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;
}
.sd-mx-pick {
  display: flex; align-items: center; gap: 7px;
  background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 9px; padding: 7px 9px;
  font-size: 12px; font-weight: 700; color: #0A1D37;
  cursor: pointer; font-family: inherit; text-align: right;
}
.sd-mx-pick:hover { border-color: #F5B93E; }
.sd-mx-custom { display: flex; gap: 6px; align-items: center; margin-top: 8px; }
.sd-mx-colorpick {
  width: 38px; height: 38px; border: 1.5px solid #e2e8f0;
  border-radius: 9px; padding: 2px; cursor: pointer; background: #fff;
}
.sd-mx-custom-name { flex: 1; margin: 0; padding: 9px 10px; font-size: 13px; }
.sd-mx-add-custom {
  background: #16a34a; color: #fff; border: none;
  border-radius: 9px; padding: 9px 14px;
  font-size: 12.5px; font-weight: 800; cursor: pointer; font-family: inherit;
}
.sd-mx-add-custom:disabled { opacity: .4; }
.sd-mx-cancel {
  width: 100%; margin-top: 6px;
  background: none; border: none; color: #94a3b8;
  font-size: 12px; cursor: pointer; font-family: inherit;
  text-decoration: underline;
}

/* ---- تنبيه الحفظ ---- */
.sd-toast {
  position: fixed; bottom: 24px; right: 50%;
  transform: translateX(50%);
  background: #0A1D37; color: #fff;
  padding: 11px 22px; border-radius: 999px;
  font-size: 13.5px; font-weight: 800;
  box-shadow: 0 8px 24px rgba(10,29,55,.35);
  z-index: 200;
  animation: sd-toast-in .2s ease;
}
@keyframes sd-toast-in {
  from { opacity: 0; transform: translateX(50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(50%) translateY(0); }
}

/* ---- التبويبات ---- */
.sd-tabs {
  max-width: 760px; margin: 16px auto 0; padding: 0 16px;
  display: flex; gap: 8px;
}
.sd-tab {
  flex: 1; background: #fff; border: 1.5px solid #e2e8f0;
  border-radius: 13px; padding: 12px;
  font-size: 14.5px; font-weight: 800; color: #64748b;
  cursor: pointer; font-family: inherit;
}
.sd-tab.active { background: #0A1D37; border-color: #0A1D37; color: #F5B93E; }

/* ---- بطاقات الإحصائيات ---- */
.sd-an-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px; margin-bottom: 14px;
}
.sd-an-card {
  background: #fff; border-radius: 14px;
  padding: 14px 12px; text-align: center;
  box-shadow: 0 1px 4px rgba(10,29,55,.07);
}
.sd-an-card.hot { border: 1.5px solid #16a34a; background: #f0fdf4; }
.sd-an-val { font-size: 22px; font-weight: 800; color: #0A1D37; }
.sd-an-label { font-size: 12px; color: #64748b; margin-top: 3px; }
.sd-an-delta { font-size: 11.5px; font-weight: 800; margin-top: 5px; }
.sd-an-delta.up { color: #16a34a; }
.sd-an-delta.down { color: #dc2626; }
.sd-an-vs { font-size: 10px; color: #94a3b8; font-weight: 500; }

/* ---- صناديق الأقسام ---- */
.sd-an-box {
  background: #fff; border-radius: 16px;
  padding: 15px; margin-bottom: 14px;
  box-shadow: 0 1px 4px rgba(10,29,55,.07);
}
.sd-an-box-title { font-size: 15px; font-weight: 800; color: #0A1D37; margin-bottom: 12px; }
.sd-an-empty { font-size: 13px; color: #94a3b8; text-align: center; padding: 16px 0; }

/* ---- الرسم البياني ---- */
.sd-an-legend { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.sd-an-leg {
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 999px; padding: 5px 12px;
  font-size: 12px; font-weight: 700; color: #94a3b8;
  cursor: pointer; font-family: inherit;
}
.sd-an-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.sd-an-leg:not(.on) .sd-an-dot { opacity: .3; }
.sd-an-chart { width: 100%; height: 150px; display: block; }
.sd-an-xaxis {
  display: flex; justify-content: space-between;
  font-size: 10.5px; color: #94a3b8; direction: ltr;
}

/* ---- أفضل المنتجات ---- */
.sd-an-toprow {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px dashed #f1f5f9;
}
.sd-an-toprow:last-child { border-bottom: none; }
.sd-an-rank {
  width: 24px; height: 24px; border-radius: 50%;
  background: #FFF8E8; color: #b45309;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.sd-an-topinfo { min-width: 0; }
.sd-an-topname { font-size: 13.5px; font-weight: 800; color: #0A1D37; }
.sd-an-topmeta { font-size: 11.5px; color: #64748b; margin-top: 2px; }

/* ---- مصادر الزيارات ---- */
.sd-an-srcrow { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.sd-an-srclabel { font-size: 12.5px; font-weight: 700; color: #334155; width: 140px; flex-shrink: 0; }
.sd-an-srcbar {
  flex: 1; height: 10px; background: #f1f5f9;
  border-radius: 999px; overflow: hidden;
}
.sd-an-srcfill { height: 100%; background: linear-gradient(90deg, #F5B93E, #d97706); border-radius: 999px; }
.sd-an-srcnum { font-size: 11.5px; color: #64748b; width: 70px; text-align: left; flex-shrink: 0; }
.sd-size-cell {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.sd-size-cell.low { border-color: #f59e0b; background: #fffbeb; }
.sd-size-cell.out { border-color: #fca5a5; background: #fef2f2; }
.sd-size-name { font-size: 10.5px; font-weight: 800; color: #64748b; }
.sd-size-cell.low .sd-size-name { color: #b45309; }
.sd-size-cell.out .sd-size-name { color: #dc2626; }
.sd-size-controls { display: flex; align-items: center; gap: 4px; }
.sd-size-controls button {
  width: 22px; height: 22px;
  border: 1px solid #e2e8f0; background: #fff;
  border-radius: 7px; font-size: 13px; font-weight: 800;
  color: #dc2626; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.sd-size-controls button.plus { color: #16a34a; }
.sd-size-controls button:disabled { opacity: .35; cursor: default; }
.sd-size-controls span {
  min-width: 20px; text-align: center;
  font-size: 13px; font-weight: 800; color: #0A1D37;
}
.sd-qty-btn {
  width: 32px; height: 32px;
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 9px; font-size: 17px; font-weight: 800;
  color: #dc2626; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
}
.sd-qty-btn.plus { color: #16a34a; }
.sd-qty-btn:disabled { opacity: .35; cursor: default; }
.sd-qty-num {
  min-width: 30px; text-align: center;
  font-size: 15.5px; font-weight: 800; color: #0A1D37;
}
.sd-qty-num.low { color: #d97706; }
.sd-qty-num.out { color: #dc2626; }

.sd-item-actions { display: flex; gap: 6px; flex-shrink: 0; }
.sd-item-actions button {
  background: #f1f5f9; border: none; border-radius: 9px;
  width: 36px; height: 36px; font-size: 15px; cursor: pointer;
}

/* ---- النموذج ---- */
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
