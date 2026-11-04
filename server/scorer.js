import { AREA_BONUS, SEVERITY_BONUS, SEVERITY_POINTS } from './constants.js';
import { bugs } from './catalog.js';

export function norm(value) {
  return String(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function passes(bug, text) {
  if (bug.banned?.some((phrase) => text.includes(norm(phrase)))) return false;
  return bug.gate.every((group) => group.some((phrase) => text.includes(norm(phrase))));
}

function severityLabel(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function matchedMessage(bug, points, areaHit, severityHit) {
  const parts = [`Confirmed: ${bug.title}. ${points} points.`];
  if (areaHit && severityHit) {
    parts.push('Area and severity both matched.');
  } else {
    if (!areaHit) parts.push(`The area for this one is ${bug.area}.`);
    if (!severityHit) parts.push(`Official severity is ${severityLabel(bug.severity)}.`);
  }
  return parts.join(' ');
}

export function scoreReport(report, priorReports = []) {
  const text = norm(`${report.title} ${report.steps} ${report.expected} ${report.actual}`);
  const found = new Set(
    priorReports
      .filter((item) => item.result?.status === 'matched')
      .map((item) => item.result.bugId),
  );
  const passing = bugs.filter((bug) => passes(bug, text));

  if (passing.length === 0) {
    return {
      status: 'unmatched',
      message:
        'Not confirmed. Name the control, what the spec says should happen, and the exact result. File one defect per report.',
    };
  }

  if (passing.length > 1) {
    return {
      status: 'ambiguous',
      message: 'This report fits more than one defect. File each behavior in its own report.',
    };
  }

  const bug = passing[0];
  if (found.has(bug.id)) {
    return {
      status: 'duplicate',
      bugId: bug.id,
      title: bug.title,
      message: `Already confirmed: ${bug.title}.`,
    };
  }

  const basePoints = SEVERITY_POINTS[bug.severity];
  const areaPoints = report.area === bug.area ? AREA_BONUS : 0;
  const severityPoints = report.severity === bug.severity ? SEVERITY_BONUS : 0;

  return {
    status: 'matched',
    bugId: bug.id,
    title: bug.title,
    area: bug.area,
    severity: bug.severity,
    basePoints,
    areaPoints,
    severityPoints,
    points: basePoints + areaPoints + severityPoints,
    message: matchedMessage(bug, basePoints + areaPoints + severityPoints, areaPoints > 0, severityPoints > 0),
  };
}
