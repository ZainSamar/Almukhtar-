// ================================================================
//  دالة معاينة روابط المنتجات — /p/{id}/{slug}
//  الزواحف (واتساب/فيسبوك/تيليغرام) تقرأ وسوم Open Graph من هنا
//  والبشر يُحوَّلون فوراً لصفحة المنتج داخل التطبيق /product/{id}
//  ملاحظة: مفتاح anon عام بطبيعته (منشور بكود الواجهة) — لا سر هنا
// ================================================================

const SUPABASE_URL = 'https://gxnwrgzwxjwmgmftauoq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bndyZ3p3eGp3bWdtZnRhdW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjcyNjUsImV4cCI6MjA5NzMwMzI2NX0.FJSPUlX45E7iScHZW8fVLlHOM5kMiLPg1wX8xFURhnM'
' // ← الصق مفتاح anon من src/lib/supabase.js

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function sb(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!r.ok) return null
  const j = await r.json()
  return Array.isArray(j) ? j[0] : j
}

export default async function handler(req, res) {
  // استخراج المعرف من المسار: /p/{id}/{slug?}
  const parts = (req.url || '').split('?')[0].split('/').filter(Boolean)
  const pid = parts[1] || ''

  let p = null, store = null
  if (pid) {
    p = await sb(`products?id=eq.${encodeURIComponent(pid)}&select=id,name,title,description,price,currency,hide_price,images,image_url,store_id&limit=1`)
    if (p?.store_id) {
      store = await sb(`stores?id=eq.${p.store_id}&select=name_ar,name_en,logo_url,cover_url&limit=1`)
    }
  }

  const name = p ? (p.name || p.title || 'منتج') : 'منتج على المختار'
  const storeName = store ? (store.name_ar || store.name_en || '') : ''
  const priceTxt = p && !p.hide_price && Number(p.price) > 0
    ? `السعر: ${Number(p.price).toLocaleString('en-US')} د.ع — `
    : ''
  const desc = `${priceTxt}${storeName ? `من متجر ${storeName} ` : ''}على منصة المختار 🇮🇶 — اطلب مباشرة والدفع عند الاستلام`

  // صورة المعاينة: أول صورة برابط عام http (صور base64 لا تصلح للزواحف)
  let ogImage = ''
  try {
    const imgs = Array.isArray(p?.images) ? p.images : JSON.parse(p?.images || '[]')
    ogImage = [...imgs, p?.image_url, store?.logo_url, store?.cover_url]
      .find((u) => typeof u === 'string' && u.startsWith('http')) || ''
  } catch (e) {
    ogImage = [p?.image_url, store?.logo_url].find((u) => typeof u === 'string' && u.startsWith('http')) || ''
  }

  const target = `/product/${esc(pid)}`
  const pageUrl = `https://almukhtar.io/p/${esc(pid)}`

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${esc(name)} | المختار</title>
<meta name="description" content="${esc(desc)}" />
src
<meta property="og:type" content="product" />
<meta property="og:title" content="${esc(name)}" />
<meta property="og:description" content="${esc(desc)}" />
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : ''}
<meta property="og:url" content="${pageUrl}" />
<meta property="og:site_name" content="المختار" />
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${esc(name)}" />
<meta name="twitter:description" content="${esc(desc)}" />
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}" />` : ''}
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script>location.replace(${JSON.stringify(target + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''))})</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding-top:60px;background:#fdfdfb">
<p>جاري فتح المنتج...</p>
<a href="${target}">اضغط هنا إن لم تُفتح الصفحة</a>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.status(200).send(html)
}
