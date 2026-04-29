export const Icon = ({ name, size = 18, color = 'currentColor', style: extraStyle, ...rest }) => {
  const s = { width: size, height: size, display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...extraStyle }
  const p = { fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    chevronLeft:  <svg style={s} viewBox="0 0 24 24" {...p}><path d="M15 18l-6-6 6-6"/></svg>,
    chevronRight: <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 18l6-6-6-6"/></svg>,
    close:        <svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    menu:         <svg style={s} viewBox="0 0 24 24" {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
    drag:         <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="1.4" fill={color}/><circle cx="15" cy="7" r="1.4" fill={color}/><circle cx="9" cy="12" r="1.4" fill={color}/><circle cx="15" cy="12" r="1.4" fill={color}/><circle cx="9" cy="17" r="1.4" fill={color}/><circle cx="15" cy="17" r="1.4" fill={color}/></svg>,
    plus:         <svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 5v14M5 12h14"/></svg>,
    trash:        <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
    edit:         <svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    check:        <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 6L9 17l-5-5"/></svg>,
    undo:         <svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1021 12"/></svg>,
    copy:         <svg style={s} viewBox="0 0 24 24" {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    download:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    calendar:     <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    code:         <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    file:         <svg style={s} viewBox="0 0 24 24" {...p}><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
    image:        <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    paperclip:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
    video:        <svg style={s} viewBox="0 0 24 24" {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    globe:        <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    sun:          <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:         <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
    monitor:      <svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    expand:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>,
    x:            <svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  }
  return icons[name] || null
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
export const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7C8FFF"/>
        <stop offset="100%" stopColor="#4F6EF7"/>
      </linearGradient>
    </defs>
    {/* Background */}
    <rect width="40" height="40" rx="11" fill="url(#lg1)"/>
    {/* Quest mark: big ? */}
    <text x="8" y="30" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="26" fill="white" opacity="0.95">?</text>
    {/* Exclamation top-right accent */}
    <circle cx="32" cy="10" r="4" fill="white" opacity="0.25"/>
    <text x="30" y="14" fontFamily="sans-serif" fontWeight="900" fontSize="9" fill="white">!</text>
  </svg>
)

// ─── Legend icons with actual symbol inside ────────────────────────────────────
export const LegendIcon = ({ type, color }) => {
  const base = {
    width: 26, height: 26, borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  if (type === 'paid') return (
    <div style={{ ...base, background: color, border: `2px solid ${color}`, boxShadow: `0 2px 8px ${color}40` }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
  if (type === 'overdue') return (
    <div style={{ ...base, background: 'rgba(220,38,38,0.10)', border: '2px solid rgba(220,38,38,0.35)' }}>
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <line x1="10" y1="3" x2="10" y2="12" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="10" cy="16" r="1.5" fill="#EF4444"/>
      </svg>
    </div>
  )
  if (type === 'pending') return (
    <div style={{ ...base, background: 'var(--accent-bg)', border: '2px solid var(--accent)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
  )
  if (type === 'current') return (
    <div style={{ ...base, background: 'rgba(255,200,0,0.12)', border: '2px solid rgba(255,180,0,0.5)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
      </svg>
    </div>
  )
  return null
}
