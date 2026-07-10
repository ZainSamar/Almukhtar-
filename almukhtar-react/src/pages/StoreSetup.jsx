import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// ================================================================
//  معالج إعداد المتجر — Store Setup Wizard
//  - يظهر تلقائياً للبائع الجديد قبل إضافة أي منتج
//  - 4 خطوات: الهوية ← الصور ← التواصل ← الموقع وساعات العمل
//  - الحقول الاختيارية قابلة للتخطي (الإعداد لا يتجاوز دقيقتين)
//  - نفس الصفحة تعمل كصفحة "تعديل معلومات المتجر" لاحقاً
// ================================================================

const STORAGE_BUCKET = 'product-images'

// نوع النشاط ← يحدد ثيم الواجهة تلقائياً (store_type)
const ACTIVITY_TYPES = [
  { id: 'fashion_store', label: 'متجر أزياء وملابس', icon: '👗', theme: 'fashion' },
  { id: 'beauty_store', label: 'مستحضرات تجميل وعناية', icon: '💄', theme: 'fashion' },
  { id: 'realestate_office', label: 'مكتب عقاري', icon: '🏠', theme: 'realestate' },
  { id: 'realestate_agent', label: 'دلال عقارات', icon: '🗝️', theme: 'realestate' },
  { id: 'electronics_store', label: 'متجر إلكترونيات', icon: '📱', theme: 'electronics' },
  { id: 'restaurant', label: 'مطعم', icon: '🍽️', theme: 'general' },
  { id: 'cafe', label: 'كافيه', icon: '☕', theme: 'general' },
  { id: 'pharmacy', label: 'صيدلية', icon: '💊', theme: 'general' },
  { id: 'clinic', label: 'عيادة / مركز طبي', icon: '🩺', theme: 'services' },
  { id: 'training', label: 'مركز تدريب', icon: '🎓', theme: 'services' },
  { id: 'service_provider', label: 'مزود خدمات', icon: '🛠️', theme: 'services' },
  { id: 'craftsman', label: 'حرفي', icon: '🔨', theme: 'services' },
  { id: 'home_business', label: 'مشروع منزلي', icon: '🏡', theme: 'general' },
  { id: 'wholesale', label: 'تاجر جملة', icon: '📦', theme: 'general' },
  { id: 'factory', label: 'مصنع', icon: '🏭', theme: 'general' },
  { id: 'company', label: 'شركة', icon: '🏢', theme: 'general' },
  { id: 'other', label: 'نشاط آخر', icon: '✨', theme: 'general' },
]

const PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء', 'كركوك', 'الأنبار',
  'ديالى', 'صلاح الدين', 'بابل', 'واسط', 'ذي قار', 'ميسان', 'المثنى',
  'القادسية', 'دهوك', 'السليمانية',
]

const SOCIAL_FIELDS = [
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'snapchat', label: 'Snapchat', icon: '👻' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'x', label: 'X (تويتر)', icon: '✖️' },
]

const WEEK_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

// توليد slug لاتيني من الاسم
function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/[\u0600-\u06FF]/g, '') // الأحرف العربية تُحذف — البائع يعدل يدوياً
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30) || 'store-' + Math.random().toString(36).slice(2, 7)
}

function compressImage(file, max = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height)
          width = Math.round(width * r); height = Math.round(height * r)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('fail'))), 'image/jpeg', 0.75)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob)
  })
}

