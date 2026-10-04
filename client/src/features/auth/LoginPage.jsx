import {useState} from 'react';
import {Alert,Box,Button,Paper,Stack,TextField,Typography} from '@mui/material';
import {Navigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
export default function LoginPage() {
 const {user,login}=useAuth();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(user)return <Navigate to="/dashboard" replace/>;
 async function submit(e){e.preventDefault();setError('');setBusy(true);try{await login(email,password);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2}}>
  <Paper variant="outlined" sx={{p:4,width:'100%',maxWidth:440}}>
   <Typography variant="h1" gutterBottom>MediShield DLP</Typography>
   <Typography color="text.secondary" sx={{mb:3}}>Acceso al laboratorio de protección de datos médicos.</Typography>
   <Stack component="form" onSubmit={submit} spacing={2}>
    <TextField label="Correo" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/>
    <TextField label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>
    {error&&<Alert severity="error">{error}</Alert>}
    <Button type="submit" variant="contained" disabled={busy}>{busy?'Verificando…':'Iniciar sesión'}</Button>
   </Stack>
  </Paper>
 </Box>;
}
