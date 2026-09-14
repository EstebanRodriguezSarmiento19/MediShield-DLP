import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTransfer } from '../src/features/dlp/dlp.service.js';

test('permite un mensaje normal a un destinatario interno habitual', () => {
  const result = analyzeTransfer({
    recipient: 'laboratorio@hospital.local',
    subject: 'Reunion',
    body: 'Agenda administrativa para manana.',
  });

  assert.equal(result.decision, 'PERMITIR');
  assert.equal(result.risk.score, 0);
  assert.equal(result.content.matches.length, 0);
});

test('genera alerta cuando hay contenido clinico hacia un destino externo habitual', () => {
  const result = analyzeTransfer({
    recipient: 'auditoria@partner.test',
    subject: 'Revision',
    body: 'Se debe revisar el resultado de laboratorio del paciente.',
  });

  assert.equal(result.decision, 'ALERTAR');
  assert.equal(result.risk.score, 50);
  assert.ok(result.content.matches.some((match) => match.ruleId === 'DLP-003'));
});

test('bloquea datos altamente sensibles dirigidos a un destinatario externo nuevo', () => {
  const result = analyzeTransfer({
    recipient: 'destino.personal@gmail.com',
    subject: 'Historia clinica',
    body: 'Referencia HC-482910 del paciente CC 1012345678.',
  });

  assert.equal(result.decision, 'BLOQUEAR');
  assert.equal(result.risk.score, 100);
  assert.ok(result.content.matches.length >= 2);
});

test('bloquea siempre un destinatario marcado como no autorizado', () => {
  const result = analyzeTransfer({
    recipient: 'bloqueado@externo.test',
    subject: 'Mensaje administrativo',
    body: 'Contenido sin datos clinicos.',
  });

  assert.equal(result.decision, 'BLOQUEAR');
});

test('no devuelve el cuerpo original dentro del resultado del analisis', () => {
  const secret = 'HC-999999 CC 1000000000';
  const result = analyzeTransfer({
    recipient: 'laboratorio@hospital.local',
    subject: 'Prueba',
    body: secret,
  });

  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(result.content.contentHash.length, 64);
});
