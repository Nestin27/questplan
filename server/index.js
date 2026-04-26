import express from 'express'
import Database from 'better-sqlite3'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

const DATA_DIR    = process.env.DATA_DIR    || path.join(__dirname, '../data')
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../data/uploads')
fs.mkdirSync(DATA_DIR,    { recursive: true })
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'questplan.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0,
    date_key TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, ord INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS task_notes (
    id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL, date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', text TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS note_blocks (
    id TEXT PRIMARY KEY, note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'text', content TEXT NOT NULL DEFAULT '',
    language TEXT, filename TEXT, filepath TEXT, mimetype TEXT, filesize INTEGER,
    ord INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS payment_items (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, amount REAL, currency TEXT NOT NULL DEFAULT 'RUB',
    day_of_month INTEGER NOT NULL DEFAULT 1, color TEXT NOT NULL DEFAULT '#4F6EF7',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS payment_checks (
    id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES payment_items(id) ON DELETE CASCADE,
    year INTEGER NOT NULL, month INTEGER NOT NULL, paid INTEGER NOT NULL DEFAULT 0,
    paid_at TEXT, UNIQUE(item_id, year, month)
  );
`)

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}_${safe}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })
const uid  = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const bool = v => v ? 1 : 0
const now  = () => new Date().toISOString()

// ═══ TASKS ═══════════════════════════════════════════════════════════════════
function getFullTask(id) {
  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(id)
  if (!task) return null
  task.done = !!task.done
  task.subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id=? ORDER BY ord').all(id).map(s=>({...s,done:!!s.done}))
  task.notes    = db.prepare('SELECT * FROM task_notes WHERE task_id=?').all(id)
  return task
}

app.get('/api/tasks', (_, res) => {
  const ids = db.prepare('SELECT id FROM tasks ORDER BY created_at').all()
  res.json(ids.map(r => getFullTask(r.id)))
})
app.post('/api/tasks', (req, res) => {
  const { title, date_key } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title required' })
  const id = uid()
  db.prepare('INSERT INTO tasks (id,title,date_key) VALUES (?,?,?)').run(id, title.trim(), date_key||null)
  res.json(getFullTask(id))
})
app.patch('/api/tasks/:id', (req, res) => {
  const { title, done, date_key } = req.body
  if (title !== undefined) db.prepare('UPDATE tasks SET title=? WHERE id=?').run(title, req.params.id)
  if (done  !== undefined) db.prepare('UPDATE tasks SET done=? WHERE id=?').run(bool(done), req.params.id)
  if ('date_key' in req.body) db.prepare('UPDATE tasks SET date_key=? WHERE id=?').run(date_key||null, req.params.id)
  const t = getFullTask(req.params.id)
  if (!t) return res.status(404).json({ error: 'not found' })
  res.json(t)
})
app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})
app.post('/api/tasks/:id/subtasks', (req, res) => {
  const sid = uid()
  const ord = db.prepare('SELECT COUNT(*) as c FROM subtasks WHERE task_id=?').get(req.params.id).c
  db.prepare('INSERT INTO subtasks (id,task_id,title,ord) VALUES (?,?,?,?)').run(sid, req.params.id, req.body.title.trim(), ord)
  res.json(getFullTask(req.params.id))
})
app.patch('/api/tasks/:id/subtasks/:sid', (req, res) => {
  db.prepare('UPDATE subtasks SET done=? WHERE id=?').run(bool(req.body.done), req.params.sid)
  res.json(getFullTask(req.params.id))
})
app.delete('/api/tasks/:id/subtasks/:sid', (req, res) => {
  db.prepare('DELETE FROM subtasks WHERE id=?').run(req.params.sid)
  res.json(getFullTask(req.params.id))
})
app.post('/api/tasks/:id/notes', (req, res) => {
  const nid = uid()
  db.prepare('INSERT INTO task_notes (id,task_id,text,date) VALUES (?,?,?,?)').run(nid, req.params.id, req.body.text.trim(), new Date().toLocaleDateString('ru'))
  res.json(getFullTask(req.params.id))
})
app.delete('/api/tasks/:id/notes/:nid', (req, res) => {
  db.prepare('DELETE FROM task_notes WHERE id=?').run(req.params.nid)
  res.json(getFullTask(req.params.id))
})

// ═══ NOTES ═══════════════════════════════════════════════════════════════════
function getFullNote(id) {
  const note = db.prepare('SELECT * FROM notes WHERE id=?').get(id)
  if (!note) return null
  note.blocks = db.prepare('SELECT * FROM note_blocks WHERE note_id=? ORDER BY ord').all(id)
  return note
}

app.get('/api/notes', (_, res) => {
  const ids = db.prepare('SELECT id FROM notes ORDER BY updated_at DESC').all()
  res.json(ids.map(r => getFullNote(r.id)))
})
app.post('/api/notes', (req, res) => {
  const id = uid()
  db.prepare('INSERT INTO notes (id,title) VALUES (?,?)').run(id, (req.body.title||'').trim())
  res.json(getFullNote(id))
})
app.patch('/api/notes/:id', (req, res) => {
  const { title, text } = req.body
  if (title !== undefined) db.prepare('UPDATE notes SET title=?,updated_at=? WHERE id=?').run(title, now(), req.params.id)
  if (text  !== undefined) db.prepare('UPDATE notes SET text=?,updated_at=? WHERE id=?').run(text, now(), req.params.id)
  const n = getFullNote(req.params.id)
  if (!n) return res.status(404).json({ error: 'not found' })
  res.json(n)
})
app.delete('/api/notes/:id', (req, res) => {
  const blocks = db.prepare('SELECT filepath FROM note_blocks WHERE note_id=? AND filepath IS NOT NULL').all(req.params.id)
  blocks.forEach(b => { try { fs.unlinkSync(b.filepath) } catch {} })
  db.prepare('DELETE FROM notes WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})
app.post('/api/notes/:id/blocks', (req, res) => {
  const { type, content, language } = req.body
  const bid = uid()
  const ord = db.prepare('SELECT COUNT(*) as c FROM note_blocks WHERE note_id=?').get(req.params.id).c
  db.prepare('INSERT INTO note_blocks (id,note_id,type,content,language,ord) VALUES (?,?,?,?,?,?)').run(bid, req.params.id, type||'text', content||'', language||null, ord)
  db.prepare('UPDATE notes SET updated_at=? WHERE id=?').run(now(), req.params.id)
  res.json(getFullNote(req.params.id))
})
app.patch('/api/notes/:id/blocks/:bid', (req, res) => {
  const { content, language } = req.body
  if (content  !== undefined) db.prepare('UPDATE note_blocks SET content=? WHERE id=?').run(content, req.params.bid)
  if (language !== undefined) db.prepare('UPDATE note_blocks SET language=? WHERE id=?').run(language, req.params.bid)
  db.prepare('UPDATE notes SET updated_at=? WHERE id=?').run(now(), req.params.id)
  res.json(getFullNote(req.params.id))
})
app.delete('/api/notes/:id/blocks/:bid', (req, res) => {
  const block = db.prepare('SELECT * FROM note_blocks WHERE id=?').get(req.params.bid)
  if (block?.filepath) { try { fs.unlinkSync(block.filepath) } catch {} }
  db.prepare('DELETE FROM note_blocks WHERE id=?').run(req.params.bid)
  db.prepare('UPDATE notes SET updated_at=? WHERE id=?').run(now(), req.params.id)
  res.json(getFullNote(req.params.id))
})
app.post('/api/notes/:id/blocks/file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const bid = uid()
  const ord = db.prepare('SELECT COUNT(*) as c FROM note_blocks WHERE note_id=?').get(req.params.id).c
  db.prepare('INSERT INTO note_blocks (id,note_id,type,content,filename,filepath,mimetype,filesize,ord) VALUES (?,?,\'file\',\'\',?,?,?,?,?)').run(bid, req.params.id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size, ord)
  db.prepare('UPDATE notes SET updated_at=? WHERE id=?').run(now(), req.params.id)
  res.json(getFullNote(req.params.id))
})

// ═══ PAYMENTS ════════════════════════════════════════════════════════════════
function getItemFull(id) {
  const item = db.prepare('SELECT * FROM payment_items WHERE id=?').get(id)
  if (!item) return null
  item.checks = db.prepare('SELECT * FROM payment_checks WHERE item_id=?').all(id)
    .map(c => ({ ...c, paid: !!c.paid }))
  return item
}

app.get('/api/payments', (_, res) => {
  const ids = db.prepare('SELECT id FROM payment_items ORDER BY created_at').all()
  res.json(ids.map(r => getItemFull(r.id)))
})
app.post('/api/payments', (req, res) => {
  const { title, amount, currency, day_of_month, color } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title required' })
  const id = uid()
  db.prepare('INSERT INTO payment_items (id,title,amount,currency,day_of_month,color) VALUES (?,?,?,?,?,?)').run(id, title.trim(), amount||null, currency||'RUB', day_of_month||1, color||'#4F6EF7')
  res.json(getItemFull(id))
})
app.patch('/api/payments/:id', (req, res) => {
  const { title, amount, currency, day_of_month, color } = req.body
  const fields = [], vals = []
  if (title        !== undefined) { fields.push('title=?');        vals.push(title) }
  if (amount       !== undefined) { fields.push('amount=?');       vals.push(amount) }
  if (currency     !== undefined) { fields.push('currency=?');     vals.push(currency) }
  if (day_of_month !== undefined) { fields.push('day_of_month=?'); vals.push(day_of_month) }
  if (color        !== undefined) { fields.push('color=?');        vals.push(color) }
  if (fields.length) db.prepare(`UPDATE payment_items SET ${fields.join(',')} WHERE id=?`).run(...vals, req.params.id)
  const item = getItemFull(req.params.id)
  if (!item) return res.status(404).json({ error: 'not found' })
  res.json(item)
})
app.delete('/api/payments/:id', (req, res) => {
  db.prepare('DELETE FROM payment_items WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})
app.post('/api/payments/:id/check', (req, res) => {
  const { year, month, paid } = req.body
  const existing = db.prepare('SELECT id FROM payment_checks WHERE item_id=? AND year=? AND month=?').get(req.params.id, year, month)
  if (existing) {
    db.prepare('UPDATE payment_checks SET paid=?,paid_at=? WHERE id=?').run(bool(paid), paid ? now() : null, existing.id)
  } else {
    db.prepare('INSERT INTO payment_checks (id,item_id,year,month,paid,paid_at) VALUES (?,?,?,?,?,?)').run(uid(), req.params.id, year, month, bool(paid), paid ? now() : null)
  }
  res.json(getItemFull(req.params.id))
})

// ── Static (production) ───────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => console.log(`✅ To-Do API → http://0.0.0.0:${PORT}`))
