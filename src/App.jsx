import { useState, useEffect, useRef } from 'react'
import { api } from './api.js'
import Payments from './Payments.jsx'

const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const DAYS_FULL  = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']
const MONTHS     = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
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
const resolveTheme = k => k==='system' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light') : k

export default function App() {
  const [themeMode, setThemeMode] = useState(()=>localStorage.getItem('qp_theme')||'system')
  const resolved = resolveTheme(themeMode)
  const T = themes[resolved]

  useEffect(()=>{
    Object.entries(T).forEach(([k,v])=>document.documentElement.style.setProperty(k,v))
    document.body.style.background=T['--bg']
    localStorage.setItem('qp_theme',themeMode)
  },[T,themeMode])

  const [tasks,setTasks]   = useState([])
  const [notes,setNotes]   = useState([])
  const [payments,setPayments] = useState([])
  const [loading,setLoading] = useState(true)
  const [tab,setTab]       = useState('planner')
  const [weekBase,setWeekBase] = useState(new Date())
  const weekDates = getWeekDates(weekBase)
  const [panel,setPanel]   = useState(null)
  const [expanded,setExpanded] = useState(null)
  const dragging = useRef(null)
  const [dragOver,setDragOver] = useState(null)

  useEffect(()=>{
    Promise.all([api.getTasks(),api.getNotes(),api.getPayments()])
      .then(([t,n,p])=>{setTasks(t);setNotes(n);setPayments(p)})
      .catch(console.error).finally(()=>setLoading(false))
  },[])

  const syncTask = t => setTasks(p=>p.some(x=>x.id===t.id)?p.map(x=>x.id===t.id?t:x):[...p,t])
  const addTask    = async(title,dk)=>{const t=await api.addTask(title,dk);syncTask(t)}
  const toggleTask = async(id,done) =>{const t=await api.updateTask(id,{done});syncTask(t)}
  const deleteTask = async id=>{await api.deleteTask(id);setTasks(p=>p.filter(t=>t.id!==id))}
  const assignDk   = async(id,dk)  =>{const t=await api.updateTask(id,{date_key:dk});syncTask(t)}
  const unassignDk = async id      =>{const t=await api.updateTask(id,{date_key:null});syncTask(t)}
  const addSub     = async(tid,title)=>{const t=await api.addSubtask(tid,title);syncTask(t)}
  const toggleSub  = async(tid,sid,done)=>{const t=await api.toggleSubtask(tid,sid,done);syncTask(t)}
  const deleteSub  = async(tid,sid)=>{const t=await api.deleteSubtask(tid,sid);syncTask(t)}
  const addTNote   = async(tid,text)=>{const t=await api.addTaskNote(tid,text);syncTask(t)}
  const delTNote   = async(tid,nid)=>{const t=await api.deleteTaskNote(tid,nid);syncTask(t)}

  const syncNote = n=>setNotes(p=>p.some(x=>x.id===n.id)?p.map(x=>x.id===n.id?n:x):[n,...p])
  const addNote    = async title=>{const n=await api.addNote(title);syncNote(n);return n}
  const updateNote = async(id,p)=>{const n=await api.updateNote(id,p);syncNote(n)}
  const deleteNote = async id=>{await api.deleteNote(id);setNotes(p=>p.filter(n=>n.id!==id))}
  const addBlock   = async(nid,b)  =>{const n=await api.addBlock(nid,b);syncNote(n)}
  const updateBlock= async(nid,bid,p)=>{const n=await api.updateBlock(nid,bid,p);syncNote(n)}
  const deleteBlock= async(nid,bid)=>{const n=await api.deleteBlock(nid,bid);syncNote(n)}
  const uploadFile = async(nid,file)=>{const n=await api.uploadFile(nid,file);syncNote(n)}

  const panelTasks = !panel?[]:panel.mode==='backlog'?tasks.filter(t=>!t.date_key):tasks.filter(t=>t.date_key===panel.dk)
  const panelLabel = !panel?'':panel.mode==='backlog'?'Все задачи':`${DAYS_FULL[(panel.date.getDay()+6)%7]}, ${panel.date.getDate()} ${MONTHS_GEN[panel.date.getMonth()]}`
  const openDay=(d)=>{setPanel({mode:'day',dk:dkey(d),date:d});setExpanded(null)}
  const openBacklog=()=>{setPanel({mode:'backlog'});setExpanded(null)}
  const closePanel=()=>setPanel(null)

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-family:'Plus Jakarta Sans',sans-serif;-webkit-tap-highlight-color:transparent}
body{background:var(--bg);color:var(--text);min-height:100vh}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;font-size:13px;font-weight:600;border:none;border-radius:9px;cursor:pointer;transition:all .15s;padding:0;line-height:1}
.btn-p{background:var(--accent);color:#fff;padding:8px 16px}.btn-p:hover{filter:brightness(1.1);transform:translateY(-1px)}
.btn-s{background:var(--surface2);color:var(--text-2);border:1px solid var(--border);padding:7px 14px}.btn-s:hover{background:var(--surface3);color:var(--text);border-color:var(--border-med)}
.btn-i{background:transparent;color:var(--text-3);width:30px;height:30px;border-radius:8px;font-size:16px}.btn-i:hover{background:var(--surface3);color:var(--text-2)}
.bdel{background:transparent;color:var(--text-4);border:none;cursor:pointer;font-family:inherit;font-size:13px;width:24px;height:24px;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:all .12s}.bdel:hover{background:rgba(220,38,38,0.12);color:var(--red)}
.inp{width:100%;background:var(--surface2);border:1.5px solid var(--border);color:var(--text);border-radius:10px;padding:9px 13px;font-family:inherit;font-size:14px;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--accent);background:var(--surface)}.inp::placeholder{color:var(--text-4)}
textarea.inp{resize:vertical;line-height:1.65}
.chk{width:18px;height:18px;border-radius:5px;flex-shrink:0;cursor:pointer;border:2px solid var(--border-med);display:flex;align-items:center;justify-content:center;transition:all .15s}.chk.on{background:var(--accent);border-color:var(--accent)}.chk.on::after{content:'';display:block;width:5px;height:9px;border:2px solid #fff;border-top:none;border-left:none;transform:rotate(45deg) translateY(-1px)}
.chk.sm{width:15px;height:15px;border-radius:4px}.chk.sm.on::after{width:4px;height:7px}
.tab{background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;padding:0 2px 11px;color:var(--text-3);border-bottom:2.5px solid transparent;transition:all .15s}.tab.on{color:var(--accent);border-bottom-color:var(--accent)}.tab:hover:not(.on){color:var(--text-2)}
.tpill{background:transparent;border:1.5px solid var(--border);border-radius:20px;padding:4px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;color:var(--text-3);transition:all .15s}.tpill.on{background:var(--accent-bg);border-color:var(--accent);color:var(--accent-text)}.tpill:hover:not(.on){border-color:var(--border-med);color:var(--text-2)}
.tile{border-radius:16px;border:1.5px solid var(--border);background:var(--surface);transition:box-shadow .15s,transform .15s,border-color .15s;cursor:pointer}.tile:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);border-color:var(--border-med)}.tile.act{background:var(--accent-bg);border-color:var(--accent);box-shadow:var(--shadow-md)}.tile.tod{background:var(--today-bg);border-color:var(--today-border);box-shadow:var(--shadow-md)}.tile.dov{outline:2.5px dashed var(--accent);outline-offset:-3px;background:var(--accent-bg)}
.chip{display:flex;align-items:center;gap:5px;border-radius:7px;padding:3px 8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;overflow:hidden;border:1px solid var(--border)}.chip:hover{filter:brightness(0.93)}
.panel{position:fixed;top:0;right:0;height:100%;width:380px;max-width:100%;background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:50;box-shadow:var(--panel-shadow);transform:translateX(100%);transition:transform .3s cubic-bezier(0.4,0,0.2,1)}.panel.open{transform:translateX(0)}
.ncard{background:var(--surface);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;transition:box-shadow .2s,transform .2s}.ncard:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.cblock{background:var(--code-bg);border-radius:10px;overflow:hidden;margin:4px 0}
.chdr{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.07)}
.ccode{padding:14px;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--code-text);white-space:pre-wrap;word-break:break-all;line-height:1.7;max-height:300px;overflow-y:auto}
.cedit{width:100%;background:transparent;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--code-text);white-space:pre;resize:none;line-height:1.7;min-height:80px}
.fblock{display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border)}
@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.fi{animation:fi .18s ease both}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:768px){
  .panel{width:100%;border-left:none;top:auto;bottom:0;height:85vh;border-radius:20px 20px 0 0;transform:translateY(100%)}.panel.open{transform:translateY(0)}
  .cal-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;padding:12px!important}
  .tile{min-height:150px!important}
  .hm{display:none!important}
  .hdr{padding:0 14px!important}
  .tpill{padding:3px 8px!important;font-size:11px!important}
  .wnav{padding:10px 14px!important}
  .ngrid{grid-template-columns:1fr!important}
}
@media(max-width:480px){.cal-grid{grid-template-columns:repeat(2,1fr)!important}.tpill .tl{display:none}}
`

  if(loading) return(
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,color:'var(--text-3)'}}>
      <style>{css}</style>
      <div style={{width:36,height:36,border:'3px solid var(--accent-bg)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <span style={{fontSize:13}}>Загрузка…</span>
    </div>
  )

  return(
    <>
      <style>{css}</style>
      {/* HEADER */}
      <header style={{background:'var(--header-bg)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:40,boxShadow:'var(--shadow-sm)'}}>
        <div className="hdr" style={{display:'flex',alignItems:'center',padding:'0 24px',height:56,gap:20}}>
          <div style={{fontWeight:800,fontSize:18,letterSpacing:-.5,lineHeight:1.1,flexShrink:0}}>
            <div style={{color:'var(--accent)'}}>To-Do</div>
            <div style={{fontSize:10,fontWeight:500,color:'var(--text-3)',letterSpacing:.2,marginTop:1}}>Планируем жизнь к лучшему</div>
          </div>
          <nav style={{display:'flex',gap:18,marginLeft:8}}>
            <button className={`tab${tab==='planner'?' on':''}`} onClick={()=>setTab('planner')}>Планировщик</button>
            <button className={`tab${tab==='notebook'?' on':''}`} onClick={()=>setTab('notebook')}>Записная книжка</button>
            <button className={`tab${tab==='payments'?' on':''}`} onClick={()=>setTab('payments')}>Платежи</button>
          </nav>
          <div style={{flex:1}}/>
          <div style={{display:'flex',gap:5}}>
            {[['light','☀︎','Светлая'],['system','⊙','Авто'],['dark','☾','Тёмная']].map(([k,i,l])=>(
              <button key={k} className={`tpill${themeMode===k?' on':''}`} onClick={()=>setThemeMode(k)}>
                {i} <span className="tl">{l}</span>
              </button>
            ))}
          </div>
          {tab==='planner'&&<button className="btn btn-s hm" style={{marginLeft:8,flexShrink:0}} onClick={openBacklog}>
            ☰ Задачи {tasks.filter(t=>!t.date_key).length>0&&<span style={{background:'var(--accent-bg)',color:'var(--accent-text)',borderRadius:10,padding:'1px 7px',fontSize:11}}>{tasks.filter(t=>!t.date_key).length}</span>}
          </button>}
          {tab==='notebook'&&<button className="btn btn-p" style={{marginLeft:8,flexShrink:0}} onClick={async()=>{const n=await addNote('');setExpanded(n.id)}}>+ Заметка</button>}
        </div>
        {tab==='planner'&&<div style={{display:'flex',justifyContent:'center',padding:'6px 14px 8px',borderTop:'1px solid var(--border)',background:'var(--header-bg)'}} className="sm-backlog" id="sm-backlog">
          <button className="btn btn-s" style={{width:'100%',maxWidth:400,fontSize:13}} onClick={openBacklog}>☰ Все задачи ({tasks.filter(t=>!t.date_key).length})</button>
          <style>{`@media(min-width:769px){#sm-backlog{display:none}}`}</style>
        </div>}
      </header>

      {/* PLANNER */}
      {tab==='planner'&&(
        <div style={{display:'flex',height:'calc(100vh - 56px)',overflow:'hidden'}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginRight:panel?380:0,transition:'margin-right .3s cubic-bezier(0.4,0,0.2,1)'}}>
            <div className="wnav" style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',background:'var(--surface)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
              <button className="btn btn-i" onClick={()=>setWeekBase(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n})}>‹</button>
              <div style={{fontWeight:700,fontSize:15,flex:1}}>
                {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
                {weekDates[0].getMonth()!==weekDates[6].getMonth()&&<span style={{color:'var(--text-3)'}}> — {MONTHS[weekDates[6].getMonth()]}</span>}
              </div>
              <button className="btn btn-i" onClick={()=>setWeekBase(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n})}>›</button>
              <button className="btn btn-s" style={{padding:'5px 12px',fontSize:12}} onClick={()=>setWeekBase(new Date())}>Сегодня</button>
            </div>
            <div style={{flex:1,overflow:'auto'}}>
              <div className="cal-grid" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:12,padding:'16px 20px 24px'}}>
                {weekDates.map((date,di)=>{
                  const dk=dkey(date),isToday=dk===todayKey,isAct=panel?.mode==='day'&&panel.dk===dk,isWknd=di>=5
                  const dayTasks=tasks.filter(t=>t.date_key===dk)
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
                          {isToday&&<span style={{fontSize:9,fontWeight:700,color:'var(--accent)',background:'var(--accent-bg)',borderRadius:8,padding:'2px 7px',letterSpacing:.3}}>сегодня</span>}
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
                      {dayTasks.length>5&&<div style={{fontSize:11,color:'var(--text-3)',paddingLeft:4}}>+{dayTasks.length-5} ещё</div>}
                      <div style={{marginTop:'auto',paddingTop:6}} onClick={e=>e.stopPropagation()}>
                        <QuickAdd onAdd={t=>addTask(t,dk)}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className={`panel${panel?' open':''}`}>
            {panel&&<TaskPanel label={panelLabel} tasks={panelTasks} isBacklog={panel.mode==='backlog'}
              expanded={expanded} setExpanded={setExpanded} weekDates={weekDates} onClose={closePanel}
              onAdd={t=>panel.mode==='backlog'?addTask(t,null):addTask(t,panel.dk)}
              onToggle={(id,done)=>toggleTask(id,done)} onDelete={deleteTask}
              onAssign={(id,dk)=>assignDk(id,dk)} onUnassign={panel.mode==='day'?unassignDk:null}
              onAddSub={addSub} onToggleSub={toggleSub} onDeleteSub={deleteSub}
              onAddTNote={addTNote} onDelTNote={delTNote} dragging={dragging}
            />}
          </div>
        </div>
      )}

      {/* NOTEBOOK */}
      {tab==='notebook'&&(
        <div style={{padding:'24px 24px 60px',maxWidth:1200,margin:'0 auto'}}>
          {notes.length===0&&<div style={{textAlign:'center',color:'var(--text-3)',padding:'80px 0',fontSize:15}}>Нет заметок — нажмите «+ Заметка»</div>}
          <div className="ngrid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:18}}>
            {notes.map(note=>(
              <NoteCard key={note.id} note={note}
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

      {/* PAYMENTS */}
      {tab==='payments'&&<Payments />}
    </>
  )
}

function QuickAdd({onAdd}){
  const [open,setOpen]=useState(false),[val,setVal]=useState('')
  const go=()=>{if(val.trim()){onAdd(val.trim());setVal('');setOpen(false)}}
  if(!open)return<button onClick={()=>setOpen(true)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-4)',fontSize:12,fontWeight:500,padding:'4px 6px',borderRadius:6,width:'100%',textAlign:'left',fontFamily:'inherit',transition:'all .12s'}} onMouseOver={e=>{e.currentTarget.style.color='var(--accent)';e.currentTarget.style.background='var(--accent-bg)'}} onMouseOut={e=>{e.currentTarget.style.color='var(--text-4)';e.currentTarget.style.background='transparent'}}>+ задача</button>
  return<div style={{display:'flex',flexDirection:'column',gap:5,marginTop:4}}>
    <input className="inp" style={{fontSize:12,padding:'5px 9px'}} value={val} onChange={e=>setVal(e.target.value)} placeholder="Задача…" autoFocus onKeyDown={e=>{if(e.key==='Enter')go();if(e.key==='Escape'){setOpen(false);setVal('')}}}/>
    <div style={{display:'flex',gap:5}}>
      <button className="btn btn-p" style={{flex:1,padding:'4px 0',fontSize:12}} onClick={go}>✓</button>
      <button className="btn btn-s" style={{flex:1,padding:'4px 0',fontSize:12}} onClick={()=>{setOpen(false);setVal('')}}>✕</button>
    </div>
  </div>
}

function TaskPanel({label,tasks,isBacklog,expanded,setExpanded,weekDates,onClose,onAdd,onToggle,onDelete,onAssign,onUnassign,onAddSub,onToggleSub,onDeleteSub,onAddTNote,onDelTNote,dragging}){
  const [adding,setAdding]=useState(false),[val,setVal]=useState('')
  const go=()=>{if(val.trim()){onAdd(val.trim());setVal('');setAdding(false)}}
  return<>
    <div style={{padding:'16px 18px 12px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
      <div style={{width:36,height:4,borderRadius:2,background:'var(--border-med)',margin:'0 auto 12px'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{label}</div>
          <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{tasks.length} задач · {tasks.filter(t=>t.done).length} выполнено</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn btn-p" style={{padding:'6px 12px',fontSize:12}} onClick={()=>setAdding(v=>!v)}>+ Задача</button>
          <button className="btn btn-i" onClick={onClose}>×</button>
        </div>
      </div>
      {adding&&<div className="fi" style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
        <input className="inp" placeholder="Название задачи…" value={val} onChange={e=>setVal(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==='Enter')go();if(e.key==='Escape')setAdding(false)}}/>
        <div style={{display:'flex',gap:7}}>
          <button className="btn btn-p" style={{flex:1,padding:'6px 0'}} onClick={go}>Добавить</button>
          <button className="btn btn-s" style={{flex:1,padding:'6px 0'}} onClick={()=>setAdding(false)}>Отмена</button>
        </div>
      </div>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
      {tasks.length===0&&<div style={{textAlign:'center',color:'var(--text-3)',padding:'40px 0',fontSize:13}}>{isBacklog?'Нет задач в очереди':'Нет задач на этот день'}</div>}
      {tasks.map(task=><PanelTask key={task.id} task={task}
        isExpanded={expanded===task.id} onExpand={()=>setExpanded(expanded===task.id?null:task.id)}
        onToggle={done=>onToggle(task.id,done)} onDelete={()=>onDelete(task.id)}
        onUnassign={onUnassign?()=>onUnassign(task.id):null}
        isBacklog={isBacklog} weekDates={weekDates} onAssign={dk=>onAssign(task.id,dk)}
        onAddSub={t=>onAddSub(task.id,t)} onToggleSub={(s,d)=>onToggleSub(task.id,s,d)} onDeleteSub={s=>onDeleteSub(task.id,s)}
        onAddTNote={t=>onAddTNote(task.id,t)} onDelTNote={n=>onDelTNote(task.id,n)} dragging={dragging}
      />)}
    </div>
  </>
}

function PanelTask({task,isExpanded,onExpand,onToggle,onDelete,onUnassign,isBacklog,weekDates,onAssign,onAddSub,onToggleSub,onDeleteSub,onAddTNote,onDelTNote,dragging}){
  const [subVal,setSubVal]=useState(''),[noteVal,setNoteVal]=useState('')
  const [showSub,setShowSub]=useState(false),[showNote,setShowNote]=useState(false),[dayMenu,setDayMenu]=useState(false)
  const prog=task.subtasks?.length?Math.round(task.subtasks.filter(s=>s.done).length/task.subtasks.length*100):null
  return<div draggable onDragStart={()=>{dragging.current=task.id}}
    style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:11,marginBottom:8,overflow:'hidden',boxShadow:'var(--shadow-sm)',opacity:task.done?.65:1}}>
    <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'10px 12px'}}>
      <span style={{color:'var(--text-4)',cursor:'grab',fontSize:14,marginTop:1}}>⠿</span>
      <div className={`chk${task.done?' on':''}`} onClick={()=>onToggle(!task.done)} style={{marginTop:1}}/>
      <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={onExpand}>
        <div style={{fontSize:13.5,fontWeight:500,lineHeight:1.4,color:'var(--text)',textDecoration:task.done?'line-through':'none',wordBreak:'break-word'}}>{task.title}</div>
        {prog!==null&&<div style={{marginTop:5,height:3,borderRadius:4,background:'var(--surface3)'}}><div style={{height:'100%',width:`${prog}%`,borderRadius:4,background:'var(--accent)',transition:'width .3s'}}/></div>}
        {task.subtasks?.length>0&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length} подзадач</div>}
      </div>
      <div style={{display:'flex',gap:2,flexShrink:0}}>
        {isBacklog&&<div style={{position:'relative'}}>
          <button className="bdel" onClick={()=>setDayMenu(v=>!v)} title="Назначить день">📅</button>
          {dayMenu&&<div style={{position:'absolute',right:0,top:28,background:'var(--surface)',border:'1px solid var(--border-med)',borderRadius:10,zIndex:20,overflow:'hidden',boxShadow:'var(--shadow-lg)',minWidth:150}}>
            {weekDates.map((d,i)=><button key={i} onClick={()=>{onAssign(dkey(d));setDayMenu(false)}}
              style={{display:'block',width:'100%',background:'transparent',border:'none',cursor:'pointer',padding:'7px 14px',textAlign:'left',fontFamily:'inherit',fontSize:13,color:'var(--text)',fontWeight:500}}
              onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              <span style={{color:'var(--text-3)',marginRight:8,fontSize:11}}>{DAYS_SHORT[i]}</span>{d.getDate()} {MONTHS_GEN[d.getMonth()]}
            </button>)}
          </div>}
        </div>}
        {onUnassign&&<button className="bdel" onClick={onUnassign} title="Убрать из дня">↩</button>}
        <button className="bdel" onClick={onDelete}>×</button>
      </div>
    </div>
    {isExpanded&&<div style={{borderTop:'1px solid var(--border)',padding:'12px 14px',background:'var(--surface2)',display:'flex',flexDirection:'column',gap:14}}>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text-3)',textTransform:'uppercase'}}>Подзадачи</span>
          <button className="btn btn-s" style={{padding:'2px 9px',fontSize:11}} onClick={()=>setShowSub(v=>!v)}>+ добавить</button>
        </div>
        {showSub&&<div style={{display:'flex',gap:6,marginBottom:8}}>
          <input className="inp" style={{fontSize:12,padding:'5px 9px'}} value={subVal} onChange={e=>setSubVal(e.target.value)} placeholder="Подзадача…" autoFocus onKeyDown={e=>{if(e.key==='Enter'&&subVal.trim()){onAddSub(subVal.trim());setSubVal('');setShowSub(false)}if(e.key==='Escape')setShowSub(false)}}/>
          <button className="btn btn-p" style={{padding:'4px 10px',fontSize:12}} onClick={()=>{if(subVal.trim()){onAddSub(subVal.trim());setSubVal('');setShowSub(false)}}}>✓</button>
        </div>}
        {(task.subtasks||[]).map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--border)'}}>
          <div className={`chk sm${s.done?' on':''}`} onClick={()=>onToggleSub(s.id,!s.done)}/>
          <span style={{flex:1,fontSize:13,color:s.done?'var(--text-3)':'var(--text)',textDecoration:s.done?'line-through':'none'}}>{s.title}</span>
          <button className="bdel" style={{width:18,height:18,fontSize:12}} onClick={()=>onDeleteSub(s.id)}>×</button>
        </div>)}
        {!(task.subtasks||[]).length&&!showSub&&<div style={{fontSize:12,color:'var(--text-4)'}}>Нет подзадач</div>}
      </div>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text-3)',textTransform:'uppercase'}}>Заметки</span>
          <button className="btn btn-s" style={{padding:'2px 9px',fontSize:11}} onClick={()=>setShowNote(v=>!v)}>+ добавить</button>
        </div>
        {showNote&&<div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:8}}>
          <textarea className="inp" rows={2} style={{fontSize:12,padding:'6px 9px'}} value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder="Заметка к задаче…" autoFocus/>
          <div style={{display:'flex',gap:6}}>
            <button className="btn btn-p" style={{flex:1,padding:'5px 0',fontSize:12}} onClick={()=>{if(noteVal.trim()){onAddTNote(noteVal.trim());setNoteVal('');setShowNote(false)}}}>Добавить</button>
            <button className="btn btn-s" style={{flex:1,padding:'5px 0',fontSize:12}} onClick={()=>{setShowNote(false);setNoteVal('')}}>Отмена</button>
          </div>
        </div>}
        {(task.notes||[]).map(n=><div key={n.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',marginBottom:6,fontSize:13,color:'var(--text)',lineHeight:1.6,position:'relative'}}>
          <span style={{color:'var(--text-3)',fontSize:11,marginRight:8}}>{n.date}</span>{n.text}
          <button className="bdel" style={{position:'absolute',right:5,top:5,width:18,height:18,fontSize:12}} onClick={()=>onDelTNote(n.id)}>×</button>
        </div>)}
        {!(task.notes||[]).length&&!showNote&&<div style={{fontSize:12,color:'var(--text-4)'}}>Нет заметок</div>}
      </div>
    </div>}
  </div>
}

