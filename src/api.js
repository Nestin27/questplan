const BASE = import.meta.env.VITE_API_URL || ''

async function req(method, path, body) {
  const opts = {
    method,
    headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  }
  const res = await fetch(`${BASE}/api${path}`, opts)
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`)
  return res.json()
}

// Tasks
export const api = {
  // Tasks
  getTasks:       ()             => req('GET',    '/tasks'),
  addTask:        (title, dk)    => req('POST',   '/tasks',                   { title, date_key: dk || null }),
  updateTask:     (id, patch)    => req('PATCH',  `/tasks/${id}`,             patch),
  deleteTask:     (id)           => req('DELETE', `/tasks/${id}`),

  // Subtasks
  addSubtask:     (tid, title)   => req('POST',   `/tasks/${tid}/subtasks`,   { title }),
  toggleSubtask:  (tid, sid, d)  => req('PATCH',  `/tasks/${tid}/subtasks/${sid}`, { done: d }),
  deleteSubtask:  (tid, sid)     => req('DELETE', `/tasks/${tid}/subtasks/${sid}`),

  // Task notes
  addTaskNote:    (tid, text)    => req('POST',   `/tasks/${tid}/notes`,      { text }),
  deleteTaskNote: (tid, nid)     => req('DELETE', `/tasks/${tid}/notes/${nid}`),

  // Notes
  getNotes:       ()             => req('GET',    '/notes'),
  addNote:        (title)        => req('POST',   '/notes',                   { title }),
  updateNote:     (id, patch)    => req('PATCH',  `/notes/${id}`,             patch),
  deleteNote:     (id)           => req('DELETE', `/notes/${id}`),

  // Note blocks
  addBlock:       (nid, block)   => req('POST',   `/notes/${nid}/blocks`,     block),
  updateBlock:    (nid, bid, p)  => req('PATCH',  `/notes/${nid}/blocks/${bid}`, p),
  deleteBlock:    (nid, bid)     => req('DELETE', `/notes/${nid}/blocks/${bid}`),

  // File upload
  uploadFile: async (nid, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return req('POST', `/notes/${nid}/blocks/file`, fd)
  },

  fileUrl: (filepath) => {
    const filename = filepath.split('/').pop()
    return `${BASE}/uploads/${filename}`
  },

  // Payments
  getPayments:    ()              => req('GET',    '/payments'),
  addPayment:     (data)          => req('POST',   '/payments',              data),
  updatePayment:  (id, data)      => req('PATCH',  `/payments/${id}`,        data),
  deletePayment:  (id)            => req('DELETE', `/payments/${id}`),
  toggleCheck:    (id, year, month, paid) => req('POST', `/payments/${id}/check`, { year, month, paid }),
}

// Payments
export const payApi = {
  getAll:    ()                    => req('GET',    '/payments'),
  add:       (data)                => req('POST',   '/payments', data),
  update:    (id, patch)           => req('PATCH',  `/payments/${id}`, patch),
  remove:    (id)                  => req('DELETE', `/payments/${id}`),
  setCheck:  (id, year, month, paid) => req('POST', `/payments/${id}/check`, { year, month, paid }),
}
