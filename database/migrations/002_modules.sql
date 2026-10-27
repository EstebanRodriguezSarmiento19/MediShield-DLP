CREATE TABLE IF NOT EXISTS sesion_web (
  sesion_hash CHAR(64) PRIMARY KEY, id_usuario INT UNSIGNED NOT NULL,
  csrf_token CHAR(64) NOT NULL, fecha_inicio DATETIME(3) NOT NULL,
  fecha_expiracion DATETIME(3) NOT NULL, ultima_actividad DATETIME(3) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario), INDEX (fecha_expiracion)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS auth_attempt (
  bucket CHAR(64) PRIMARY KEY, window_start DATETIME(3) NOT NULL, attempts INT UNSIGNED NOT NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS destinatario (
  correo VARCHAR(254) PRIMARY KEY, nombre VARCHAR(120) NOT NULL,
  autorizado BOOLEAN NOT NULL DEFAULT FALSE, version INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS regla_dlp (
  id VARCHAR(20) PRIMARY KEY, activo BOOLEAN NOT NULL DEFAULT TRUE,
  peso INT NOT NULL, version INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS transferencia (
  id CHAR(36) PRIMARY KEY, id_usuario INT UNSIGNED NOT NULL,
  destinatario VARCHAR(254) NOT NULL, decision ENUM('PERMITIR','ALERTAR','BLOQUEAR') NOT NULL,
  estado ENUM('ANALIZADA','ENVIANDO','ENVIADA','FALLIDA') NOT NULL DEFAULT 'ANALIZADA',
  riesgo INT NOT NULL, content_hash CHAR(64) NOT NULL, resultado JSON NOT NULL,
  fecha_creacion DATETIME(3) NOT NULL, message_id VARCHAR(255) NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario), INDEX(id_usuario, fecha_creacion), INDEX(decision)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS alerta (
  id CHAR(36) PRIMARY KEY, transferencia_id CHAR(36) NOT NULL UNIQUE,
  estado ENUM('ABIERTA','EN_REVISION','CERRADA') NOT NULL DEFAULT 'ABIERTA',
  nota VARCHAR(500) NOT NULL DEFAULT '', revisado_por INT UNSIGNED NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1, actualizado DATETIME(3) NOT NULL,
  FOREIGN KEY (transferencia_id) REFERENCES transferencia(id), FOREIGN KEY (revisado_por) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS historial_comunicacion (
  id_usuario INT UNSIGNED NOT NULL, destinatario VARCHAR(254) NOT NULL,
  envios_confirmados INT UNSIGNED NOT NULL DEFAULT 0, ultimo_envio DATETIME(3) NOT NULL,
  PRIMARY KEY(id_usuario,destinatario), FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS audit_head (
  id INT PRIMARY KEY, sequence_no BIGINT UNSIGNED NOT NULL, event_hash CHAR(64) NOT NULL
) ENGINE=InnoDB;
INSERT IGNORE INTO audit_head VALUES (1,0,REPEAT('0',64));
CREATE TABLE IF NOT EXISTS audit_event (
  sequence_no BIGINT UNSIGNED PRIMARY KEY, payload MEDIUMTEXT NOT NULL,
  previous_hash CHAR(64) NOT NULL, event_hash CHAR(64) NOT NULL
) ENGINE=InnoDB;
