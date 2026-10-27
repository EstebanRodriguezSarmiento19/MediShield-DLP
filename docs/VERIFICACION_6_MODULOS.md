# Verificación de módulos de MediShield DLP

Fecha de la ejecución documentada: **1 de octubre de 2026**.

El objetivo mínimo era disponer de seis módulos reales y defendibles. La implementación y el paquete de pruebas cubren los diez activos de la matriz. Las capturas y resultados se encuentran en `evidence/`.

## Resultado general

| Control | Resultado |
| --- | --- |
| Pruebas unitarias | 12/12 aprobadas |
| Verificación integral | 26/26 aprobada |
| SAST del backend | 0 errores, 0 advertencias |
| SCA del cliente | 0 vulnerabilidades reportadas |
| SCA del servidor | 0 vulnerabilidades reportadas |
| Compilación del cliente | Aprobada |
| Flujo visual | 11 capturas, 0 errores JavaScript |
| Latencia local observada | p50 22 ms, p95 36 ms, máximo 38 ms en 20 solicitudes secuenciales |

La medición de latencia sirve como evidencia no funcional del laboratorio local. No representa una prueba de carga de producción.

## Relación entre módulos y evidencia

### 1. Autenticación

- Contraseñas derivadas con `scrypt` y sal aleatoria.
- Sesión aleatoria guardada en MySQL.
- Cookie `HttpOnly`, `SameSite=Strict`, expiración y cierre de sesión.
- Token CSRF y validación del origen.
- Límite de intentos por cuenta y dirección IP, persistente después de reiniciar.
- Casos integrales: rechazo sin sesión, credenciales incorrectas, SQL injection, roles, CSRF, cierre, expiración y limitación de intentos.
- Captura: `evidence/screenshots/01-autenticacion.png`.

### 2. Transferencias y motor DLP

- Esquema estricto de entrada y normalización en el servidor.
- Patrones clínicos sintéticos y puntuación ponderada.
- Decisiones `PERMITIR`, `ALERTAR` y `BLOQUEAR`.
- El servidor no confía en una decisión enviada por el navegador.
- Casos: decisiones completas, fuzz de tipos y longitudes, destinatario desconocido y manipulación de solicitudes.
- Capturas: `03-dlp-permitir.png`, `05-dlp-alertar.png` y `06-dlp-bloquear.png`.

### 3. Destinatarios autorizados

- Catálogo persistente con alta, autorización y revocación.
- Control de versión para evitar actualizaciones perdidas.
- Un destino desconocido o revocado se bloquea por defecto.
- La revocación posterior a un análisis invalida el envío.
- Captura: `evidence/screenshots/07-destinatarios.png`.

### 4. Análisis de comportamiento

- El historial se calcula por pareja usuario-destinatario.
- Solo una entrega SMTP confirmada incrementa la habitualidad.
- Las decisiones `ALERTAR` y `BLOQUEAR` no alteran el historial.
- Dos usuarios no comparten su línea base.
- Evidencia: pruebas de historial y archivo `.eml` en `evidence/after/smtp/`.

### 5. Reglas DLP

- Pesos persistentes y versión incremental.
- Solo el administrador puede modificar una regla.
- La versión obsoleta se rechaza para impedir que un cambio silencioso sobrescriba otro.
- Cada modificación genera auditoría.
- Captura: `evidence/screenshots/08-reglas.png`.

### 6. Alertas

- Las decisiones de advertencia o bloqueo generan una alerta persistente.
- Flujo permitido: `ABIERTA → EN_REVISION → CERRADA`.
- Notas obligatorias y registro del actor.
- Saltos inválidos y usuarios sin privilegio se rechazan.
- Captura: `evidence/screenshots/09-alertas.png`.

### 7. Auditoría

- Registra fecha, actor, acción, resultado y datos mínimos del evento.
- Cada evento incluye el HMAC del evento anterior, creando una cadena verificable.
- La API comprueba la integridad de la cadena completa.
- La cuenta SQL de la aplicación solo puede insertar y leer `audit_event`; no puede actualizar ni borrar.
- Captura: `evidence/screenshots/10-auditoria.png`.

### 8. Persistencia MySQL

- Usuarios, sesiones, intentos, destinatarios, reglas, transferencias, alertas, historial y auditoría se guardan en MySQL.
- Las consultas usan parámetros.
- La prueba integral reinicia el backend y confirma que el estado y la sesión sobreviven.
- Captura: `evidence/screenshots/02-persistencia-dashboard.png`.

### 9. Correo controlado

- Nodemailer apunta a un receptor SMTP local en `127.0.0.1:1025`.
- El receptor guarda `.eml` y metadatos JSON, y no retransmite mensajes.
- El envío vuelve a validar propietario, contenido, destino y decisión.
- Un análisis no se puede reutilizar para cambiar el mensaje, cambiar el usuario ni duplicar una entrega.
- Captura: `evidence/screenshots/04-correo-confirmado.png`.

### 10. Protección transversal de la API

- Helmet configura cabeceras de seguridad.
- Las respuestas autenticadas usan `Cache-Control: no-store`.
- La API oculta `X-Powered-By`.
- Hay límites de solicitudes y errores normalizados.
- Las comprobaciones de RBAC e IDOR se realizan en el servidor.

## Cómo reproducir la evidencia

### Preparar la base

```powershell
cd server
npm install
npm run db:setup
```

El comando crea `server/.env.lab` y `server/.lab-accounts.json`. Son archivos privados locales y no deben compartirse ni agregarse a Git.

### Ejecutar la prueba unitaria

```powershell
cd server
npm test
```

### Ejecutar la verificación integral

```powershell
cd server
npm run verify:lab
```

El script levanta una API temporal en `127.0.0.1:3107`, inicia un SMTP local, crea cuentas sintéticas de prueba y guarda `evidence/after/verification.json`. Los datos de prueba contienen identificadores sintéticos.

### Ejecutar SAST y SCA

```powershell
cd server
npx eslint "src/**/*.js" -f json
npm audit --json

cd ..\client
npm audit --json
npm run build
```

## Lectura del paquete de evidencia

- `evidence/index.html`: índice principal.
- `evidence/antes.html`: estado técnico anterior.
- `evidence/verificacion.html`: resumen de pruebas funcionales y no funcionales.
- `evidence/seguridad.html`: SAST, SCA y alcance de las pruebas de seguridad.
- `evidence/after/verification.json`: detalle de los 26 controles con trazas HTTP redactadas.
- `evidence/after/unit-tests.txt`: resultado de las 12 pruebas unitarias.
- `evidence/screenshots/`: capturas de la interfaz.
- `evidence/Matriz_Verificacion_MediShield_DLP.xlsx`: matriz completada con evidencia de antes y después.

## Límites que deben explicarse con precisión

- Los mensajes y datos son sintéticos.
- El correo se valida con un receptor SMTP local; no se prueba entrega en un proveedor externo.
- La latencia corresponde a solicitudes secuenciales en el computador de laboratorio.
- Las pruebas HTTP dirigidas cubren riesgos concretos, pero no constituyen un pentest independiente.
- No se ejecutó una campaña completa con OWASP ZAP. La columna DAST de la matriz se describe como prueba HTTP dirigida para evitar afirmar una herramienta que no se utilizó.
