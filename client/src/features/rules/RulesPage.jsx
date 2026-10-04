import {useEffect,useState} from 'react';
import {Alert,Button,Paper,Stack,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
import {useAuth} from '../auth/AuthContext.jsx';
export default function RulesPage(){
 const {user}=useAuth(),[items,setItems]=useState([]),[error,setError]=useState('');
 const load=()=>api.get('/rules').then(r=>setItems(r.data)).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 const save=async r=>{try{await api.patch('/rules/'+r.id,{weight:Number(r.peso),version:r.version});setError('');await load();}catch(e){setError(e.message);}};
 return <Stack spacing={3}><Typography variant="h1">Reglas DLP</Typography>
  <Typography>Los patrones de detección son fijos. El administrador puede ajustar el peso entre 25 y 60; cada cambio incrementa la versión y queda auditado.</Typography>
  {error&&<Alert severity="error">{error}</Alert>}{items.map(r=><Paper key={r.id} variant="outlined" sx={{p:3}}>
   <Stack spacing={2}><Typography variant="h2">{r.id} · {r.name}</Typography><Typography>{r.description}</Typography>
    <Typography>Versión {r.version} · Sensibilidad {r.sensitivity}</Typography>
    <TextField label={'Peso '+r.id} type="number" inputProps={{min:25,max:60}} disabled={user.role!=='admin'} value={r.peso}
      onChange={e=>setItems(items.map(x=>x.id===r.id?{...x,peso:e.target.value}:x))}/>
    {user.role==='admin'&&<Button onClick={()=>save(r)}>Guardar peso</Button>}
   </Stack></Paper>)}</Stack>;
}
