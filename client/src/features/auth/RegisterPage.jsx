import {useState} from 'react';
import {Alert,Box,Button,Link,Paper,Stack,TextField,Typography} from '@mui/material';
import {Link as RouterLink,Navigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
export default function RegisterPage() {
 const {user,register}=useAuth();
 const [name,setName]=useState(''),[email,setEmail]=useState('');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 if(user)return <Navigate to="/dashboard" replace/>;
 async function submit(e){
  e.preventDefault();setError('');
  setBusy(true);
  try{await register(name,email);setDone(true);}catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2}}>
  <Paper variant="outlined" sx={{p:4,width:'100%',maxWidth:440}}>
   <Typography variant="h1" gutterBottom>Crear cuenta</Typography>
   <Typography color="text.secondary" sx={{mb:3}}>Confirma tu correo antes de crear una contraseña y acceder al laboratorio.</Typography>
   {done?<Alert severity="success">Si el correo puede registrarse, recibirás un enlace para confirmarlo. Revisa también la carpeta de spam. El enlace vence en 15 minutos.</Alert>:<Stack component="form" onSubmit={submit} spacing={2}>
    <TextField label="Nombre completo" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} inputProps={{maxLength:150}} required/>
    <TextField label="Correo" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} inputProps={{maxLength:150,pattern:"(?![^@]*\\.\\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+\\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\\-]*[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]*[a-zA-Z0-9])?)+",inputMode:"email"}} required/>
    <TextField label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}
     error={tooShort} helperText={`Entre ${MIN_PASSWORD} y 128 caracteres.`} inputProps={{maxLength:128}} required/>
    <TextField label="Confirmar contraseña" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}
     error={mismatch} helperText={mismatch?'Las contraseñas no coinciden.':' '} inputProps={{maxLength:128}} required/>
    {error&&<Alert severity="error">{error}</Alert>}
    <Button type="submit" variant="contained" disabled={busy}>{busy?'Enviando…':'Enviar enlace de confirmación'}</Button>
   </Stack>}
   <Typography variant="body2" sx={{mt:2,textAlign:'center'}}>¿Ya tienes cuenta? <Link component={RouterLink} to="/login">Inicia sesión</Link></Typography>
  </Paper>
 </Box>;
}
