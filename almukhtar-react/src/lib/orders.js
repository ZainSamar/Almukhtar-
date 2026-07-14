import { supabase } from './supabase.js'
import { track } from './analytics.js'

// ================================================================
//  نظام الطلبات — منصة المختار
//  - سلة لكل متجر (localStorage — الزبون بدون حساب، مناسب للعراق)
//  - إرسال الطلب مع طابور أوفلاين: الإنترنت ضعيف؟ الطلب محفوظ ويُرسل تلقائياً
//  - رقم طلب فوري يظهر للزبون حتى قبل وصول الطلب للسيرفر
//  - ثلاثة أنواع: product (سلة) · service (حجز) · inspection (معاينة عقار)
// ================================================================

const CART_PREFIX = 'mk_cart_'
const ORDER_QUEUE = 'mk_order_queue'

// ----- رقم الطلب: قصير وسهل القراءة بالهاتف -----
export function makeOrderNumber() {
  const t = Date.now().toString(36).toUpperCase().slice(-6)
  const r = Math.random().toString(36).toUpperCase().slice(2, 4)
  return `MK-${t}${r}`
}

// ================= السلة =================
function cartKey(storeId) { return CART_PREFIX + storeId }

export function getCart(storeId) {
  try { return JSON.parse(localStorage.getItem(cartKey(storeId)) || '[]') } catch (e) { return [] }
}
function saveCart(storeId, items) {
  try { localStorage.setItem(cartKey(storeId), JSON.stringify(items)) } catch (e) { /* ignore */ }
}

// عنصر السلة: { productId, name, sku, img, price, currency, size, color, qty }
export function addToCart(storeId, item) {
  const items = getCart(storeId)
  // نفس المنتج بنفس القياس واللون → نزيد الكمية
  const same = items.find(
    (x) => x.productId === item.productId && x.size === item.size && x.color === item.color
  )
  if (same) same.qty += item.qty
  else items.push(item)
  saveCart(storeId, items)
  return items
}

export function updateCartQty(storeId, index, delta) {
  const items = getCart(storeId)
  if (!items[index]) return items
  items[index].qty = Math.max(1, items[index].qty + delta)
  saveCart(storeId, items)
  return items
}

export function removeFromCart(storeId, index) {
  const items = getCart(storeId)
  items.splice(index, 1)
  saveCart(storeId, items)
  return items
}

export function clearCart(storeId) {
  saveCart(storeId, [])
  return []
}

export function cartCount(items) {
  return items.reduce((s, x) => s + x.qty, 0)
}
export function cartTotal(items) {
  return items.reduce((s, x) => s + (Number(x.price) || 0) * x.qty, 0)
}

// ================= التحقق =================
export function validCustomer(c) {
  if (!c.name || c.name.trim().length < 2) return 'اكتب اسمك الكامل'
  const digits = (c.phone || '').replace(/[^0-9]/g, '')
  if (digits.length < 10 || digits.length > 15) return 'اكتب رقم هاتف صحيح (مثال: 07701234567)'
  if (!c.province) return 'اختر المحافظة'
  return null
}

// ================= الإرسال مع دعم الأوفلاين =================
function readQueue() {
  try { return JSON.parse(localStorage.getItem(ORDER_QUEUE) || '[]') } catch (e) { return [] }
}
function writeQueue(q) {
  try { localStorage.setItem(ORDER_QUEUE, JSON.stringify(q)) } catch (e) { /* ignore */ }
}

async function insertOrder(payload) {
  const { order, items } = payload
  const { error: e1 } = await supabase.from('store_orders').insert(order)
  if (e1) throw e1
  if (items.length) {
    const { error: e2 } = await supabase.from('store_order_items').insert(items)
    if (e2) throw e2
  }
  await supabase.from('order_events').insert({
    order_id: order.id, status: 'new', note: 'استلام الطلب',
  })
}

export async function flushOrderQueue() {
  const q = readQueue()
  if (!q.length) return
  const remaining = []
  for (const payload of q) {
    try { await insertOrder(payload) } catch (e) { remaining.push(payload) }
  }
  writeQueue(remaining)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOrderQueue)
  setTimeout(flushOrderQueue, 3000)
}

/**
 * إرسال طلب — يرجع فوراً برقم الطلب حتى لو الإنترنت مقطوع
 * type: 'product' | 'service' | 'inspection'
 * meta: للخدمات/المعاينة: { preferred_date, preferred_time }
 */
export async function submitOrder({ store, type = 'product', customer, items = [], meta = {} }) {
  const orderId = crypto.randomUUID
    ? crypto.randomUUID()
    : 'o_' + Date.now() + Math.random().toString(36).slice(2)
  const orderNumber = makeOrderNumber()
  const total = cartTotal(items)

  const order = {
    id: orderId,
    order_number: orderNumber,
    store_id: store.id,
    order_type: type,
    status: 'new',
    customer_name: customer.name.trim(),
    customer_phone: customer.phone.trim(),
    province: customer.province,
    area: (customer.area || '').trim() || null,
    address: (customer.address || '').trim() || null,
    notes: (customer.notes || '').trim() || null,
    items_total: total,
    currency: items[0]?.currency || 'IQD',
    meta,
  }
  const orderItems = items.map((x) => ({
    order_id: orderId,
    product_id: x.productId,
    product_name: x.name,
    sku: x.sku || null,
    size: x.size || null,
    color: x.color || null,
    qty: x.qty,
    unit_price: Number(x.price) || 0,
    currency: x.currency || 'IQD',
  }))

  const payload = { order, items: orderItems }
  try {
    await insertOrder(payload)
    track('order_created', { storeId: store.id, ownerId: store.owner_id })
    return { ok: true, queued: false, orderNumber }
  } catch (e) {
    // إنترنت ضعيف/مقطوع → نحفظ محلياً ويُرسل تلقائياً
    const q = readQueue()
    q.push(payload)
    writeQueue(q)
    return { ok: true, queued: true, orderNumber }
  }
}

// نص ملخص الطلب لإرساله واتساب للبائع (اختياري بعد النجاح)
export function orderWhatsappText(orderNumber, customer, items, total, type) {
  const lines = [`🧾 طلب جديد من المختار`, `رقم الطلب: ${orderNumber}`]
  if (type === 'service') lines.push('النوع: حجز خدمة')
  if (type === 'inspection') lines.push('النوع: طلب معاينة')
  lines.push(`الاسم: ${customer.name}`, `الهاتف: ${customer.phone}`, `المحافظة: ${customer.province}`)
  if (items.length) {
    lines.push('---')
    for (const x of items) {
      const opts = [x.size, x.color].filter(Boolean).join(' / ')
      lines.push(`• ${x.name}${opts ? ` (${opts})` : ''} × ${x.qty}`)
    }
    if (total > 0) lines.push(`الإجمالي: ${total.toLocaleString('en-US')} د.ع`)
  }
  return lines.join('\n')
}
