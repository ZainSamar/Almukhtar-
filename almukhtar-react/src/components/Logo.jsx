export default function Logo({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
    >
      <svg width="110" height="28" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="3,26 55,3 107,26" stroke="#C9952A" strokeWidth="2" strokeLinejoin="round" fill="none" />
        <text x="55" y="21" textAnchor="middle" fontFamily="Georgia,serif" fontSize="8.5" fontWeight="bold" letterSpacing="2.5" fill="#C9952A">
          AL-MUKHTAR
        </text>
      </svg>
      <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
        المختار
      </div>
      <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 7.5, color: '#C9952A', letterSpacing: 1, marginTop: 1 }}>
        تجارتك في ايدك
      </div>
    </div>
  )
}
