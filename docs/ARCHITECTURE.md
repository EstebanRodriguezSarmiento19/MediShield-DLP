# Arquitectura de MediShield DLP

MediShield usa **Feature-Based Architecture** tanto en frontend como en backend. Cada capacidad del sistema mantiene juntas sus rutas, controladores, servicios y componentes para facilitar cambios manuales o asistidos por IA sin convertir el repositorio en una estructura global de `controllers/`, `services/` y `models/`.

## Backend (`server/src`)

```text
src/
  app.js
  server.js
  config/
  db/
  middleware/
  features/
    health/
    dlp/
      dlp.routes.js
      dlp.controller.js
      dlp.service.js
      dlp.rules.js
      dlp.demoRecipients.js
      dlp.store.js
  shared/
    errors/
    utils/
```

### Feature DLP actual

El flujo funcional de la Beta 0.1 es:

```text
React
  -> POST /api/dlp/analyze
  -> dlp.controller
  -> dlp.service
       -> reglas de contenido
       -> clasificacion del destinatario
       -> calculo de riesgo
       -> PERMITIR / ALERTAR / BLOQUEAR
  -> dlp.store (memoria temporal)
  -> respuesta sin contenido clinico original
```

La logica de riesgo no vive en React. La interfaz solo envia la solicitud y presenta el resultado devuelto por el servidor.

`dlp.store.js` es intencionalmente temporal y se reemplazara por repositorios MySQL cuando se implemente la persistencia de `TRANSFERENCIA`, `ANALISIS_DLP`, `COINCIDENCIA_DLP`, `ALERTA` y `REGISTRO_AUDITORIA`.

## Frontend (`client/src`)

```text
src/
  app/
  features/
    auth/
    dashboard/
    transfers/
    alerts/
    audit/
    dlp/
      dlpApi.js
  shared/
    components/layout/
    services/
    hooks/
```

La pantalla **Analisis DLP** permite ejecutar tres escenarios de laboratorio y tambien escribir casos manualmente. Dashboard, Alertas y Trazabilidad consumen los resultados reales generados por el backend durante la sesion del servidor.

## Siguientes features

Orden recomendado:

1. `auth` y `users`: autenticacion real y roles con MySQL.
2. `transfers`: persistencia del intento de transferencia.
3. `recipients`: historial remitente-destinatario en MySQL.
4. `alerts`: persistencia y gestion de alertas.
5. `audit`: auditoria encadenada con hashes.
6. `mail`: Nodemailer + Mailpit, invocado solo despues de una decision DLP permitida.
7. Snort y Gophish como herramientas de laboratorio independientes.
8. Python para analisis posterior de eventos.

## Regla de seguridad estructural

El navegador nunca sera la autoridad para decidir si una transferencia puede salir. Cuando se implemente correo, el flujo obligatorio sera:

```text
React -> Express -> TransferService -> DLP -> Decision -> MailService -> Mailpit
```

Si DLP devuelve `BLOQUEAR`, `MailService` no debe ser invocado.
