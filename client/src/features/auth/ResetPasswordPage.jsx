import {useEffect,useState} from 'react';
import {Alert,Box,Button,Link,Paper,Stack,TextField,Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import api from '../../shared/services/api.js';

export default function ResetPasswordPage(){
 const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('token')||'');
 useEffect(()=>{if(token)window.history.replaceState(null,'','/reset-password');},[token]);
 const [password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 async function submit(event){
  event.preventDefault();setError('');
  if(password!==repeat){setError('Las contraseñas no coinciden.');return;}
  setBusy(true);
  try{await api.post('/auth/password/reset',{token,password});setDone(true);window.history.replaceState(null,'','/reset-password');}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2}}><Paper variant="outlined" sx={{p:4,width:'100%',maxWidth:480}}>
  <Stack spacing={2} component="form" onSubmit={submit}>
   <Typography variant="h1">Elegir contraseña</Typography>
   {!/^[0-9a-f]{64}$/.test(token)&&!done&&<Alert severity="error">El enlace es inválido. Solicita uno nuevo.</Alert>}
   {done?<Alert severity="success">Contraseña actualizada. Todas tus sesiones anteriores quedaron cerradas.</Alert>:<>
    <Typography color="text.secondary">Usa al menos 15 caracteres. El enlace vence en 15 minutos y solo funciona una vez.</Typography>
    <TextField label="Contraseña nueva" type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} inputProps={{minLength:15,maxLength:128}} required/>
    <TextField label="Confirmar contraseña" type="password" autoComplete="new-password" value={repeat} onChange={event=>setRepeat(event.target.value)} required/>
    {error&&<Alert severity="error">{error}</Alert>}
    <Button type="submit" variant="contained" disabled={busy||!/^[0-9a-f]{64}$/.test(token)}>{busy?'Guardando…':'Guardar contraseña'}</Button>
   </>}
   <Link component={RouterLink} to="/login">Ir al inicio de sesión</Link>
  </Stack>
 </Paper></Box>;
}
