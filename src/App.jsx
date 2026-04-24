import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DAYS_FULL  = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const MONTHS     = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

let _id = Date.now();
const uid = () => String(++_id);

function getWeekDates(base) {
  const d = new Date(base);
  const dow = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x;
  });
}

const dkey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const todayKey = dkey(new Date());

// ─── Theme system ─────────────────────────────────────────────────────────────
const themes = {
  light: {
    "--bg":            "#F7F8FC",
    "--surface":       "#FFFFFF",
    "--surface2":      "#F0F2F8",
    "--surface3":      "#E8EBF4",
    "--border":        "rgba(30,40,80,0.08)",
    "--border-med":    "rgba(30,40,80,0.14)",
    "--text":          "#14182B",
    "--text-2":        "#5B6280",
    "--text-3":        "#9CA3C0",
    "--text-4":        "#C8CCE0",
    "--accent":        "#4A6CF7",
    "--accent-bg":     "rgba(74,108,247,0.09)",
    "--accent-text":   "#3457D5",
    "--accent-light":  "#6B8EFA",
    "--green":         "#1B9E6E",
    "--green-bg":      "rgba(27,158,110,0.09)",
    "--red":           "#D94040",
    "--today-bg":      "rgba(74,108,247,0.07)",
    "--today-border":  "#4A6CF7",
    "--weekend-bg":    "rgba(30,40,80,0.022)",
    "--header-bg":     "#FFFFFF",
    "--shadow-sm":     "0 1px 3px rgba(14,20,60,0.08), 0 1px 2px rgba(14,20,60,0.05)",
    "--shadow-md":     "0 4px 16px rgba(14,20,60,0.12), 0 2px 6px rgba(14,20,60,0.07)",
    "--shadow-lg":     "0 8px 32px rgba(14,20,60,0.16)",
    "--panel-shadow":  "-4px 0 24px rgba(14,20,60,0.12)",
  },
  dark: {
    "--bg":            "#0F1117",
    "--surface":       "#181B24",
    "--surface2":      "#1F2330",
    "--surface3":      "#262A38",
    "--border":        "rgba(255,255,255,0.07)",
    "--border-med":    "rgba(255,255,255,0.13)",
    "--text":          "#E8EAF2",
    "--text-2":        "#8B92B3",
    "--text-3":        "#4E5470",
    "--text-4":        "#2E3250",
    "--accent":        "#5B7FFF",
    "--accent-bg":     "rgba(91,127,255,0.14)",
    "--accent-text":   "#8FABFF",
    "--accent-light":  "#7A9BFF",
    "--green":         "#2DBE8A",
    "--green-bg":      "rgba(45,190,138,0.12)",
    "--red":           "#E05555",
    "--today-bg":      "rgba(91,127,255,0.12)",
    "--today-border":  "#5B7FFF",
    "--weekend-bg":    "rgba(255,255,255,0.018)",
    "--header-bg":     "#13161F",
    "--shadow-sm":     "0 1px 3px rgba(0,0,0,0.3)",
    "--shadow-md":     "0 4px 16px rgba(0,0,0,0.4)",
    "--shadow-lg":     "0 8px 32px rgba(0,0,0,0.5)",
    "--panel-shadow":  "-4px 0 24px rgba(0,0,0,0.4)",
  }
};

