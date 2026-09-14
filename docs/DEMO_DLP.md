# Demo DLP - Beta 0.1

Esta iteracion incorpora un primer **vertical slice funcional** del nucleo de MediShield DLP. El analisis se ejecuta en Node.js, no en React.

## Que se puede demostrar

1. El usuario abre **Analisis DLP**.
2. Ingresa destinatario, asunto y mensaje.
3. React envia la solicitud a `POST /api/dlp/analyze`.
4. El backend aplica reglas deterministas y analiza el contexto del destinatario.
5. El backend calcula un puntaje de riesgo entre 0 y 100.
6. El motor decide `PERMITIR`, `ALERTAR` o `BLOQUEAR`.
7. La interfaz muestra la decision, el puntaje, las reglas activadas y los motivos.
8. El Dashboard, Alertas y Trazabilidad consumen los eventos que realmente se generaron durante la ejecucion.

> En esta beta los eventos DLP se mantienen en memoria. La persistencia completa en MySQL y el envio con Mailpit corresponden a la siguiente fase.

## Reglas implementadas

- `DLP-001`: identificacion sintetica con prefijos `CC` o `TI`.
- `DLP-002`: codigos sinteticos de historia clinica como `HC-482910`.
- `DLP-003`: terminologia clinica como `diagnostico`, `paciente`, `tratamiento` o `resultado de laboratorio`.

El resultado **no devuelve el texto sensible detectado**. Solo se exponen metadatos de coincidencia y un hash SHA-256 del contenido.

## Escenario 1 - PERMITIR

Destinatario:

`laboratorio@hospital.local`

Asunto:

`Reunion de equipo`

Mensaje:

`Confirmo la reunion de seguimiento para manana a las 10:00 a. m.`

Resultado esperado: `PERMITIR`.

## Escenario 2 - ALERTAR

Destinatario:

`auditoria@partner.test`

Asunto:

`Revision de resultados`

Mensaje:

`Se requiere revisar el resultado de laboratorio del paciente antes de la reunion.`

Resultado esperado: `ALERTAR`.

## Escenario 3 - BLOQUEAR

Destinatario:

`destino.personal@gmail.com`

Asunto:

`Historia clinica`

Mensaje:

`Referencia HC-482910 correspondiente al paciente identificado como CC 1012345678.`

Resultado esperado: `BLOQUEAR`.

## Como explicarlo al profesor

> En esta primera beta dejamos de trabajar solo con mockups. El formulario envia el contenido al backend y el motor DLP aplica reglas reales de clasificacion. La decision no la toma React: Node.js analiza el contenido y el destinatario, calcula un puntaje y devuelve PERMITIR, ALERTAR o BLOQUEAR. Ademas evitamos devolver el contenido sensible y conservamos un hash para futura trazabilidad. En la siguiente iteracion vamos a persistir transferencias y alertas en MySQL y conectaremos Nodemailer con Mailpit para comprobar que un correo bloqueado nunca sale del sistema.