function NoteCard({note,editing,onEdit,onUpdate,onDelete,onAddBlock,onUpdateBlock,onDeleteBlock,onUploadFile}){
  const [addMenu,setAddMenu]=useState(false),[codeEdit,setCodeEdit]=useState(null)
  const fileRef=useRef()
  const handleFile=e=>{const f=e.target.files?.[0];if(f){onUploadFile(f);setAddMenu(false)};e.target.value=''}
  return<div className="ncard fi">
    <div style={{padding:'15px 18px 12px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
      {editing
        ?<input className="inp" value={note.title} onChange={e=>onUpdate('title',e.target.value)} placeholder="Название заметки…" style={{fontSize:15,fontWeight:700,flex:1}} autoFocus/>
        :<h3 onClick={onEdit} style={{fontSize:15,fontWeight:700,color:'var(--text)',cursor:'pointer',flex:1,lineHeight:1.35}}>{note.title||<span style={{color:'var(--text-4)',fontStyle:'italic',fontWeight:400}}>Без названия</span>}</h3>}
      <div style={{display:'flex',gap:5,flexShrink:0}}>
        <button className="btn btn-s" style={{padding:'3px 10px',fontSize:12}} onClick={onEdit}>{editing?'Готово':'Изменить'}</button>
        <button className="bdel" onClick={onDelete} style={{width:26,height:26,fontSize:14}}>×</button>
      </div>
    </div>
    <div style={{padding:'14px 18px 18px',display:'flex',flexDirection:'column',gap:10}}>
      {editing
        ?<textarea className="inp" rows={3} value={note.text} onChange={e=>onUpdate('text',e.target.value)} placeholder="Текст заметки…"/>
        :note.text&&<div style={{fontSize:14,color:'var(--text-2)',lineHeight:1.75,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{note.text}</div>}
      {(note.blocks||[]).map(block=><div key={block.id}>
        {block.type==='code'&&<div className="cblock">
          <div className="chdr">
            <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',letterSpacing:.5}}>{(block.language||'code').toUpperCase()}</span>
            <div style={{display:'flex',gap:8}}>
              {editing&&<button style={{background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:12}} onClick={()=>setCodeEdit(codeEdit===block.id?null:block.id)}>✏️</button>}
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:12}} onClick={()=>navigator.clipboard?.writeText(block.content)} title="Скопировать">📋</button>
              {editing&&<button style={{background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,100,100,0.5)',fontSize:14,fontWeight:700}} onClick={()=>onDeleteBlock(block.id)}>×</button>}
            </div>
          </div>
          {codeEdit===block.id
            ?<div style={{padding:'10px 14px'}}>
              <select value={block.language||'javascript'} onChange={e=>onUpdateBlock(block.id,{language:e.target.value})}
                style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'var(--code-text)',borderRadius:6,padding:'3px 8px',fontSize:12,fontFamily:'inherit',marginBottom:8,width:'100%'}}>
                {CODE_LANGS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
              <textarea className="cedit" value={block.content} onChange={e=>onUpdateBlock(block.id,{content:e.target.value})} rows={5}/>
            </div>
            :<div className="ccode">{block.content||<span style={{opacity:.3}}>{'// пусто'}</span>}</div>}
        </div>}
        {block.type==='file'&&<div className="fblock">
          <div style={{width:36,height:36,borderRadius:8,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
            {block.mimetype?.startsWith('image/')?'🖼️':block.mimetype?.startsWith('video/')?'🎬':block.mimetype?.includes('pdf')?'📄':'📎'}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{block.filename}</div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{fmtBytes(block.filesize||0)}</div>
          </div>
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            <a href={api.fileUrl(block.filepath)} download={block.filename} target="_blank" rel="noreferrer"
              style={{background:'var(--accent-bg)',color:'var(--accent-text)',borderRadius:7,padding:'5px 10px',fontSize:12,fontWeight:600,cursor:'pointer',textDecoration:'none'}}>↓</a>
            {editing&&<button className="bdel" onClick={()=>onDeleteBlock(block.id)}>×</button>}
          </div>
        </div>}
      </div>)}
      {editing&&<div style={{position:'relative'}}>
        <button className="btn btn-s" style={{width:'100%',padding:'7px 0',fontSize:13,gap:6}} onClick={()=>setAddMenu(v=>!v)}>
          <span style={{fontSize:16}}>+</span> Добавить блок
        </button>
        {addMenu&&<div className="fi" style={{position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border-med)',borderRadius:12,overflow:'hidden',boxShadow:'var(--shadow-lg)',zIndex:10}}>
          <BBtn icon="💻" label="Блок кода" sub="JS, Python, SQL, Bash…" onClick={()=>{onAddBlock({type:'code',content:'',language:'javascript'});setAddMenu(false)}}/>
          <BBtn icon="📎" label="Прикрепить файл" sub="Изображение, документ, до 50 МБ" onClick={()=>fileRef.current?.click()}/>
          <input ref={fileRef} type="file" style={{display:'none'}} onChange={handleFile}/>
        </div>}
      </div>}
    </div>
  </div>
}

function BBtn({icon,label,sub,onClick}){
  return<button onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,width:'100%',background:'transparent',border:'none',cursor:'pointer',padding:'11px 16px',fontFamily:'inherit',textAlign:'left',transition:'background .12s'}}
    onMouseOver={e=>e.currentTarget.style.background='var(--surface2)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
    <span style={{fontSize:20}}>{icon}</span>
    <div>
      <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{label}</div>
      <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{sub}</div>
    </div>
  </button>
}
