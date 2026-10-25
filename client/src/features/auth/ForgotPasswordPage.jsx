import {useState} from 'react';
import {Alert,Box,Button,Link,Paper,Stack,TextField,Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import api from '../../shared/services/api.js';

export default function ForgotPasswordPage(){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 async function submit(event){
  event.preventDefault();setBusy(true);setError('');
  try{await api.post('/auth/password/forgot',{email});setDone(true);}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2}}><Paper variant="outlined" sx={{p:4,width:'100%',maxWidth:480}}>
  <Stack spacing={2} component="form" onSubmit={submit}>
   <Typography variant="h1">Recuperar acceso</Typography>
   <Typography color="text.secondary">Escribe el correo de tu cuenta. Si está activa, recibirás un enlace válido durante 15 minutos.</Typography>
   <TextField label="Correo" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} required/>
   {error&&<Alert severity="error">{error}</Alert>}
   {done&&<Alert severity="success">Si la cuenta existe y está activa, recibirás un enlace para elegir una contraseña nueva. Revisa también la carpeta de spam.</Alert>}
   <Button type="submit" variant="contained" disabled={busy}>{busy?'Enviando…':'Enviar enlace'}</Button>
   <Link component={RouterLink} to="/login">Volver al inicio de sesión</Link>
  </Stack>
 </Paper></Box>;
}
