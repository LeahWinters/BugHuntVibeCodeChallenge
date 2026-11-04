import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { UUID_PATTERN } from './constants.js';
import { buildDebrief } from './debrief.js';
import {
  addItem,
  clearCompleted,
  deleteItem,
  getView,
  patchItem,
  stepQuantity,
  toggleAll,
  createSeedItems,
} from './listService.js';
import { publicSpec } from './spec.js';
import { createStore, toPublicSession, validateReport } from './store.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const store = createStore(path.join(rootDir, 'data', 'sessions.json'));
const distDir = path.resolve(rootDir, '../client/dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));

function requireSession(req, res) {
  if (!UUID_PATTERN.test(req.params.id || '')) {
    res.status(404).json({ message: 'That hunt does not exist on this machine.' });
    return null;
  }
  const session = store.getSession(req.params.id);
  if (!session) {
    res.status(404).json({ message: 'That hunt does not exist on this machine.' });
    return null;
  }
  return session;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/spec', (_req, res) => {
  res.json(publicSpec());
});

app.post('/api/sessions', (req, res) => {
  const session = store.createSession(req.body?.playerName);
  console.log(`Hunt started for ${session.playerName} (${session.id})`);
  res.status(201).json(toPublicSession(session));
});

app.get('/api/sessions/:id', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  res.json(toPublicSession(session));
});

app.get('/api/sessions/:id/items', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  res.json(getView(session.items, req.query));
});

app.post('/api/sessions/:id/items', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  const result = addItem(session.items, req.body || {});
  if (!result.ok) return res.status(result.status).json({ message: result.message });
  store.save();
  res.status(201).json({ ok: true, item: result.item });
});

app.patch('/api/sessions/:id/items/:itemId', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  if (!UUID_PATTERN.test(req.params.itemId || '')) {
    return res.status(404).json({ message: 'Item not found.' });
  }
  const result = patchItem(session.items, req.params.itemId, req.body || {});
  if (!result.ok) return res.status(result.status).json({ message: result.message });
  store.save();
  res.json({ ok: true });
});

app.post('/api/sessions/:id/items/:itemId/step', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  if (!UUID_PATTERN.test(req.params.itemId || '')) {
    return res.status(404).json({ message: 'Item not found.' });
  }
  const result = stepQuantity(session.items, req.params.itemId, req.body?.direction);
  if (!result.ok) return res.status(result.status).json({ message: result.message });
  store.save();
  res.json({ ok: true });
});

app.delete('/api/sessions/:id/items/:itemId', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  if (!UUID_PATTERN.test(req.params.itemId || '')) {
    return res.status(404).json({ message: 'Item not found.' });
  }
  const result = deleteItem(session.items, req.params.itemId);
  if (!result.ok) return res.status(result.status).json({ message: result.message });
  store.save();
  res.json({ ok: true });
});

app.post('/api/sessions/:id/clear-completed', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  clearCompleted(session.items);
  store.save();
  res.json({ ok: true });
});

app.post('/api/sessions/:id/toggle-all', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  toggleAll(session.items);
  store.save();
  res.json({ ok: true });
});

app.post('/api/sessions/:id/reset-list', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  session.items = createSeedItems();
  store.save();
  res.json({ ok: true });
});

app.post('/api/sessions/:id/reports', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  const parsed = validateReport(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const saved = store.addReport(session, parsed.value);
  if (!saved.ok) return res.status(saved.status).json({ message: saved.message });
  const { status, title } = saved.report.result;
  console.log(
    status === 'matched'
      ? `Confirmed "${title}" for ${session.playerName}`
      : `Report ${status} from ${session.playerName}: ${saved.report.title}`,
  );
  res.status(201).json({
    session: toPublicSession(session),
    report: saved.report,
  });
});

app.get('/api/sessions/:id/debrief', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  res.json({ session: toPublicSession(session), debrief: buildDebrief(session) });
});

app.post('/api/sessions/:id/reveal', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  session.revealed = true;
  store.save();
  console.log(`Answer key opened for ${session.playerName}`);
  res.json({ session: toPublicSession(session), debrief: buildDebrief(session) });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'No such API route.' });
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.use((req, res) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Not found.' });
  }
  const indexFile = path.join(distDir, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  return res.status(404).json({
    message: 'API is running. Start the workshop UI with npm run dev and open http://localhost:5173',
  });
});

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body was not valid JSON.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'The server hit an error.' });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, '0.0.0.0', () => {
  console.log(`Bug Hunt API on http://localhost:${port}`);
});
