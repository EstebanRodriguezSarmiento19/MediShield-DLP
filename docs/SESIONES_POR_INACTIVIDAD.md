# Expiración por inactividad

La autenticación tiene dos tiempos independientes:

| Elemento | Inactividad máxima | Límite absoluto |
| --- | ---: | ---: |
| Token de acceso (`medishield_access`) | 2 minutos | Depende de la sesión |
| Sesión renovable (`medishield_session`) | 15 minutos | 8 horas desde el inicio de sesión |

Las dos cookies son `HttpOnly` y `SameSite=Strict`; en producción también son `Secure`.
La base almacena solamente hashes de los tokens. La migración
`database/migrations/008_access_idle.sql` agrega el hash y la última actividad
del token de acceso. Las sesiones previas a la migración pueden renovar el acceso
al volver a abrir la aplicación, siempre que su sesión siga vigente.

Una solicitud normal comprueba ambos plazos sin modificarlos. El panel puede
consultar datos cada 30 segundos, pero esas consultas no prolongan la sesión.
Los eventos de teclado, ratón y pantalla táctil del usuario activan como máximo
una renovación por minuto mediante `POST /api/auth/refresh`. La renovación
requiere la cookie de sesión vigente y el origen de la aplicación. Cuando el
token de acceso expiró pero la sesión sigue vigente, una acción del usuario
obtiene un token nuevo y reintenta la solicitud una vez. Si la sesión superó
los 15 minutos de inactividad o las 8 horas absolutas, debe iniciar sesión.

Para verificarlo con MySQL local, ejecute `npm run db:setup --prefix server` y
`npm run verify:lab --prefix server`. Los casos AUT-09 y AUT-10 adelantan los
relojes de la fila de prueba en MySQL, de modo que no hay que esperar 2 o 15
minutos. AUT-09 confirma que una consulta ordinaria no renueva la actividad;
AUT-10 confirma que una sesión inactiva rechaza la renovación. AUT-07 comprueba
el límite absoluto, AUT-06 el cierre de sesión y AUT-11 la sustitución de una
sesión anterior tras un nuevo inicio válido.
