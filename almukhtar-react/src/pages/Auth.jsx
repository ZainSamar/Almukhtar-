import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Nav ── */}
      <nav style={{
        background: 'var(--navy)', padding: '0 20px', height: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.25)'
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={navBtnGhost}>عربي | EN</button>
          <button style={navBtnOutline} onClick={() => navigate('/login')}>تسجيل الدخول</button>
          <button style={navBtnGold} onClick={() => navigate('/register')}>افتح متجرك</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1a3a7a 100%)',
        padding: '80px 5% 100px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(201,149,42,0.15)', border: '1px solid rgba(201,149,42,0.3)',
          color: 'var(--gold-light)', padding: '6px 16px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, marginBottom: 24
        }}>
          🇮🇶 منصتك لترتيب تجارتك
        </div>
        <h1 style={{
          fontSize: 'clamp(32px,6vw,64px)', fontWeight: 800, color: '#fff',
          lineHeight: 1.15, marginBottom: 20
        }}>
          افتح متجرك وبيع<br />
          <span style={{ color: 'var(--gold-light)' }}>بدون تعقيد</span>
        </h1>
        <p style={{
          fontSize: 17, color: 'rgba(255,255,255,0.75)', maxWidth: 560,
          margin: '0 auto 36px', lineHeight: 1.6
        }}>
          بدون خبرة تقنية. بدون رسوم مسبقة. شارك رابط متجرك على واتساب، إنستغرام، تيك توك، وفيسبوك — وابدأ البيع اليوم.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={heroPrimaryBtn} onClick={() => navigate('/register')}>افتح متجرك الآن ←</button>
          <button style={heroOutlineBtn} onClick={() => navigate('/store/demo')}>شاهد مثال على متجر</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '20px 5%', display: 'flex', justifyContent: 'center', gap: 50, flexWrap: 'wrap'
      }}>
        <Stat num="1,240+" label="بائع نشط" />
        <Stat num="8,900+" label="طلب مكتمل" />
        <Stat num="100%" label="الدفع عند الاستلام" />
      </div>

      {/* ── Features ── */}
      <div style={{ padding: '60px 5%', background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>لماذا المختار؟</h2>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>بُنيت خصيصاً للسوق العراقي</p>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          gap: 20, maxWidth: 1000, margin: '0 auto'
        }}>
          <Feature icon="🚀" title="10 دقائق للإطلاق" desc="أضف منتجاتك، خصص متجرك، وشارك الرابط." />
          <Feature icon="💵" title="الدفع عند الاستلام" desc="80% من المشترين يفضلون الدفع نقداً." />
          <Feature icon="📱" title="شارك في كل مكان" desc="واتساب، إنستغرام، تيك توك، وفيسبوك." />
          <Feature icon="📦" title="إدارة الطلبات" desc="تتبع كل طلب من الاستلام حتى التوصيل." />
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: 'var(--navy)', padding: '24px 5%', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <span style={{ color: 'var(--gold)', fontWeight: 800 }}>المختار</span> © 2025 — بغداد، العراق
        </p>
      </div>
    </div>
  )
}

function Stat({ num, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>{num}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 24
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}

const navBtnGhost = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
  color: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 600
}
const navBtnOutline = {
  background: 'rgba(255,255,255,0.12)', border: '1.5px solid #fff', color: '#fff',
  padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700
}
const navBtnGold = {
  background: 'var(--gold)', border: '2px solid #F5C842', color: '#fff',
  padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800
}
const heroPrimaryBtn = {
  background: 'var(--gold)', color: '#fff', padding: '16px 36px', borderRadius: 12,
  fontSize: 16, fontWeight: 800, border: '2px solid #F5C842', boxShadow: '0 4px 20px rgba(201,149,42,0.4)'
}
const heroOutlineBtn = {
  background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 36px', borderRadius: 12,
  fontSize: 16, fontWeight: 700, border: '2px solid rgba(255,255,255,0.7)'
}
