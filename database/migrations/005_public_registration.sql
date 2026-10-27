CREATE TABLE IF NOT EXISTS registro_pendiente (
  correo VARCHAR(150) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  fecha_creacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_expiracion DATETIME(3) NOT NULL,
  INDEX (fecha_expiracion)
) ENGINE=InnoDB;
