import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState('seller')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [agreed, setAgreed] = useState(false)

  const formatPhone = (p) => {
    const clean = p.replace(/\D/g, '')
    if (clean.startsWith('07')) return '+964' + clean.slice(1)
    if (clean.startsWith('964')) return '+' + clean
    return '+964' + clean
  }

  const sendOTP = async () => {
    if (!phone || phone.length < 10) { setError('أدخل رقم هاتف صحيح'); return }
    if (tab === 'register' && !name.trim()) { setError('أدخل اسمك الكامل'); return }
    if (tab === 'register' && !agreed) { setError('يجب الموافقة على الشروط والأحكام'); return }
    setLoading(true); setError('')
    try {
      await supabase.auth.signInWithOtp({ phone: formatPhone(phone) })
    } catch(e) {}
    setStep(2); setLoading(false)
  }

  const verifyOTP = async () => {
    if (!otp || otp.length < 4) { setError('أدخل رمز التحقق'); return }
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone), token: otp, type: 'sms'
      })
      if (error) throw error
      if (tab === 'register') {
        await supabase.from('users').upsert({
          id: data.user.id, phone: formatPhone(phone),
          name, role, phone_verified: true
        })
        if (role === 'seller') {
          const slug = name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now().toString().slice(-4)
          await supabase.from('stores').insert({
            owner_id: data.user.id, store_slug: slug,
            name_ar: `متجر ${name}`, name_en: `${name}'s Store`
          })
        }
      }
      navigate(role === 'seller' ? '/seller' : '/store/demo')
    } catch(e) {
      if (otp.length >= 4) { navigate(role === 'seller' ? '/seller' : '/store/demo') }
      else { setError('رمز خاطئ، حاول مرة ثانية') }
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0D1B3E 0%,#1B3060 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:24,padding:'36px 28px',width:'100%',maxWidth:420,boxShadow:'0 8px 40px rgba(0,0,0,0.2)'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <svg width="110" height="28" viewBox="0 0 110 28" fill="none">
            <polyline points="3,26 55,3 107,26" stroke="#C9952A" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <text x="55" y="21" textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fontWeight="bold" letterSpacing="2" fill="#C9952A">AL-MUKHTAR</text>
          </svg>
          <div style={{fontSize:20,fontWeight:900,color:'#0D1B3E',lineHeight:1,marginTop:2,fontFamily:'Cairo,sans-serif'}}>المختار</div>
          <div style={{fontSize:10,color:'#C9952A',marginTop:2,fontFamily:'Cairo,sans-serif'}}>تجارتك في ايدك</div>
        </div>

        {/* Tabs */}
        {step === 1 && (
          <div style={{display:'flex',border:'1.5px solid #E8E4DC',borderRadius:10,overflow:'hidden',marginBottom:24}}>
            {['login','register'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1,padding:'10px',fontSize:14,fontWeight:700,border:'none',
                cursor:'pointer',fontFamily:'Cairo,sans-serif',
                background: tab===t ? '#0D1B3E' : 'transparent',
                color: tab===t ? '#fff' : '#7A7A8C'
              }}>{t==='login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</button>
            ))}
          </div>
        )}

        {step === 1 && (
          <>
            {/* Role */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {[
                { id:'seller', title:'بائع', desc:'أدر متجرك', icon: (
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                    <path d="M4 20 L24 6 L44 20" stroke="#C9952A" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                    <rect x="6" y="20" width="36" height="24" rx="1" fill="#FFF8E7" stroke="#C9952A" strokeWidth="1.5"/>
                    <path d="M19 44 L19 30 Q19 27 22 27 L26 27 Q29 27 29 30 L29 44" fill="#C9952A" opacity="0.3" stroke="#C9952A" strokeWidth="1.2"/>
                    <rect x="9" y="24" width="8" height="8" rx="1" fill="none" stroke="#C9952A" strokeWidth="1.2"/>
                    <rect x="31" y="24" width="8" height="8" rx="1" fill="none" stroke="#C9952A" strokeWidth="1.2"/>
                  </svg>
                )},
                { id:'buyer', title:'مشتري', desc:'تسوق الآن', icon: (
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                    <path d="M8 18 L10 42 Q10 44 12 44 L36 44 Q38 44 38 42 L40 18 Z" fill="#FFF8E7" stroke="#C9952A" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M17 18 Q17 8 24 8 Q31 8 31 18" stroke="#C9952A" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <rect x="21" y="6" width="6" height="4" rx="2" fill="#C9952A" opacity="0.4"/>
                  </svg>
                )}
              ].map(r => (
                <div key={r.id} onClick={() => setRole(r.id)} style={{
                  border: `2px solid ${role===r.id ? '#C9952A' : '#E8E4DC'}`,
                  borderRadius:12,padding:'14px 8px',textAlign:'center',
                  cursor:'pointer',background: role===r.id ? '#FFF8E7' : '#FAFAF7'
                }}>
                  <div style={{marginBottom:6}}>{r.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#0D1B3E',fontFamily:'Cairo,sans-serif'}}>{r.title}</div>
                  <div style={{fontSize:11,color:'#7A7A8C',fontFamily:'Cairo,sans-serif'}}>{r.desc}</div>
                </div>
              ))}
            </div>

            {tab === 'register' && (
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0D1B3E',marginBottom:6,fontFamily:'Cairo,sans-serif'}}>الاسم الكامل *</label>
                <input style={{width:'100%',padding:'11px 14px',border:'1.5px solid #E8E4DC',borderRadius:10,fontSize:14,fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}}
                  type="text" placeholder="أدخل اسمك الكامل" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
            )}

            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0D1B3E',marginBottom:6,fontFamily:'Cairo,sans-serif'}}>رقم الهاتف *</label>
              <input style={{width:'100%',padding:'11px 14px',border:'1.5px solid #E8E4DC',borderRadius:10,fontSize:14,outline:'none',direction:'ltr',letterSpacing:1,boxSizing:'border-box'}}
                type="tel" placeholder="07X XXXX XXXX" value={phone} onChange={e=>setPhone(e.target.value)}/>
              <small style={{fontSize:11,color:'#7A7A8C',fontFamily:'Cairo,sans-serif'}}>سنرسل لك رمز تحقق على هذا الرقم</small>
            </div>

            {tab === 'register' && (
              <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:16,padding:'12px',background:'#FFF8E7',borderRadius:10,border:'1px solid #C9952A'}}>
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}
                  style={{width:18,height:18,marginTop:2,accentColor:'#C9952A',cursor:'pointer',flexShrink:0}}/>
                <label style={{fontSize:12,color:'#0D1B3E',fontFamily:'Cairo,sans-serif',cursor:'pointer',lineHeight:1.5}}>
                  أوافق على <span style={{color:'#C9952A',fontWeight:700,cursor:'pointer'}} onClick={()=>navigate('/terms')}>شروط الخدمة وعقد الاشتراك</span> الخاص بمنصة المختار
                </label>
              </div>
            )}

            {error && <div style={{background:'#FDE8E8',color:'#B22222',padding:'10px 14px',borderRadius:10,fontSize:13,marginBottom:14,fontWeight:600,fontFamily:'Cairo,sans-serif'}}>{error}</div>}

            <button onClick={sendOTP} disabled={loading} style={{
              width:'100%',background:'#C9952A',color:'#fff',border:'none',borderRadius:12,
              padding:14,fontSize:15,fontWeight:800,cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1,fontFamily:'Cairo,sans-serif',boxShadow:'0 4px 16px rgba(201,149,42,0.3)'
            }}>{loading ? '...' : 'إرسال رمز التحقق →'}</button>

            <button onClick={()=>navigate('/')} style={{
              width:'100%',background:'transparent',color:'#7A7A8C',border:'none',
              padding:12,fontSize:13,cursor:'pointer',marginTop:8,fontFamily:'Cairo,sans-serif'
            }}>← العودة للرئيسية</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:48,marginBottom:12}}>📱</div>
              <h2 style={{fontSize:18,fontWeight:800,color:'#0D1B3E',marginBottom:8,fontFamily:'Cairo,sans-serif'}}>أدخل رمز التحقق</h2>
              <p style={{fontSize:13,color:'#7A7A8C',fontFamily:'Cairo,sans-serif',lineHeight:1.5}}>
                أرسلنا رمز SMS إلى<br/>
                <strong style={{color:'#0D1B3E',direction:'ltr',display:'inline-block'}}>{formatPhone(phone)}</strong>
              </p>
            </div>

            <div style={{marginBottom:16}}>
              <input style={{
                width:'100%',padding:14,border:'1.5px solid #E8E4DC',borderRadius:10,
                fontSize:24,fontWeight:800,textAlign:'center',letterSpacing:8,
                outline:'none',boxSizing:'border-box'
              }} type="number" placeholder="● ● ● ● ● ●" value={otp}
                onChange={e=>setOtp(e.target.value)} maxLength={6}/>
            </div>

            <div style={{background:'#FFF8E7',border:'1px solid #C9952A',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#C75B00',marginBottom:16,textAlign:'center',fontFamily:'Cairo,sans-serif'}}>
              🧪 للتجربة الحين: أدخل أي 6 أرقام
            </div>

            {error && <div style={{background:'#FDE8E8',color:'#B22222',padding:'10px 14px',borderRadius:10,fontSize:13,marginBottom:14,fontWeight:600,fontFamily:'Cairo,sans-serif'}}>{error}</div>}

            <button onClick={verifyOTP} disabled={loading} style={{
              width:'100%',background:'#C9952A',color:'#fff',border:'none',borderRadius:12,
              padding:14,fontSize:15,fontWeight:800,cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1,fontFamily:'Cairo,sans-serif',boxShadow:'0 4px 16px rgba(201,149,42,0.3)'
            }}>{loading ? '...' : 'تأكيد الدخول ✓'}</button>

            <button onClick={()=>{setStep(1);setOtp('');setError('')}} style={{
              width:'100%',background:'transparent',color:'#7A7A8C',border:'none',
              padding:12,fontSize:13,cursor:'pointer',marginTop:8,fontFamily:'Cairo,sans-serif'
            }}>← تغيير رقم الهاتف</button>
          </>
        )}
      </div>
    </div>
  )
}
