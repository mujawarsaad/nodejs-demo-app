'use strict';

const COLORS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#f0f9ff', label: 'Sky' },
  { hex: '#fefce8', label: 'Lemon' },
  { hex: '#fdf4ff', label: 'Lavender' },
  { hex: '#f0fdf4', label: 'Mint' },
  { hex: '#fff7ed', label: 'Peach' },
];

const app = (() => {
  let notes = [], activeTag = null, searchQuery = '', currentNote = null, editorTags = [], toastTimeout = null;

  const $ = id => document.getElementById(id);
  const notesGrid = $('notesGrid'), emptyState = $('emptyState'), noteCount = $('noteCount');
  const tagList = $('tagList'), searchInput = $('searchInput'), modalBackdrop = $('modalBackdrop');
  const editorTitle = $('editorTitle'), editorContent = $('editorContent'), editorMeta = $('editorMeta');
  const editorTagsEl = $('editorTags'), tagInput = $('tagInput'), colorSwatches = $('colorSwatches');
  const pinBtn = $('pinBtn'), deleteBtn = $('deleteBtn'), topbarTitle = $('topbarTitle');
  const toast = $('toast'), sidebar = $('sidebar');

  const api = {
    async getAll(q) {
      const url = q ? `/api/notes?q=${encodeURIComponent(q)}` : '/api/notes';
      return (await (await fetch(url)).json()).data;
    },
    async create(data) {
      return (await (await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json()).data;
    },
    async update(id, data) {
      return (await (await fetch(`/api/notes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json()).data;
    },
    async delete(id) { await fetch(`/api/notes/${id}`, { method: 'DELETE' }); },
  };

  function showToast(msg) {
    clearTimeout(toastTimeout);
    toast.textContent = msg;
    toast.classList.remove('hidden');
    requestAnimationFrame(() => toast.classList.add('show'));
    toastTimeout = setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.classList.add('hidden'), 280); }, 2200);
  }

  function formatDate(iso) {
    const d = new Date(iso), now = new Date(), diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function allTags() {
    const set = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => set.add(t)));
    return [...set].sort();
  }

  function renderTagSidebar() {
    const tags = allTags();
    tagList.innerHTML = tags.length
      ? ['all', ...tags].map(t => `<button class="tag-pill ${activeTag === t || (t === 'all' && !activeTag) ? 'active' : ''}" data-tag="${t}">${t === 'all' ? 'All notes' : t}</button>`).join('')
      : '<span style="font-size:12px;color:var(--ink-muted)">No tags yet</span>';
  }

  function renderNotes() {
    const list = notes.filter(n => !activeTag || activeTag === 'all' || (n.tags || []).includes(activeTag));
    renderTagSidebar();
    noteCount.textContent = `${list.length} note${list.length !== 1 ? 's' : ''}`;
    topbarTitle.textContent = activeTag && activeTag !== 'all' ? `#${activeTag}` : searchQuery ? `Search: "${searchQuery}"` : 'All Notes';
    if (!list.length) { notesGrid.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');
    notesGrid.innerHTML = list.map(n => `
      <article class="note-card ${n.pinned ? 'pinned' : ''}" style="background:${n.color || '#fff'}" data-id="${n.id}" role="button" tabindex="0">
        <h2 class="card-title">${escHtml(n.title)}</h2>
        ${n.content ? `<p class="card-content">${escHtml(n.content)}</p>` : ''}
        <footer class="card-footer">
          <span class="card-date">${formatDate(n.updatedAt)}</span>
          <div class="card-tags">${(n.tags || []).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}</div>
        </footer>
      </article>`).join('');
  }

  function buildSwatches(selected) {
    colorSwatches.innerHTML = COLORS.map(c => `<button class="swatch ${c.hex === selected ? 'selected' : ''}" style="background:${c.hex}" data-color="${c.hex}" title="${c.label}"></button>`).join('');
  }

  function renderEditorTags() {
    editorTagsEl.innerHTML = editorTags.map(t => `<span class="editor-tag">${escHtml(t)}<button data-tag="${escHtml(t)}">✕</button></span>`).join('');
  }

  function addTag(raw) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !editorTags.includes(tag)) { editorTags.push(tag); renderEditorTags(); }
    tagInput.value = '';
  }

  function openEditor(note = null) {
    currentNote = note;
    editorTags = note ? [...(note.tags || [])] : [];
    editorTitle.value = note ? note.title : '';
    editorContent.value = note ? note.content : '';
    pinBtn.classList.toggle('active', !!(note && note.pinned));
    deleteBtn.classList.toggle('hidden', !note);
    buildSwatches(note ? note.color : '#ffffff');
    renderEditorTags();
    editorMeta.textContent = note ? `Created ${formatDate(note.createdAt)} · Edited ${formatDate(note.updatedAt)}` : '';
    modalBackdrop.classList.remove('hidden');
    setTimeout(() => editorTitle.focus(), 60);
  }

  function closeEditor() {
    modalBackdrop.classList.add('hidden');
    currentNote = null;
    editorTags = [];
  }

  async function saveNote() {
    const title = editorTitle.value.trim(), content = editorContent.value.trim();
    const color = colorSwatches.querySelector('.swatch.selected')?.dataset.color || '#ffffff';
    const pinned = pinBtn.classList.contains('active');
    if (!title && !content) { showToast('Add a title or content to save.'); return; }
    try {
      if (currentNote) {
        const updated = await api.update(currentNote.id, { title, content, color, pinned, tags: editorTags });
        notes = notes.map(n => n.id === updated.id ? updated : n);
        showToast('Note updated');
      } else {
        const created = await api.create({ title, content, color, pinned, tags: editorTags });
        notes.unshift(created);
        showToast('Note saved');
      }
      renderNotes(); closeEditor();
    } catch { showToast('Something went wrong. Try again.'); }
  }

  async function deleteNote() {
    if (!currentNote || !confirm('Delete this note? This cannot be undone.')) return;
    await api.delete(currentNote.id);
    notes = notes.filter(n => n.id !== currentNote.id);
    showToast('Note deleted'); renderNotes(); closeEditor();
  }

  async function loadNotes(q = '') {
    notes = await api.getAll(q || undefined);
    renderNotes();
  }

  function bindEvents() {
    $('newNoteBtn').addEventListener('click', () => openEditor());
    $('saveBtn').addEventListener('click', saveNote);
    $('cancelBtn').addEventListener('click', closeEditor);
    $('closeBtn').addEventListener('click', closeEditor);
    deleteBtn.addEventListener('click', deleteNote);
    pinBtn.addEventListener('click', () => pinBtn.classList.toggle('active'));
    modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeEditor(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeEditor();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveNote(); }
    });
    colorSwatches.addEventListener('click', e => {
      const sw = e.target.closest('.swatch');
      if (!sw) return;
      colorSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    });
    tagInput.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput.value); } });
    tagInput.addEventListener('blur', () => { if (tagInput.value.trim()) addTag(tagInput.value); });
    editorTagsEl.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      editorTags = editorTags.filter(t => t !== btn.dataset.tag);
      renderEditorTags();
    });
    notesGrid.addEventListener('click', e => {
      const card = e.target.closest('.note-card');
      if (card) { const note = notes.find(n => n.id === card.dataset.id); if (note) openEditor(note); }
    });
    let searchDebounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchQuery = searchInput.value.trim();
      searchDebounce = setTimeout(() => loadNotes(searchQuery), 280);
    });
    tagList.addEventListener('click', e => {
      const pill = e.target.closest('.tag-pill');
      if (!pill) return;
      activeTag = pill.dataset.tag === 'all' ? null : pill.dataset.tag;
      renderNotes();
    });
    $('menuBtn').addEventListener('click', () => sidebar.classList.add('open'));
    $('sidebarToggle').addEventListener('click', () => sidebar.classList.remove('open'));
  }

  document.addEventListener('DOMContentLoaded', () => { bindEvents(); loadNotes(); });
  return { openEditor };
})();
