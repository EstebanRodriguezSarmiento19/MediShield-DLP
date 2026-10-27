# Cuentas, permisos y recuperación

## Configuración del correo real

En Brevo, verifica una dirección remitente a la que tengas acceso. En Render,
servicio MediShield → **Environment**, guarda estas variables:

| Variable | Valor |
| --- | --- |
| `BREVO_API_KEY` | Clave API v3 de Brevo; nunca se guarda en Git |
| `BREVO_SENDER_EMAIL` | Dirección remitente verificada en Brevo |
| `BREVO_SENDER_NAME` | `MediShield DLP` (opcional) |

`CLIENT_ORIGIN` debe ser la URL HTTPS pública de Render. El backend usa la API
HTTPS de Brevo; no depende de los puertos SMTP salientes bloqueados por Render
Free. El proveedor debe estar configurado antes de crear o reactivar cuentas en
la web. Para probarlo en local, añade las tres variables a `server/.env.lab`;
ese archivo privado está excluido de Git.

## Uso desde la web

1. Inicia sesión como administrador y abre **Cuentas**.
2. Escribe nombre, correo real y rol. Activa «Puede gestionar cuentas» para
   compartir esta función con un analista o usuario sin cambiar su rol DLP.
3. Pulsa **Crear y enviar invitación**. La persona abre el mensaje y elige una
   contraseña de 15 a 128 caracteres antes de que pasen 15 minutos.
4. **Editar** cambia nombre, correo o permisos. Si cambia el correo, se cierran
   las sesiones, se invalida la contraseña anterior y se envía una invitación al
   nuevo correo. Si cambian los permisos, las sesiones también se cierran.
5. **Desactivar** impide inmediatamente el acceso. El registro permanece para
   conservar los vínculos con transferencias y auditoría. **Reactivar e invitar**
   genera una contraseña aleatoria desconocida y envía un nuevo enlace.
6. Si Brevo rechaza una invitación, la web lo indica. Tras corregir el
   remitente o la clave, usa **Reenviar invitación**.

La persona que olvide su contraseña usa **¿Olvidaste tu contraseña?** en el
inicio de sesión. La respuesta no confirma si el correo existe. El enlace
vence a los 15 minutos, funciona una vez y, al usarlo, cierra todas las
sesiones existentes de esa cuenta.

**Regístrate** permite solicitar una cuenta pública únicamente cuando Brevo
está configurado. La solicitud solo pide nombre y correo; la cuenta no se crea
todavía. El destinatario abre el enlace recibido y elige su propia contraseña.
Al confirmarlo se crea una cuenta de rol `usuario`, sin permiso para gestionar
cuentas. El enlace caduca a los 15 minutos y se consume una sola vez. Una
respuesta genérica evita revelar si el correo ya pertenece a una cuenta.
`ALLOW_PUBLIC_REGISTRATION=false` desactiva las solicitudes y confirmaciones
nuevas sin desactivar la recuperación de contraseña ni las invitaciones.

## Comprobación y base de datos

La migración `004_accounts.sql` crea `gestor_usuarios` y
`recuperacion_clave`; `005_public_registration.sql` crea
`registro_pendiente`. `usuario` conserva rol, estado y hash de contraseña.
`recuperacion_clave` almacena solo SHA-256 del token; los tokens completos
viajan únicamente en el correo. `audit_event` registra altas, cambios,
desactivaciones, invitaciones y restablecimientos sin contraseñas ni tokens.

En MySQL Workbench se pueden inspeccionar las cuentas y permisos con:

```sql
SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.estado,
       (u.rol = 'admin' OR g.id_usuario IS NOT NULL) AS puede_gestionar_cuentas
FROM medishield.usuario AS u
LEFT JOIN medishield.gestor_usuarios AS g ON g.id_usuario = u.id_usuario
ORDER BY u.id_usuario;
```

No consultes ni compartas `clave_hash` o los hashes de recuperación como
evidencia de clase. Para verificar localmente sin enviar correo real:

```powershell
cd server
npm run db:setup
npm run verify:accounts:lab
```

La verificación usa un simulador de la respuesta HTTP de Brevo y comprueba
invitación, elección de contraseña, permiso de gestión, cambio de correo,
restablecimiento de un solo uso, revocación de sesiones, desactivación y
reactivación. La entrega a un buzón real se comprueba por separado tras
configurar Brevo en Render.
