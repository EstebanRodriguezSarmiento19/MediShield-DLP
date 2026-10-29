-- Roles personalizados y permisos granulares.
-- Los roles base (admin, analista, usuario) se conservan. Una cuenta sin rol
-- personalizado mantiene los permisos por defecto de su rol base.

CREATE TABLE IF NOT EXISTS rol_personalizado (
  id_rol INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  creado_por INT UNSIGNED NULL,
  fecha_creacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_actualizacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rol_permiso (
  id_rol INT UNSIGNED NOT NULL,
  permiso VARCHAR(60) NOT NULL,
  PRIMARY KEY (id_rol, permiso),
  FOREIGN KEY (id_rol) REFERENCES rol_personalizado(id_rol) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE usuario
  ADD COLUMN id_rol INT UNSIGNED NULL,
  ADD INDEX (id_rol),
  ADD CONSTRAINT fk_usuario_rol_personalizado FOREIGN KEY (id_rol) REFERENCES rol_personalizado(id_rol) ON DELETE SET NULL;
