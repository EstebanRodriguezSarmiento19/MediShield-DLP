import {useEffect,useState} from 'react';
<<<<<<< HEAD
import {Alert,Box,Button,Link,Paper,Stack,Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import api from '../../shared/services/api.js';
import {PasswordField,PasswordRequirements} from '../../shared/components/PasswordFields.jsx';
import {isPasswordValid} from '../../shared/utils/passwordPolicy.js';
=======
import {Alert,Box,Button,Link,Paper,Stack,TextField,Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import api from '../../shared/services/api.js';
>>>>>>> origin/main

export default function ConfirmRegistrationPage(){
 const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('token')||'');
 useEffect(()=>{if(token)window.history.replaceState(null,'','/register/confirm');},[token]);
 const [password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 async function submit(event){
  event.preventDefault();setError('');
<<<<<<< HEAD
  if(!isPasswordValid(password)){setError('La contraseña no cumple los requisitos.');return;}
=======
>>>>>>> origin/main
  if(password!==repeat){setError('Las contraseñas no coinciden.');return;}
  setBusy(true);
  try{await api.post('/auth/register/confirm',{token,password});setDone(true);}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2}}><Paper variant="outlined" sx={{p:4,width:'100%',maxWidth:480}}>
  <Stack spacing={2} component="form" onSubmit={submit}>
   <Typography variant="h1">Confirmar cuenta</Typography>
   {!/^[0-9a-f]{64}$/.test(token)&&!done&&<Alert severity="error">El enlace es inválido. Solicita uno nuevo desde «Regístrate».</Alert>}
   {done?<Alert severity="success">Correo confirmado y cuenta creada con rol usuario. Ya puedes iniciar sesión.</Alert>:<>
<<<<<<< HEAD
    <Typography color="text.secondary">Elige una contraseña que cumpla los requisitos. El enlace vence en 15 minutos y solo se puede usar una vez.</Typography>
    <PasswordField label="Contraseña" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} required/>
    <PasswordRequirements password={password}/>
    <PasswordField label="Confirmar contraseña" autoComplete="new-password" value={repeat} onChange={event=>setRepeat(event.target.value)} required/>
=======
    <Typography color="text.secondary">Elige una contraseña de 15 a 128 caracteres. El enlace vence en 15 minutos y solo se puede usar una vez.</Typography>
    <TextField label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} inputProps={{minLength:15,maxLength:128}} required/>
    <TextField label="Confirmar contraseña" type="password" autoComplete="new-password" value={repeat} onChange={event=>setRepeat(event.target.value)} required/>
>>>>>>> origin/main
    {error&&<Alert severity="error">{error}</Alert>}
    <Button type="submit" variant="contained" disabled={busy||!/^[0-9a-f]{64}$/.test(token)}>{busy?'Creando cuenta…':'Confirmar y crear cuenta'}</Button>
   </>}
   <Link component={RouterLink} to="/login">Ir al inicio de sesión</Link>
  </Stack>
 </Paper></Box>;
}
