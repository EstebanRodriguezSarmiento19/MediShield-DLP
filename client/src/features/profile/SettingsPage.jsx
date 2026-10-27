import {useState} from 'react';
import {Alert,Box,Button,Paper,Stack,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';

const blank={currentPassword:'',newPassword:'',confirm:''};
export default function SettingsPage(){
 const [form,setForm]=useState(blank),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const change=(field,value)=>setForm(c=>({...c,[field]:value}));
 async function submit(event){
  event.preventDefault();setError('');setNotice('');
  if(form.newPassword!==form.confirm){setError('La confirmación no coincide con la nueva contraseña.');return;}
  setBusy(true);
  try{const r=await api.post('/profile/password',{currentPassword:form.currentPassword,newPassword:form.newPassword});setNotice(r.data.message);setForm(blank);}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <Stack spacing={3} sx={{maxWidth:720}}>
  <Box><Typography variant="h1">Ajustes</Typography>
   <Typography color="text.secondary">Seguridad de tu cuenta.</Typography></Box>
  {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="success">{notice}</Alert>}
  <Paper variant="outlined" sx={{p:3}}><Stack component="form" onSubmit={submit} spacing={2}>
   <Typography variant="h2">Cambiar contraseña</Typography>
   <TextField label="Contraseña actual" type="password" autoComplete="current-password" value={form.currentPassword} onChange={e=>change('currentPassword',e.target.value)} inputProps={{maxLength:128}} required/>
   <TextField label="Nueva contraseña" type="password" autoComplete="new-password" value={form.newPassword} onChange={e=>change('newPassword',e.target.value)} inputProps={{maxLength:128,minLength:15}} helperText="Entre 15 y 128 caracteres." required/>
   <TextField label="Confirmar nueva contraseña" type="password" autoComplete="new-password" value={form.confirm} onChange={e=>change('confirm',e.target.value)} inputProps={{maxLength:128}} required/>
   <Button type="submit" variant="contained" disabled={busy} sx={{alignSelf:'flex-start'}}>Actualizar contraseña</Button>
   <Typography variant="body2" color="text.secondary">Al cambiarla se cerrarán tus sesiones abiertas en otros dispositivos.</Typography>
  </Stack></Paper>
 </Stack>;
}
