import AppError from './errors/AppError.js';
export function fail(message, status = 400) { throw new AppError(message, status); }
export function object(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('El cuerpo debe ser un objeto JSON.');
  if (Object.keys(value).some(key => !fields.includes(key))) fail('La solicitud contiene campos no permitidos.');
  return value;
}
export function text(value, label, max, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /[\u0000]/u.test(value)) fail(`${label}: valor inválido.`);
  return value.trim();
}
export function email(value) {
  const normalized = text(value, 'Correo', 254).toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) fail('Correo inválido.');
  const [local, domain] = parts;
  if (!local || local.length > 64 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) fail('Correo inválido.');
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some(label => !label || label.length > 63 || !/^[a-z0-9-]+$/i.test(label) || label.startsWith('-') || label.endsWith('-'))) fail('Correo inválido.');
  return normalized;
}
export function version(value) { if (!Number.isSafeInteger(value) || value < 1) fail('Versión inválida.'); return value; }
export function pageLimit(value) { const n = Number(value || 50); if (!Number.isInteger(n) || n < 1 || n > 100) fail('Límite inválido (1 a 100).'); return n; }
