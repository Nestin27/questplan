import { useState, useEffect } from 'react'
import { payApi } from './api.js'

const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
const MONTHS_FULL  = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const CURRENCIES   = ['RUB','USD','EUR','GBP','UAH','KZT']
const PALETTE      = ['#4F6EF7','#E05A8A','#22C55E','#F59E0B','#8B5CF6','#06B6D4','#EF4444','#F97316']

const fmt = (amount, currency) => {
  if (!amount) return ''
  const symbols = { RUB: '₽', USD: '$', EUR: '€', GBP: '£', UAH: '₴', KZT: '₸' }
  return `${Number(amount).toLocaleString('ru')} ${symbols[currency] || currency}`
}

export default function Payments() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [year, setYear]         = useState(new Date().getFullYear())
  const [showAdd, setShowAdd]   = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState({ title:'', amount:'', currency:'RUB', day_of_month:1, color:'#4F6EF7' })

  useEffect(() => {
    payApi.getAll().then(setItems).catch(console.error).finally(() => setLoading(false))
  }, [])

  const syncItem = item => setItems(p => p.some(x => x.id === item.id) ? p.map(x => x.id === item.id ? item : x) : [...p, item])

  const resetForm = () => setForm({ title:'', amount:'', currency:'RUB', day_of_month:1, color:'#4F6EF7' })

  const submitAdd = async () => {
    if (!form.title.trim()) return
    const item = await payApi.add({ ...form, amount: form.amount ? parseFloat(form.amount) : null, day_of_month: parseInt(form.day_of_month) })
    syncItem(item); resetForm(); setShowAdd(false)
  }

  const submitEdit = async () => {
    const item = await payApi.update(editId, { ...form, amount: form.amount ? parseFloat(form.amount) : null, day_of_month: parseInt(form.day_of_month) })
    syncItem(item); setEditId(null); resetForm()
  }

  const startEdit = item => {
    setForm({ title: item.title, amount: item.amount || '', currency: item.currency, day_of_month: item.day_of_month, color: item.color })
    setEditId(item.id); setShowAdd(false)
  }

  const removeItem = async id => {
    await payApi.remove(id)
    setItems(p => p.filter(x => x.id !== id))
  }

  const toggleCheck = async (item, month) => {
    const existing = item.checks?.find(c => c.year === year && c.month === month)
    const paid = !(existing?.paid)
    const updated = await payApi.setCheck(item.id, year, month, paid)
    syncItem(updated)
  }

  const isPaid = (item, month) => item.checks?.find(c => c.year === year && c.month === month)?.paid

  // Stats for the year
  const totalPerMonth = (month) => items.reduce((sum, item) => {
    return isPaid(item, month) ? sum + (item.amount || 0) : sum
  }, 0)

  const totalPaidYear = items.reduce((sum, item) => {
    const paidCount = MONTHS_SHORT.reduce((s, _, m) => s + (isPaid(item, m) ? 1 : 0), 0)
    return sum + paidCount * (item.amount || 0)
  }, 0)

  const currentMonth = new Date().getMonth()
  const currentYear  = new Date().getFullYear()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--text-3)', fontSize:14 }}>
      Загрузка…
    </div>
  )

  return (
    <div style={{ padding:'24px 20px 60px', maxWidth:1400, margin:'0 auto' }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:-.3 }}>Платёжный планировщик</h2>
          <div style={{ fontSize:13, color:'var(--text-3)', marginTop:3 }}>
            {items.length} платежей · оплачено за год: <span style={{ color:'var(--green)', fontWeight:700 }}>{totalPaidYear.toLocaleString('ru')} ₽</span>
          </div>
        </div>
        <div style={{ flex:1 }} />

        {/* Year switcher */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'6px 12px' }}>
          <button onClick={()=>setYear(y=>y-1)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:16, lineHeight:1, padding:'0 4px' }}>‹</button>
          <span style={{ fontWeight:700, fontSize:15, minWidth:44, textAlign:'center' }}>{year}</span>
          <button onClick={()=>setYear(y=>y+1)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:16, lineHeight:1, padding:'0 4px' }}>›</button>
        </div>

        <button className="btn btn-p" onClick={()=>{ setShowAdd(v=>!v); setEditId(null); resetForm() }}>
          + Платёж
        </button>
      </div>

      {/* Add / Edit form */}
      {(showAdd || editId) && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24, boxShadow:'var(--shadow-md)' }} className="fi">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:16 }}>
            {editId ? 'Редактировать платёж' : 'Новый платёж'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Label>Название</Label>
              <input className="inp" placeholder="Например: Аренда, Netflix, Страховка…" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus />
            </div>
            <div>
              <Label>Сумма</Label>
              <input className="inp" type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            </div>
            <div>
              <Label>Валюта</Label>
              <select className="inp" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>День платежа (число месяца)</Label>
              <input className="inp" type="number" min={1} max={31} value={form.day_of_month} onChange={e=>setForm(f=>({...f,day_of_month:e.target.value}))} />
            </div>
            <div>
              <Label>Цвет метки</Label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                {PALETTE.map(c => (
                  <div key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                    style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                      outline: form.color===c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset:2, transition:'outline .12s' }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button className="btn btn-p" onClick={editId ? submitEdit : submitAdd}>
              {editId ? 'Сохранить' : 'Добавить'}
            </button>
            <button className="btn btn-s" onClick={()=>{ setShowAdd(false); setEditId(null); resetForm() }}>Отмена</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && (
        <div style={{ textAlign:'center', color:'var(--text-3)', padding:'80px 0', fontSize:15 }}>
          Нет платежей — нажмите «+ Платёж» чтобы добавить
        </div>
      )}

      {items.length > 0 && (
        <div style={{ overflowX:'auto', borderRadius:16, boxShadow:'var(--shadow-sm)' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, background:'var(--surface)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)' }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                {/* Item name col */}
                <th style={{ padding:'12px 18px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-3)', letterSpacing:.8, textTransform:'uppercase', borderBottom:'1px solid var(--border)', position:'sticky', left:0, background:'var(--surface2)', zIndex:2, minWidth:180, whiteSpace:'nowrap' }}>
                  Платёж
                </th>
                <th style={{ padding:'12px 10px', fontSize:12, fontWeight:700, color:'var(--text-3)', letterSpacing:.6, textTransform:'uppercase', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', textAlign:'center' }}>
                  День
                </th>
                {MONTHS_SHORT.map((m, mi) => (
                  <th key={mi} style={{
                    padding:'12px 6px', fontSize:11, fontWeight:700, letterSpacing:.6, textTransform:'uppercase',
                    borderBottom:'1px solid var(--border)', textAlign:'center', minWidth:52, whiteSpace:'nowrap',
                    color: mi === currentMonth && year === currentYear ? 'var(--accent)' : 'var(--text-3)',
                    background: mi === currentMonth && year === currentYear ? 'var(--accent-bg)' : 'transparent',
                  }}>{m}</th>
                ))}
                <th style={{ padding:'12px 14px', fontSize:12, fontWeight:700, color:'var(--text-3)', letterSpacing:.6, textTransform:'uppercase', borderBottom:'1px solid var(--border)', textAlign:'right', whiteSpace:'nowrap' }}>
                  Итого
                </th>
                <th style={{ padding:'12px 10px', borderBottom:'1px solid var(--border)', width:60 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const paidCount = MONTHS_SHORT.reduce((s, _, m) => s + (isPaid(item, m) ? 1 : 0), 0)
                const paidTotal = paidCount * (item.amount || 0)
                return (
                  <tr key={item.id} style={{ borderBottom: idx < items.length-1 ? '1px solid var(--border)' : 'none' }}
                    onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    {/* Name */}
                    <td style={{ padding:'12px 18px', position:'sticky', left:0, background:'inherit', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:item.color, flexShrink:0, boxShadow:`0 0 6px ${item.color}60` }} />
                        <div>
                          <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', whiteSpace:'nowrap' }}>{item.title}</div>
                          {item.amount && <div style={{ fontSize:12, color:'var(--text-3)', marginTop:1 }}>{fmt(item.amount, item.currency)}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Day badge */}
                    <td style={{ textAlign:'center', padding:'12px 10px' }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        width:28, height:28, borderRadius:8, fontSize:12, fontWeight:700,
                        background:`${item.color}18`, color:item.color
                      }}>{item.day_of_month}</span>
                    </td>
                    {/* Month checkboxes */}
                    {MONTHS_SHORT.map((_, mi) => {
                      const paid = isPaid(item, mi)
                      const isCur = mi === currentMonth && year === currentYear
                      const isPast = year < currentYear || (year === currentYear && mi < currentMonth)
                      return (
                        <td key={mi} style={{
                          textAlign:'center', padding:'10px 6px',
                          background: isCur ? 'var(--accent-bg)' : 'transparent',
                        }}>
                          <div onClick={()=>toggleCheck(item, mi)}
                            style={{
                              width:30, height:30, borderRadius:8, margin:'0 auto',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              cursor:'pointer', transition:'all .15s',
                              background: paid ? item.color : isPast && !paid ? 'rgba(220,38,38,0.07)' : 'var(--surface2)',
                              border: paid ? `2px solid ${item.color}` : isPast && !paid ? '2px solid rgba(220,38,38,0.2)' : '2px solid var(--border)',
                              boxShadow: paid ? `0 2px 8px ${item.color}40` : 'none',
                            }}
                            title={paid ? 'Оплачено — нажмите чтобы отменить' : 'Нажмите чтобы отметить оплату'}
                          >
                            {paid
                              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : isPast && !paid
                                ? <span style={{ color:'var(--red)', fontSize:13, fontWeight:700 }}>!</span>
                                : null
                            }
                          </div>
                        </td>
                      )
                    })}
                    {/* Row total */}
                    <td style={{ padding:'12px 14px', textAlign:'right', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:13, fontWeight:700, color: paidCount > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                        {paidCount > 0 ? fmt(paidTotal, item.currency) : '—'}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{paidCount}/12 мес.</div>
                    </td>
                    {/* Actions */}
                    <td style={{ padding:'12px 10px', textAlign:'center' }}>
                      <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                        <button className="bdel" onClick={()=>startEdit(item)} title="Редактировать"
                          style={{ color:'var(--text-3)' }} onMouseOver={e=>e.currentTarget.style.color='var(--accent)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-3)'}>✏️</button>
                        <button className="bdel" onClick={()=>removeItem(item.id)} title="Удалить">×</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr style={{ background:'var(--surface2)', borderTop:'2px solid var(--border)' }}>
                <td style={{ padding:'11px 18px', fontSize:12, fontWeight:700, color:'var(--text-3)', position:'sticky', left:0, background:'var(--surface2)', textTransform:'uppercase', letterSpacing:.6 }}>Оплачено за месяц</td>
                <td />
                {MONTHS_SHORT.map((_, mi) => {
                  const total = totalPerMonth(mi)
                  const isCur = mi === currentMonth && year === currentYear
                  return (
                    <td key={mi} style={{ textAlign:'center', padding:'11px 4px', background: isCur ? 'var(--accent-bg)' : 'transparent' }}>
                      {total > 0
                        ? <span style={{ fontSize:11, fontWeight:700, color:'var(--green)' }}>{total.toLocaleString('ru')}</span>
                        : <span style={{ fontSize:11, color:'var(--text-4)' }}>—</span>}
                    </td>
                  )
                })}
                <td style={{ padding:'11px 14px', textAlign:'right' }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'var(--green)' }}>{totalPaidYear.toLocaleString('ru')} ₽</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Legend */}
      {items.length > 0 && (
        <div style={{ display:'flex', gap:20, marginTop:16, flexWrap:'wrap' }}>
          <Legend color="var(--green)" bg="var(--green-bg)">✓ Оплачено</Legend>
          <Legend color="var(--red)" bg="rgba(220,38,38,0.07)">! Просрочено</Legend>
          <Legend color="var(--text-3)" bg="var(--surface2)">Ожидается</Legend>
          <Legend color="var(--accent)" bg="var(--accent-bg)">Текущий месяц</Legend>
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', marginBottom:6, letterSpacing:.4 }}>{children}</div>
}

function Legend({ color, bg, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)' }}>
      <span style={{ width:20, height:20, borderRadius:6, background:bg, border:`2px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color }} />
      {children}
    </div>
  )
}
