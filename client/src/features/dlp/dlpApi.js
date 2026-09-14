import api from '../../shared/services/api.js';

export function analyzeTransfer(payload) {
  return api.post('/dlp/analyze', payload);
}

export function getDlpStats() {
  return api.get('/dlp/stats');
}

export function getRecentDlpAnalyses(limit = 10) {
  return api.get(`/dlp/recent?limit=${limit}`);
}

export function getDlpRules() {
  return api.get('/dlp/rules');
}
