ALTER TABLE sesion_web
  ADD COLUMN access_hash CHAR(64) NULL,
  ADD COLUMN ultima_actividad_access DATETIME(3) NULL,
  ADD UNIQUE INDEX ix_sesion_access_hash (access_hash);
