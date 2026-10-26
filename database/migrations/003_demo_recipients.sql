-- Destinatarios sintéticos que utilizan los casos rápidos de la interfaz.
-- INSERT IGNORE conserva cualquier autorización o revocación hecha por un administrador.
INSERT IGNORE INTO destinatario (correo, nombre, autorizado) VALUES
  ('laboratorio@hospital.local', 'Laboratorio interno', TRUE),
  ('especialista@hospital.local', 'Especialista interno', TRUE),
  ('auditoria@partner.test', 'Socio de laboratorio', TRUE),
  ('bloqueado@externo.test', 'Destino revocado', FALSE);
