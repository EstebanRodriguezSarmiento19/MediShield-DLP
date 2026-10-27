# Despliegue gratuito de MediShield DLP

Esta guía publica una demostración con datos sintéticos. Usa una instancia web gratuita de Render y un MySQL gratuito de Aiven. El servicio web puede tardar aproximadamente un minuto en despertar tras 15 minutos sin tráfico; el almacenamiento de Aiven Free es de 1 GB. No uses datos clínicos reales.

## 1. Preparar GitHub

Sube los cambios revisados al repositorio. Conecta la rama principal a Render y configura el despliegue automático tras las comprobaciones de CI. No subas `server/.env`, `server/.env.lab`, `server/.env.cloud` ni `server/.lab-accounts.json`.

Para dar permisos de escritura a compañeros en un repositorio personal, ve a **Settings → Collaborators → Add people** e introduce su usuario de GitHub o su correo asociado. La URL pública del repositorio permite consultar o clonar, pero no concede permiso de escritura. Si todavía no sabes sus cuentas y el repositorio es público, pueden enviar cambios mediante forks y pull requests.

Nadie necesita instalar MySQL en su computador para editar el código. Pueden abrir el repositorio en `github.dev` (tecla `.` en GitHub) para cambiar archivos y crear commits desde el navegador; este editor no tiene terminal ni puede ejecutar pruebas. Para programar y probar en un entorno de navegador, pueden usar GitHub Codespaces dentro de su cuota gratuita personal. Los secretos de Render y Aiven permanecen solo en las plataformas; cada colaborador trabaja en una rama y propone un pull request hacia `main`.

## 2. Crear MySQL en Aiven

En Aiven, crea un proyecto y un servicio **MySQL Free**. Descarga el certificado CA. Anota el host, puerto, usuario `avnadmin` y contraseña. La base de datos no es la que corre en tu computador; el script crea una base nueva en Aiven.

Convierte el certificado a base64 en PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\ruta\al\ca.pem')) | Set-Clipboard
```

Crea `server/.env.cloud` en tu computador con estas claves y valores privados:

```dotenv
DB_HOST=host-de-aiven
DB_PORT=puerto-de-aiven
DB_USER=avnadmin
DB_PASSWORD=contraseña-de-aiven
DB_NAME=medishield
DB_SSL_CA_BASE64=certificado-base64
APP_DB_USER=medishield_app
APP_DB_PASSWORD=contraseña-aleatoria-distinta-de-al-menos-24-caracteres
INITIAL_ADMIN_EMAIL=tu-correo-real
INITIAL_ADMIN_PASSWORD=frase-de-paso-unica-de-al-menos-15-caracteres
```

Desde `server`, ejecuta una sola vez:

```powershell
npm run db:setup:cloud
```

El comando crea el esquema, las reglas iniciales, tu cuenta de administrador y un usuario SQL con permisos limitados. Se puede repetir sin sobrescribir la contraseña del administrador existente. Si falla, no configures la web como publicada hasta resolver el error. Conserva la contraseña en un gestor de contraseñas y retira el archivo `.env.cloud` una vez configurado Render.

## 3. Crear la web en Render

En Render, crea un **Web Service** desde el repositorio de GitHub, elige la rama de despliegue y el plan **Free**. El `Dockerfile` del directorio raíz compila React y sirve la interfaz junto con `/api` desde un solo dominio. Activa **Auto-Deploy: After CI Checks Pass** para que los cambios lleguen a la web al pasar las pruebas de GitHub Actions.

Configura estas variables secretas en Render:

```dotenv
NODE_ENV=production
DB_HOST=host-de-aiven
DB_PORT=puerto-de-aiven
DB_NAME=medishield
DB_USER=medishield_app
DB_PASSWORD=contraseña-APP_DB_PASSWORD
DB_SSL_CA_BASE64=certificado-base64
AUDIT_HMAC_KEY=64-caracteres-hexadecimales-generados-al-azar
CLIENT_ORIGIN=https://nombre-del-servicio.onrender.com
SMTP_ENABLED=false
```

Genera `AUDIT_HMAC_KEY` una vez con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Guárdala en Render y en un gestor de secretos: cambiarla invalidaría la verificación de la cadena de auditoría previa. No copies `DB_USER=avnadmin` ni la contraseña de administrador de Aiven al servicio web. Render asigna `PORT` automáticamente y el servidor escucha en `0.0.0.0` al ejecutarse en producción.

Cuando termine el despliegue, abre la URL de Render y consulta `/api/health`. Debe informar `database: connected`. Inicia sesión con `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`. Usa cuentas distintas para cada integrante; la función de invitaciones de la aplicación todavía está pendiente.

## 4. Restricciones de esta etapa

- `smtp:lab` y los destinatarios `.local` o `.test` siguen siendo solo para el laboratorio local. En la web, `SMTP_ENABLED=false`; no se enviará correo externo.
- Render Free se suspende por inactividad y pierde archivos locales al reiniciar. La información persistente debe estar en Aiven.
- Render Free bloquea salida SMTP en puertos 25, 465 y 587. La etapa de correo real se implementará por API HTTPS con un remitente verificado y destinos de prueba autorizados.
- La instancia gratuita es para demostración universitaria con datos sintéticos; no ofrece disponibilidad ni capacidad para un sistema clínico real.

Referencias: [Render Free](https://render.com/docs/free), [despliegue automático de Render](https://render.com/docs/deploys), [Aiven MySQL Free](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier), [invitación de colaboradores en GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository), [editor github.dev](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor), [cuota gratuita de Codespaces](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-included-usage).
