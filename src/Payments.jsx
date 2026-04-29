import { useState, useEffect } from 'react'
import { payApi } from './api.js'
import { Icon, LegendIcon } from './icons.jsx'
import { T } from './i18n.js'

const CURRENCIES = ['RUB','USD','EUR','GBP','UAH','KZT']
const PALETTE    = ['#4F6EF7','#E05A8A','#22C55E','#F59E0B','#8B5CF6','#06B6D4','#EF4444','#F97316']
const SYM        = { RUB:'₽', USD:'$', EUR:'€', GBP:'£', UAH:'₴', KZT:'₸' }

const fmtAmt = (amount, currency) => {
  if (!amount) return ''
  return `${Number(amount).toLocaleString('ru')} ${SYM[currency] || currency}`
}

export default function Payments({ lang = 'ru' }) {
  const i = T[lang] || T.ru
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [showAdd, setShowAdd] = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState({ title:'', amount:'', currency:'RUB', day_of_month:1, color:'#4F6EF7' })

  useEffect(() => {
    payApi.getAll().then(setItems).catch(console.error).finally(() => setLoading(false))
  }, [])

  const sync  = item => setItems(p => p.some(x => x.id === item.id) ? p.map(x => x.id === item.id ? item : x) : [...p, item])
  const reset = () => setForm({ title:'', amount:'', currency:'RUB', day_of_month:1, color:'#4F6EF7' })

  const submitAdd = async () => {
    if (!form.title.trim()) return
    const item = await payApi.add({ ...form, amount: form.amount ? parseFloat(form.amount) : null, day_of_month: parseInt(form.day_of_month) })
    sync(item); reset(); setShowAdd(false)
  }
  const submitEdit = async () => {
    const item = await payApi.update(editId, { ...form, amount: form.amount ? parseFloat(form.amount) : null, day_of_month: parseInt(form.day_of_month) })
    sync(item); setEditId(null); reset()
  }
  const startEdit = item => {
    setForm({ title: item.title, amount: item.amount || '', currency: item.currency, day_of_month: item.day_of_month, color: item.color })
    setEditId(item.id); setShowAdd(false)
  }
  const remove = async id => { await payApi.remove(id); setItems(p => p.filter(x => x.id !== id)) }
  const toggle = async (item, month) => {
    const ex = item.checks?.find(c => c.year === year && c.month === month)
    const updated = await payApi.setCheck(item.id, year, month, !(ex?.paid))
    sync(updated)
  }

  const isPaid = (item, m) => !!(item.checks?.find(c => c.year === year && c.month === m)?.paid)

  // Per-currency totals for a specific month
  const monthTotals = (m) => {
    const map = {}
    items.forEach(it => {
      if (isPaid(it, m)) {
        const k = it.currency || 'RUB'
        map[k] = (map[k] || 0) + (it.amount || 0)
      }
    })
    return map
  }

  // Per-currency totals for the whole year
  const yearTotals = () => {
    const map = {}
    items.forEach(it => {
      const cnt = i.months.reduce((s, _, m) => s + (isPaid(it, m) ? 1 : 0), 0)
      if (cnt > 0 && it.amount) {
        const k = it.currency || 'RUB'
        map[k] = (map[k] || 0) + cnt * it.amount
      }
    })
    return map
  }

  const curM = new Date().getMonth()
  const curY = new Date().getFullYear()
  const today = new Date()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--text-3)', fontSize:14 }}>
      Загрузка…
    </div>
  )

  const yt = yearTotals()

  return (
    <div style={{ padding:'24px 20px 120px', maxWidth:1440, margin:'0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:-.3 }}>{i.payTitle}</h2>
          <div style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>
            {i.paySubtitle(items.length)}
            {Object.keys(yt).length > 0 && (
              <span style={{ marginLeft:8 }}>
                · {i.paidTotal}:{' '}
                {Object.entries(yt).map(([k,v], idx) => (
                  <span key={k} style={{ color:'var(--green)', fontWeight:700 }}>
                    {idx > 0 && ' + '}{v.toLocaleString('ru')} {SYM[k]||k}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
        <div style={{ flex:1 }} />

        {/* Year nav */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'5px 12px' }}>
          <button onClick={() => setYear(y => y-1)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center' }}>
            <Icon name="chevronLeft" size={18}/>
          </button>
          <span style={{ fontWeight:700, fontSize:15, minWidth:44, textAlign:'center' }}>{year}</span>
          <button onClick={() => setYear(y => y+1)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center' }}>
            <Icon name="chevronRight" size={18}/>
          </button>
        </div>

        <button className="btn btn-p" style={{ gap:6 }} onClick={() => { setShowAdd(v=>!v); setEditId(null); reset() }}>
          <Icon name="plus" size={14}/>{i.addPayment}
        </button>
      </div>

      {/* ── Form ── */}
      {(showAdd || editId) && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24, boxShadow:'var(--shadow-md)' }} className="fi">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:16 }}>{editId ? i.editPayment : i.newPayment}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <FL>{i.payName}</FL>
              <input className="inp" placeholder={i.payNamePh} value={form.title}
                onChange={e => setForm(f => ({ ...f, title:e.target.value }))} autoFocus/>
            </div>
            <div>
              <FL>{i.amount}</FL>
              <input className="inp" type="number" placeholder="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount:e.target.value }))}/>
            </div>
            <div>
              <FL>{i.currency}</FL>
              <select className="inp" value={form.currency} onChange={e => setForm(f => ({ ...f, currency:e.target.value }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c} {SYM[c]}</option>)}
              </select>
            </div>
            <div>
              <FL>{i.payDay}</FL>
              <input className="inp" type="number" min={1} max={31} value={form.day_of_month}
                onChange={e => setForm(f => ({ ...f, day_of_month:e.target.value }))}/>
            </div>
            <div>
              <FL>{i.colorLabel}</FL>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                {PALETTE.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color:c }))}
                    style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                      outline: form.color===c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset:2, transition:'outline .12s' }}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button className="btn btn-p" onClick={editId ? submitEdit : submitAdd}>{editId ? i.save : i.add}</button>
            <button className="btn btn-s" onClick={() => { setShowAdd(false); setEditId(null); reset() }}>{i.cancel}</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && (
        <div style={{ textAlign:'center', color:'var(--text-3)', padding:'80px 0', fontSize:15 }}>{i.noPayments}</div>
      )}

      {/* ── Table ── */}
      {items.length > 0 && (
        <div style={{ overflowX:'auto', borderRadius:16, boxShadow:'var(--shadow-sm)' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, background:'var(--surface)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)' }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                <th style={TH({ sticky:true, minW:180 })}>{i.payName}</th>
                <th style={TH({ center:true })}>День</th>
                {i.months.map((m, mi) => (
                  <th key={mi} style={TH({ center:true, accent: mi===curM && year===curY })}>{m}</th>
                ))}
                <th style={TH({ right:true })}>{i.amount}</th>
                <th style={TH({ w:64 })}/>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const paidCnt = i.months.reduce((s, _, m) => s + (isPaid(item, m) ? 1 : 0), 0)
                const paidSum = paidCnt * (item.amount || 0)
                return (
                  <tr key={item.id}
                    style={{ borderBottom: idx < items.length-1 ? '1px solid var(--border)' : 'none', transition:'background .1s' }}
                    onMouseOver={e => e.currentTarget.style.background='var(--surface2)'}
                    onMouseOut={e => e.currentTarget.style.background='transparent'}>

                    {/* Name */}
                    <td style={{ padding:'12px 18px', position:'sticky', left:0, background:'inherit', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:item.color, flexShrink:0, boxShadow:`0 0 6px ${item.color}60` }}/>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', whiteSpace:'nowrap' }}>{item.title}</div>
                          {item.amount && <div style={{ fontSize:12, color:'var(--text-3)', marginTop:1 }}>{fmtAmt(item.amount, item.currency)}/мес</div>}
                        </div>
                      </div>
                    </td>

                    {/* Day badge */}
                    <td style={{ textAlign:'center', padding:'12px 10px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                        width:28, height:28, borderRadius:8, fontSize:12, fontWeight:700,
                        background:`${item.color}18`, color:item.color }}>
                        {item.day_of_month}
                      </span>
                    </td>

                    {/* Month cells */}
                    {i.months.map((_, mi) => {
                      const paid       = isPaid(item, mi)
                      const isCurMonth = mi === curM && year === curY
                      const isPast     = year < curY || (year === curY && mi < curM)
                      // today is the payment day and not yet paid
                      const isDueToday = isCurMonth && today.getDate() === item.day_of_month && !paid
                      // current month but payment day hasn't arrived yet
                      const isUpcoming = isCurMonth && today.getDate() < item.day_of_month && !paid

                      let bg, border, shadow
                      if (paid)        { bg=item.color;                    border=`2px solid ${item.color}`;                 shadow=`0 2px 8px ${item.color}40` }
                      else if (isDueToday)  { bg='rgba(91,127,255,0.18)'; border='2px solid var(--accent)';              shadow='0 0 0 3px var(--accent-bg)' }
                      else if (isPast)      { bg='rgba(220,38,38,0.08)';  border='2px solid rgba(220,38,38,0.25)';       shadow='none' }
                      else if (isUpcoming)  { bg='rgba(245,158,11,0.10)'; border='2px solid rgba(245,158,11,0.35)';      shadow='none' }
                      else                  { bg='var(--surface2)';        border='2px solid var(--border)';             shadow='none' }

                      return (
                        <td key={mi} style={{ textAlign:'center', padding:'8px 4px',
                          background: isCurMonth ? 'var(--accent-bg)' : 'transparent' }}>
                          <div onClick={() => toggle(item, mi)}
                            style={{ width:30, height:30, borderRadius:8, margin:'0 auto',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              cursor:'pointer', transition:'all .15s', background:bg, border, boxShadow:shadow }}>
                            {paid ? (
                              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : isDueToday ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                            ) : isPast ? (
                              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                                <line x1="10" y1="3" x2="10" y2="12" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round"/>
                                <circle cx="10" cy="16" r="1.5" fill="#EF4444"/>
                              </svg>
                            ) : isUpcoming ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                              </svg>
                            ) : null}
                          </div>
                        </td>
                      )
                    })}

                    {/* Row total */}
                    <td style={{ padding:'12px 14px', textAlign:'right', whiteSpace:'nowrap' }}>
                      {paidCnt > 0
                        ? <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{fmtAmt(paidSum, item.currency)}</div>
                        : <div style={{ fontSize:13, color:'var(--text-4)' }}>—</div>}
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{paidCnt}{i.ofMonths}</div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding:'12px 8px', textAlign:'center' }}>
                      <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                        <button className="bdel" onClick={() => startEdit(item)} title={i.edit}
                          style={{ color:'var(--text-3)' }}
                          onMouseOver={e => e.currentTarget.style.color='var(--accent)'}
                          onMouseOut={e => e.currentTarget.style.color='var(--text-3)'}>
                          <Icon name="edit" size={14}/>
                        </button>
                        <button className="bdel" onClick={() => remove(item.id)}>
                          <Icon name="trash" size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Footer totals */}
            <tfoot>
              <tr style={{ background:'var(--surface2)', borderTop:'2px solid var(--border)' }}>
                <td style={{ padding:'11px 18px', fontSize:11, fontWeight:700, color:'var(--text-3)',
                  position:'sticky', left:0, background:'var(--surface2)',
                  textTransform:'uppercase', letterSpacing:.6 }}>{i.paidMonth}</td>
                <td/>
                {i.months.map((_, mi) => {
                  const mt = monthTotals(mi)
                  const isCurMonth = mi === curM && year === curY
                  const keys = Object.keys(mt)
                  return (
                    <td key={mi} style={{ textAlign:'center', padding:'10px 4px',
                      background: isCurMonth ? 'var(--accent-bg)' : 'transparent' }}>
                      {keys.length > 0
                        ? keys.map(k => (
                            <div key={k} style={{ fontSize:10, fontWeight:700, color:'var(--green)', lineHeight:1.4 }}>
                              {mt[k].toLocaleString('ru')} {SYM[k]||k}
                            </div>
                          ))
                        : <span style={{ fontSize:11, color:'var(--text-4)' }}>—</span>}
                    </td>
                  )
                })}
                <td style={{ padding:'11px 14px', textAlign:'right' }}>
                  {Object.entries(yt).map(([k,v]) => (
                    <div key={k} style={{ fontSize:12, fontWeight:800, color:'var(--green)' }}>
                      {v.toLocaleString('ru')} {SYM[k]||k}
                    </div>
                  ))}
                  {Object.keys(yt).length === 0 && <span style={{ color:'var(--text-4)', fontSize:12 }}>—</span>}
                </td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Legend ── */}
      {items.length > 0 && (
        <div style={{ display:'flex', gap:20, marginTop:18, flexWrap:'wrap', alignItems:'center' }}>
          <LegendRow type="paid"    color="#22C55E" label={i.legendPaid}/>
          <LegendRow type="overdue" color="#EF4444" label={i.legendOverdue}/>
          <LegendRow type="pending" color="var(--accent)" label={i.legendPending}/>
          <LegendRow type="current" color="#F59E0B" label={i.legendCurrent}/>
        </div>
      )}
    </div>
  )
}

function LegendRow({ type, color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)' }}>
      <LegendIcon type={type} color={color}/>
      <span>{label}</span>
    </div>
  )
}

function FL({ children }) {
  return <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', marginBottom:6, letterSpacing:.4 }}>{children}</div>
}

function TH({ sticky, center, right, accent, minW, w }) {
  return {
    padding: `12px ${center || right ? '6px' : '18px'}`,
    textAlign: right ? 'right' : center ? 'center' : 'left',
    fontSize: 11, fontWeight: 700,
    color: accent ? 'var(--accent)' : 'var(--text-3)',
    letterSpacing: .6, textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
    background: accent ? 'var(--accent-bg)' : 'transparent',
    position: sticky ? 'sticky' : 'static',
    left: sticky ? 0 : 'auto',
    zIndex: sticky ? 2 : 'auto',
    minWidth: minW,
    width: w,
    whiteSpace: 'nowrap',
  }
}
