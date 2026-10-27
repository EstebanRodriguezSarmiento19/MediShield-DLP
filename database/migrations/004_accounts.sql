CREATE TABLE IF NOT EXISTS gestor_usuarios (
  id_usuario INT UNSIGNED PRIMARY KEY,
  concedido_por INT UNSIGNED NULL,
  fecha_concesion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (concedido_por) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recuperacion_clave (
  token_hash CHAR(64) PRIMARY KEY,
  id_usuario INT UNSIGNED NOT NULL,
  fecha_creacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_expiracion DATETIME(3) NOT NULL,
  fecha_uso DATETIME(3) NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  INDEX (id_usuario, fecha_expiracion),
  INDEX (fecha_expiracion)
) ENGINE=InnoDB;
