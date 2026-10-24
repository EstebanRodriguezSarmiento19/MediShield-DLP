import {useState} from 'react';
import {Alert,Box,Button,Link,Paper,Stack,TextField,Typography} from '@mui/material';
import {Link as RouterLink,Navigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
const MIN_PASSWORD=15;
export default function RegisterPage() {
 const {user,register}=useAuth();
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(user)return <Navigate to="/dashboard" replace/>;
 const tooShort=password.length>0&&password.length<MIN_PASSWORD;
 const mismatch=confirm.length>0&&password!==confirm;
 async function submit(e){
  e.preventDefault();setError('');
  if(password.length<MIN_PASSWORD)return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  if(password!==confirm)return setError('Las contraseñas no coinciden.');
  setBusy(true);
  try{await register(name,email,password);}catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2}}>
  <Paper variant="outlined" sx={{p:4,width:'100%',maxWidth:440}}>
   <Typography variant="h1" gutterBottom>Crear cuenta</Typography>
   <Typography color="text.secondary" sx={{mb:3}}>Regístrate para acceder al laboratorio de protección de datos médicos.</Typography>
   <Stack component="form" onSubmit={submit} spacing={2}>
    <TextField label="Nombre completo" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} inputProps={{maxLength:150}} required/>
    <TextField label="Correo" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} inputProps={{maxLength:150}} required/>
    <TextField label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}
     error={tooShort} helperText={`Entre ${MIN_PASSWORD} y 128 caracteres.`} inputProps={{maxLength:128}} required/>
    <TextField label="Confirmar contraseña" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}
     error={mismatch} helperText={mismatch?'Las contraseñas no coinciden.':' '} inputProps={{maxLength:128}} required/>
    {error&&<Alert severity="error">{error}</Alert>}
    <Button type="submit" variant="contained" disabled={busy}>{busy?'Creando cuenta…':'Registrarme'}</Button>
   </Stack>
   <Typography variant="body2" sx={{mt:2,textAlign:'center'}}>¿Ya tienes cuenta? <Link component={RouterLink} to="/login">Inicia sesión</Link></Typography>
  </Paper>
 </Box>;
}
