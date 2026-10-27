/**
 * Datos sinteticos de laboratorio para demostrar la parte contextual del DLP.
 * No representan usuarios reales y posteriormente se reemplazaran por
 * HISTORIAL_COMUNICACION en MySQL.
 */
const demoRecipients = {
  'laboratorio@hospital.local': {
    authorized: true,
    habituality: 100,
    previousSends: 8,
  },
  'especialista@hospital.local': {
    authorized: true,
    habituality: 60,
    previousSends: 3,
  },
  'auditoria@partner.test': {
    authorized: true,
    habituality: 60,
    previousSends: 4,
  },
  'bloqueado@externo.test': {
    authorized: false,
    habituality: 0,
    previousSends: 0,
  },
};

export default demoRecipients;
