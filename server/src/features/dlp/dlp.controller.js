import { analyzeTransfer, getPublicRules } from './dlp.service.js';
import { getDlpStats, getRecentAnalyses, saveAnalysis } from './dlp.store.js';

export function analyze(req, res, next) {
  try {
    const result = analyzeTransfer(req.body ?? {});
    saveAnalysis(result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export function stats(req, res) {
  res.json({
    success: true,
    data: getDlpStats(),
  });
}

export function recent(req, res) {
  res.json({
    success: true,
    data: getRecentAnalyses(req.query.limit),
  });
}

export function rules(req, res) {
  res.json({
    success: true,
    data: getPublicRules(),
  });
}
