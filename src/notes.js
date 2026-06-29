const express = require('express');
const router = express.Router();
const store = require('../store/notes');

router.get('/', (req, res) => {
  const { q } = req.query;
  const notes = q ? store.search(q) : store.getAll();
  res.json({ success: true, data: notes });
});

router.get('/:id', (req, res) => {
  const note = store.getById(req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true, data: note });
});

router.post('/', (req, res) => {
  const note = store.create(req.body);
  res.status(201).json({ success: true, data: note });
});

router.put('/:id', (req, res) => {
  const note = store.update(req.params.id, req.body);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true, data: note });
});

router.delete('/:id', (req, res) => {
  const deleted = store.delete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true, message: 'Note deleted' });
});

module.exports = router;