export default function StoreSetup() {
  const [user, setUser] = useState(null)
  const [existingStore, setExistingStore] = useState(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  const [f, setF] = useState({
    name_ar: '', name_en: '', store_slug: '',
    activity_type: '', store_type: 'general',
    description: '', about: '', founded_year: '',
    logo: null, cover: null, // {dataUrl, blob} أو رابط نصي
    phone: '', whatsapp: '', email: '', website: '',
    socials: {},
    province: '', city: '', area: '', address: '', show_location: true,
    work_days: [], work_from: '09:00', work_to: '21:00',
  })

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)

    // إذا عنده متجر — نحمل بياناته للتعديل
    const { data: st } = await supabase
      .from('stores').select('*').eq('owner_id', user.id).maybeSingle()
    if (st) {
      setExistingStore(st)
      setF((prev) => ({
        ...prev,
        name_ar: st.name_ar || '', name_en: st.name_en || '',
        store_slug: st.store_slug || '',
        activity_type: st.activity_type || '',
        store_type: st.store_type || 'general',
        description: st.description || '', about: st.about || '',
        founded_year: st.founded_year || '',
        logo: st.logo_url || null, cover: st.cover_url || null,
        phone: st.phone || '', whatsapp: st.whatsapp || '',
        email: st.email || '', website: st.website || '',
        socials: st.socials || {},
        province: st.province || '', city: st.city || '',
        area: st.area || '', address: st.address || '',
        show_location: st.show_location !== false,
        work_days: st.working_hours?.days || [],
        work_from: st.working_hours?.from || '09:00',
        work_to: st.working_hours?.to || '21:00',
      }))
    }
    setLoading(false)
  }

  function set(k, v) { setF((prev) => ({ ...prev, [k]: v })) }

  function pickActivity(a) {
    setF((prev) => ({ ...prev, activity_type: a.id, store_type: a.theme }))
  }

  async function onPickImage(e, field) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const blob = await compressImage(file, field === 'cover' ? 1400 : 600)
      const dataUrl = await blobToDataURL(blob)
      set(field, { dataUrl, blob })
    } catch (err) { console.error(err) }
    e.target.value = ''
  }

  async function uploadOne(img, path) {
    if (!img) return null
    if (typeof img === 'string') return img // رابط موجود مسبقاً
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET).upload(path, img.blob, { contentType: 'image/jpeg', upsert: true })
      if (!error) {
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
        if (data?.publicUrl) return data.publicUrl
      }
    } catch (e) { /* fallback */ }
    return img.dataUrl // خطة بديلة: حفظ مضغوط داخل قاعدة البيانات
  }

  // ---- التحقق لكل خطوة ----
  function validateStep() {
    if (step === 0) {
      if (!f.name_ar.trim()) return 'اكتب اسم المتجر'
      if (!f.activity_type) return 'اختر نوع النشاط'
      if (!f.store_slug.trim() || !/^[a-z0-9-]{3,}$/.test(f.store_slug))
        return 'رابط المتجر: أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3 أحرف على الأقل)'
    }
    if (step === 2) {
      if (!f.whatsapp.trim() && !f.phone.trim())
        return 'أدخل رقم هاتف أو واتساب واحد على الأقل'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { setMsg({ type: 'err', text: err }); return }
    setMsg(null)
    setStep(step + 1)
  }

  async function finish() {
    const err = validateStep()
    if (err) { setMsg({ type: 'err', text: err }); return }
    setSaving(true)
    setMsg(null)
    try {
      // تفرد الرابط
      const { data: taken } = await supabase
        .from('stores').select('id').eq('store_slug', f.store_slug).maybeSingle()
      if (taken && taken.id !== existingStore?.id) {
        setMsg({ type: 'err', text: 'رابط المتجر مستخدم — جرب اسماً آخر' })
        setSaving(false); setStep(0)
        return
      }

      const logoUrl = await uploadOne(f.logo, `stores/${user.id}/logo.jpg`)
      const coverUrl = await uploadOne(f.cover, `stores/${user.id}/cover.jpg`)

      const row = {
        owner_id: user.id,
        name_ar: f.name_ar.trim(),
        name_en: f.name_en.trim() || f.name_ar.trim(),
        store_slug: f.store_slug.trim(),
        activity_type: f.activity_type,
        store_type: f.store_type,
        description: f.description.trim() || null,
        about: f.about.trim() || null,
        founded_year: f.founded_year || null,
        logo_url: logoUrl,
        cover_url: coverUrl,
        phone: f.phone.trim() || null,
        whatsapp: f.whatsapp.trim() || null,
        email: f.email.trim() || null,
        website: f.website.trim() || null,
        socials: f.socials,
        province: f.province || null,
        city: f.city.trim() || null,
        area: f.area.trim() || null,
        address: f.address.trim() || null,
        show_location: f.show_location,
        working_hours: { days: f.work_days, from: f.work_from, to: f.work_to },
        is_setup_complete: true,
      }

      let error
      if (existingStore) {
        ;({ error } = await supabase.from('stores').update(row).eq('id', existingStore.id))
      } else {
        ;({ error } = await supabase.from('stores').insert(row))
      }
      if (error) throw error

      setMsg({ type: 'ok', text: '🎉 تم حفظ متجرك بنجاح! جاري نقلك للوحة التحكم...' })
      setTimeout(() => { window.location.href = '/dashboard' }, 1200)
    } catch (err) {
      console.error(err)
      setMsg({ type: 'err', text: 'حدث خطأ: ' + (err.message || 'حاول مرة ثانية') })
    }
    setSaving(false)
  }

  const STEPS = ['هوية المتجر', 'الشعار والغلاف', 'التواصل', 'الموقع والدوام']

  if (loading) {
    return (
      <div dir="rtl" className="su-page"><style>{CSS}</style>
        <div className="su-state">⏳ جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="su-page">
      <style>{CSS}</style>

      <header className="su-header">
        <div className="su-header-title">
          {existingStore ? '✏️ تعديل معلومات المتجر' : '🏪 أنشئ متجرك في دقيقتين'}
        </div>
        <div className="su-header-sub">
          {existingStore ? 'حدّث بيانات متجرك في أي وقت' : 'خطوات بسيطة — والحقول الاختيارية تقدر تكملها لاحقاً'}
        </div>
      </header>

      {/* شريط التقدم */}
      <div className="su-steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`su-step ${i === step ? 'now' : ''} ${i < step ? 'done' : ''}`}>
            <span className="su-step-num">{i < step ? '✓' : i + 1}</span>
            <span className="su-step-label">{s}</span>
          </div>
        ))}
      </div>

      {msg && <div className={`su-msg ${msg.type}`}>{msg.text}</div>}

      <div className="su-card">

        {/* ============ الخطوة 1: هوية المتجر ============ */}
        {step === 0 && (
          <>
            <label className="su-label">اسم المتجر *</label>
            <input className="su-input" value={f.name_ar}
              onChange={(e) => {
                const v = e.target.value
                setF((p) => ({
                  ...p, name_ar: v,
                  store_slug: existingStore ? p.store_slug : makeSlug(p.name_en || v),
                }))
              }}
              placeholder="مثال: أزياء سمر" />

            <label className="su-label">الاسم بالإنجليزية (اختياري)</label>
            <input className="su-input" dir="ltr" value={f.name_en}
              onChange={(e) => {
                const v = e.target.value
                setF((p) => ({
                  ...p, name_en: v,
                  store_slug: existingStore ? p.store_slug : makeSlug(v || p.name_ar),
                }))
              }}
              placeholder="Azyaa Samar" />

            <label className="su-label">رابط متجرك *</label>
            <div className="su-slug-row" dir="ltr">
              <span className="su-slug-prefix">almukhtar.io/store/</span>
              <input className="su-input su-slug-input" value={f.store_slug}
                onChange={(e) => set('store_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="samar" />
            </div>

            <label className="su-label">نوع النشاط * <span className="su-hint-inline">(يحدد شكل واجهة متجرك تلقائياً)</span></label>
            <div className="su-acts">
              {ACTIVITY_TYPES.map((a) => (
                <button key={a.id} type="button"
                  className={`su-act ${f.activity_type === a.id ? 'active' : ''}`}
                  onClick={() => pickActivity(a)}>
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>

            <label className="su-label">وصف مختصر (يظهر تحت اسم المتجر)</label>
            <input className="su-input" value={f.description} maxLength={60}
              onChange={(e) => set('description', e.target.value)}
              placeholder="مثال: أناقة تليق بكِ" />

            <label className="su-label">نبذة تفصيلية عن النشاط (اختياري)</label>
            <textarea className="su-input" rows={3} value={f.about}
              onChange={(e) => set('about', e.target.value)}
              placeholder="من نحن، ماذا نقدم، ما يميزنا..." />

            <label className="su-label">سنة تأسيس النشاط (اختياري)</label>
            <input className="su-input" type="number" value={f.founded_year}
              onChange={(e) => set('founded_year', e.target.value)} placeholder="2020" />
          </>
        )}

        {/* ============ الخطوة 2: الشعار والغلاف ============ */}
        {step === 1 && (
          <>
            <label className="su-label">شعار المتجر (Logo) — اختياري</label>
            <div className="su-img-pick su-logo-pick">
              {f.logo
                ? <img src={typeof f.logo === 'string' ? f.logo : f.logo.dataUrl} alt="" />
                : <span>🏪</span>}
              <label className="su-img-btn">
                {f.logo ? 'تغيير الشعار' : 'رفع شعار'}
                <input type="file" accept="image/*" hidden onChange={(e) => onPickImage(e, 'logo')} />
              </label>
            </div>

            <label className="su-label">صورة الغلاف (Cover) — اختياري</label>
            <div className="su-img-pick su-cover-pick">
              {f.cover
                ? <img src={typeof f.cover === 'string' ? f.cover : f.cover.dataUrl} alt="" />
                : <span>🖼️ صورة عرضية تظهر أعلى صفحة متجرك</span>}
              <label className="su-img-btn">
                {f.cover ? 'تغيير الغلاف' : 'رفع غلاف'}
                <input type="file" accept="image/*" hidden onChange={(e) => onPickImage(e, 'cover')} />
              </label>
            </div>
            <div className="su-hint">💡 الصور تُضغط تلقائياً للتحميل السريع — تقدر تتخطى هذه الخطوة وتكملها لاحقاً</div>
          </>
        )}

        {/* ============ الخطوة 3: التواصل ============ */}
        {step === 2 && (
          <>
            <div className="su-row">
              <div style={{ flex: 1 }}>
                <label className="su-label">رقم الهاتف</label>
                <input className="su-input" dir="ltr" value={f.phone}
                  onChange={(e) => set('phone', e.target.value)} placeholder="07701234567" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="su-label">رقم واتساب *</label>
                <input className="su-input" dir="ltr" value={f.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value)} placeholder="9647701234567" />
              </div>
            </div>

            <label className="su-label">البريد الإلكتروني (اختياري)</label>
            <input className="su-input" dir="ltr" type="email" value={f.email}
              onChange={(e) => set('email', e.target.value)} placeholder="store@email.com" />

            <label className="su-label">الموقع الإلكتروني (اختياري)</label>
            <input className="su-input" dir="ltr" value={f.website}
              onChange={(e) => set('website', e.target.value)} placeholder="https://..." />

            <label className="su-label">صفحات التواصل الاجتماعي (اختياري)</label>
            {SOCIAL_FIELDS.map((s) => (
              <div key={s.id} className="su-social-row">
                <span className="su-social-icon">{s.icon}</span>
                <input className="su-input" dir="ltr"
                  value={f.socials[s.id] || ''}
                  onChange={(e) => set('socials', { ...f.socials, [s.id]: e.target.value })}
                  placeholder={`رابط ${s.label}`} />
              </div>
            ))}
          </>
        )}

        {/* ============ الخطوة 4: الموقع وساعات العمل ============ */}
        {step === 3 && (
          <>
            <div className="su-row">
              <div style={{ flex: 1 }}>
                <label className="su-label">المحافظة</label>
                <select className="su-input" value={f.province}
                  onChange={(e) => set('province', e.target.value)}>
                  <option value="">اختر...</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="su-label">المدينة</label>
                <input className="su-input" value={f.city}
                  onChange={(e) => set('city', e.target.value)} placeholder="مثال: الكرادة" />
              </div>
            </div>

            <label className="su-label">المنطقة</label>
            <input className="su-input" value={f.area}
              onChange={(e) => set('area', e.target.value)} placeholder="اسم المنطقة أو الحي" />

            <label className="su-label">العنوان التفصيلي (اختياري)</label>
            <input className="su-input" value={f.address}
              onChange={(e) => set('address', e.target.value)} placeholder="شارع، بناية، قرب..." />

            <label className="su-check">
              <input type="checkbox" checked={f.show_location}
                onChange={(e) => set('show_location', e.target.checked)} />
              إظهار الموقع للعملاء في صفحة المتجر
            </label>

            <label className="su-label" style={{ marginTop: 18 }}>أيام العمل</label>
            <div className="su-days">
              {WEEK_DAYS.map((d) => (
                <button key={d} type="button"
                  className={`su-day ${f.work_days.includes(d) ? 'active' : ''}`}
                  onClick={() => set('work_days',
                    f.work_days.includes(d)
                      ? f.work_days.filter((x) => x !== d)
                      : [...f.work_days, d]
                  )}>{d}</button>
              ))}
            </div>

            <div className="su-row">
              <div style={{ flex: 1 }}>
                <label className="su-label">من الساعة</label>
                <input className="su-input" type="time" value={f.work_from}
                  onChange={(e) => set('work_from', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="su-label">إلى الساعة</label>
                <input className="su-input" type="time" value={f.work_to}
                  onChange={(e) => set('work_to', e.target.value)} />
              </div>
            </div>
            <div className="su-hint">🕐 حالة "مفتوح الآن" ستظهر للزبائن تلقائياً حسب هذه الأوقات</div>
          </>
        )}

        {/* ============ أزرار التنقل ============ */}
        <div className="su-actions">
          {step > 0 && (
            <button className="su-back" onClick={() => { setMsg(null); setStep(step - 1) }}>
              → السابق
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="su-next" onClick={next}>التالي ←</button>
          ) : (
            <button className="su-next su-finish" onClick={finish} disabled={saving}>
              {saving ? '⏳ جاري الحفظ...' : existingStore ? '✔ حفظ التعديلات' : '🎉 إنشاء متجري'}
            </button>
          )}
        </div>

        {(step === 1 || step === 3) && step < STEPS.length - 1 && (
          <button className="su-skip" onClick={() => { setMsg(null); setStep(step + 1) }}>
            تخطي هذه الخطوة ↓
          </button>
        )}
      </div>
    </div>
  )
}

// ================= التنسيقات =================
const CSS = `
.su-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0A1D37 0%, #0A1D37 190px, #f6f7f9 190px);
  font-family: 'Tajawal', sans-serif;
  padding-bottom: 60px;
}
.su-state { text-align: center; padding: 60px 20px; color: #fff; font-size: 16px; }
.su-header { text-align: center; padding: 30px 20px 16px; }
.su-header-title { color: #F5B93E; font-size: 23px; font-weight: 800; }
.su-header-sub { color: #cbd5e1; font-size: 13.5px; margin-top: 5px; }

.su-steps {
  display: flex; justify-content: center; gap: 6px;
  padding: 0 14px; max-width: 620px; margin: 0 auto 14px;
}
.su-step {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
}
.su-step-num {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,255,255,.15); color: #cbd5e1;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
}
.su-step.now .su-step-num { background: #F5B93E; color: #111; }
.su-step.done .su-step-num { background: #16a34a; color: #fff; }
.su-step-label { font-size: 11px; color: #cbd5e1; text-align: center; }
.su-step.now .su-step-label { color: #F5B93E; font-weight: 800; }

.su-msg {
  max-width: 620px; margin: 0 auto 12px; padding: 12px 16px;
  border-radius: 12px; font-size: 14px; font-weight: 700;
}
.su-msg.ok  { background: #ecfdf5; color: #067647; border: 1px solid #a7f3d0; }
.su-msg.err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.su-card {
  max-width: 620px; margin: 0 auto; background: #fff;
  border-radius: 20px; padding: 20px;
  box-shadow: 0 4px 20px rgba(10,29,55,.15);
}
.su-label { display: block; font-size: 13.5px; font-weight: 800; color: #334155; margin: 14px 0 6px; }
.su-hint-inline { font-weight: 500; color: #94a3b8; font-size: 12px; }
.su-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px; border-radius: 11px;
  border: 1px solid #e2e8f0; background: #fff;
  font-size: 14.5px; font-family: inherit; outline: none;
}
.su-input:focus { border-color: #F5B93E; }
.su-row { display: flex; gap: 10px; }
.su-hint { font-size: 12.5px; color: #1d4ed8; background: #eff6ff; border-radius: 9px; padding: 9px 12px; margin-top: 14px; }

.su-slug-row { display: flex; align-items: center; gap: 0; }
.su-slug-prefix {
  background: #f1f5f9; border: 1px solid #e2e8f0; border-left: none;
  padding: 12px 12px; border-radius: 0 11px 11px 0;
  font-size: 13px; color: #64748b; white-space: nowrap;
}
.su-slug-input { border-radius: 11px 0 0 11px !important; }

.su-acts { display: flex; flex-wrap: wrap; gap: 8px; }
.su-act {
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 999px; padding: 9px 15px;
  font-size: 13.5px; cursor: pointer; font-family: inherit; color: #334155;
}
.su-act.active { background: #0A1D37; border-color: #0A1D37; color: #F5B93E; font-weight: 800; }

.su-img-pick {
  border: 2px dashed #cbd5e1; border-radius: 16px;
  background: #f8fafc; padding: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  text-align: center; color: #94a3b8; font-size: 13.5px;
}
.su-logo-pick img { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; }
.su-logo-pick span { font-size: 44px; }
.su-cover-pick img { width: 100%; max-height: 170px; border-radius: 12px; object-fit: cover; }
.su-img-btn {
  background: #0A1D37; color: #F5B93E;
  border-radius: 10px; padding: 9px 22px;
  font-size: 13.5px; font-weight: 800; cursor: pointer;
}

.su-social-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.su-social-icon { font-size: 20px; width: 28px; text-align: center; }

.su-check {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #334155; margin-top: 12px; cursor: pointer;
}
.su-check input { width: 18px; height: 18px; accent-color: #F5B93E; }

.su-days { display: flex; flex-wrap: wrap; gap: 8px; }
.su-day {
  border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 999px; padding: 8px 15px;
  font-size: 13.5px; cursor: pointer; font-family: inherit; color: #334155;
}
.su-day.active { background: #16a34a; border-color: #16a34a; color: #fff; font-weight: 800; }

.su-actions { display: flex; gap: 10px; margin-top: 22px; }
.su-next {
  flex: 1; background: #F5B93E; color: #111;
  border: none; border-radius: 12px; padding: 14px;
  font-size: 15.5px; font-weight: 800; cursor: pointer; font-family: inherit;
}
.su-finish { background: #16a34a; color: #fff; }
.su-finish:disabled { opacity: .6; }
.su-back {
  background: #f1f5f9; color: #334155;
  border: none; border-radius: 12px; padding: 14px 20px;
  font-size: 14.5px; font-weight: 700; cursor: pointer; font-family: inherit;
}
.su-skip {
  display: block; width: 100%; background: none; border: none;
  color: #94a3b8; font-size: 13px; cursor: pointer;
  font-family: inherit; margin-top: 12px; text-decoration: underline;
}
`
