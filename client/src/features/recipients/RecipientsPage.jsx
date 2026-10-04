import {useEffect,useState} from 'react';
import {Alert,Button,Chip,Paper,Stack,Table,TableBody,TableCell,TableHead,TableRow,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
import {useAuth} from '../auth/AuthContext.jsx';
export default function RecipientsPage(){
 const {user}=useAuth(),[items,setItems]=useState([]),[error,setError]=useState(''),[email,setEmail]=useState(''),[name,setName]=useState('');
 const load=()=>api.get('/recipients').then(r=>setItems(r.data)).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 const update=async r=>{setError('');try{await api.patch('/recipients/'+encodeURIComponent(r.correo),{authorized:!r.authorized,version:r.version});await load();}catch(e){setError(e.message);}};
 const add=async e=>{e.preventDefault();setError('');try{await api.post('/recipients',{email,name,authorized:false});setEmail('');setName('');await load();}catch(e){setError(e.message);}};
 return <Stack spacing={3}><Typography variant="h1">Destinatarios</Typography>
  <Typography>Los destinatarios nuevos o revocados se bloquean. La habitualidad se calcula con envíos SMTP confirmados de tu usuario.</Typography>
  {error&&<Alert severity="error">{error}</Alert>}
  {user.role==='admin'&&<Stack component="form" direction="row" spacing={2} onSubmit={add}>
   <TextField label="Correo del destinatario" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
   <TextField label="Nombre" value={name} onChange={e=>setName(e.target.value)} required/>
   <Button type="submit" variant="outlined">Registrar sin autorización</Button>
  </Stack>}
  <Paper variant="outlined" sx={{overflowX:'auto'}}><Table><TableHead><TableRow>{['Correo','Tipo','Política','Envíos propios','Habitualidad','Acción'].map(x=><TableCell key={x}>{x}</TableCell>)}</TableRow></TableHead>
   <TableBody>{items.map(r=><TableRow key={r.correo}><TableCell>{r.correo}</TableCell><TableCell>{r.type}</TableCell>
    <TableCell><Chip label={r.authorized?'Autorizado':'Bloqueado'} color={r.authorized?'success':'error'} size="small"/></TableCell>
    <TableCell>{r.previousSends}</TableCell><TableCell>{r.hasHistory?r.habituality+'%':'Sin historial'}</TableCell>
    <TableCell>{user.role==='admin'&&<Button onClick={()=>update(r)}>{r.authorized?'Revocar':'Autorizar'}</Button>}</TableCell></TableRow>)}</TableBody></Table></Paper>
 </Stack>;
}
