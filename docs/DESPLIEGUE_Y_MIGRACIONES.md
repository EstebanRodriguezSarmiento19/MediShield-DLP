# Publicación de código y base de datos

La rama de producción es `main`. Los cambios se preparan en otra rama y se
integran mediante Pull Request. El trabajo local se comprueba con
`npm test --prefix server`, `npm run build --prefix client` y, para cambios
de base de datos, `npm run db:setup --prefix server` en MySQL local.

## Qué se sincroniza

Los archivos `database/schema.sql` y `database/migrations/NNN_nombre.sql`
definen la estructura y los datos de configuración compartidos, como reglas y
destinatarios sintéticos. Cada migración nueva usa un número mayor y operaciones
que toleren una reejecución. Una migración ya aplicada no se edita: el ejecutor
comprueba su SHA-256 en `schema_migration` y exige un archivo nuevo si cambia.

Los registros de actividad (usuarios, sesiones, análisis, alertas y auditoría)
permanecen en la base donde se originaron. No se copian desde MySQL local a
Aiven al publicar código.

No conecte servidores locales a Aiven con un `AUDIT_HMAC_KEY` distinto al de
Render. Las entradas que escriban quedarán enlazadas, pero no podrán
verificarse con una sola clave. Para desarrollo utilice MySQL local; si un
equipo comparte Aiven, todos los procesos que escriben auditoría deben usar
la misma clave de producción gestionada como secreto. Nunca reescriba eventos
históricos para ocultar un fallo de verificación.

## Primera configuración en GitHub y Render

En GitHub, configurar los siguientes secretos de Actions en
`Settings → Secrets and variables → Actions`:

| Secreto | Valor |
| --- | --- |
| `AIVEN_DB_HOST` | Host del servicio MySQL de Aiven |
| `AIVEN_DB_PORT` | Puerto del servicio |
| `AIVEN_DB_USER` | Usuario autorizado a aplicar migraciones |
| `AIVEN_DB_PASSWORD` | Contraseña de ese usuario |
| `AIVEN_DB_NAME` | `medishield` |
| `AIVEN_DB_SSL_CA_BASE64` | Certificado CA de Aiven en Base64 |

Para comenzar se puede utilizar el usuario administrativo que ya figura en
`server/.env.cloud`. Los secretos se guardan en GitHub Actions, nunca en un
commit. Más adelante puede crearse un usuario migrador limitado a la base
`medishield`. La cuenta SQL que usa la web en Render no debe recibir permisos
de creación de tablas.

En Render, el servicio web debe apuntar a la rama `main` y tener
`Auto-Deploy → After CI Checks Pass`. Al integrar un cambio, el job `verify`
ejecuta pruebas y compila el cliente; luego `migrate` aplica en Aiven las
migraciones pendientes. Render despliega el código después de que ambos jobs
terminen correctamente. Si una migración falla, el despliegue se detiene.

El plan Free puede dormir el servicio por inactividad. Antes de una presentación,
abrir la web, esperar a que despierte y comprobar `/api/health`.

El registro público está desactivado por defecto en producción. El job de
migraciones otorga a `medishield_app` permisos limitados para crear y actualizar
`usuario`, gestionar `gestor_usuarios` y `recuperacion_clave`; no permite borrar
usuarios ni modificar eventos de auditoría. Si cambia el nombre de esa cuenta
SQL, actualice `APP_DB_USER` en el workflow. Las altas, roles y contraseñas de
personas son datos operativos de Aiven y no se copian desde MySQL local.

## Prueba del caso «Seguro»

La migración `003_demo_recipients.sql` añade los destinatarios sintéticos
utilizados por los casos rápidos de la interfaz. Usa `INSERT IGNORE`: si un
administrador ya cambió el estado de un destinatario, no se revierte su decisión.

Después del despliegue, comprobar en Aiven:

```sql
SELECT correo, autorizado, version
FROM medishield.destinatario
WHERE correo IN ('laboratorio@hospital.local', 'auditoria@partner.test');
```

En la web, iniciar sesión, elegir «Seguro» y analizar. Con el destinatario
autorizado y sin patrones sensibles, la decisión debe ser `PERMITIR` con
riesgo bajo. La ausencia de envíos anteriores puede mantener el puntaje en 25;
no bloquea por sí sola.
