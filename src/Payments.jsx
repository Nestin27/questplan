import { useState, useEffect } from 'react'
import { payApi } from './api.js'
import { Icon, LegendIcon } from './icons.jsx'
import { T } from './i18n.js'

const CURRENCIES = ['RUB','USD','EUR','GBP','UAH','KZT']
const PALETTE    = ['#4F6EF7','#E05A8A','#22C55E','#F59E0B','#8B5CF6','#06B6D4','#EF4444','#F97316']

const fmtAmt = (amount, currency) => {
  if (!amount) return ''
  const sym = { RUB:'₽', USD:'$', EUR:'€', GBP:'£', UAH:'₴', KZT:'₸' }
  return `${Number(amount).toLocaleString('ru')} ${sym[currency]||currency}`
}

export default function Payments({ lang = 'ru' }) {
  const i = T[lang] || T.ru
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear]       = useState(new Date().getFullYear())
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm]       = useState({ title:'', amount:'', currency:'RUB', day_of_month:1, color:'#4F6EF7' })

  useEffect(() => {
    payApi.getAll().then(setItems).catch(console.error).finally(() => setLoading(false))
  }, [])

  const sync  = item => setItems(p => p.some(x=>x.id===item.id)?p.map(x=>x.id===item.id?item:x):[...p,item])
  const reset = () => setForm({ title:'', amount:'', currency:'RUB', day_of_month:1, color:'#4F6EF7' })

  const submitAdd = async () => {
    if (!form.title.trim()) return
    const item = await payApi.add({ ...form, amount: form.amount?parseFloat(form.amount):null, day_of_month: parseInt(form.day_of_month) })
    sync(item); reset(); setShowAdd(false)
  }
  const submitEdit = async () => {
    const item = await payApi.update(editId, { ...form, amount: form.amount?parseFloat(form.amount):null, day_of_month: parseInt(form.day_of_month) })
    sync(item); setEditId(null); reset()
  }
  const startEdit = item => {
    setForm({ title:item.title, amount:item.amount||'', currency:item.currency, day_of_month:item.day_of_month, color:item.color })
    setEditId(item.id); setShowAdd(false)
  }
  const remove = async id => { await payApi.remove(id); setItems(p=>p.filter(x=>x.id!==id)) }
  const toggle = async (item, month) => {
    const ex = item.checks?.find(c=>c.year===year&&c.month===month)
    const updated = await payApi.setCheck(item.id, year, month, !(ex?.paid))
    sync(updated)
  }
  const isPaid  = (item, m) => item.checks?.find(c=>c.year===year&&c.month===m)?.paid
  const mTotal  = m => items.reduce((s,it) => isPaid(it,m)?s+(it.amount||0):s, 0)
  const yrTotal = items.reduce((s,it) => {
    const cnt = i.months.reduce((_,__,m)=>_+(isPaid(it,m)?1:0),0)
    return s + cnt*(it.amount||0)
  },0)

  const curM = new Date().getMonth()
  const curY = new Date().getFullYear()

  if (loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--text-3)',fontSize:14}}>
      Loading…
    </div>
  )

  return(
    <div style={{padding:'24px 20px 120px',maxWidth:1440,margin:'0 auto'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:'var(--text)',letterSpacing:-.3}}>{i.payTitle}</h2>
          <div style={{fontSize:13,color:'var(--text-3)',marginTop:3}}
            dangerouslySetInnerHTML={{__html: i.paySubtitle(items.length, `<span style="color:var(--green);font-weight:700">${fmtAmt(yrTotal,'RUB')}</span>`)}}/>
        </div>
        <div style={{flex:1}}/>
        {/* Year nav */}
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'5px 12px'}}>
          <button onClick={()=>setYear(y=>y-1)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex',alignItems:'center',padding:'0 2px'}}>
            <Icon name="chevronLeft" size={18}/>
          </button>
          <span style={{fontWeight:700,fontSize:15,minWidth:44,textAlign:'center'}}>{year}</span>
          <button onClick={()=>setYear(y=>y+1)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex',alignItems:'center',padding:'0 2px'}}>
            <Icon name="chevronRight" size={18}/>
          </button>
        </div>
        <button className="btn btn-p" style={{gap:6}} onClick={()=>{setShowAdd(v=>!v);setEditId(null);reset()}}>
          <Icon name="plus" size={14}/>{i.addPayment}
        </button>
      </div>

      {/* Form */}
      {(showAdd||editId)&&(
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,marginBottom:24,boxShadow:'var(--shadow-md)'}} className="fi">
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:16}}>{editId?i.editPayment:i.newPayment}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{gridColumn:'1/-1'}}>
              <FL>{i.payName}</FL>
              <input className="inp" placeholder={i.payNamePh} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus/>
            </div>
            <div><FL>{i.amount}</FL><input className="inp" type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
            <div><FL>{i.currency}</FL>
              <select className="inp" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><FL>{i.payDay}</FL><input className="inp" type="number" min={1} max={31} value={form.day_of_month} onChange={e=>setForm(f=>({...f,day_of_month:e.target.value}))}/></div>
            <div>
              <FL>{i.colorLabel}</FL>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}}>
                {PALETTE.map(c=>(
                  <div key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                    style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',
                      outline:form.color===c?`3px solid ${c}`:'3px solid transparent',outlineOffset:2,transition:'outline .12s'}}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button className="btn btn-p" onClick={editId?submitEdit:submitAdd}>{editId?i.save:i.add}</button>
            <button className="btn btn-s" onClick={()=>{setShowAdd(false);setEditId(null);reset()}}>{i.cancel}</button>
          </div>
        </div>
      )}

      {items.length===0&&!showAdd&&(
        <div style={{textAlign:'center',color:'var(--text-3)',padding:'80px 0',fontSize:15}}>{i.noPayments}</div>
      )}

      {/* Table */}
      {items.length>0&&(
        <div style={{overflowX:'auto',borderRadius:16,boxShadow:'var(--shadow-sm)'}}>
          <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,background:'var(--surface)',borderRadius:16,overflow:'hidden',border:'1px solid var(--border)'}}>
            <thead>
              <tr style={{background:'var(--surface2)'}}>
                <th style={TH({sticky:true,minW:180})}>{i.payName}</th>
                <th style={TH({center:true})}>{i.payDay}</th>
                {i.months.map((m,mi)=>(
                  <th key={mi} style={TH({center:true,accent:mi===curM&&year===curY})}>
                    {m}
                  </th>
                ))}
                <th style={TH({right:true})}>{i.amount}</th>
                <th style={TH({w:64})}/>
              </tr>
            </thead>
            <tbody>
              {items.map((item,idx)=>{
                const paidCnt = i.months.reduce((s,_,m)=>s+(isPaid(item,m)?1:0),0)
                const paidSum = paidCnt*(item.amount||0)
                return(
                  <tr key={item.id} style={{borderBottom:idx<items.length-1?'1px solid var(--border)':'none',transition:'background .1s'}}
                    onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    {/* Name */}
                    <td style={{padding:'12px 18px',position:'sticky',left:0,background:'inherit',zIndex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{width:10,height:10,borderRadius:'50%',background:item.color,flexShrink:0,boxShadow:`0 0 6px ${item.color}60`}}/>
                        <div>
                          <div style={{fontWeight:600,fontSize:14,color:'var(--text)',whiteSpace:'nowrap'}}>{item.title}</div>
                          {item.amount&&<div style={{fontSize:12,color:'var(--text-3)',marginTop:1}}>{fmtAmt(item.amount,item.currency)}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Day */}
                    <td style={{textAlign:'center',padding:'12px 10px'}}>
                      <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,fontSize:12,fontWeight:700,background:`${item.color}18`,color:item.color}}>
                        {item.day_of_month}
                      </span>
                    </td>
                    {/* Month cells */}
                    {i.months.map((_,mi)=>{
                      const paid   = isPaid(item,mi)
                      const isCur  = mi===curM&&year===curY
                      const isPast = year<curY||(year===curY&&mi<curM)
                      return(
                        <td key={mi} style={{textAlign:'center',padding:'8px 4px',background:isCur?'var(--accent-bg)':'transparent'}}>
                          <div onClick={()=>toggle(item,mi)}
                            style={{width:30,height:30,borderRadius:8,margin:'0 auto',display:'flex',alignItems:'center',
                              justifyContent:'center',cursor:'pointer',transition:'all .15s',
                              background:paid?item.color:isPast&&!paid?'rgba(220,38,38,0.07)':'var(--surface2)',
                              border:paid?`2px solid ${item.color}`:isPast&&!paid?'2px solid rgba(220,38,38,0.2)':'2px solid var(--border)',
                              boxShadow:paid?`0 2px 8px ${item.color}40`:'none'}}
                            title={paid?'Оплачено':'Отметить оплату'}>
                            {paid
                              ?<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              :isPast&&!paid
                                ?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="14"/><circle cx="12" cy="18.5" r="1.3" fill="#EF4444" stroke="none"/></svg>
                                :null}
                          </div>
                        </td>
                      )
                    })}
                    {/* Total */}
                    <td style={{padding:'12px 14px',textAlign:'right',whiteSpace:'nowrap'}}>
                      <div style={{fontSize:13,fontWeight:700,color:paidCnt>0?'var(--green)':'var(--text-3)'}}>
                        {paidCnt>0?fmtAmt(paidSum,item.currency):'—'}
                      </div>
                      <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{paidCnt}{i.ofMonths}</div>
                    </td>
                    {/* Actions */}
                    <td style={{padding:'12px 8px',textAlign:'center'}}>
                      <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                        <button className="bdel" onClick={()=>startEdit(item)} title={i.edit}
                          style={{color:'var(--text-3)'}} onMouseOver={e=>e.currentTarget.style.color='var(--accent)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-3)'}>
                          <Icon name="edit" size={14}/>
                        </button>
                        <button className="bdel" onClick={()=>remove(item.id)}><Icon name="trash" size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Footer */}
            <tfoot>
              <tr style={{background:'var(--surface2)',borderTop:'2px solid var(--border)'}}>
                <td style={{padding:'11px 18px',fontSize:12,fontWeight:700,color:'var(--text-3)',position:'sticky',left:0,background:'var(--surface2)',textTransform:'uppercase',letterSpacing:.5}}>{i.paidMonth}</td>
                <td/>
                {i.months.map((_,mi)=>{
                  const total=mTotal(mi), isCur=mi===curM&&year===curY
                  return(
                    <td key={mi} style={{textAlign:'center',padding:'11px 4px',background:isCur?'var(--accent-bg)':'transparent'}}>
                      {total>0
                        ?<span style={{fontSize:11,fontWeight:700,color:'var(--green)'}}>{total.toLocaleString('ru')}</span>
                        :<span style={{fontSize:11,color:'var(--text-4)'}}>—</span>}
                    </td>
                  )
                })}
                <td style={{padding:'11px 14px',textAlign:'right'}}>
                  <span style={{fontSize:13,fontWeight:800,color:'var(--green)'}}>{yrTotal.toLocaleString('ru')} ₽</span>
                </td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Legend */}
      {items.length>0&&(
        <div style={{display:'flex',gap:20,marginTop:18,flexWrap:'wrap',alignItems:'center'}}>
          <LegendRow type="paid"    color="#22C55E" label={i.legendPaid}/>
          <LegendRow type="overdue" color="#EF4444" label={i.legendOverdue}/>
          <LegendRow type="pending" color="var(--text-3)" label={i.legendPending}/>
          <LegendRow type="current" color="var(--accent)" label={i.legendCurrent}/>
        </div>
      )}
    </div>
  )
}

function LegendRow({ type, color, label }) {
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--text-3)'}}>
      <LegendIcon type={type} color={color}/>
      <span>{label}</span>
    </div>
  )
}

function FL({ children }) {
  return <div style={{fontSize:12,fontWeight:600,color:'var(--text-3)',marginBottom:6,letterSpacing:.4}}>{children}</div>
}

function TH({ sticky, center, right, accent, minW, w }) {
  return {
    padding: '12px ' + (center||right?'6px':'18px'),
    textAlign: right?'right':center?'center':'left',
    fontSize: 11, fontWeight: 700, color: accent?'var(--accent)':'var(--text-3)',
    letterSpacing: .6, textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
    background: accent ? 'var(--accent-bg)' : 'transparent',
    position: sticky ? 'sticky' : 'static',
    left: sticky ? 0 : 'auto',
    zIndex: sticky ? 2 : 'auto',
    minWidth: minW || undefined,
    width: w || undefined,
    whiteSpace: 'nowrap',
  }
}
