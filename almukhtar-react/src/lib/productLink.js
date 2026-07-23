import { track } from './analytics.js'

// ================================================================
//  نظام روابط المنتجات الدائمة والمشاركة
//  الرابط: /p/{id}/{slug} — المعرف ثابت، الـ slug تجميلي قابل للتغيير
// ================================================================

export function slugify(name) {
  return (name || 'item')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40) || 'item'
}

// الرابط الدائم العام للمنتج
export function productUrl(p) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://almukhtar.io'
  return `${base}/p/${p.id}/${slugify(p.name || p.title)}`
}

// معرف التركيبة الحقيقي (ثابت وقابل للتتبع في الطلبات)
export function variantId(productId, size, colorName) {
  return `${productId}::${size || '-'}::${colorName || '-'}`
}

// نص المشاركة العربي المختصر
export function shareText(p, store) {
  const lines = [
    `شاهد هذا المنتج من متجر ${store?.name_ar || store?.name_en || ''} على منصة المختار:`,
    '',
    p.name || p.title || 'منتج',
  ]
  if (!p.hide_price && Number(p.price) > 0) {
    lines.push(`السعر: ${Number(p.price).toLocaleString('en-US')} د.ع`)
  }
  return lines.join('\n')
}

// روابط المشاركة اليدوية لكل منصة
export function shareLinks(url, text) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(text)
  const full = encodeURIComponent(`${text}\n\n${url}`)
  return {
    whatsapp: `https://wa.me/?text=${full}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  }
}

// رابط QR (يُولَّد عند الطلب — لا يُخزَّن)
export function qrUrl(url, size = 400) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(url)}`
}

// المشاركة: Web Share API أولاً، وإلا يرجع false ليُعرض البديل اليدوي
export async function nativeShare(p, store) {
  const url = productUrl(p)
  const text = shareText(p, store)
  track('product_share', { storeId: store?.id, productId: p.id, ownerId: null })
  if (navigator.share) {
    try {
      await navigator.share({ title: p.name || 'منتج', text, url })
      return true
    } catch (e) {
      // المستخدم ألغى — لا نعرض البديل
      if (e && e.name === 'AbortError') return true
      return false
    }
  }
  return false
}

export async function copyLink(p, store) {
  const url = productUrl(p)
  track('product_link_copied', { storeId: store?.id, productId: p.id, ownerId: null })
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch (e) {
    // بديل للمتصفحات القديمة
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  }
}
