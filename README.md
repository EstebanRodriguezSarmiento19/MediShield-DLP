# MediShield DLP

MediShield DLP es un sistema web para prevenir la salida no autorizada de datos clínicos sintéticos. React presenta la interfaz y una API de Node.js toma todas las decisiones de seguridad. MySQL conserva usuarios, sesiones, destinatarios, reglas, transferencias, alertas, historial y auditoría.

## Funciones implementadas

- Autenticación real con contraseñas derivadas mediante `scrypt`, sesiones aleatorias almacenadas en MySQL, cookie `HttpOnly` con `SameSite=Strict`, protección CSRF, validación de origen y límite persistente de intentos.
- Roles `admin`, `analista` y `usuario`, aplicados en el servidor.
- Gestión de cuentas desde la web: invitaciones, cambios de correo y rol, permiso independiente para gestionar cuentas, desactivación y reactivación. Las sesiones se revocan al cambiar acceso.
- Recuperación de contraseñas mediante correo HTTPS, enlace de 15 minutos y uso único. El servidor almacena solo el hash del token y cierra las sesiones anteriores tras restablecer la clave.
- Motor DLP que normaliza y valida la entrada, identifica patrones sensibles y decide `PERMITIR`, `ALERTAR` o `BLOQUEAR`.
- Catálogo persistente de destinatarios autorizados o revocados, con control de versión.
- Historial remitente-destinatario calculado únicamente a partir de entregas SMTP confirmadas.
- Reglas DLP administrables, ponderadas, versionadas y protegidas por rol.
- Alertas persistentes con flujo `ABIERTA → EN_REVISION → CERRADA`, notas y registro de cada transición.
- Auditoría encadenada con HMAC-SHA256. La cuenta SQL de la aplicación no posee permisos `UPDATE` ni `DELETE` sobre `audit_event`.
- Receptor SMTP local que guarda archivos `.eml` y nunca retransmite correo a Internet.
- Cabeceras HTTP de seguridad, respuestas sensibles sin caché y límites de solicitudes.

## Requisitos

- Node.js 20 o superior.
- npm.
- MySQL 8 o compatible en ejecución.

## Preparación inicial

1. Copie `.env.example` como `server/.env` y configure la conexión administrativa a MySQL.
2. Instale las dependencias:

```powershell
cd server
npm install
npm run db:setup

cd ..\client
npm install
```

`npm run db:setup` crea o actualiza el esquema, carga datos sintéticos, genera cuentas de laboratorio y crea una cuenta SQL con privilegios mínimos. Las contraseñas quedan únicamente en `server/.lab-accounts.json`. La configuración privada queda en `server/.env.lab`. Ambos archivos están excluidos de Git.

## Crear y administrar cuentas

En la web publicada, un administrador abre **Cuentas**. Puede crear una cuenta
con rol `usuario`, `analista` o `admin` y conceder por separado el permiso
«Puede gestionar cuentas». La aplicación envía una invitación al correo real de
la persona. Ella elige su contraseña; nadie tiene que conocerla ni escribirla
en Workbench. También se pueden modificar el nombre, correo y permisos,
desactivar una cuenta y reactivarla. Cambiar el correo invalida la contraseña
anterior y envía una invitación al nuevo correo. Desactivar conserva la fila y
el historial para que la auditoría siga siendo verificable.

El registro público se habilita cuando Brevo tiene una clave y un remitente
configurados. La persona solicita un enlace desde «Regístrate», confirma el
correo y elige una contraseña; solo entonces se crea la cuenta `usuario`.
Un enlace vence a los 15 minutos y funciona una vez. Para cerrar el registro
público sin afectar las invitaciones, configura `ALLOW_PUBLIC_REGISTRATION=false`.

Para «Olvidé mi contraseña», configura un remitente verificado y una clave de
API de Brevo en Render. Consulta
[`docs/CUENTAS_Y_RECUPERACION.md`](docs/CUENTAS_Y_RECUPERACION.md).

## Ejecución

Abra tres terminales en la raíz del proyecto.

Terminal 1:

```powershell
cd server
npm run smtp:lab
```

Terminal 2:

```powershell
cd server
npm start
```

Terminal 3:

```powershell
cd client
npm run dev
```

Abra `http://localhost:5173`. Use una cuenta de `server/.lab-accounts.json` según el rol que quiera demostrar.

## Pruebas y evidencias

Pruebas unitarias del motor:

```powershell
cd server
npm test
npm run verify:accounts:lab
```

Verificación integral aislada:

```powershell
cd server
npm run verify:lab
```

La verificación integral inicia una API temporal y un SMTP local, crea cuentas sintéticas descartables, ejecuta 26 controles y guarda el resultado en `evidence/after/verification.json`.

Resultados verificados el 1 de octubre de 2026:

- 12 de 12 pruebas unitarias aprobadas.
- 26 de 26 controles integrales aprobados.
- SAST: 0 errores y 0 advertencias en el backend.
- SCA: 0 vulnerabilidades reportadas en cliente y servidor.
- Compilación del cliente completada.
- Flujo visual automatizado: 11 capturas y 0 errores JavaScript.
- Prueba local secuencial de 20 análisis: p50 22 ms, p95 36 ms y máximo 38 ms. Es una observación del equipo local, no una prueba de carga de producción.

Consulte [`docs/VERIFICACION_6_MODULOS.md`](docs/VERIFICACION_6_MODULOS.md) para repetir la demostración y relacionar cada módulo con sus pruebas. Abra `evidence/index.html` para navegar el paquete de evidencia.

Para sincronizar cambios de estructura y configuración entre MySQL local,
Aiven y Render, consulte [`docs/DESPLIEGUE_Y_MIGRACIONES.md`](docs/DESPLIEGUE_Y_MIGRACIONES.md).

## Alcance del laboratorio

El sistema procesa datos sintéticos. El SMTP local recibe y conserva mensajes en disco sin enviarlos a redes externas. Las pruebas HTTP dirigidas cubren autenticación, autorización, CSRF, IDOR, inyección SQL, manipulación de solicitudes y fuzzing básico. No sustituyen una auditoría externa ni una campaña completa con OWASP ZAP.


## Demostración web y colaboración

La preparación de una web pública gratuita con Render y MySQL alojado en Aiven, junto con la edición desde el navegador y la configuración de despliegue automático desde GitHub, se explica en [docs/DESPLIEGUE_GRATUITO.md](docs/DESPLIEGUE_GRATUITO.md). Usa solo datos sintéticos.