function resolveTheme(key) {
  if (key === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return key;
}

// ─── Persist ──────────────────────────────────────────────────────────────────
function loadState() {
  try { const s = localStorage.getItem("qp_v4"); if (s) return JSON.parse(s); } catch {}
  return { tasks: [], notes: [] };
}
function saveState(s) { try { localStorage.setItem("qp_v4", JSON.stringify(s)); } catch {} }

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("qp_theme") || "system");
  const resolved = resolveTheme(themeMode);
  const T = themes[resolved];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(T).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.background = T["--bg"];
    localStorage.setItem("qp_theme", themeMode);
  }, [T, themeMode]);

  const [data, setData] = useState(loadState);
  const [tab, setTab]   = useState("planner");
  const [weekBase, setWeekBase] = useState(new Date());
  const weekDates = getWeekDates(weekBase);

  // Panel state
  const [panel, setPanel]   = useState(null); // null | { mode:"backlog"|"day", dk?:string, date?:Date }
  const [expanded, setExpanded] = useState(null);

  // Drag
  const dragging = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  // Notebook
  const [editingNote, setEditingNote] = useState(null);
  const [addingNote, setAddingNote]   = useState(false);
  const [newNote, setNewNote] = useState({ title: "", text: "" });

  const mutate = useCallback((fn) => {
    setData(prev => { const next = fn(prev); saveState(next); return next; });
  }, []);

  // ── Task ops ──────────────────────────────────────────────────────────────
  const addTask = (title, dk) => mutate(d => ({
    ...d, tasks: [...d.tasks, { id:uid(), title:title.trim(), done:false, subtasks:[], notes:[], dk: dk||null }]
  }));
  const toggleTask  = id => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id===id?{...t,done:!t.done}:t) }));
  const deleteTask  = id => mutate(d => ({ ...d, tasks: d.tasks.filter(t => t.id!==id) }));
  const assignDk    = (id, dk) => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id===id?{...t,dk}:t) }));
  const unassignDk  = id => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id===id?{...t,dk:null}:t) }));
  const addSub      = (tid, title) => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id!==tid?t:{...t,subtasks:[...(t.subtasks||[]),{id:uid(),title,done:false}]})}));
  const toggleSub   = (tid, sid)   => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id!==tid?t:{...t,subtasks:t.subtasks.map(s=>s.id===sid?{...s,done:!s.done}:s)})}));
  const deleteSub   = (tid, sid)   => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id!==tid?t:{...t,subtasks:t.subtasks.filter(s=>s.id!==sid)})}));
  const addTNote    = (tid, text)  => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id!==tid?t:{...t,notes:[...(t.notes||[]),{id:uid(),text,date:new Date().toLocaleDateString("ru")}]})}));
  const delTNote    = (tid, nid)   => mutate(d => ({ ...d, tasks: d.tasks.map(t => t.id!==tid?t:{...t,notes:t.notes.filter(n=>n.id!==nid)})}));

  // ── Note ops ──────────────────────────────────────────────────────────────
  const saveNote   = () => {
    if (!newNote.title.trim()) return;
    mutate(d => ({ ...d, notes: [...d.notes, { id:uid(), ...newNote }] }));
    setNewNote({ title:"", text:"" }); setAddingNote(false);
  };
  const patchNote  = (id, f, v) => mutate(d => ({ ...d, notes: d.notes.map(n=>n.id===id?{...n,[f]:v}:n) }));
  const deleteNote = id => { mutate(d => ({ ...d, notes: d.notes.filter(n=>n.id!==id) })); if(editingNote===id)setEditingNote(null); };

  // ── Panel helpers ─────────────────────────────────────────────────────────
  const openDay     = (date) => { setPanel({ mode:"day", dk:dkey(date), date }); setExpanded(null); };
  const openBacklog = ()     => { setPanel({ mode:"backlog" }); setExpanded(null); };
  const closePanel  = ()     => setPanel(null);

  const panelTasks = !panel ? [] :
    panel.mode === "backlog"
      ? data.tasks.filter(t => !t.dk)
      : data.tasks.filter(t => t.dk === panel.dk);

  const panelLabel = !panel ? "" :
    panel.mode === "backlog" ? "Все задачи" :
    `${DAYS_FULL[(panel.date.getDay()+6)%7]}, ${panel.date.getDate()} ${MONTHS_GEN[panel.date.getMonth()]}`;

  // ─────────────────────────────────────────────────────────────────────────
  const PANEL_W = 380;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; }
        body { background:var(--bg); color:var(--text); min-height:100vh; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--surface3); border-radius:8px; }

        /* Buttons */
        .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px;
          font-family:inherit; font-size:13px; font-weight:600; line-height:1;
          border:none; border-radius:8px; cursor:pointer; transition:all .15s ease; padding:0; }
        .btn-primary { background:var(--accent); color:#fff; padding:7px 16px; letter-spacing:.2px; }
        .btn-primary:hover { filter:brightness(1.12); transform:translateY(-1px); box-shadow:var(--shadow-sm); }
        .btn-primary:active { transform:translateY(0); }
        .btn-secondary { background:var(--surface2); color:var(--text-2); border:1px solid var(--border); padding:6px 14px; }
        .btn-secondary:hover { background:var(--surface3); color:var(--text); border-color:var(--border-med); }
        .btn-ghost { background:transparent; color:var(--text-3); width:28px; height:28px; border-radius:7px; font-size:16px; }
        .btn-ghost:hover { background:var(--surface3); color:var(--text-2); }
        .btn-del { background:transparent; color:var(--text-4); border:none; cursor:pointer;
          font-family:inherit; font-size:13px; width:22px; height:22px; border-radius:5px;
          display:flex; align-items:center; justify-content:center; transition:all .12s; }
        .btn-del:hover { background:rgba(210,50,50,0.12); color:var(--red); }

        /* Inputs */
        .inp { width:100%; background:var(--surface2); border:1.5px solid var(--border);
          color:var(--text); border-radius:9px; padding:8px 12px;
          font-family:inherit; font-size:14px; outline:none; transition:border-color .15s; }
        .inp:focus { border-color:var(--accent); background:var(--surface); }
        .inp::placeholder { color:var(--text-4); }
        textarea.inp { resize:vertical; line-height:1.65; }

        /* Checkbox */
        .chk { width:17px; height:17px; border-radius:5px; flex-shrink:0; cursor:pointer;
          border:2px solid var(--border-med); display:flex; align-items:center;
          justify-content:center; transition:all .15s; }
        .chk.on { background:var(--accent); border-color:var(--accent); }
        .chk.on::after { content:""; display:block; width:5px; height:9px;
          border:2px solid #fff; border-top:none; border-left:none;
          transform:rotate(45deg) translateY(-1px); }

        /* Tab buttons */
        .tab { background:transparent; border:none; cursor:pointer;
          font-family:inherit; font-size:13px; font-weight:600; letter-spacing:.2px;
          padding:0 2px 10px; color:var(--text-3); border-bottom:2px solid transparent;
          transition:all .15s; }
        .tab.on { color:var(--accent); border-bottom-color:var(--accent); }
        .tab:hover:not(.on) { color:var(--text-2); }

        /* Theme toggle pills */
        .theme-pill { background:transparent; border:1.5px solid var(--border); border-radius:20px;
          padding:4px 12px; font-size:12px; font-weight:600; cursor:pointer;
          font-family:inherit; color:var(--text-3); transition:all .15s; }
        .theme-pill.on { background:var(--accent-bg); border-color:var(--accent); color:var(--accent-text); }
        .theme-pill:hover:not(.on) { border-color:var(--border-med); color:var(--text-2); }

        /* Calendar tile */
        .cal-day { border-radius:16px; border:1.5px solid var(--border);
          background:var(--surface); transition:box-shadow .15s, transform .15s, border-color .15s; }
        .cal-day:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); border-color:var(--border-med); }

        /* Task chip in calendar */
        .chip { display:flex; align-items:center; gap:5px; border-radius:6px;
          padding:3px 7px; font-size:12px; font-weight:500; cursor:pointer;
          transition:all .12s; white-space:nowrap; overflow:hidden; max-width:100%; }
        .chip:hover { filter:brightness(0.93); }

        /* Slide panel */
        .panel { position:fixed; top:0; right:0; height:100vh; width:${PANEL_W}px;
          background:var(--surface); border-left:1px solid var(--border);
          display:flex; flex-direction:column; z-index:50;
          box-shadow:var(--panel-shadow);
          transform:translateX(100%);
          transition:transform .3s cubic-bezier(0.4,0,0.2,1); }
        .panel.open { transform:translateX(0); }

        /* Note card */
        .note-card { background:var(--surface); border:1px solid var(--border);
          border-radius:14px; overflow:hidden;
          transition:box-shadow .2s, transform .2s; }
        .note-card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }

        /* Drag-over highlight */
        .drop-target { background:var(--accent-bg) !important;
          outline:2px dashed var(--accent); outline-offset:-3px; }

        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        .fade-in { animation:fadeIn .18s ease both; }

        /* Scrollbar for panel */
        .panel-body { flex:1; overflow-y:auto; padding:12px 16px; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{
        background:"var(--header-bg)", borderBottom:"1px solid var(--border)",
        position:"sticky", top:0, zIndex:40, height:54,
        display:"flex", alignItems:"center", padding:"0 24px", gap:20,
        boxShadow:"var(--shadow-sm)"
      }}>
        {/* Logo */}
        <div style={{ fontWeight:700, fontSize:18, letterSpacing:-.5, flexShrink:0 }}>
          <span style={{ color:"var(--accent)" }}>Quest</span>
          <span style={{ color:"var(--text)" }}>Plan</span>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:20, borderBottom:"none", marginLeft:12 }}>
          <button className={`tab${tab==="planner"?" on":""}`} onClick={()=>setTab("planner")}>Планировщик</button>
          <button className={`tab${tab==="notebook"?" on":""}`} onClick={()=>setTab("notebook")}>Записная книжка</button>
        </div>

        <div style={{ flex:1 }} />

        {/* Theme switcher */}
        <div style={{ display:"flex", gap:6 }}>
          {[["light","☀︎ Светлая"],["system","⊙ Авто"],["dark","☾ Тёмная"]].map(([k,label])=>(
            <button key={k} className={`theme-pill${themeMode===k?" on":""}`} onClick={()=>setThemeMode(k)}>{label}</button>
          ))}
        </div>

        {/* Header actions */}
        {tab==="planner" && (
          <button className="btn btn-secondary" style={{ marginLeft:8, flexShrink:0 }} onClick={openBacklog}>
            <span style={{ fontSize:14 }}>☰</span>
            Задачи
            {data.tasks.filter(t=>!t.dk).length > 0 && (
              <span style={{
                background:"var(--accent-bg)", color:"var(--accent-text)",
                borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700
              }}>{data.tasks.filter(t=>!t.dk).length}</span>
            )}
          </button>
        )}
        {tab==="notebook" && (
          <button className="btn btn-primary" style={{ marginLeft:8, flexShrink:0 }} onClick={()=>setAddingNote(true)}>
            + Заметка
          </button>
        )}
      </header>

      {/* ═══ PLANNER ═══ */}
      {tab==="planner" && (
        <div style={{
          display:"flex", height:"calc(100vh - 54px)", overflow:"hidden",
          transition:"all .3s"
        }}>
          {/* Main calendar area */}
          <div style={{
            flex:1, display:"flex", flexDirection:"column", overflow:"hidden",
            marginRight: panel ? PANEL_W : 0,
            transition:"margin-right .3s cubic-bezier(0.4,0,0.2,1)"
          }}>

            {/* Week navigation bar */}
            <div style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 24px",
              background:"var(--surface)", borderBottom:"1px solid var(--border)", flexShrink:0
            }}>
              <button className="btn btn-ghost" onClick={()=>setWeekBase(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n;})}>‹</button>
              <div style={{ fontWeight:700, fontSize:16, minWidth:260, color:"var(--text)" }}>
                {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
                {weekDates[0].getMonth()!==weekDates[6].getMonth() &&
                  <span style={{ color:"var(--text-3)" }}> — {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}</span>}
              </div>
              <button className="btn btn-ghost" onClick={()=>setWeekBase(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n;})}>›</button>
              <button className="btn btn-secondary" style={{ padding:"5px 14px", fontSize:12 }} onClick={()=>setWeekBase(new Date())}>
                Сегодня
              </button>
            </div>

            {/* Calendar tile grid */}
            <div style={{ flex:1, overflow:"auto" }}>
              <div style={{
                display:"grid", gridTemplateColumns:"repeat(7,1fr)",
                gap:12, padding:"16px 20px 24px",
                minHeight:"100%", alignContent:"start"
              }}>
                {weekDates.map((date, di) => {
                  const dk        = dkey(date);
                  const isToday   = dk === todayKey;
                  const isWknd    = di >= 5;
                  const isActive  = panel?.mode==="day" && panel.dk===dk;
                  const dayTasks  = data.tasks.filter(t => t.dk === dk);
                  const isDragOver = dragOver === dk;

                  return (
                    <div key={di}
                      className={`cal-day${isDragOver?" drop-target":""}`}
                      style={{
                        display:"flex", flexDirection:"column", padding:"14px 12px 10px", gap:5,
                        cursor:"pointer", minHeight:220,
                        background: isActive
                          ? "var(--accent-bg)"
                          : isToday
                            ? "var(--today-bg)"
                            : isWknd
                              ? "var(--weekend-bg)"
                              : "var(--surface)",
                        borderColor: isActive
                          ? "var(--accent)"
                          : isToday
                            ? "var(--today-border)"
                            : "var(--border)",
                        boxShadow: isActive || isToday ? "var(--shadow-md)" : "var(--shadow-sm)",
                      }}
                      onDragOver={e=>{ e.preventDefault(); setDragOver(dk); }}
                      onDragLeave={()=>setDragOver(null)}
                      onDrop={e=>{
                        e.preventDefault();
                        if (dragging.current) { assignDk(dragging.current, dk); dragging.current=null; }
                        setDragOver(null);
                      }}
                      onClick={()=>{ if(!isDragOver) isActive?closePanel():openDay(date); }}
                    >
                      {/* Tile header: day name + number */}
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
                        <div>
                          <div style={{
                            fontSize:10, fontWeight:700, letterSpacing:1.2,
                            textTransform:"uppercase", marginBottom:3,
                            color: isToday||isActive ? "var(--accent)" : isWknd ? "var(--text-3)" : "var(--text-3)"
                          }}>{DAYS_SHORT[di]}</div>
                          <div style={{
                            fontSize:26, fontWeight:800, lineHeight:1, letterSpacing:-.5,
                            color: isToday||isActive ? "var(--accent)" : isWknd ? "var(--text-3)" : "var(--text)"
                          }}>
                            {date.getDate()}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                          {isToday && (
                            <span style={{
                              fontSize:10, fontWeight:700, color:"var(--accent)",
                              background:"var(--accent-bg)", borderRadius:8, padding:"2px 7px",
                              letterSpacing:.5
                            }}>сегодня</span>
                          )}
                          {dayTasks.length > 0 && (
                            <span style={{
                              fontSize:10, fontWeight:700, color:"var(--text-3)",
                              background:"var(--surface2)", borderRadius:8, padding:"2px 7px"
                            }}>
                              {dayTasks.filter(t=>t.done).length}/{dayTasks.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ height:1, background:"var(--border)", marginBottom:4, flexShrink:0 }} />

                      {/* Task chips */}
                      {dayTasks.slice(0,6).map(task => (
                        <div key={task.id}
                          className="chip"
                          draggable
                          onDragStart={e=>{ e.stopPropagation(); dragging.current=task.id; }}
                          onClick={e=>{ e.stopPropagation(); openDay(date); setExpanded(task.id); }}
                          style={{
                            background: task.done ? "var(--green-bg)" : "var(--surface2)",
                            color: task.done ? "var(--green)" : "var(--text-2)",
                            opacity: task.done ? .75 : 1,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span style={{
                            width:6, height:6, borderRadius:"50%", flexShrink:0,
                            background: task.done ? "var(--green)" : "var(--accent)",
                          }} />
                          <span style={{ overflow:"hidden", textOverflow:"ellipsis", flex:1 }}>
                            {task.done ? <s>{task.title}</s> : task.title}
                          </span>
                        </div>
                      ))}
                      {dayTasks.length > 6 && (
                        <div style={{ fontSize:11, color:"var(--text-3)", paddingLeft:4 }}>
                          ещё +{dayTasks.length-6}
                        </div>
                      )}

                      {/* Quick add */}
                      <div style={{ marginTop:"auto", paddingTop:4 }} onClick={e=>e.stopPropagation()}>
                        <QuickAdd placeholder="+ задача" onAdd={t=>addTask(t,dk)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── SLIDING PANEL ── */}
          <div className={`panel${panel?" open":""}`}>
            {panel && (
              <SlidePanel
                label={panelLabel}
                tasks={panelTasks}
                isBacklog={panel.mode==="backlog"}
                expanded={expanded}
                setExpanded={setExpanded}
                weekDates={weekDates}
                onClose={closePanel}
                onAdd={t=>panel.mode==="backlog"?addTask(t,null):addTask(t,panel.dk)}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onAssign={(id,dk)=>assignDk(id,dk)}
                onUnassign={panel.mode==="day" ? unassignDk : null}
                onAddSub={addSub}
                onToggleSub={toggleSub}
                onDeleteSub={deleteSub}
                onAddTNote={addTNote}
                onDelTNote={delTNote}
                dragging={dragging}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══ NOTEBOOK ═══ */}
      {tab==="notebook" && (
        <div style={{ padding:"28px 28px 40px", maxWidth:1300, margin:"0 auto" }}>
          {addingNote && (
            <div className="fade-in" style={{
              background:"var(--surface)", border:"1px solid var(--border)",
              borderRadius:14, padding:22, marginBottom:24,
              boxShadow:"var(--shadow-md)"
            }}>
              <input className="inp" placeholder="Название заметки…" value={newNote.title}
                onChange={e=>setNewNote(n=>({...n,title:e.target.value}))} autoFocus
                style={{ marginBottom:12 }} />
              <textarea className="inp" rows={5} placeholder="Текст заметки…" value={newNote.text}
                onChange={e=>setNewNote(n=>({...n,text:e.target.value}))}
                style={{ marginBottom:12 }} />
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary" onClick={saveNote}>Создать</button>
                <button className="btn btn-secondary" onClick={()=>{ setAddingNote(false); setNewNote({title:"",text:""}); }}>Отмена</button>
              </div>
            </div>
          )}

          {data.notes.length===0 && !addingNote && (
            <div style={{ textAlign:"center", color:"var(--text-3)", padding:"80px 0", fontSize:15 }}>
              Нет заметок — нажмите «+ Заметка»
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:18 }}>
            {data.notes.map(note => (
              <NoteCard key={note.id} note={note}
                editing={editingNote===note.id}
                onEdit={()=>setEditingNote(editingNote===note.id?null:note.id)}
                onUpdate={(f,v)=>patchNote(note.id,f,v)}
                onDelete={()=>deleteNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── QuickAdd ─────────────────────────────────────────────────────────────────
function QuickAdd({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [val, setVal]   = useState("");
  const go = () => { if(val.trim()){ onAdd(val.trim()); setVal(""); setOpen(false); } };

  if (!open) return (
    <button
      onClick={()=>setOpen(true)}
      style={{
        background:"transparent", border:"none", cursor:"pointer",
        color:"var(--text-4)", fontSize:12, fontWeight:500,
        padding:"4px 6px", borderRadius:6, width:"100%", textAlign:"left",
        fontFamily:"inherit", transition:"color .12s, background .12s"
      }}
      onMouseOver={e=>{ e.currentTarget.style.color="var(--accent)"; e.currentTarget.style.background="var(--accent-bg)"; }}
      onMouseOut={e=>{ e.currentTarget.style.color="var(--text-4)"; e.currentTarget.style.background="transparent"; }}
    >{placeholder}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:4 }}>
      <input className="inp" style={{ fontSize:12, padding:"5px 9px" }}
        value={val} onChange={e=>setVal(e.target.value)} placeholder="Задача…" autoFocus
        onKeyDown={e=>{ if(e.key==="Enter")go(); if(e.key==="Escape"){ setOpen(false); setVal(""); } }} />
      <div style={{ display:"flex", gap:5 }}>
        <button className="btn btn-primary" style={{ flex:1, padding:"4px 0", fontSize:12 }} onClick={go}>✓</button>
        <button className="btn btn-secondary" style={{ flex:1, padding:"4px 0", fontSize:12 }} onClick={()=>{ setOpen(false); setVal(""); }}>✕</button>
      </div>
    </div>
  );
}

// ─── SlidePanel ───────────────────────────────────────────────────────────────
function SlidePanel({ label, tasks, isBacklog, expanded, setExpanded, weekDates,
  onClose, onAdd, onToggle, onDelete, onAssign, onUnassign,
  onAddSub, onToggleSub, onDeleteSub, onAddTNote, onDelTNote, dragging }) {

  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");

  const go = () => { if(newVal.trim()){ onAdd(newVal.trim()); setNewVal(""); setAdding(false); } };

  return (
    <>
      {/* Panel header */}
      <div style={{
        padding:"16px 18px 12px", borderBottom:"1px solid var(--border)",
        flexShrink:0, background:"var(--surface)"
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", lineHeight:1.3 }}>{label}</div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <button className="btn btn-primary" style={{ padding:"5px 13px", fontSize:12 }}
              onClick={()=>setAdding(v=>!v)}>+ Задача</button>
            <button className="btn btn-ghost" onClick={onClose} title="Закрыть">×</button>
          </div>
        </div>
        <div style={{ fontSize:12, color:"var(--text-3)", marginTop:4 }}>
          {tasks.length} задач · {tasks.filter(t=>t.done).length} выполнено
        </div>

        {adding && (
          <div className="fade-in" style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
            <input className="inp" placeholder="Название задачи…" value={newVal}
              onChange={e=>setNewVal(e.target.value)} autoFocus
              onKeyDown={e=>{ if(e.key==="Enter")go(); if(e.key==="Escape")setAdding(false); }} />
            <div style={{ display:"flex", gap:7 }}>
              <button className="btn btn-primary" style={{ flex:1, padding:"6px 0" }} onClick={go}>Добавить</button>
              <button className="btn btn-secondary" style={{ flex:1, padding:"6px 0" }} onClick={()=>setAdding(false)}>Отмена</button>
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="panel-body">
        {tasks.length===0 && (
          <div style={{ textAlign:"center", color:"var(--text-3)", padding:"40px 0 20px", fontSize:13 }}>
            {isBacklog ? "Нет задач в очереди.\nПеретяните задачи из панели на день." : "Нет задач на этот день"}
          </div>
        )}
        {tasks.map(task => (
          <PanelTask key={task.id} task={task}
            isExpanded={expanded===task.id}
            onExpand={()=>setExpanded(expanded===task.id?null:task.id)}
            onToggle={()=>onToggle(task.id)}
            onDelete={()=>onDelete(task.id)}
            onUnassign={onUnassign?()=>onUnassign(task.id):null}
            isBacklog={isBacklog}
            weekDates={weekDates}
            onAssign={(dk)=>onAssign(task.id,dk)}
            onAddSub={t=>onAddSub(task.id,t)}
            onToggleSub={s=>onToggleSub(task.id,s)}
            onDeleteSub={s=>onDeleteSub(task.id,s)}
            onAddTNote={t=>onAddTNote(task.id,t)}
            onDelTNote={n=>onDelTNote(task.id,n)}
            dragging={dragging}
          />
        ))}
      </div>
    </>
  );
}

// ─── PanelTask ────────────────────────────────────────────────────────────────
function PanelTask({ task, isExpanded, onExpand, onToggle, onDelete, onUnassign,
  isBacklog, weekDates, onAssign, onAddSub, onToggleSub, onDeleteSub, onAddTNote, onDelTNote, dragging }) {

  const [subVal, setSubVal]     = useState("");
  const [noteVal, setNoteVal]   = useState("");
  const [showSub, setShowSub]   = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [dayMenu, setDayMenu]   = useState(false);

  const progress = task.subtasks?.length
    ? Math.round(task.subtasks.filter(s=>s.done).length / task.subtasks.length * 100)
    : null;

  const addSub  = () => { if(subVal.trim()){ onAddSub(subVal.trim()); setSubVal(""); setShowSub(false); } };
  const addNote = () => { if(noteVal.trim()){ onAddTNote(noteVal.trim()); setNoteVal(""); setShowNote(false); } };

  return (
    <div
      draggable
      onDragStart={()=>{ dragging.current=task.id; }}
      style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:11, marginBottom:8, overflow:"hidden",
        boxShadow:"var(--shadow-sm)",
        opacity:task.done?.65:1, transition:"opacity .15s, box-shadow .15s"
      }}
    >
      {/* Row */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px" }}>
        <span style={{ color:"var(--text-4)", cursor:"grab", fontSize:14, marginTop:1, flexShrink:0 }}>⠿</span>
        <div className={`chk${task.done?" on":""}`} onClick={onToggle} style={{ marginTop:1 }} />
        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={onExpand}>
          <div style={{
            fontSize:13.5, fontWeight:500, lineHeight:1.4, wordBreak:"break-word",
            color:"var(--text)", textDecoration:task.done?"line-through":"none"
          }}>{task.title}</div>
          {progress!==null && (
            <div style={{ marginTop:5, height:3, borderRadius:4, background:"var(--surface3)" }}>
              <div style={{ height:"100%", width:`${progress}%`, borderRadius:4,
                background:"var(--accent)", transition:"width .3s" }} />
            </div>
          )}
          {task.subtasks?.length>0 && (
            <div style={{ fontSize:11, color:"var(--text-3)", marginTop:3 }}>
              {task.subtasks.filter(s=>s.done).length}/{task.subtasks.length} подзадач
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
          {isBacklog && (
            <div style={{ position:"relative" }}>
              <button className="btn-del" title="Назначить день" onClick={()=>setDayMenu(v=>!v)}
                style={{ fontSize:12 }}>📅</button>
              {dayMenu && (
                <div style={{
                  position:"absolute", right:0, top:28, background:"var(--surface)",
                  border:"1px solid var(--border-med)", borderRadius:10, zIndex:20, overflow:"hidden",
                  boxShadow:"var(--shadow-lg)", minWidth:130
                }}>
                  {weekDates.map((d,i)=>(
                    <button key={i}
                      onClick={()=>{ onAssign(dkey(d)); setDayMenu(false); }}
                      style={{
                        display:"block", width:"100%", background:"transparent",
                        border:"none", cursor:"pointer", padding:"7px 14px",
                        textAlign:"left", fontFamily:"inherit", fontSize:13,
                        color:"var(--text)", fontWeight:500, transition:"background .1s"
                      }}
                      onMouseOver={e=>e.currentTarget.style.background="var(--surface2)"}
                      onMouseOut={e=>e.currentTarget.style.background="transparent"}
                    >
                      <span style={{ color:"var(--text-3)", marginRight:8, fontSize:12 }}>{DAYS_SHORT[i]}</span>
                      {d.getDate()} {MONTHS_GEN[d.getMonth()]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {onUnassign && (
            <button className="btn-del" title="Убрать из дня" onClick={onUnassign} style={{ fontSize:13 }}>↩</button>
          )}
          <button className="btn-del" onClick={onDelete}>×</button>
        </div>
      </div>

      {/* Expanded quest zone */}
      {isExpanded && (
        <div style={{
          borderTop:"1px solid var(--border)", padding:"12px 14px",
          background:"var(--surface2)", display:"flex", flexDirection:"column", gap:14
        }}>

          {/* Subtasks */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:.8, color:"var(--text-3)", textTransform:"uppercase" }}>
                Подзадачи
              </span>
              <button className="btn btn-secondary" style={{ padding:"2px 9px", fontSize:11 }}
                onClick={()=>setShowSub(v=>!v)}>+ добавить</button>
            </div>
            {showSub && (
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                <input className="inp" style={{ fontSize:12, padding:"5px 9px" }}
                  value={subVal} onChange={e=>setSubVal(e.target.value)}
                  placeholder="Подзадача…" autoFocus
                  onKeyDown={e=>{ if(e.key==="Enter")addSub(); if(e.key==="Escape")setShowSub(false); }} />
                <button className="btn btn-primary" style={{ padding:"4px 10px", fontSize:12 }} onClick={addSub}>✓</button>
              </div>
            )}
            {(task.subtasks||[]).length===0 && !showSub && (
              <div style={{ fontSize:12, color:"var(--text-4)" }}>Нет подзадач</div>
            )}
            {(task.subtasks||[]).map(sub => (
              <div key={sub.id} style={{
                display:"flex", alignItems:"center", gap:8, padding:"5px 0",
                borderBottom:"1px solid var(--border)"
              }}>
                <div className={`chk${sub.done?" on":""}`}
                  style={{ width:14, height:14, borderRadius:4 }} onClick={()=>onToggleSub(sub.id)} />
                <span style={{
                  flex:1, fontSize:13, color:sub.done?"var(--text-3)":"var(--text)",
                  textDecoration:sub.done?"line-through":"none"
                }}>{sub.title}</span>
                <button className="btn-del" style={{ width:18, height:18, fontSize:12 }}
                  onClick={()=>onDeleteSub(sub.id)}>×</button>
              </div>
            ))}
          </div>

          {/* Task notes */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:.8, color:"var(--text-3)", textTransform:"uppercase" }}>
                Заметки
              </span>
              <button className="btn btn-secondary" style={{ padding:"2px 9px", fontSize:11 }}
                onClick={()=>setShowNote(v=>!v)}>+ добавить</button>
            </div>
            {showNote && (
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:8 }}>
                <textarea className="inp" rows={2} style={{ fontSize:12, padding:"6px 9px" }}
                  value={noteVal} onChange={e=>setNoteVal(e.target.value)}
                  placeholder="Заметка к задаче…" autoFocus />
                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn btn-primary" style={{ flex:1, padding:"5px 0", fontSize:12 }} onClick={addNote}>Добавить</button>
                  <button className="btn btn-secondary" style={{ flex:1, padding:"5px 0", fontSize:12 }}
                    onClick={()=>{ setShowNote(false); setNoteVal(""); }}>Отмена</button>
                </div>
              </div>
            )}
            {(task.notes||[]).length===0 && !showNote && (
              <div style={{ fontSize:12, color:"var(--text-4)" }}>Нет заметок</div>
            )}
            {(task.notes||[]).map(n => (
              <div key={n.id} style={{
                background:"var(--surface)", border:"1px solid var(--border)",
                borderRadius:8, padding:"8px 10px", marginBottom:6,
                fontSize:13, color:"var(--text)", lineHeight:1.6, position:"relative"
              }}>
                <span style={{ color:"var(--text-3)", fontSize:11, marginRight:8 }}>{n.date}</span>
                {n.text}
                <button className="btn-del" style={{ position:"absolute", right:5, top:6, width:18, height:18, fontSize:12 }}
                  onClick={()=>onDelTNote(n.id)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────
function NoteCard({ note, editing, onEdit, onUpdate, onDelete }) {
  return (
    <div className="note-card fade-in">
      {/* Title bar */}
      <div style={{
        padding:"15px 18px 12px",
        borderBottom:"1px solid var(--border)",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10
      }}>
        {editing
          ? <input className="inp" value={note.title}
              onChange={e=>onUpdate("title",e.target.value)} autoFocus
              style={{ fontSize:15, fontWeight:600, flex:1 }} />
          : <h3 onClick={onEdit} style={{
              fontSize:15, fontWeight:700, color:"var(--text)",
              cursor:"pointer", flex:1, lineHeight:1.35
            }}>{note.title||<span style={{color:"var(--text-4)", fontStyle:"italic"}}>Без названия</span>}</h3>
        }
        <div style={{ display:"flex", gap:5, flexShrink:0 }}>
          <button className="btn btn-secondary" style={{ padding:"3px 10px", fontSize:12 }} onClick={onEdit}>
            {editing?"Готово":"Изменить"}
          </button>
          <button className="btn-del" onClick={onDelete} style={{ width:26, height:26, fontSize:14 }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"14px 18px 18px" }}>
        {editing
          ? <textarea className="inp" rows={6}
              value={note.text} onChange={e=>onUpdate("text",e.target.value)}
              placeholder="Текст заметки…" style={{ minHeight:100 }} />
          : <div onClick={onEdit} style={{
              fontSize:14, color:note.text?"var(--text-2)":"var(--text-4)",
              lineHeight:1.75, whiteSpace:"pre-wrap", wordBreak:"break-word",
              cursor:"pointer", minHeight:50, fontStyle:note.text?"normal":"italic"
            }}>{note.text||"Нажмите чтобы добавить текст…"}</div>
        }
      </div>
    </div>
  );
}


