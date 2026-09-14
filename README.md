# MediShield DLP

Sistema web para la prevencion de perdida de datos medicos. La **Beta 0.1** ya contiene un vertical slice funcional del motor DLP: React envia un mensaje al backend, Node.js analiza contenido y destinatario y devuelve `PERMITIR`, `ALERTAR` o `BLOQUEAR`.

La persistencia DLP completa en MySQL y el envio controlado con Mailpit son las siguientes etapas.

## Tecnologias

**Frontend:** React, Vite, JavaScript, Material UI, React Router  
**Backend:** Node.js, Express, JavaScript, mysql2, dotenv  
**Base de datos:** MySQL  
**Pruebas:** `node:test` para el nucleo DLP

## Que funciona ahora

- Feature-Based Architecture en frontend y backend.
- `GET /api/health` con comprobacion de MySQL.
- `POST /api/dlp/analyze` con analisis server-side real.
- Reglas DLP deterministas para identificacion, historia clinica y terminologia medica.
- Analisis contextual de destinatarios de laboratorio.
- Puntaje de riesgo de 0 a 100.
- Decisiones `PERMITIR`, `ALERTAR` y `BLOQUEAR`.
- SHA-256 del contenido en lugar de devolver el texto sensible como evidencia.
- Dashboard con metricas generadas por analisis reales de la ejecucion.
- Vista de alertas DLP.
- Vista temporal de trazabilidad.
- Cinco pruebas automatizadas del motor DLP.

Los eventos DLP se almacenan **en memoria** durante esta beta y desaparecen al reiniciar el backend. MySQL se usa actualmente para comprobar infraestructura y contiene la tabla inicial de usuarios. La siguiente fase migrara la evidencia DLP a las tablas definitivas.

## Requisitos

- Node.js 18 o superior.
- npm.
- MySQL 8 o compatible para comprobar la capa de datos. El motor DLP puede demostrarse aunque MySQL todavia no este configurado.

## 1. Base de datos

```bash
mysql -u root -p < database/schema.sql
```

## 2. Backend

Copia la plantilla de variables:

```bash
cp .env.example server/.env
```

Ajusta las credenciales de MySQL en `server/.env`.

Instala y ejecuta:

```bash
cd server
npm install
npm run dev
```

Backend: `http://localhost:3000`

## 3. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Por defecto el cliente usa `http://localhost:3000/api`. Si necesitas cambiarlo, copia `client/.env.example` como `client/.env`.

## 4. Demo rapida

Abre:

`http://localhost:5173/transfers`

En **Casos de laboratorio** prueba, en orden:

1. `Seguro` -> `PERMITIR`.
2. `Advertencia` -> `ALERTAR`.
3. `Bloqueo` -> `BLOQUEAR`.

Luego abre:

- `/dashboard`: metricas reales de los analisis de esta ejecucion.
- `/alerts`: solo decisiones `ALERTAR` y `BLOQUEAR`.
- `/audit`: trazabilidad temporal con ID y hash SHA-256.

La guia para sustentar la demo esta en [`docs/DEMO_DLP.md`](docs/DEMO_DLP.md).

## 5. API DLP

### Analizar una transferencia

`POST /api/dlp/analyze`

Ejemplo:

```json
{
  "recipient": "destino.personal@gmail.com",
  "subject": "Historia clinica",
  "body": "Referencia HC-482910 del paciente CC 1012345678"
}
```

El backend calcula el resultado. El frontend no puede elegir la decision.

### Estadisticas temporales

`GET /api/dlp/stats`

### Actividad reciente

`GET /api/dlp/recent?limit=10`

### Reglas publicas

`GET /api/dlp/rules`

## 6. Pruebas

```bash
cd server
npm test
```

Se prueban casos de permitir, alertar, bloquear, destinatario no autorizado y minimizacion de datos.

## Estado de la hoja de ruta

### Beta 0.1 - actual

- [x] Base React / Express.
- [x] Conexion preparada con MySQL.
- [x] Motor DLP determinista server-side.
- [x] Analisis de destinatario de laboratorio.
- [x] Dashboard de actividad real.
- [x] Alertas temporales.
- [x] Hash de evidencia.
- [x] Tests del nucleo.

### Siguiente fase

- [ ] Autenticacion real y roles.
- [ ] Persistencia de transferencias y analisis DLP en MySQL.
- [ ] Historial real remitente-destinatario.
- [ ] Auditoria persistente.
- [ ] Nodemailer + Mailpit.
- [ ] Confirmacion de transferencias en estado `ALERTAR`.

Despues se incorporaran Snort, Gophish, OWASP ZAP y analisis de datos con Python sin romper el nucleo de la aplicacion.
