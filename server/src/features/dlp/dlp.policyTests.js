import definitions from './dlp.rules.js';
import { analyzeTransfer, evaluateRecipient } from './dlp.service.js';

/**
 * Casos de prueba de política DLP. Son datos sintéticos y contextos fijos
 * (autorización e historial), así que el resultado depende solo de las reglas
 * activas y de su peso. Si un administrador cambia pesos o desactiva reglas,
 * algún caso puede fallar: eso indica deriva de la política, no un error de la prueba.
 */
const INTERNAL = 'laboratorio@hospital.local';
const NEW_INTERNAL = 'especialista@hospital.local';
const PARTNER = 'auditoria@partner.test';
const REVOKED = 'bloqueado@externo.test';

export const policyTestCases = [
  { id: 'PT-01', name: 'Agenda administrativa a interno habitual', description: 'Sin datos sensibles, destinatario autorizado con historial confirmado.',
    recipient: INTERNAL, authorized: true, previousSends: 8, totalSends: 8,
    subject: 'Reunión semanal', body: 'Agenda administrativa del laboratorio.', expected: 'PERMITIR' },
  { id: 'PT-02', name: 'Interno autorizado sin historial', description: 'Contenido administrativo a un destinatario interno sin envíos previos.',
    recipient: NEW_INTERNAL, authorized: true, previousSends: 0, totalSends: 8,
    subject: 'Reunión semanal', body: 'Agenda administrativa del laboratorio.', expected: 'PERMITIR' },
  { id: 'PT-03', name: 'Historia clínica a interno habitual', description: 'Código de historia clínica a un destinatario interno: se retiene para revisión.',
    recipient: INTERNAL, authorized: true, previousSends: 8, totalSends: 8,
    subject: 'Seguimiento', body: 'Revisar HC-482910 antes de la reunión.', expected: 'ALERTAR' },
  { id: 'PT-04', name: 'Identificación personal a externo autorizado', description: 'Identificador de alto riesgo nunca sale a un dominio externo.',
    recipient: PARTNER, authorized: true, previousSends: 4, totalSends: 4,
    subject: 'Caso', body: 'Paciente con CC 1012345678.', expected: 'BLOQUEAR' },
  { id: 'PT-05', name: 'Destinatario revocado', description: 'Un destinatario no autorizado queda bloqueado aunque el contenido sea neutro.',
    recipient: REVOKED, authorized: false, previousSends: 0, totalSends: 0,
    subject: 'Reunión', body: 'Agenda administrativa.', expected: 'BLOQUEAR' },
  { id: 'PT-06', name: 'Terminología clínica a externo autorizado', description: 'Vocabulario clínico sin identificadores: alerta, no bloqueo.',
    recipient: PARTNER, authorized: true, previousSends: 4, totalSends: 4,
    subject: 'Informe', body: 'Resultados de laboratorio del paciente.', expected: 'ALERTAR' },
  { id: 'PT-07', name: 'Historia clínica con caracteres de ancho completo', description: 'La normalización NFKC evita eludir la regla con caracteres de ancho completo.',
    recipient: PARTNER, authorized: true, previousSends: 4, totalSends: 4,
    subject: 'Caso', body: 'Ver ＨＣ-482910 en el expediente.', expected: 'BLOQUEAR' },
  { id: 'PT-08', name: 'Separador invisible en historia clínica', description: 'Los separadores de ancho cero se eliminan antes de analizar.',
    recipient: INTERNAL, authorized: true, previousSends: 8, totalSends: 8,
    subject: 'Caso', body: 'Ver H\u200bC-482910 en el expediente.', expected: 'ALERTAR' },
  { id: 'PT-09', name: 'Dominio que imita al laboratorio', description: 'Un subdominio engañoso se trata como externo, no como interno.',
    recipient: 'x@hospital.local.evil.test', authorized: true, previousSends: 0, totalSends: 8,
    subject: 'Reunión', body: 'Agenda administrativa.', expected: 'ALERTAR' },
];

const defaultRules = definitions.map(rule => ({ ...rule, version: 1 }));

/** Ejecuta la batería con las reglas indicadas. No accede a la base de datos. */
export function runPolicyTests(rules = defaultRules) {
  const cases = policyTestCases.map(test => {
    const recipient = evaluateRecipient(test.recipient, { autorizado: test.authorized, version: 1 }, test.previousSends, test.totalSends);
    const analysis = analyzeTransfer(
      { recipient: test.recipient, subject: test.subject, body: test.body },
      { recipient, rules }
    );
    return {
      id: test.id,
      name: test.name,
      description: test.description,
      recipient: test.recipient,
      expected: test.expected,
      obtained: analysis.decision,
      passed: analysis.decision === test.expected,
      riskScore: analysis.risk.score,
      recipientType: recipient.type,
      matchedRules: analysis.content.matches.map(match => match.ruleId),
    };
  });
  const passed = cases.filter(item => item.passed).length;
  return {
    executedAt: new Date().toISOString(),
    rulesVersion: rules.map(rule => `${rule.id}:${rule.version}`),
    summary: { total: cases.length, passed, failed: cases.length - passed },
    cases,
  };
}
