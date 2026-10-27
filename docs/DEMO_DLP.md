# Demostración de MediShield DLP

## Preparación

1. Confirme que MySQL está iniciado.
2. En `server`, ejecute `npm run db:setup` una sola vez o cuando necesite reconstruir los datos de laboratorio.
3. Inicie `npm run smtp:lab`.
4. Inicie el backend con `npm start`.
5. Inicie el cliente con `npm run dev` y abra `http://localhost:5173`.
6. Consulte las cuentas locales en `server/.lab-accounts.json`.

## Recorrido sugerido para el profesor

### 1. Autenticación y roles

Entre como profesional de salud. Muestre que la sesión se conserva mediante una cookie `HttpOnly` y que el menú no expone administración. Intente abrir una ruta administrativa: la API devuelve `403`, aunque se escriba la URL manualmente.

### 2. Decisión PERMITIR y envío

Use el destinatario `laboratorio@hospital.local`, un asunto administrativo y un cuerpo sin patrones clínicos. El motor devuelve `PERMITIR`. Envíe el correo y muestre el archivo `.eml` creado en `evidence/mailbox`.

### 3. Decisión ALERTAR

Use `auditoria@partner.test` y un texto con términos clínicos sintéticos. El motor devuelve `ALERTAR`, crea una alerta y no entrega el mensaje al SMTP.

### 4. Decisión BLOQUEAR

Use un destinatario externo o un texto con `HC-482910` y `CC 1012345678`. El motor devuelve `BLOQUEAR`, registra la decisión y no ofrece envío.

### 5. Destinatarios y comportamiento

Entre como administrador. Autorice y revoque un destinatario. Explique que el historial solo aumenta después de una entrega SMTP confirmada y que se mantiene separado por usuario.

### 6. Reglas

Cambie el peso de una regla. Muestre el incremento de versión y el evento de auditoría. Un profesional de salud no puede hacer esta modificación.

### 7. Alertas

Abra una alerta, pásela a `EN_REVISION`, agregue una nota y ciérrela. El servidor rechaza saltos de estado no permitidos.

### 8. Auditoría y persistencia

Abra Auditoría y ejecute la comprobación de cadena. Reinicie el backend y muestre que sesiones, análisis, reglas y alertas siguen disponibles en MySQL.

## Frase breve para sustentar la arquitectura

> La interfaz no decide si un dato puede salir. El backend autentica al usuario, aplica roles, valida el contenido y el destinatario, persiste la decisión y vuelve a comprobarla antes de entregar el correo a un SMTP local. Cada acción relevante queda enlazada en una bitácora HMAC y la cuenta SQL de la aplicación no puede modificar ni borrar esos eventos.

## Evidencia reproducible

Ejecute `npm test` y `npm run verify:lab` dentro de `server`. Los resultados se guardan en `evidence/after`. El índice navegable está en `evidence/index.html` y la matriz de capturas en `evidence/Matriz_Verificacion_MediShield_DLP.xlsx`.
