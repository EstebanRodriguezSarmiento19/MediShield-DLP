-- =========================================================
-- MediShield DLP - Esquema inicial de base de datos
-- =========================================================
-- Este esquema es solo el punto de partida para comprobar
-- la conexión de la aplicación con MySQL. Se irá ampliando
-- a medida que se desarrollen las funcionalidades reales
-- (auth, transfers, dlp, alerts, audit, etc.).
-- =========================================================

CREATE DATABASE IF NOT EXISTS medishield
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medishield;

-- ---------------------------------------------------------
-- Tabla: usuario
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(150)  NOT NULL,
  correo         VARCHAR(150)  NOT NULL UNIQUE,
  clave_hash     VARCHAR(255)  NOT NULL,
  rol            ENUM('admin', 'analista', 'usuario') NOT NULL DEFAULT 'usuario',
  estado         ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Nota: clave_hash debe almacenar siempre un hash (ej. bcrypt),
-- nunca una contraseña en texto plano. La lógica de autenticación
-- se implementará más adelante en server/src/features/auth.
