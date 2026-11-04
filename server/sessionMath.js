export function tally(session) {
  const seen = new Set();
  let score = 0;
  for (const report of session.reports) {
    if (report.result?.status !== 'matched') continue;
    if (seen.has(report.result.bugId)) continue;
    seen.add(report.result.bugId);
    score += report.result.points || 0;
  }
  return { confirmedCount: seen.size, score };
}
