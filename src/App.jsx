import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { api } from './api.js'
import Payments from './Payments.jsx'
import { Icon, Logo } from './icons.jsx'
import { T, LANGS } from './i18n.js'

// ─── Lang context ─────────────────────────────────────────────────────────────
export const LangCtx = createContext('ru')
export const useLang = () => { const l = useContext(LangCtx); return T[l] || T.ru }

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT_ALL = {
  ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
  de: ['Mo','Di','Mi','Do','Fr','Sa','So'],
  zh: ['一','二','三','四','五','六','日'],
}
const MONTHS_ALL = {
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
}
const MONTHS_GEN_ALL = {
  ru: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
}
const CODE_LANGS = ['javascript','typescript','python','rust','go','java','c','cpp','csharp','php','ruby','swift','kotlin','sql','bash','html','css','json','yaml','dockerfile']

function getWeekDates(base) {
  const d = new Date(base), dow = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x })
}
const dkey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const todayKey = dkey(new Date())
const fmtBytes = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

// ─── Themes ───────────────────────────────────────────────────────────────────
const themes = {
  light: {
    '--bg':'#F5F6FA','--surface':'#FFFFFF','--surface2':'#EEF0F8','--surface3':'#E4E7F2',
    '--border':'rgba(30,40,100,0.08)','--border-med':'rgba(30,40,100,0.15)',
    '--text':'#111827','--text-2':'#4B5563','--text-3':'#9CA3AF','--text-4':'#D1D5DB',
    '--accent':'#4F6EF7','--accent-bg':'rgba(79,110,247,0.09)','--accent-text':'#3451C7',
    '--green':'#16A34A','--green-bg':'rgba(22,163,74,0.09)',
    '--red':'#DC2626','--today-bg':'rgba(79,110,247,0.06)','--today-border':'#4F6EF7',
    '--weekend-bg':'rgba(0,0,0,0.015)','--header-bg':'#FFFFFF',
    '--shadow-sm':'0 1px 3px rgba(0,0,0,0.07)','--shadow-md':'0 4px 16px rgba(0,0,0,0.10)',
    '--shadow-lg':'0 8px 32px rgba(0,0,0,0.14)','--panel-shadow':'-2px 0 20px rgba(0,0,0,0.10)',
    '--code-bg':'#1E1E2E','--code-text':'#CDD6F4',
  },
  dark: {
    '--bg':'#0D1017','--surface':'#161B27','--surface2':'#1C2235','--surface3':'#232840',
    '--border':'rgba(255,255,255,0.07)','--border-med':'rgba(255,255,255,0.13)',
    '--text':'#E8EAF6','--text-2':'#8892B0','--text-3':'#4A5275','--text-4':'#272D45',
    '--accent':'#5B7FFF','--accent-bg':'rgba(91,127,255,0.13)','--accent-text':'#8BABFF',
    '--green':'#22C55E','--green-bg':'rgba(34,197,94,0.12)',
    '--red':'#F87171','--today-bg':'rgba(91,127,255,0.11)','--today-border':'#5B7FFF',
    '--weekend-bg':'rgba(255,255,255,0.015)','--header-bg':'#111520',
    '--shadow-sm':'0 1px 3px rgba(0,0,0,0.3)','--shadow-md':'0 4px 16px rgba(0,0,0,0.4)',
    '--shadow-lg':'0 8px 32px rgba(0,0,0,0.5)','--panel-shadow':'-2px 0 20px rgba(0,0,0,0.4)',
    '--code-bg':'#11111B','--code-text':'#CDD6F4',
  }
}
const resolveTheme = k => k==='system'?(window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'):k

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]         = useState(() => localStorage.getItem('qp_lang') || 'ru')
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('qp_theme') || 'system')
  const resolved = resolveTheme(themeMode)
  const Th = themes[resolved]
  const i  = T[lang] || T.ru

  const DAYS_SHORT = DAYS_SHORT_ALL[lang] || DAYS_SHORT_ALL.ru
  const MONTHS     = MONTHS_ALL[lang]     || MONTHS_ALL.ru
  const MONTHS_GEN = MONTHS_GEN_ALL[lang] || MONTHS_GEN_ALL.ru

  useEffect(() => {
    Object.entries(Th).forEach(([k,v]) => document.documentElement.style.setProperty(k,v))
    document.body.style.background = Th['--bg']
    localStorage.setItem('qp_theme', themeMode)
  }, [Th, themeMode])

  useEffect(() => { localStorage.setItem('qp_lang', lang) }, [lang])

  const [tasks,  setTasks]   = useState([])
  const [notes,  setNotes]   = useState([])
  const [loading,setLoading] = useState(true)
  const [tab,    setTab]     = useState('planner')
  const [weekBase, setWeekBase] = useState(new Date())
  const weekDates = getWeekDates(weekBase)
  const [panel,    setPanel]    = useState(null)
  const [expanded, setExpanded] = useState(null)
  const dragging = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => {
    Promise.all([api.getTasks(), api.getNotes()])
      .then(([t,n]) => { setTasks(t); setNotes(n) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const syncTask = t => setTasks(p => p.some(x=>x.id===t.id)?p.map(x=>x.id===t.id?t:x):[...p,t])
  const addTask    = async(title,dk) => { const t=await api.addTask(title,dk); syncTask(t) }
  const toggleTask = async(id,done)  => { const t=await api.updateTask(id,{done}); syncTask(t) }
  const deleteTask = async id        => { await api.deleteTask(id); setTasks(p=>p.filter(t=>t.id!==id)) }
  const assignDk   = async(id,dk)    => { const t=await api.updateTask(id,{date_key:dk}); syncTask(t) }
  const unassignDk = async id        => { const t=await api.updateTask(id,{date_key:null}); syncTask(t) }
  const addSub     = async(tid,title)=> { const t=await api.addSubtask(tid,title); syncTask(t) }
  const toggleSub  = async(tid,sid,done)=>{ const t=await api.toggleSubtask(tid,sid,done); syncTask(t) }
  const deleteSub  = async(tid,sid)  => { const t=await api.deleteSubtask(tid,sid); syncTask(t) }
  const addTNote   = async(tid,text) => { const t=await api.addTaskNote(tid,text); syncTask(t) }
  const delTNote   = async(tid,nid)  => { const t=await api.deleteTaskNote(tid,nid); syncTask(t) }

  const syncNote   = n => setNotes(p => p.some(x=>x.id===n.id)?p.map(x=>x.id===n.id?n:x):[n,...p])
  const addNote    = async title => { const n=await api.addNote(title); syncNote(n); return n }
  const updateNote = async(id,p) => { const n=await api.updateNote(id,p); syncNote(n) }
  const deleteNote = async id    => { await api.deleteNote(id); setNotes(p=>p.filter(n=>n.id!==id)) }
  const addBlock   = async(nid,b)   => { const n=await api.addBlock(nid,b); syncNote(n) }
  const updateBlock= async(nid,bid,p)=>{ const n=await api.updateBlock(nid,bid,p); syncNote(n) }
  const deleteBlock= async(nid,bid) => { const n=await api.deleteBlock(nid,bid); syncNote(n) }
  const uploadFile = async(nid,file)=> { const n=await api.uploadFile(nid,file); syncNote(n) }

  const panelTasks = !panel?[]:panel.mode==='backlog'?tasks.filter(t=>!t.date_key):tasks.filter(t=>t.date_key===panel.dk)
  const panelLabel = !panel?'':panel.mode==='backlog'?i.allTasks:`${(DAYS_SHORT_ALL[lang]||DAYS_SHORT_ALL.ru)[(panel.date.getDay()+6)%7] /* full name via DAYS_FULL_ALL if needed */}, ${panel.date.getDate()} ${MONTHS_GEN[panel.date.getMonth()]}`
  const openDay    = d => { setPanel({mode:'day',dk:dkey(d),date:d}); setExpanded(null) }
  const openBacklog= () => { setPanel({mode:'backlog'}); setExpanded(null) }
  const closePanel = () => setPanel(null)

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-family:'Plus Jakarta Sans',sans-serif;-webkit-tap-highlight-color:transparent}
body{background:var(--bg);color:var(--text);min-height:100vh}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;font-size:13px;font-weight:600;border:none;border-radius:9px;cursor:pointer;transition:all .15s;padding:0;line-height:1}
.btn-p{background:var(--accent);color:#fff;padding:8px 16px}.btn-p:hover{filter:brightness(1.1);transform:translateY(-1px)}.btn-p:active{transform:none}
.btn-s{background:var(--surface2);color:var(--text-2);border:1px solid var(--border);padding:7px 14px}.btn-s:hover{background:var(--surface3);color:var(--text);border-color:var(--border-med)}
.btn-i{background:transparent;color:var(--text-3);width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center}.btn-i:hover{background:var(--surface3);color:var(--text-2)}
.bdel{background:transparent;border:none;cursor:pointer;color:var(--text-4);width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all .12s;padding:0}.bdel:hover{background:rgba(220,38,38,0.12);color:var(--red)}
.inp{width:100%;background:var(--surface2);border:1.5px solid var(--border);color:var(--text);border-radius:10px;padding:9px 13px;font-family:inherit;font-size:14px;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--accent);background:var(--surface)}.inp::placeholder{color:var(--text-4)}
textarea.inp{resize:vertical;line-height:1.65}
.chk{width:18px;height:18px;border-radius:5px;flex-shrink:0;cursor:pointer;border:2px solid var(--border-med);display:flex;align-items:center;justify-content:center;transition:all .15s}.chk.on{background:var(--accent);border-color:var(--accent)}.chk.on::after{content:'';display:block;width:5px;height:9px;border:2px solid #fff;border-top:none;border-left:none;transform:rotate(45deg) translateY(-1px)}
.chk.sm{width:15px;height:15px;border-radius:4px}.chk.sm.on::after{width:4px;height:7px}
.tab{background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;padding:0 2px 11px;color:var(--text-3);border-bottom:2.5px solid transparent;transition:all .15s}.tab.on{color:var(--accent);border-bottom-color:var(--accent)}.tab:hover:not(.on){color:var(--text-2)}
.tpill{background:transparent;border:1.5px solid var(--border);border-radius:20px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;color:var(--text-3);transition:all .15s;display:inline-flex;align-items:center;gap:5px}.tpill.on{background:var(--accent-bg);border-color:var(--accent);color:var(--accent-text)}.tpill:hover:not(.on){border-color:var(--border-med);color:var(--text-2)}
.tile{border-radius:16px;border:1.5px solid var(--border);background:var(--surface);transition:box-shadow .15s,transform .15s,border-color .15s;cursor:pointer}.tile:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);border-color:var(--border-med)}.tile.act{background:var(--accent-bg);border-color:var(--accent);box-shadow:var(--shadow-md)}.tile.tod{background:var(--today-bg);border-color:var(--today-border);box-shadow:var(--shadow-md)}.tile.dov{outline:2.5px dashed var(--accent);outline-offset:-3px;background:var(--accent-bg)}
.chip{display:flex;align-items:center;gap:5px;border-radius:7px;padding:3px 8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;overflow:hidden;border:1px solid var(--border)}.chip:hover{filter:brightness(0.93)}
.panel{position:fixed;top:0;right:0;height:100%;width:380px;max-width:100%;background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:50;box-shadow:var(--panel-shadow);transform:translateX(100%);transition:transform .3s cubic-bezier(0.4,0,0.2,1)}.panel.open{transform:translateX(0)}
.ncard{background:var(--surface);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;transition:box-shadow .2s,transform .2s}.ncard:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.cblock{background:var(--code-bg);border-radius:10px;overflow:hidden;margin:4px 0}
.chdr{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.07)}
.ccode{padding:14px;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--code-text);white-space:pre-wrap;word-break:break-all;line-height:1.7;max-height:300px;overflow-y:auto}
.cedit{width:100%;background:transparent;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--code-text);white-space:pre;resize:none;line-height:1.7;min-height:80px}
.cblock select option{background:#1e1e2e;color:#CDD6F4}
.cblock select{appearance:auto;-webkit-appearance:auto}
/* Syntax color hints by keyword type */
.ccode .kw{color:#CBA6F7}.ccode .str{color:#A6E3A1}.ccode .cmt{color:#6C7086;font-style:italic}.ccode .num{color:#FAB387}.ccode .fn{color:#89DCEB}
.fblock{display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border)}
@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.fi{animation:fi .18s ease both}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── RESPONSIVE ─────────────────────────────────────────────────── */
/* Mobile panel slides up from bottom */
@media(max-width:768px){
  .panel{width:100%;border-left:none;top:auto;bottom:0;height:88vh;border-radius:20px 20px 0 0;
    transform:translateY(100%);border-top:1px solid var(--border)}
  .panel.open{transform:translateY(0)}
  .cal-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;padding:10px!important}
  .tile{min-height:140px!important}
  .hm{display:none!important}
  .hdr{padding:0 12px!important;height:50px!important}
  .logo-sub{display:none!important}
  .wnav{padding:8px 12px!important}
  .ngrid{grid-template-columns:1fr!important}
  .theme-group{gap:4px!important}
  .tpill .tl{display:none!important}
  .tpill{padding:4px 7px!important}
  .footer-bar{padding:8px 14px!important}
  .lang-label{display:none!important}
}
@media(max-width:480px){
  .cal-grid{grid-template-columns:repeat(2,1fr)!important}
  .tab{font-size:12px}
  .hdr-tabs{gap:12px!important}
  .logo-text{font-size:15px!important}
}
@media(min-width:769px){
  #mobile-backlog-btn{display:none!important}
}
`

  if (loading) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,color:'var(--text-3)'}}>
      <style>{css}</style>
      <div style={{width:36,height:36,border:'3px solid var(--accent-bg)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <span style={{fontSize:13}}>Loading…</span>
    </div>
  )

  return (
    <LangCtx.Provider value={lang}>
      <style>{css}</style>

      {/* ══ HEADER ══ */}
      <header style={{background:'var(--header-bg)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:40,boxShadow:'var(--shadow-sm)'}}>
        <div className="hdr" style={{display:'flex',alignItems:'center',padding:'0 24px',height:56,gap:16}}>

          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <Logo size={36}/>
            <div className="logo-text" style={{fontWeight:800,fontSize:18,letterSpacing:-.5,lineHeight:1.1}}>
              <div style={{background:'linear-gradient(135deg,var(--accent),#8B6FFF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>QuestPlan</div>
              <div className="logo-sub" style={{fontSize:10,fontWeight:500,color:'var(--text-3)',letterSpacing:.2,marginTop:1,WebkitTextFillColor:'var(--text-3)'}}>{i.slogan}</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hdr-tabs" style={{display:'flex',gap:18,marginLeft:8}}>
            <button className={`tab${tab==='planner'?' on':''}`}  onClick={()=>setTab('planner')}>{i.planner}</button>
            <button className={`tab${tab==='notebook'?' on':''}`} onClick={()=>setTab('notebook')}>{i.notebook}</button>
            <button className={`tab${tab==='payments'?' on':''}`} onClick={()=>setTab('payments')}>{i.payments}</button>
          </nav>

          <div style={{flex:1}}/>

          {/* Theme */}
          <div className="theme-group" style={{display:'flex',gap:5}}>
            {[['light','sun',i.light],['system','monitor',i.auto],['dark','moon',i.dark]].map(([k,ico,lbl])=>(
              <button key={k} className={`tpill${themeMode===k?' on':''}`} onClick={()=>setThemeMode(k)}>
                <Icon name={ico} size={13}/><span className="tl">{lbl}</span>
              </button>
            ))}
          </div>

          {/* Action button */}
          {tab==='planner'&&<button className="btn btn-s hm" style={{marginLeft:8,flexShrink:0,gap:6}} onClick={openBacklog}>
            <Icon name="menu" size={15}/>{i.backlog}
            {tasks.filter(t=>!t.date_key).length>0&&<span style={{background:'var(--accent-bg)',color:'var(--accent-text)',borderRadius:10,padding:'1px 7px',fontSize:11}}>{tasks.filter(t=>!t.date_key).length}</span>}
          </button>}
          {tab==='notebook'&&<button className="btn btn-p" style={{marginLeft:8,flexShrink:0}} onClick={async()=>{const n=await addNote('');setExpanded(n.id)}}>{i.addNote}</button>}
        </div>

        {/* Mobile backlog button */}
        <div id="mobile-backlog-btn" style={{padding:'6px 12px 8px',borderTop:'1px solid var(--border)'}}>
          {tab==='planner'&&<button className="btn btn-s" style={{width:'100%',justifyContent:'center',gap:6}} onClick={openBacklog}>
            <Icon name="menu" size={15}/>{i.backlog} ({tasks.filter(t=>!t.date_key).length})
          </button>}
        </div>
      </header>

      {/* ══ PLANNER ══ */}
      {tab==='planner'&&(
        <div style={{display:'flex',height:'calc(100vh - 56px)',overflow:'hidden'}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginRight:panel?380:0,transition:'margin-right .3s cubic-bezier(0.4,0,0.2,1)'}}>

            {/* Week nav */}
            <div className="wnav" style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
              <button className="btn btn-i" onClick={()=>setWeekBase(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n})}><Icon name="chevronLeft" size={18}/></button>
              <div style={{fontWeight:700,fontSize:15,flex:1}}>
                {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
                {weekDates[0].getMonth()!==weekDates[6].getMonth()&&<span style={{color:'var(--text-3)'}}> — {MONTHS[weekDates[6].getMonth()]}</span>}
              </div>
              <button className="btn btn-i" onClick={()=>setWeekBase(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n})}><Icon name="chevronRight" size={18}/></button>
              <button className="btn btn-s" style={{padding:'5px 12px',fontSize:12}} onClick={()=>setWeekBase(new Date())}>{i.today_btn}</button>
            </div>

            {/* Calendar tiles */}
            <div style={{flex:1,overflow:'auto'}}>
              <div className="cal-grid" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:12,padding:'16px 20px 24px'}}>
                {weekDates.map((date,di)=>{
                  const dk=dkey(date),isToday=dk===todayKey,isAct=panel?.mode==='day'&&panel.dk===dk,isWknd=di>=5
                  const dayTasks=tasks.filter(t=>t.date_key===dk)
                  const DAYS_SHORT = DAYS_SHORT_ALL[lang]||DAYS_SHORT_ALL.ru
                  return(
                    <div key={di} className={`tile${isAct?' act':isToday?' tod':''}${dragOver===dk?' dov':''}`}
                      style={{display:'flex',flexDirection:'column',padding:'14px 12px 10px',minHeight:220,gap:4,opacity:isWknd&&!isAct&&!isToday?.85:1}}
                      onDragOver={e=>{e.preventDefault();setDragOver(dk)}}
                      onDragLeave={()=>setDragOver(null)}
                      onDrop={e=>{e.preventDefault();if(dragging.current){assignDk(dragging.current,dk);dragging.current=null}setDragOver(null)}}
                      onClick={()=>isAct?closePanel():openDay(date)}
                    >
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',marginBottom:3,color:isToday||isAct?'var(--accent)':isWknd?'var(--text-3)':'var(--text-3)'}}>{DAYS_SHORT[di]}</div>
                          <div style={{fontSize:26,fontWeight:800,lineHeight:1,letterSpacing:-.5,color:isToday||isAct?'var(--accent)':isWknd?'var(--text-3)':'var(--text)'}}>{date.getDate()}</div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                          {isToday&&<span style={{fontSize:9,fontWeight:700,color:'var(--accent)',background:'var(--accent-bg)',borderRadius:8,padding:'2px 7px',letterSpacing:.3}}>{i.today}</span>}
                          {dayTasks.length>0&&<span style={{fontSize:10,fontWeight:700,color:'var(--text-3)',background:'var(--surface2)',borderRadius:8,padding:'2px 7px'}}>{dayTasks.filter(t=>t.done).length}/{dayTasks.length}</span>}
                        </div>
                      </div>
                      <div style={{height:1,background:'var(--border)',marginBottom:4}}/>
                      {dayTasks.slice(0,5).map(t=>(
                        <div key={t.id} className="chip" draggable
                          onDragStart={e=>{e.stopPropagation();dragging.current=t.id}}
                          onClick={e=>{e.stopPropagation();openDay(date);setExpanded(t.id)}}
                          style={{background:t.done?'var(--green-bg)':'var(--surface2)',color:t.done?'var(--green)':'var(--text-2)',opacity:t.done?.7:1}}>
                          <span style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:t.done?'var(--green)':'var(--accent)'}}/>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.done?<s>{t.title}</s>:t.title}</span>
                        </div>
                      ))}
                      {dayTasks.length>5&&<div style={{fontSize:11,color:'var(--text-3)',paddingLeft:4}}>{i.moreItems(dayTasks.length-5)}</div>}
                      <div style={{marginTop:'auto',paddingTop:6}} onClick={e=>e.stopPropagation()}>
                        <QuickAdd placeholder={i.taskPlaceholder} onAdd={t=>addTask(t,dk)}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Slide panel */}
          <div className={`panel${panel?' open':''}`}>
            {panel&&<TaskPanel i={i} label={panelLabel} tasks={panelTasks} isBacklog={panel.mode==='backlog'}
              expanded={expanded} setExpanded={setExpanded} weekDates={weekDates} onClose={closePanel}
              onAdd={t=>panel.mode==='backlog'?addTask(t,null):addTask(t,panel.dk)}
              onToggle={(id,done)=>toggleTask(id,done)} onDelete={deleteTask}
              onAssign={(id,dk)=>assignDk(id,dk)} onUnassign={panel.mode==='day'?unassignDk:null}
              onAddSub={addSub} onToggleSub={toggleSub} onDeleteSub={deleteSub}
              onAddTNote={addTNote} onDelTNote={delTNote} dragging={dragging}
              DAYS_SHORT={DAYS_SHORT_ALL[lang]||DAYS_SHORT_ALL.ru}
              MONTHS_GEN={MONTHS_GEN_ALL[lang]||MONTHS_GEN_ALL.ru}
            />}
          </div>
        </div>
      )}

      {/* ══ NOTEBOOK ══ */}
      {tab==='notebook'&&(
        <div style={{padding:'24px 24px 120px',maxWidth:1200,margin:'0 auto'}}>
          {notes.length===0&&<div style={{textAlign:'center',color:'var(--text-3)',padding:'80px 0',fontSize:15}}>{i.noNotesTxt}</div>}
          <div className="ngrid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:18}}>
            {notes.map(note=>(
              <NoteCard key={note.id} note={note} i={i}
                editing={expanded===note.id}
                onEdit={()=>setExpanded(expanded===note.id?null:note.id)}
                onUpdate={(f,v)=>updateNote(note.id,{[f]:v})}
                onDelete={()=>deleteNote(note.id)}
                onAddBlock={b=>addBlock(note.id,b)}
                onUpdateBlock={(bid,p)=>updateBlock(note.id,bid,p)}
                onDeleteBlock={bid=>deleteBlock(note.id,bid)}
                onUploadFile={file=>uploadFile(note.id,file)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ PAYMENTS ══ */}
      {tab==='payments'&&<Payments lang={lang}/>}

      {/* ══ FOOTER — Language switcher ══ */}
      <footer className="footer-bar" style={{
        position:'fixed',bottom:0,left:0,right:0,
        background:'var(--header-bg)',borderTop:'1px solid var(--border)',
        padding:'8px 24px',display:'flex',alignItems:'center',justifyContent:'flex-end',
        gap:8,zIndex:30,opacity:.85
      }}>
        <Icon name="globe" size={15} color="var(--text-3)"/>
        <span className="lang-label" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{i.language}:</span>
        {LANGS.map(l=>(
          <button key={l.code} onClick={()=>setLang(l.code)}
            style={{background:'transparent',border:'none',cursor:'pointer',padding:'3px 8px',
              borderRadius:6,fontSize:12,fontWeight:lang===l.code?700:500,fontFamily:'inherit',
              color:lang===l.code?'var(--accent)':'var(--text-3)',
              background:lang===l.code?'var(--accent-bg)':'transparent',
              transition:'all .15s'}}>
            {l.label}
          </button>
        ))}
      </footer>
    </LangCtx.Provider>
  )
}

// ─── QuickAdd ─────────────────────────────────────────────────────────────────
function QuickAdd({placeholder,onAdd}){
  const [open,setOpen]=useState(false),[val,setVal]=useState('')
  const go=()=>{if(val.trim()){onAdd(val.trim());setVal('');setOpen(false)}}
  if(!open) return(
    <button onClick={()=>setOpen(true)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-4)',fontSize:12,fontWeight:500,padding:'4px 6px',borderRadius:6,width:'100%',textAlign:'left',fontFamily:'inherit',transition:'all .12s'}}
      onMouseOver={e=>{e.currentTarget.style.color='var(--accent)';e.currentTarget.style.background='var(--accent-bg)'}}
      onMouseOut={e=>{e.currentTarget.style.color='var(--text-4)';e.currentTarget.style.background='transparent'}}
    >{placeholder}</button>
  )
  return(
    <div style={{display:'flex',flexDirection:'column',gap:5,marginTop:4}}>
      <input className="inp" style={{fontSize:12,padding:'5px 9px'}} value={val} onChange={e=>setVal(e.target.value)} placeholder="…" autoFocus onKeyDown={e=>{if(e.key==='Enter')go();if(e.key==='Escape'){setOpen(false);setVal('')}}}/>
      <div style={{display:'flex',gap:5}}>
        <button className="btn btn-p" style={{flex:1,padding:'4px 0',fontSize:12}} onClick={go}><Icon name="check" size={13}/></button>
        <button className="btn btn-s" style={{flex:1,padding:'4px 0',fontSize:12}} onClick={()=>{setOpen(false);setVal('')}}><Icon name="close" size={13}/></button>
      </div>
    </div>
  )
}

// ─── TaskPanel ────────────────────────────────────────────────────────────────
function TaskPanel({i,label,tasks,isBacklog,expanded,setExpanded,weekDates,onClose,onAdd,onToggle,onDelete,onAssign,onUnassign,onAddSub,onToggleSub,onDeleteSub,onAddTNote,onDelTNote,dragging,DAYS_SHORT,MONTHS_GEN}){
  const [adding,setAdding]=useState(false),[val,setVal]=useState('')
  const go=()=>{if(val.trim()){onAdd(val.trim());setVal('');setAdding(false)}}
  return<>
    <div style={{padding:'16px 18px 12px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
      <div style={{width:36,height:4,borderRadius:2,background:'var(--border-med)',margin:'0 auto 12px'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{label}</div>
          <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{i.tasksCount(tasks.length,tasks.filter(t=>t.done).length)}</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn btn-p" style={{padding:'6px 14px',fontSize:12,gap:5}} onClick={()=>setAdding(v=>!v)}><Icon name="plus" size={13}/>{i.addTask}</button>
          <button className="btn btn-i" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
      </div>
      {adding&&<div className="fi" style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
        <input className="inp" placeholder={i.taskName} value={val} onChange={e=>setVal(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==='Enter')go();if(e.key==='Escape')setAdding(false)}}/>
        <div style={{display:'flex',gap:7}}>
          <button className="btn btn-p" style={{flex:1,padding:'6px 0'}} onClick={go}>{i.add}</button>
          <button className="btn btn-s" style={{flex:1,padding:'6px 0'}} onClick={()=>setAdding(false)}>{i.cancel}</button>
        </div>
      </div>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
      {tasks.length===0&&<div style={{textAlign:'center',color:'var(--text-3)',padding:'40px 0',fontSize:13}}>{isBacklog?i.noTasks:i.noDayTasks}</div>}
      {tasks.map(task=><PanelTask key={task.id} task={task} i={i}
        isExpanded={expanded===task.id} onExpand={()=>setExpanded(expanded===task.id?null:task.id)}
        onToggle={done=>onToggle(task.id,done)} onDelete={()=>onDelete(task.id)}
        onUnassign={onUnassign?()=>onUnassign(task.id):null}
        isBacklog={isBacklog} weekDates={weekDates}
        onAssign={dk=>onAssign(task.id,dk)}
        onAddSub={t=>onAddSub(task.id,t)} onToggleSub={(s,d)=>onToggleSub(task.id,s,d)} onDeleteSub={s=>onDeleteSub(task.id,s)}
        onAddTNote={t=>onAddTNote(task.id,t)} onDelTNote={n=>onDelTNote(task.id,n)} dragging={dragging}
        DAYS_SHORT={DAYS_SHORT} MONTHS_GEN={MONTHS_GEN}
      />)}
    </div>
  </>
}

// ─── PanelTask ────────────────────────────────────────────────────────────────
function PanelTask({task,i,isExpanded,onExpand,onToggle,onDelete,onUnassign,isBacklog,weekDates,onAssign,onAddSub,onToggleSub,onDeleteSub,onAddTNote,onDelTNote,dragging,DAYS_SHORT,MONTHS_GEN}){
  const [subVal,setSubVal]=useState(''),[noteVal,setNoteVal]=useState('')
  const [showSub,setShowSub]=useState(false),[showNote,setShowNote]=useState(false),[dayMenu,setDayMenu]=useState(false)
  const prog=task.subtasks?.length?Math.round(task.subtasks.filter(s=>s.done).length/task.subtasks.length*100):null
  const dkey2 = d=>`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  return(
    <div draggable onDragStart={()=>{dragging.current=task.id}}
      style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:11,marginBottom:8,overflow:'hidden',boxShadow:'var(--shadow-sm)',opacity:task.done?.65:1}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'10px 12px'}}>
        <div style={{color:'var(--text-4)',cursor:'grab',marginTop:2,flexShrink:0}}><Icon name="drag" size={14}/></div>
        <div className={`chk${task.done?' on':''}`} onClick={()=>onToggle(!task.done)} style={{marginTop:2}}/>
        <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={onExpand}>
          <div style={{fontSize:13.5,fontWeight:500,lineHeight:1.4,color:'var(--text)',textDecoration:task.done?'line-through':'none',wordBreak:'break-word'}}>{task.title}</div>
          {prog!==null&&<div style={{marginTop:5,height:3,borderRadius:4,background:'var(--surface3)'}}><div style={{height:'100%',width:`${prog}%`,borderRadius:4,background:'var(--accent)',transition:'width .3s'}}/></div>}
          {task.subtasks?.length>0&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length} {i.subtasks.toLowerCase()}</div>}
        </div>
        <div style={{display:'flex',gap:2,flexShrink:0,marginTop:1}}>
          {isBacklog&&(
            <div style={{position:'relative'}}>
              <button className="bdel" onClick={()=>setDayMenu(v=>!v)} title={i.assignDay}><Icon name="calendar" size={14}/></button>
              {dayMenu&&(
                <div style={{position:'absolute',right:0,top:30,background:'var(--surface)',border:'1px solid var(--border-med)',borderRadius:10,zIndex:20,overflow:'hidden',boxShadow:'var(--shadow-lg)',minWidth:160}}>
                  {weekDates.map((d,idx)=>(
                    <button key={idx} onClick={()=>{onAssign(dkey2(d));setDayMenu(false)}}
                      style={{display:'block',width:'100%',background:'transparent',border:'none',cursor:'pointer',padding:'7px 14px',textAlign:'left',fontFamily:'inherit',fontSize:13,color:'var(--text)',fontWeight:500,transition:'background .1s'}}
                      onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{color:'var(--text-3)',marginRight:8,fontSize:11}}>{DAYS_SHORT[idx]}</span>{d.getDate()} {MONTHS_GEN[d.getMonth()]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {onUnassign&&<button className="bdel" onClick={onUnassign} title={i.removeFromDay}><Icon name="undo" size={14}/></button>}
          <button className="bdel" onClick={onDelete}><Icon name="trash" size={14}/></button>
        </div>
      </div>
      {isExpanded&&(
        <div style={{borderTop:'1px solid var(--border)',padding:'12px 14px',background:'var(--surface2)',display:'flex',flexDirection:'column',gap:14}}>
          {/* Subtasks */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text-3)',textTransform:'uppercase'}}>{i.subtasks}</span>
              <button className="btn btn-s" style={{padding:'2px 9px',fontSize:11,gap:4}} onClick={()=>setShowSub(v=>!v)}><Icon name="plus" size={11}/>{i.addSubtask}</button>
            </div>
            {showSub&&(
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                <input className="inp" style={{fontSize:12,padding:'5px 9px'}} value={subVal} onChange={e=>setSubVal(e.target.value)} placeholder={i.subtaskPh} autoFocus
                  onKeyDown={e=>{if(e.key==='Enter'&&subVal.trim()){onAddSub(subVal.trim());setSubVal('');setShowSub(false)}if(e.key==='Escape')setShowSub(false)}}/>
                <button className="btn btn-p" style={{padding:'4px 10px',fontSize:12}} onClick={()=>{if(subVal.trim()){onAddSub(subVal.trim());setSubVal('');setShowSub(false)}}}><Icon name="check" size={13}/></button>
              </div>
            )}
            {(task.subtasks||[]).map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
                <div className={`chk sm${s.done?' on':''}`} onClick={()=>onToggleSub(s.id,!s.done)}/>
                <span style={{flex:1,fontSize:13,color:s.done?'var(--text-3)':'var(--text)',textDecoration:s.done?'line-through':'none'}}>{s.title}</span>
                <button className="bdel" style={{width:20,height:20}} onClick={()=>onDeleteSub(s.id)}><Icon name="trash" size={12}/></button>
              </div>
            ))}
            {!(task.subtasks||[]).length&&!showSub&&<div style={{fontSize:12,color:'var(--text-4)'}}>{i.noSubtasks}</div>}
          </div>
          {/* Task notes */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text-3)',textTransform:'uppercase'}}>{i.notes}</span>
              <button className="btn btn-s" style={{padding:'2px 9px',fontSize:11,gap:4}} onClick={()=>setShowNote(v=>!v)}><Icon name="plus" size={11}/>{i.addSubtask}</button>
            </div>
            {showNote&&(
              <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:8}}>
                <textarea className="inp" rows={2} style={{fontSize:12,padding:'6px 9px'}} value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder={i.notePh} autoFocus/>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-p" style={{flex:1,padding:'5px 0',fontSize:12}} onClick={()=>{if(noteVal.trim()){onAddTNote(noteVal.trim());setNoteVal('');setShowNote(false)}}}>{i.add}</button>
                  <button className="btn btn-s" style={{flex:1,padding:'5px 0',fontSize:12}} onClick={()=>{setShowNote(false);setNoteVal('')}}>{i.cancel}</button>
                </div>
              </div>
            )}
            {(task.notes||[]).map(n=>(
              <div key={n.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',marginBottom:6,fontSize:13,color:'var(--text)',lineHeight:1.6,position:'relative'}}>
                <span style={{color:'var(--text-3)',fontSize:11,marginRight:8}}>{n.date}</span>{n.text}
                <button className="bdel" style={{position:'absolute',right:5,top:5,width:20,height:20}} onClick={()=>onDelTNote(n.id)}><Icon name="trash" size={12}/></button>
              </div>
            ))}
            {!(task.notes||[]).length&&!showNote&&<div style={{fontSize:12,color:'var(--text-4)'}}>{i.noNotes}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────
function NoteCard({note,i,editing,onEdit,onUpdate,onDelete,onAddBlock,onUpdateBlock,onDeleteBlock,onUploadFile}){
  const [addMenu,setAddMenu]=useState(false),[codeEdit,setCodeEdit]=useState(null)
  const [copyMsg,setCopyMsg]=useState({})
  const [lightbox,setLightbox]=useState(null)
  const fileRef=useRef()
  const handleFile=e=>{const f=e.target.files?.[0];if(f){onUploadFile(f);setAddMenu(false)};e.target.value=''}
  const doCopy=async(bid,text)=>{
    try{await navigator.clipboard.writeText(text);setCopyMsg(m=>({...m,[bid]:true}));setTimeout(()=>setCopyMsg(m=>({...m,[bid]:false})),1800)}
    catch(e){console.error('clipboard',e)}
  }

  return(
    <div className="ncard fi">
      {/* Title bar */}
      <div style={{padding:'15px 18px 12px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
        {editing
          ?<input className="inp" value={note.title} onChange={e=>onUpdate('title',e.target.value)} placeholder={i.noteTitle} style={{fontSize:15,fontWeight:700,flex:1}} autoFocus/>
          :<h3 onClick={onEdit} style={{fontSize:15,fontWeight:700,color:'var(--text)',cursor:'pointer',flex:1,lineHeight:1.35}}>{note.title||<span style={{color:'var(--text-4)',fontStyle:'italic',fontWeight:400}}>{i.untitled}</span>}</h3>}
        <div style={{display:'flex',gap:5,flexShrink:0}}>
          <button className="btn btn-s" style={{padding:'3px 10px',fontSize:12,gap:5}} onClick={onEdit}>
            {editing?<><Icon name="check" size={12}/>{i.done}</>:<><Icon name="edit" size={12}/>{i.edit}</>}
          </button>
          <button className="bdel" onClick={onDelete} style={{width:28,height:28}}><Icon name="trash" size={14}/></button>
        </div>
      </div>

      {/* Body */}
      <div style={{padding:'14px 18px 18px',display:'flex',flexDirection:'column',gap:10}}>
        {editing
          ?<textarea className="inp" rows={3} value={note.text} onChange={e=>onUpdate('text',e.target.value)} placeholder={i.noteText}/>
          :note.text&&<div style={{fontSize:14,color:'var(--text-2)',lineHeight:1.75,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{note.text}</div>}

        {/* Blocks */}
        {(note.blocks||[]).map(block=>(
          <div key={block.id}>
            {block.type==='code'&&(
              <div className="cblock">
                <div className="chdr">
                  <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:.5,fontFamily:"'JetBrains Mono',monospace"}}>{(block.language||'code').toUpperCase()}</span>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    {editing&&<button style={{background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',transition:'color .12s'}} onClick={()=>setCodeEdit(codeEdit===block.id?null:block.id)} onMouseOver={e=>e.currentTarget.style.color='rgba(255,255,255,0.8)'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}><Icon name="edit" size={13} color="currentColor"/></button>}
                    <button style={{background:'transparent',border:'none',cursor:'pointer',color:copyMsg[block.id]?'#4ade80':'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',gap:3,transition:'color .12s',fontSize:10,fontFamily:'inherit'}} onClick={()=>doCopy(block.id,block.content)} title={i.copy} onMouseOver={e=>e.currentTarget.style.color='rgba(255,255,255,0.8)'} onMouseOut={e=>{if(!copyMsg[block.id])e.currentTarget.style.color='rgba(255,255,255,0.4)'}}><Icon name="copy" size={13} color="currentColor"/>{copyMsg[block.id]&&<span style={{fontSize:10}}>{i.copied}</span>}</button>
                    {editing&&<button style={{background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,100,100,0.5)',display:'flex',alignItems:'center'}} onClick={()=>onDeleteBlock(block.id)}><Icon name="trash" size={13} color="currentColor"/></button>}
                  </div>
                </div>
                {codeEdit===block.id
                  ?<div style={{padding:'10px 14px'}}>
                    <select value={block.language||'javascript'} onChange={e=>onUpdateBlock(block.id,{language:e.target.value})}
                      style={{background:'#2a2a3f',border:'1px solid rgba(255,255,255,0.18)',color:'#CDD6F4',borderRadius:6,padding:'4px 10px',fontSize:12,fontFamily:"'JetBrains Mono',monospace",marginBottom:8,width:'100%',outline:'none',cursor:'pointer'}}>
                      {CODE_LANGS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                    <textarea className="cedit" value={block.content} onChange={e=>onUpdateBlock(block.id,{content:e.target.value})} rows={5}/>
                  </div>
                  :<div className="ccode">{block.content||<span style={{opacity:.3}}>{'// …'}</span>}</div>}
              </div>
            )}
            {block.type==='file'&&(
              block.mimetype?.startsWith('image/')
                ?<div style={{borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',position:'relative'}}>
                  <img src={api.fileUrl(block.filepath)} alt={block.filename}
                    style={{width:'100%',display:'block',maxHeight:320,objectFit:'cover',cursor:'pointer'}}
                    onClick={()=>setLightbox(api.fileUrl(block.filepath))}/>
                  <div style={{position:'absolute',top:8,right:8,display:'flex',gap:6}}>
                    <a href={api.fileUrl(block.filepath)} download={block.filename} target="_blank" rel="noreferrer"
                      style={{background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',borderRadius:7,padding:'5px 9px',display:'flex',alignItems:'center',gap:5,textDecoration:'none',color:'#fff',fontSize:12,fontWeight:600}}>
                      <Icon name="download" size={13} color="#fff"/>{i.download}
                    </a>
                    {editing&&<button onClick={()=>onDeleteBlock(block.id)}
                      style={{background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',border:'none',borderRadius:7,padding:'5px 7px',cursor:'pointer',display:'flex',alignItems:'center'}}>
                      <Icon name="trash" size={13} color="#fff"/>
                    </button>}
                  </div>
                  <div style={{padding:'6px 10px',background:'var(--surface2)',fontSize:11,color:'var(--text-3)',display:'flex',justifyContent:'space-between'}}>
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{block.filename}</span>
                    <span style={{flexShrink:0,marginLeft:8}}>{fmtBytes(block.filesize||0)}</span>
                  </div>
                </div>
                :<div className="fblock">
                  <div style={{width:38,height:38,borderRadius:9,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {block.mimetype?.startsWith('video/')
                      ?<Icon name="video" size={18} color="var(--accent)"/>
                      :block.mimetype?.includes('pdf')
                        ?<Icon name="pdf" size={18} color="var(--accent)"/>
                        :<Icon name="file" size={18} color="var(--accent)"/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{block.filename}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{fmtBytes(block.filesize||0)}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <a href={api.fileUrl(block.filepath)} download={block.filename} target="_blank" rel="noreferrer"
                      style={{background:'var(--accent-bg)',color:'var(--accent-text)',borderRadius:7,padding:'6px 10px',fontSize:12,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
                      <Icon name="download" size={13} color="var(--accent)"/>{i.download}
                    </a>
                    {editing&&<button className="bdel" onClick={()=>onDeleteBlock(block.id)}><Icon name="trash" size={14}/></button>}
                  </div>
                </div>
            )}
          </div>
        ))}

        {/* Add block */}
        {editing&&(
          <div style={{position:'relative'}}>
            <button className="btn btn-s" style={{width:'100%',padding:'8px 0',fontSize:13,gap:6}} onClick={()=>setAddMenu(v=>!v)}>
              <Icon name="plus" size={14}/>{i.addBlock}
            </button>
            {addMenu&&(
              <div className="fi" style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border-med)',borderRadius:12,overflow:'hidden',boxShadow:'var(--shadow-lg)',zIndex:10}}>
                <BlockOption icon={<Icon name="code" size={20} color="var(--accent)"/>} label={i.codeBlock} sub={i.codeBlockSub}
                  onClick={()=>{onAddBlock({type:'code',content:'',language:'javascript'});setAddMenu(false)}}/>
                <BlockOption icon={<Icon name="paperclip" size={20} color="var(--accent)"/>} label={i.attachFile} sub={i.attachFileSub}
                  onClick={()=>fileRef.current?.click()}/>
                <input ref={fileRef} type="file" style={{display:'none'}} onChange={handleFile}/>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Lightbox */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',backdropFilter:'blur(6px)'}}>
          <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}}>
            <img src={lightbox} style={{maxWidth:'90vw',maxHeight:'85vh',objectFit:'contain',borderRadius:12,boxShadow:'0 20px 60px rgba(0,0,0,0.8)'}}/>
            <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:-14,right:-14,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
              <Icon name="close" size={15} color="#fff"/>
            </button>
            <a href={lightbox} download target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
              style={{position:'absolute',bottom:-44,left:'50%',transform:'translateX(-50%)',background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:8,padding:'6px 16px',fontSize:12,fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(4px)'}}>
              <Icon name="download" size={13} color="#fff"/>{i.download}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockOption({icon,label,sub,onClick}){
  return(
    <button onClick={onClick}
      style={{display:'flex',alignItems:'center',gap:14,width:'100%',background:'transparent',border:'none',cursor:'pointer',padding:'12px 16px',fontFamily:'inherit',textAlign:'left',transition:'background .12s',borderBottom:'1px solid var(--border)'}}
      onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'}
      onMouseOut={e=>e.currentTarget.style.background='transparent'}>
      <div style={{width:40,height:40,borderRadius:10,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{label}</div>
        <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{sub}</div>
      </div>
    </button>
  )
}
