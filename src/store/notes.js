const { v4: uuidv4 } = require('uuid');

let notes = [
  {
    id: uuidv4(),
    title: 'Welcome to NoteApp 👋',
    content: 'Start capturing your thoughts. Click "+ New Note" to create your first note.',
    color: '#f0f9ff',
    pinned: true,
    tags: ['welcome'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Tips & Tricks',
    content: '• Pin important notes to the top\n• Filter by tags\n• Search across all notes\n• Use Ctrl+S to save',
    color: '#fefce8',
    pinned: false,
    tags: ['tips'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const store = {
  getAll: () => [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }),
  getById: (id) => notes.find(n => n.id === id) || null,
  create: ({ title = 'Untitled', content = '', color = '#ffffff', tags = [] } = {}) => {
    const note = {
      id: uuidv4(),
      title: title.trim() || 'Untitled',
      content, color,
      pinned: false,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.push(note);
    return note;
  },
  update: (id, fields) => {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    ['title', 'content', 'color', 'pinned', 'tags'].forEach(key => {
      if (fields[key] !== undefined) notes[idx][key] = fields[key];
    });
    notes[idx].updatedAt = new Date().toISOString();
    return notes[idx];
  },
  delete: (id) => {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    notes.splice(idx, 1);
    return true;
  },
  search: (q) => {
    const lower = q.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(lower) ||
      n.content.toLowerCase().includes(lower) ||
      n.tags.some(t => t.toLowerCase().includes(lower))
    );
  },
  _reset: (seed = []) => { notes = seed; },
};

module.exports = store;
