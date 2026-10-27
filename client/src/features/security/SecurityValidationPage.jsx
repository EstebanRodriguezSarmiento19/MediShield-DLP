<<<<<<< HEAD
import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography
} from '@mui/material';
import api from '../../shared/services/api.js';

const decisionColor = { PERMITIR: 'success', ALERTAR: 'warning', BLOQUEAR: 'error' };
const blankSimulation = { recipient: '', subject: '', body: '' };

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SecurityValidationPage() {
  const [catalog, setCatalog] = useState([]);
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const [sim, setSim] = useState(blankSimulation);
  const [simResult, setSimResult] = useState(null);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState('');

  useEffect(() => {
    api.get('/security/dlp-tests').then(r => setCatalog(r.data)).catch(err => setError(err.message));
  }, []);

  async function runSuite() {
    setRunning(true);
    setError('');
    try {
      const r = await api.post('/security/dlp-tests/run', {});
      setReport(r.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function simulate(event) {
    event.preventDefault();
    setSimBusy(true);
    setSimError('');
    try {
      const r = await api.post('/security/dlp-simulate', sim);
      setSimResult(r.data);
    } catch (err) {
      setSimResult(null);
      setSimError(err.message);
    } finally {
      setSimBusy(false);
    }
  }

  // Antes de ejecutar se muestran los casos del catálogo; después, los resultados reales.
  const rows = report
    ? report.cases
    : catalog.map(test => ({ id: test.id, name: test.name, recipient: test.recipient, expected: test.expected }));

  function exportReport() {
    download('medishield-politica-dlp.json', {
      project: 'MediShield-DLP',
      generatedAt: new Date().toISOString(),
      notice: 'Resultado de la batería ejecutada contra el motor DLP del servidor con las reglas activas. Los casos usan datos sintéticos.',
      executedAt: report.executedAt,
      rulesVersion: report.rulesVersion,
      summary: report.summary,
      cases: report.cases
    });
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Seguridad y pruebas DLP</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Verifica que el motor de políticas tome las decisiones esperadas con las reglas activas.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Alert severity="info">
        Las pruebas usan el motor real del servidor. No envían correos ni crean transferencias, y el simulador tampoco guarda el mensaje analizado.
      </Alert>

      <Grid container spacing={2}>
        {[
          ['Casos', report ? report.summary.total : catalog.length],
          ['Aprobados', report ? report.summary.passed : '—'],
          ['Fallidos', report ? report.summary.failed : '—'],
          ['Última ejecución', report ? new Date(report.executedAt).toLocaleString('es') : 'Sin ejecutar']
        ].map(([label, value]) => (
          <Grid item xs={6} md={3} key={label}>
            <Card variant="outlined"><CardContent>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h2">Batería de políticas</Typography>
            <Typography variant="body2" color="text.secondary">
              Cada caso define un contexto (autorización e historial) y la decisión esperada.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={runSuite} disabled={running}>
              {running ? 'Ejecutando…' : 'Ejecutar pruebas'}
            </Button>
            <Button variant="outlined" onClick={exportReport} disabled={!report}>Exportar informe JSON</Button>
          </Stack>
        </Stack>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['ID', 'Caso', 'Destinatario', 'Esperado', 'Obtenido', 'Riesgo', 'Reglas', 'Resultado'].map(h => <TableCell key={h}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>{row.name}</TableCell>
                  <TableCell sx={{ overflowWrap: 'anywhere' }}>{row.recipient}</TableCell>
                  <TableCell><Chip size="small" label={row.expected} color={decisionColor[row.expected]} variant="outlined" /></TableCell>
                  <TableCell>{row.obtained ? <Chip size="small" label={row.obtained} color={decisionColor[row.obtained]} /> : '—'}</TableCell>
                  <TableCell>{row.riskScore ?? '—'}</TableCell>
                  <TableCell>{row.matchedRules ? (row.matchedRules.join(', ') || 'Ninguna') : '—'}</TableCell>
                  <TableCell>
                    {row.passed === undefined ? '—' : <Chip size="small" label={row.passed ? 'Aprobado' : 'Fallido'} color={row.passed ? 'success' : 'error'} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2">Simulador de mensaje</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Analiza un mensaje con tu historial real y las reglas activas. Sirve para entender por qué una transferencia se permitiría, alertaría o bloquearía.
        </Typography>
        <Stack component="form" onSubmit={simulate} spacing={2}>
          {simError && <Alert severity="error">{simError}</Alert>}
          <TextField label="Destinatario" type="email" value={sim.recipient} onChange={e => setSim(c => ({ ...c, recipient: e.target.value }))} inputProps={{ maxLength: 254 }} required />
          <TextField label="Asunto" value={sim.subject} onChange={e => setSim(c => ({ ...c, subject: e.target.value }))} inputProps={{ maxLength: 200 }} />
          <TextField label="Mensaje" multiline minRows={4} value={sim.body} onChange={e => setSim(c => ({ ...c, body: e.target.value }))} inputProps={{ maxLength: 20000 }} />
          <Button type="submit" variant="outlined" disabled={simBusy} sx={{ alignSelf: 'flex-start' }}>
            {simBusy ? 'Analizando…' : 'Analizar sin enviar'}
          </Button>
        </Stack>

        {simResult && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Chip label={simResult.decision} color={decisionColor[simResult.decision]} />
              <Typography>Riesgo {simResult.risk.score}/100 · {simResult.recipient.type === 'EXTERNO' ? 'Destino externo' : 'Destino interno'} · {simResult.recipient.authorized ? 'Autorizado' : 'No autorizado'}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Envíos confirmados previos a este destinatario: {simResult.recipient.previousSends}. Habitualidad: {simResult.recipient.habituality}%.
            </Typography>
            {simResult.matches.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {simResult.matches.map(m => <Chip key={m.ruleId} size="small" variant="outlined" label={`${m.ruleId} · ${m.name} (${m.sensitivity})`} />)}
              </Stack>
            )}
            <Stack spacing={0.5} sx={{ mt: 2 }}>
              {simResult.reasons.map(reason => <Typography key={reason} variant="body2">• {reason}</Typography>)}
            </Stack>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
=======
import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';

const STORAGE_KEY = 'medishield-security-validation-v1';
const initialItems = [
 { id:'functional', name:'Pruebas funcionales', category:'Funcional', objective:'Verificar inicio/cierre de sesión, roles, análisis DLP, reglas, destinatarios, alertas y auditoría.', evidence:'Capturas de los flujos ejecutados; resultado esperado vs. obtenido.', commands:'Ejecutar manualmente cada flujo con cuentas de laboratorio y registrar resultado.' },
 { id:'nonfunctional', name:'Pruebas no funcionales', category:'No funcional', objective:'Medir tiempos de respuesta, comportamiento con errores, concurrencia básica y recuperación tras reinicio.', evidence:'Tabla con cantidad de solicitudes, latencias, errores y condiciones de prueba.', commands:'Registrar línea base y repetir en el mismo equipo/condiciones; no declarar rendimiento sin mediciones.' },
 { id:'sast', name:'SAST — análisis estático', category:'SAST', objective:'Buscar patrones inseguros en el código sin ejecutar la aplicación.', evidence:'Informe del analizador, fecha, versión del commit, hallazgos y correcciones.', commands:'Desde la raíz: npm audit --omit=dev (SCA, no SAST). Para SAST, integrar Semgrep/CodeQL y guardar su reporte.' },
 { id:'dast', name:'DAST — análisis dinámico', category:'DAST', objective:'Evaluar la aplicación en ejecución en el entorno local autorizado.', evidence:'Reporte de OWASP ZAP Baseline, URL probada, fecha y falsos positivos revisados.', commands:'Levantar frontend y backend de laboratorio; ejecutar ZAP solo contra localhost y revisar cada alerta.' },
 { id:'sca', name:'SCA — dependencias', category:'SCA', objective:'Identificar vulnerabilidades conocidas en dependencias directas y transitivas.', evidence:'Salida npm audit, versiones afectadas, severidad y plan de mitigación.', commands:'En client y server: npm audit. No ejecutar npm audit fix --force sin revisar cambios incompatibles.' },
 { id:'ast', name:'AST — pruebas de seguridad', category:'AST', objective:'Documentar las pruebas de seguridad que exige la asignatura; aquí se usa AST como categoría general del curso.', evidence:'Casos de prueba, pasos, resultado esperado/obtenido y evidencia reproducible.', commands:'Definir y ejecutar casos de autorización, validación de entradas, CSRF, sesiones, exposición de errores y auditoría.' },
 { id:'iast', name:'IAST — análisis interactivo', category:'IAST', objective:'Observar vulnerabilidades mientras se ejercitan rutas de la aplicación con instrumentación compatible.', evidence:'Reporte de herramienta IAST, cobertura alcanzada y rutas ejercitadas.', commands:'Requiere instrumentación/agente compatible con Node.js; si no se instala, dejar como pendiente y justificar.' },
 { id:'iac', name:'IaC — infraestructura como código', category:'IaC', objective:'Revisar configuración reproducible y segura de contenedores, despliegue o infraestructura declarativa.', evidence:'Archivos de infraestructura revisados y salida de Checkov/tfsec u otra herramienta aplicable.', commands:'Si el proyecto no tiene Terraform/Docker/Kubernetes, documentar “no aplica al estado actual” y plan de mejora; no marcar aprobado sin evidencia.' },
];
const statuses = ['Pendiente','En progreso','Aprobada','Fallida','No aplica'];
const colors = { 'Pendiente':'default','En progreso':'info','Aprobada':'success','Fallida':'error','No aplica':'default' };
function loadItems(){
 try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); return initialItems.map(x=>({...x,status:saved[x.id]?.status||'Pendiente',notes:saved[x.id]?.notes||''})); }
 catch { return initialItems.map(x=>({...x,status:'Pendiente',notes:''})); }
}
export default function SecurityValidationPage(){
 const [items,setItems]=useState(loadItems);
 const [filter,setFilter]=useState('Todas');
 const [message,setMessage]=useState('');
 const counts=useMemo(()=>statuses.reduce((a,s)=>({...a,[s]:items.filter(i=>i.status===s).length}),{}),[items]);
 const visible=items.filter(i=>filter==='Todas'||i.status===filter);
 function update(id,field,value){const next=items.map(i=>i.id===id?{...i,[field]:value}:i);setItems(next);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(Object.fromEntries(next.map(i=>[i.id,{status:i.status,notes:i.notes}]))));setMessage('Cambios guardados en este navegador.');}catch{setMessage('No fue posible guardar en el navegador.');}}
 function exportReport(){const payload={project:'MediShield-DLP',generatedAt:new Date().toISOString(),notice:'Estados diligenciados manualmente; adjuntar los reportes originales como evidencia.',summary:counts,tests:items.map(({id,name,category,objective,status,notes,evidence})=>({id,name,category,objective,status,notes,evidence}))};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='medishield-validacion-seguridad.json';a.click();URL.revokeObjectURL(url);}
 return <Stack spacing={3}>
  <Box><Typography variant="h1">Centro de seguridad y validación</Typography><Typography color="text.secondary" sx={{mt:1}}>Plan de evidencia para la sustentación del tercer corte · 2026-2 · MediShield-DLP</Typography></Box>
<Alert severity="info">
  Conserva los reportes originales de las herramientas para la sustentación. El seguimiento que hagas aquí se guarda únicamente en tu navegador actual y no se sincroniza con la base de datos.
</Alert>
  <Grid container spacing={2}>{[['Total de controles',items.length],['Pendientes',counts['Pendiente']],['En progreso',counts['En progreso']],['Aprobadas',counts['Aprobada']]].map(([label,value])=><Grid item xs={6} md={3} key={label}><Card variant="outlined"><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4" sx={{mt:1}}>{value}</Typography></CardContent></Card></Grid>)}</Grid>
  <Card variant="outlined"><CardContent><Typography variant="h2" gutterBottom>Arquitectura que se debe sustentar</Typography><Grid container spacing={2}>{[
   ['Frontend','React + Vite + Material UI','Interfaz, rutas protegidas y llamadas a la API.'],['Backend','Node.js + Express','Autenticación, reglas DLP, validación y endpoints REST.'],['Persistencia','MariaDB/MySQL','Usuarios, reglas, análisis y eventos de auditoría.'],['Correo de laboratorio','SMTP local 127.0.0.1:1025','Captura local de mensajes de prueba; sin retransmisión externa.'],['Telemetría externa','Gophish / Snort','No afirmar integración en vivo hasta que exista conector, configuración y prueba verificable.']].map(([title,tech,desc])=><Grid item xs={12} md={6} key={title}><Box sx={{p:2,border:1,borderColor:'divider',borderRadius:1,height:'100%'}}><Typography fontWeight={700}>{title}</Typography><Typography color="primary.main" sx={{my:.5}}>{tech}</Typography><Typography variant="body2" color="text.secondary">{desc}</Typography></Box></Grid>)}</Grid></CardContent></Card>
  <Box><Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" alignItems={{sm:'center'}} spacing={2} sx={{mb:2}}><Box><Typography variant="h2">Matriz de pruebas</Typography><Typography variant="body2" color="text.secondary">Registra el estado y escribe dónde está la evidencia (ruta, archivo, captura o ID de ejecución).</Typography></Box><Stack direction="row" spacing={1}><TextField select size="small" label="Filtrar estado" value={filter} onChange={e=>setFilter(e.target.value)} sx={{minWidth:150}}>{['Todas',...statuses].map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField><Button variant="contained" onClick={exportReport}>Exportar informe JSON</Button></Stack></Stack>
   <Stack spacing={2}>{visible.map(item=><Card variant="outlined" key={item.id}><CardContent><Stack direction={{xs:'column',md:'row'}} spacing={2} justifyContent="space-between"><Box sx={{flex:1}}><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6">{item.name}</Typography><Chip size="small" label={item.category}/></Stack><Typography sx={{mt:1}}>{item.objective}</Typography><Typography variant="body2" color="text.secondary" sx={{mt:1}}><b>Evidencia requerida:</b> {item.evidence}</Typography><Divider sx={{my:1.5}}/><Typography variant="body2" sx={{whiteSpace:'pre-wrap'}}><b>Cómo empezar:</b> {item.commands}</Typography></Box><Box sx={{width:{xs:'100%',md:250},flexShrink:0}}><TextField fullWidth select size="small" label="Estado de la prueba" value={item.status} onChange={e=>update(item.id,'status',e.target.value)} sx={{mb:1}}>{statuses.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField><Chip color={colors[item.status]} label={item.status} variant="outlined" sx={{mb:1}}/><TextField fullWidth multiline minRows={3} label="Notas / ubicación de evidencia" placeholder="Ej.: reports/zap-baseline.html, ejecución 2026-10-20..." value={item.notes} onChange={e=>update(item.id,'notes',e.target.value)}/></Box></Stack></CardContent></Card>)}</Stack>
  </Box>
  {message&&<Alert severity="info" onClose={()=>setMessage('')}>{message}</Alert>}
<Alert severity="warning">
  Esta pantalla funciona como una bitácora manual, no ejecuta escaneos automáticos. Marca una prueba como Aprobada únicamente cuando ya tengas la evidencia que lo respalde.
</Alert> 
</Stack>;
}



>>>>>>> origin/main
