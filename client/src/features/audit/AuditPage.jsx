import {useEffect,useState} from 'react';
import {Alert,Button,Paper,Stack,Table,TableBody,TableCell,TableHead,TableRow,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
export default function AuditPage(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[integrity,setIntegrity]=useState(null);
 const load=()=>api.get('/audit?limit=100').then(r=>setItems(r.data)).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 async function verify(){try{const r=await api.get('/audit/verify');setIntegrity(r.data);await load();}catch(e){setError(e.message);}}
 return <Stack spacing={3}><Typography variant="h1">Auditoría</Typography>
  <Typography>Eventos persistentes con actor, fecha UTC, acción y resultado. La cadena HMAC detecta cambios en los registros; la cuenta SQL de aplicación no puede editarlos ni borrarlos.</Typography>
  <Stack direction="row" spacing={2}><Button onClick={load}>Actualizar</Button><Button variant="contained" onClick={verify}>Verificar integridad</Button></Stack>
  {error&&<Alert severity="error">{error}</Alert>}
  {integrity&&<Alert severity={integrity.valid?'success':'error'}>{integrity.valid?'Cadena íntegra':'Alteración detectada'} · {integrity.checked} registros comprobados</Alert>}
  <Paper variant="outlined" sx={{overflowX:'auto'}}><Table size="small"><TableHead><TableRow>{['N.º','Fecha UTC','Actor','Acción','Recurso','Resultado','HMAC'].map(x=><TableCell key={x}>{x}</TableCell>)}</TableRow></TableHead>
   <TableBody>{items.map(r=><TableRow key={r.sequence}><TableCell>{r.sequence}</TableCell><TableCell>{r.at}</TableCell><TableCell>{r.actor??'Sin sesión'}</TableCell><TableCell>{r.action}</TableCell><TableCell sx={{maxWidth:180,overflowWrap:'anywhere'}}>{r.resource||'—'}</TableCell><TableCell>{r.outcome}</TableCell><TableCell title={r.hash} sx={{fontFamily:'monospace'}}>{r.hash.slice(0,16)}…</TableCell></TableRow>)}</TableBody></Table></Paper>
 </Stack>;
}
