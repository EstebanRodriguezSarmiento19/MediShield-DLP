import {useEffect,useState} from 'react';
import {Alert,Button,Chip,Paper,Stack,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
export default function AlertsPage(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[notes,setNotes]=useState({});
 const load=()=>api.get('/alerts?limit=100').then(r=>setItems(r.data)).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 const review=async r=>{setError('');try{await api.patch('/alerts/'+r.alertId,{status:r.alertStatus==='ABIERTA'?'EN_REVISION':'CERRADA',note:notes[r.alertId]||'',version:r.version});await load();}catch(e){setError(e.message);}};
 return <Stack spacing={3}><Typography variant="h1">Alertas DLP</Typography>
  <Typography>Seguimiento de transferencias retenidas y bloqueadas. Cerrar una alerta registra su atención; la decisión DLP conserva su efecto.</Typography>
  <Button onClick={load}>Actualizar</Button>{error&&<Alert severity="error">{error}</Alert>}
  {!items.length&&<Typography>No hay alertas registradas.</Typography>}
  {items.map(r=><Paper key={r.alertId} variant="outlined" sx={{p:3}}><Stack spacing={2}>
   <Stack direction="row" spacing={2}><Chip label={r.decision} color={r.decision==='BLOQUEAR'?'error':'warning'}/><Chip label={r.alertStatus}/></Stack>
   <Typography>{r.recipient.email} · Riesgo {r.risk.score}/100 · Usuario {r.ownerId}</Typography>
   <Typography variant="caption">Análisis {r.id} · {new Date(r.createdAt).toLocaleString('es-CO')}</Typography>
   <Typography>{r.reasons.join(' ')}</Typography>{r.note&&<Typography>Última nota: {r.note}</Typography>}
   {r.alertStatus!=='CERRADA'&&<><TextField label="Nota de seguimiento" value={notes[r.alertId]||''} onChange={e=>setNotes({...notes,[r.alertId]:e.target.value})} inputProps={{maxLength:500}}/>
   <Button onClick={()=>review(r)}>{r.alertStatus==='ABIERTA'?'Iniciar revisión':'Cerrar alerta'}</Button></>}
  </Stack></Paper>)}</Stack>;
}
