import { supabase } from './supabase.js'

// ================================================================
//  نظام تتبع الأحداث — منصة المختار
//  - Session ID ثابت للزائر (زوار فريدون حقيقيون)
//  - منع تضخيم الأرقام: منع تكرار المشاهدة خلال 30 دقيقة + استبعاد صاحب المتجر
//  - مصدر الزيارة: UTM ثم الـ Referrer
//  - إرسال بالدفعات بالخلفية + تخزين مؤقت عند انقطاع الإنترنت
//  - لا يؤخر فتح الصفحة إطلاقاً (fire-and-forget)
// ================================================================

const SID_KEY = 'mk_session_id'
const DEDUPE_KEY = 'mk_ev_dedupe'
const QUEUE_KEY = 'mk_ev_queue'
const DEDUPE_TTL = 30 * 60 * 1000 // 30 دقيقة
const FLUSH_INTERVAL = 4000 // إرسال الدفعة كل 4 ثوانٍ

// ----- معرف الجلسة -----
function sessionId() {
  try {
    let sid = localStorage.getItem(SID_KEY)
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      localStorage.setItem(SID_KEY, sid)
    }
    return sid
  } catch (e) {
    return 's_anon'
  }
}

// ----- نوع الجهاز -----
function deviceType() {
  const w = window.innerWidth
  return w < 700 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop'
}

// ----- مصدر الزيارة (UTM ثم Referrer) -----
function detectSource() {
  try {
    const params = new URLSearchParams(window.location.search)
    const utm = params.get('utm_source')
    if (utm) return utm.toLowerCase()
    const ref = document.referrer
    if (!ref) return 'direct'
    const host = new URL(ref).hostname
    if (host === window.location.hostname) return 'internal'
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook'
    if (host.includes('instagram')) return 'instagram'
    if (host.includes('tiktok')) return 'tiktok'
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp'
    if (host.includes('t.me') || host.includes('telegram')) return 'telegram'
    if (host.includes('google') || host.includes('bing')) return 'search'
    return 'other'
  } catch (e) {
    return 'direct'
  }
}

// ----- استبعاد صاحب المتجر من أرقام متجره -----
let cachedUserId = undefined // undefined = لم يُجلب بعد، null = زائر
async function currentUserId() {
  if (cachedUserId !== undefined) return cachedUserId
  try {
    const { data: { user } } = await supabase.auth.getUser()
    cachedUserId = user?.id || null
  } catch (e) {
    cachedUserId = null
  }
  return cachedUserId
}

// ----- منع التكرار (نفس الحدث بنفس الجلسة خلال 30 دقيقة) -----
function isDuplicate(key) {
  try {
    const map = JSON.parse(localStorage.getItem(DEDUPE_KEY) || '{}')
    const now = Date.now()
    // تنظيف القديم
    for (const k of Object.keys(map)) if (now - map[k] > DEDUPE_TTL) delete map[k]
    if (map[key] && now - map[key] < DEDUPE_TTL) {
      localStorage.setItem(DEDUPE_KEY, JSON.stringify(map))
      return true
    }
    map[key] = now
    localStorage.setItem(DEDUPE_KEY, JSON.stringify(map))
    return false
  } catch (e) {
    return false
  }
}

// ----- طابور الإرسال (دفعات + أوفلاين) -----
function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch (e) { return [] }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200))) } catch (e) { /* ignore */ }
}

let flushing = false
async function flush() {
  if (flushing) return
  const q = readQueue()
  if (q.length === 0) return
  flushing = true
  try {
    const batch = q.slice(0, 25)
    const { error } = await supabase.from('analytics_events').insert(batch)
    if (!error) {
      writeQueue(q.slice(batch.length))
    }
  } catch (e) { /* تبقى بالطابور للمحاولة القادمة */ }
  flushing = false
}

let started = false
function ensureLoop() {
  if (started) return
  started = true
  setInterval(flush, FLUSH_INTERVAL)
  window.addEventListener('online', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

// ================================================================
//  الدالة الرئيسية — استدعِها ولا تنتظرها (لا await بمسار العرض)
//  track('store_view', { storeId, ownerId })
//  track('product_view', { storeId, productId, ownerId })
//  track('whatsapp_click' | 'phone_click' | 'store_share' | 'product_share' | ...)
// ================================================================
export function track(eventType, { storeId, productId = null, ownerId = null } = {}) {
  if (!storeId || !eventType) return
  ensureLoop()
  ;(async () => {
    try {
      // صاحب المتجر لا يُحسب بأرقام متجره
      const uid = await currentUserId()
      if (ownerId && uid && uid === ownerId) return

      // منع تكرار المشاهدات فقط (النقرات تُحسب كلها)
      if (eventType === 'store_view' || eventType === 'product_view') {
        const key = `${sessionId()}|${eventType}|${storeId}|${productId || ''}`
        if (isDuplicate(key)) return
      }

      const row = {
        store_id: storeId,
        product_id: productId,
        user_id: uid,
        session_id: sessionId(),
        event_type: eventType,
        source: detectSource(),
        device_type: deviceType(),
      }
      const q = readQueue()
      q.push(row)
      writeQueue(q)
    } catch (e) { /* التتبع لا يكسر الصفحة أبداً */ }
  })()
}
