import crypto from 'node:crypto';
import dlpRules from './dlp.rules.js';
import demoRecipients from './dlp.demoRecipients.js';

const INTERNAL_DOMAINS = new Set(['hospital.local', 'clinica.local', 'medishield.local']);

const RISK_CONFIG = Object.freeze({
  externalRecipient: 25,
  noHistory: 25,
  lowHabituality: 15,
  lowHabitualityThreshold: 30,
  maxContentScore: 60,
  allowMax: 39,
  alertMax: 69,
});

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRecipientDomain(email) {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

function analyzeContent(subject, body) {
  const content = `${subject}\n${body}`;
  const matches = [];

  for (const rule of dlpRules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    const found = content.match(regex) || [];

    if (found.length > 0) {
      matches.push({
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        sensitivity: rule.sensitivity,
        count: found.length,
        weight: rule.weight,
      });
    }
  }

  const rawScore = matches.reduce((total, match) => total + match.weight, 0);

  return {
    score: Math.min(RISK_CONFIG.maxContentScore, rawScore),
    matches,
  };
}

function analyzeRecipient(email) {
  const normalizedEmail = email.toLowerCase();
  const domain = getRecipientDomain(normalizedEmail);
  const isExternal = !INTERNAL_DOMAINS.has(domain);
  const profile = demoRecipients[normalizedEmail];
  const hasHistory = Boolean(profile && profile.previousSends > 0);
  const habituality = profile?.habituality ?? 0;
  const authorized = profile?.authorized ?? true;
  const reasons = [];
  let score = 0;

  if (isExternal) {
    score += RISK_CONFIG.externalRecipient;
    reasons.push('El destinatario pertenece a un dominio externo al laboratorio.');
  }

  if (!hasHistory) {
    score += RISK_CONFIG.noHistory;
    reasons.push('No existe historial previo con este destinatario en los datos de laboratorio.');
  }

  if (hasHistory && habituality < RISK_CONFIG.lowHabitualityThreshold) {
    score += RISK_CONFIG.lowHabituality;
    reasons.push('La habitualidad del destinatario es baja.');
  }

  if (hasHistory && reasons.length === 0) {
    reasons.push('El destinatario aparece como habitual en el escenario de laboratorio.');
  }

  if (!authorized) {
    reasons.push('El destinatario esta marcado como no autorizado por la politica de laboratorio.');
  }

  return {
    email: normalizedEmail,
    domain,
    type: isExternal ? 'EXTERNO' : 'INTERNO',
    hasHistory,
    habituality,
    authorized,
    isAtypical: isExternal || !hasHistory || habituality < RISK_CONFIG.lowHabitualityThreshold,
    score,
    reasons,
  };
}

function getDecision(totalScore, recipient) {
  if (!recipient.authorized) return 'BLOQUEAR';
  if (totalScore <= RISK_CONFIG.allowMax) return 'PERMITIR';
  if (totalScore <= RISK_CONFIG.alertMax) return 'ALERTAR';
  return 'BLOQUEAR';
}

function getDecisionExplanation(decision, content, recipient) {
  const reasons = [...recipient.reasons];

  if (content.matches.length === 0) {
    reasons.unshift('No se detectaron patrones de informacion medica sensible.');
  } else {
    reasons.unshift(
      `Se detectaron ${content.matches.length} regla(s) DLP unica(s) en asunto o cuerpo.`,
    );
  }

  const decisionText = {
    PERMITIR: 'El riesgo calculado esta dentro del rango permitido.',
    ALERTAR: 'La transferencia requiere revision o confirmacion antes de un envio futuro.',
    BLOQUEAR: 'La transferencia supera el umbral permitido o viola una politica de destino.',
  }[decision];

  return [...reasons, decisionText];
}

export function analyzeTransfer(payload) {
  const recipient = normalizeText(payload.recipient);
  const subject = normalizeText(payload.subject);
  const body = normalizeText(payload.body);

  if (!recipient || !recipient.includes('@')) {
    const error = new Error('Ingresa un destinatario valido.');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  if (!subject && !body) {
    const error = new Error('Debes ingresar un asunto o un mensaje para analizar.');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  const startedAt = performance.now();
  const content = analyzeContent(subject, body);
  const recipientAnalysis = analyzeRecipient(recipient);
  const totalScore = Math.min(100, content.score + recipientAnalysis.score);
  const decision = getDecision(totalScore, recipientAnalysis);
  const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    recipient: recipientAnalysis,
    content: {
      score: content.score,
      matches: content.matches,
      contentHash: crypto.createHash('sha256').update(`${subject}\n${body}`).digest('hex'),
    },
    risk: {
      score: totalScore,
      level: totalScore >= 70 ? 'ALTO' : totalScore >= 40 ? 'MEDIO' : 'BAJO',
    },
    decision,
    latencyMs,
    reasons: getDecisionExplanation(decision, content, recipientAnalysis),
  };
}

export function getPublicRules() {
  return dlpRules.map(({ pattern, ...rule }) => rule);
}
