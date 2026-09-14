const MAX_EVENTS = 100;
const analyses = [];

export function saveAnalysis(analysis) {
  analyses.unshift(analysis);
  if (analyses.length > MAX_EVENTS) {
    analyses.length = MAX_EVENTS;
  }
  return analysis;
}

export function getRecentAnalyses(limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  return analyses.slice(0, safeLimit);
}

export function getDlpStats() {
  return analyses.reduce(
    (stats, item) => {
      stats.total += 1;
      if (item.decision === 'PERMITIR') stats.allowed += 1;
      if (item.decision === 'ALERTAR') stats.alerted += 1;
      if (item.decision === 'BLOQUEAR') stats.blocked += 1;
      if (item.recipient.isAtypical) stats.atypicalRecipients += 1;
      return stats;
    },
    {
      total: 0,
      allowed: 0,
      alerted: 0,
      blocked: 0,
      atypicalRecipients: 0,
    },
  );
}
