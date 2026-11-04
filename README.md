# 🛡️ MediShield DLP

**Sistema de prevención de pérdida y fuga de información (Data Loss Prevention)**

MediShield DLP es una aplicación web diseñada para prevenir la salida no autorizada de datos clínicos sintéticos. Cuenta con una interfaz desarrollada en React, una API de Node.js y una base de datos MySQL, incorporando mecanismos de autenticación, autorización, análisis de información sensible, alertas y auditoría de seguridad.

---

## Descripción del proyecto

MediShield DLP es una solución de seguridad informática enfocada en la protección de información académica y clínica sensible.

Su objetivo es identificar, analizar y controlar los intentos de transferencia de información, evitando posibles fugas de datos mediante políticas de prevención, validación de destinatarios y monitoreo de eventos.

## Funcionalidades principales

- **Autenticación segura:** contraseñas protegidas mediante `scrypt`, sesiones almacenadas en MySQL y cookies HttpOnly.
- **Control de acceso:** gestión de permisos basada en roles.
- **Motor DLP:** identificación de patrones sensibles y clasificación de operaciones.
- **Gestión de destinatarios:** registro de destinatarios autorizados y revocados.
- **Reglas de seguridad:** administración de reglas DLP ponderadas y versionadas.
- **Sistema de alertas:** generación, seguimiento y cierre de alertas.
- **Auditoría:** registro encadenado mediante HMAC-SHA256.
- **Receptor SMTP local:** almacenamiento de mensajes de laboratorio sin retransmisión a Internet.
- **Protección HTTP:** cabeceras de seguridad, protección CSRF y limitación de solicitudes.

## Arquitectura del sistema

El proyecto está organizado en tres componentes principales:

| Componente | Descripción |
|---|---|
| Frontend | Interfaz web desarrollada con React. |
| Backend | API desarrollada con Node.js. |
| Base de datos | MySQL para persistencia de usuarios, sesiones, alertas y auditoría. |

## Tecnologías utilizadas

- React
- JavaScript
- Node.js
- MySQL
- Express
- Vite
- SMTP local
- HMAC-SHA256
- Git y GitHub

## Estructura del repositorio

```text
MediShield-DLP/
│
├── .github/
│   └── workflows/
│
├── client/
│   └── Aplicación frontend React
│
├── server/
│   └── API y lógica de seguridad
│
├── database/
│   └── Archivos de base de datos
│
├── docs/
│   └── Documentación técnica
│
├── evidence/
│   └── Evidencias y resultados de pruebas
│
├── .env.example
├── .gitignore
├── Dockerfile
├── package-lock.json
└── README.md
```

### Acceso directo a las carpetas

- [Frontend – Client](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/client)
- [Backend – Server](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/server)
- [Base de datos – Database](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/database)
- [Documentación – Docs](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/docs)
- [Evidencias – Evidence](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/evidence)
- [GitHub Actions](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/.github/workflows)

## equisitos previos

Antes de ejecutar el proyecto, asegúrese de contar con:

- Node.js 20 o superior
- npm
- MySQL 8 o compatible
- Git

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP.git
```

### 2. Ingresar al proyecto

```bash
cd MediShield-DLP
```

### 3. Configurar las variables de entorno

Copiar el archivo de ejemplo a la carpeta del servidor.

**Windows PowerShell:**

```powershell
Copy-Item .env.example server/.env
```

**Linux / macOS:**

```bash
cp .env.example server/.env
```

Editar `server/.env` y configurar los parámetros de conexión a MySQL según el entorno local.

### 4. Instalar dependencias del backend

```bash
cd server
npm install
```

### 5. Configurar la base de datos

```bash
npm run db:setup
```

Este comando prepara el esquema de la base de datos, carga datos sintéticos, genera cuentas de laboratorio y configura una cuenta SQL con privilegios mínimos.

### 6. Instalar dependencias del frontend

```bash
cd ../client
npm install
```

## Ejecución del proyecto EN LOCAL

Para ejecutar MediShield DLP se deben abrir **tres terminales independientes** desde la carpeta raíz del proyecto.

### Terminal 1 – Servidor SMTP local

```bash
cd server
npm run smtp:lab
```

### Terminal 2 – Backend

```bash
cd server
npm start
```

### Terminal 3 – Frontend

```bash
cd client
npm run dev
```

### Acceso a la aplicación

Una vez iniciados los tres servicios, abrir el siguiente enlace en el navegador:

[http://localhost:5173](http://localhost:5173)

Utilizar las credenciales generadas en `server/.lab-accounts.json` para ingresar según el rol que se desee demostrar.

## Roles del sistema

MediShield DLP incorpora tres roles principales:

| Rol | Descripción |
|---|---|
| Administrador | Administración y configuración general del sistema. |
| Analista | Supervisión de alertas y eventos de seguridad. |
| Usuario | Acceso a las funcionalidades autorizadas para usuarios. |

Los permisos son validados desde el backend para evitar accesos no autorizados.

## Pruebas y verificación

### 1. Ejecutar pruebas unitarias

```bash
cd server
npm test
```

### 2. Ejecutar verificación integral

```bash
cd server
npm run verify:lab
```

La verificación integral inicia una API temporal y un servidor SMTP local, genera cuentas sintéticas descartables y ejecuta 26 controles de seguridad.

### Resultados de verificación

Resultados documentados el 1 de octubre de 2026:

| Prueba | Resultado |
|---|---|
| Pruebas unitarias | 12/12 aprobadas |
| Controles integrales | 26/26 aprobados |
| SAST Backend | 0 errores y 0 advertencias |
| SCA | 0 vulnerabilidades reportadas |
| Compilación frontend | Completada |
| Pruebas visuales automatizadas | 11 capturas, 0 errores JavaScript |

Los resultados corresponden al entorno de laboratorio y no representan una certificación de seguridad de producción.

## Evidencias y documentación

Para consultar los documentos técnicos y resultados de las pruebas, acceder a los siguientes recursos:

- [Verificación de los 6 módulos](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/blob/main/docs/VERIFICACION_6_MODULOS.md)
- [Guía de despliegue gratuito](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/blob/main/docs/DESPLIEGUE_GRATUITO.md)
- [Evidencias de verificación](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/tree/main/evidence)
- [Índice de evidencias](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP/blob/main/evidence/index.html)

## Alcance del laboratorio

MediShield DLP trabaja con datos clínicos sintéticos. El receptor SMTP local almacena los mensajes en disco sin retransmitirlos a redes externas.

El proyecto incorpora controles de autenticación, autorización, protección CSRF, prevención de IDOR, inyección SQL, manipulación de solicitudes y fuzzing básico.

Estas pruebas no sustituyen una auditoría externa ni una evaluación completa de seguridad en producción.

## Repositorio

**MediShield DLP – GitHub**

[![GitHub Repository](https://img.shields.io/badge/GitHub-MediShield--DLP-black?logo=github)](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP)

[📂 Ver código fuente](https://github.com/EstebanRodriguezSarmiento19/MediShield-DLP)

---

**MediShield DLP | Proyecto de seguridad informática y prevención de pérdida de información.**
