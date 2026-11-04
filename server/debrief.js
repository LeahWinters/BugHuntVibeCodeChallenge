import { AREA_BONUS, SEVERITY_BONUS, SEVERITY_POINTS } from './constants.js';
import { bugs, presentBug } from './catalog.js';
import { tally } from './sessionMath.js';

export function buildDebrief(session) {
  const { score, confirmedCount } = tally(session);
  if (!session.revealed) {
    return { revealed: false, score, confirmedCount };
  }

  const matched = new Map();
  for (const report of session.reports) {
    if (report.result?.status === 'matched' && !matched.has(report.result.bugId)) {
      matched.set(report.result.bugId, report);
    }
  }

  return {
    revealed: true,
    score,
    confirmedCount,
    totalBugs: bugs.length,
    maxScore: bugs.reduce((sum, bug) => sum + SEVERITY_POINTS[bug.severity] + AREA_BONUS + SEVERITY_BONUS, 0),
    bugs: bugs.map((bug) => {
      const report = matched.get(bug.id);
      return {
        ...presentBug(bug),
        found: Boolean(report),
        pointsAwarded: report?.result.points ?? 0,
        reportTitle: report?.title ?? null,
      };
    }),
  };
}
