import {useEffect,useState} from 'react';
import {Alert,Avatar,Box,Button,Chip,Paper,Stack,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
import {useAuth} from '../auth/AuthContext.jsx';
import {roleName,initials} from '../../shared/utils/roles.js';

export default function ProfilePage(){
 const {user,updateUser}=useAuth();
 const [name,setName]=useState(user.name),[createdAt,setCreatedAt]=useState(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{api.get('/profile').then(r=>setCreatedAt(r.data.createdAt)).catch(()=>{});},[]);
 async function save(event){
  event.preventDefault();setBusy(true);setError('');setNotice('');
  try{const r=await api.patch('/profile',{name});updateUser({name:r.data.name});setNotice('Perfil actualizado.');}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Stack spacing={3} sx={{maxWidth:720}}>
  <Typography variant="h1">Mi perfil</Typography>
  {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="success">{notice}</Alert>}
  <Paper variant="outlined" sx={{p:3}}><Stack spacing={3}>
   <Stack direction="row" spacing={2} alignItems="center">
    <Avatar sx={{width:64,height:64,bgcolor:'primary.main',color:'primary.contrastText',fontSize:24}}>{initials(user.name)}</Avatar>
    <Box><Typography variant="h2">{user.name}</Typography><Typography color="text.secondary">{user.email}</Typography>
     <Chip size="small" label={roleName[user.role]} sx={{mt:0.5}}/></Box>
   </Stack>
   <Stack component="form" onSubmit={save} spacing={2}>
    <TextField label="Nombre" value={name} onChange={e=>setName(e.target.value)} inputProps={{maxLength:150}} required/>
    <TextField label="Correo" value={user.email} disabled helperText="El correo solo puede cambiarlo un administrador."/>
    <TextField label="Rol" value={roleName[user.role]} disabled helperText="Los roles solo los modifica un administrador."/>
    {createdAt&&<Typography variant="body2" color="text.secondary">Cuenta creada el {new Date(createdAt).toLocaleDateString('es')}</Typography>}
    <Button type="submit" variant="contained" disabled={busy||name.trim()===user.name||name.trim().length<2} sx={{alignSelf:'flex-start'}}>Guardar cambios</Button>
   </Stack>
  </Stack></Paper>
 </Stack>;
}
