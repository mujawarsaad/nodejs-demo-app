const request = require('supertest');
const app = require('../src/server');
const store = require('../src/store/notes');

beforeEach(() => store._reset([]));

describe('GET /api/notes', () => {
  it('returns empty array', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
  it('returns all notes', async () => {
    store.create({ title: 'A' }); store.create({ title: 'B' });
    const res = await request(app).get('/api/notes');
    expect(res.body.data).toHaveLength(2);
  });
  it('searches notes', async () => {
    store.create({ title: 'Shopping', content: 'milk' });
    store.create({ title: 'Work', content: 'deploy' });
    const res = await request(app).get('/api/notes?q=shopping');
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/notes', () => {
  it('creates a note', async () => {
    const res = await request(app).post('/api/notes').send({ title: 'Hello', tags: ['test'] });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Hello');
  });
});

describe('PUT /api/notes/:id', () => {
  it('updates a note', async () => {
    const note = store.create({ title: 'Draft' });
    const res = await request(app).put(`/api/notes/${note.id}`).send({ title: 'Final' });
    expect(res.body.data.title).toBe('Final');
  });
  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/notes/fake').send({ title: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('deletes a note', async () => {
    const note = store.create({ title: 'Bye' });
    const res = await request(app).delete(`/api/notes/${note.id}`);
    expect(res.status).toBe(200);
  });
});
