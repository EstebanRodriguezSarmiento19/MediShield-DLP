import crypto from 'node:crypto';
import env from '../../config/env.js';
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

export function recoveryConfigured() {
  return Boolean(env.recoveryMail.apiKey && env.recoveryMail.senderEmail);
}

export async function issueRecoveryToken(cx, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await cx.execute('DELETE FROM recuperacion_clave WHERE id_usuario=? OR fecha_expiracion<UTC_TIMESTAMP(3)', [userId]);
  await cx.execute(`INSERT INTO recuperacion_clave(token_hash,id_usuario,fecha_expiracion)
    VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE))`, [hashToken(token), userId]);
  return token;
}

export async function invalidateRecovery(cx, userId) {
  await cx.execute('DELETE FROM recuperacion_clave WHERE id_usuario=?', [userId]);
}

export async function sendRecoveryEmail(address, name, token, invitation = false) {
  if (!recoveryConfigured()) throw new Error('El proveedor de correo no está configurado.');
  const base = new URL(env.clientOrigin);
  if (env.production && base.protocol !== 'https:') throw new Error('CLIENT_ORIGIN debe usar HTTPS en producción.');
  const url = new URL('/reset-password', base);
  url.hash = `token=${token}`;
  const subject = invitation ? 'Activa tu cuenta MediShield DLP' : 'Restablece tu contraseña de MediShield DLP';
  const intro = invitation ? 'Se creó una cuenta para ti en MediShield DLP.' : 'Recibimos una solicitud para restablecer tu contraseña de MediShield DLP.';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', signal: controller.signal,
      headers: { 'api-key': env.recoveryMail.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: { name: env.recoveryMail.senderName, email: env.recoveryMail.senderEmail },
        to: [{ email: address, name }], subject,
        textContent: `${intro}\n\nAbre este enlace para elegir una contraseña:\n${url}\n\nEl enlace vence en 15 minutos y solo se puede usar una vez. Si no esperabas este correo, ignóralo.\n` }),
    });
    if (response.status !== 201) throw new Error('Brevo rechazó el envío.');
  } finally { clearTimeout(timeout); }
}
