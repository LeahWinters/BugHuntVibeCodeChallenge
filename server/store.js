import fs from 'node:fs';
import path from 'node:path';
import { AREAS, SEVERITIES } from './constants.js';
import { createSeedItems } from './listService.js';
import { scoreReport } from './scorer.js';
import { tally } from './sessionMath.js';

function loadSessions(dataFile) {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function cleanPlayerName(value) {
  const cleaned = String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return cleaned || 'Anonymous';
}

export function validateReport(body) {
  const title = String(body?.title || '').trim();
  const steps = String(body?.steps || '').trim();
  const expected = String(body?.expected || '').trim();
  const actual = String(body?.actual || '').trim();
  const area = body?.area;
  const severity = body?.severity;

  if (title.length < 8 || title.length > 120) return { error: 'Title should be 8–120 characters.' };
  if (steps.length < 20 || steps.length > 1000) return { error: 'Steps should be 20–1000 characters.' };
  if (expected.length < 10 || expected.length > 600) return { error: 'Expected should be 10–600 characters.' };
  if (actual.length < 10 || actual.length > 600) return { error: 'Actual should be 10–600 characters.' };
  if (!AREAS.includes(area)) return { error: 'Pick an area.' };
  if (!SEVERITIES.includes(severity)) return { error: 'Pick a severity.' };

  return { value: { title, steps, expected, actual, area, severity } };
}

export function toPublicReport(report) {
  return {
    id: report.id,
    title: report.title,
    area: report.area,
    severity: report.severity,
    steps: report.steps,
    expected: report.expected,
    actual: report.actual,
    createdAt: report.createdAt,
    result: report.result,
  };
}

export function toPublicSession(session) {
  const { score, confirmedCount } = tally(session);
  return {
    id: session.id,
    playerName: session.playerName,
    createdAt: session.createdAt,
    revealed: session.revealed,
    score,
    confirmedCount,
    reports: session.reports.map(toPublicReport),
  };
}

export function createStore(dataFile) {
  let sessions = loadSessions(dataFile);

  function save() {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(sessions, null, 2));
  }

  function getSession(id) {
    return sessions.find((session) => session.id === id) || null;
  }

  function createSession(playerName) {
    const session = {
      id: crypto.randomUUID(),
      playerName: cleanPlayerName(playerName),
      createdAt: new Date().toISOString(),
      revealed: false,
      items: createSeedItems(),
      reports: [],
    };
    sessions.push(session);
    if (sessions.length > 100) sessions = sessions.slice(-100);
    save();
    return session;
  }

  function addReport(session, input) {
    if (session.revealed) {
      return {
        ok: false,
        status: 400,
        message: 'The answer key is open, so filing is closed. Start a new hunt to keep going.',
      };
    }
    if (session.reports.length >= 40) {
      return { ok: false, status: 400, message: 'This hunt already has 40 reports.' };
    }
    const result = scoreReport(input, session.reports);
    const report = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
      result,
    };
    session.reports.push(report);
    save();
    return { ok: true, report };
  }

  return { getSession, createSession, addReport, save };
}
