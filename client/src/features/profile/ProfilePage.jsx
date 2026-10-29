import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Alert,Avatar,Box,Button,Chip,Divider,Paper,Stack,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
import {useAuth} from '../auth/AuthContext.jsx';
import {roleName,initials} from '../../shared/utils/roles.js';
import {PasswordField,PasswordRequirements} from '../../shared/components/PasswordFields.jsx';
import {isPasswordValid} from '../../shared/utils/passwordPolicy.js';

const blankPassword={currentPassword:'',newPassword:'',confirm:''};

/** Perfil de cualquier rol: datos, correo y contraseña. */
export default function ProfilePage(){
 const {user,updateUser}=useAuth();
 const navigate=useNavigate();
 const [name,setName]=useState(user.name),[email,setEmail]=useState(user.email),[currentPassword,setCurrentPassword]=useState(''),[createdAt,setCreatedAt]=useState(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [pwd,setPwd]=useState(blankPassword),[pwdBusy,setPwdBusy]=useState(false),[pwdError,setPwdError]=useState(''),[pwdNotice,setPwdNotice]=useState('');
 useEffect(()=>{api.get('/profile').then(r=>setCreatedAt(r.data.createdAt)).catch(()=>{});},[]);

 async function save(event){
  event.preventDefault();setBusy(true);setError('');setNotice('');
  try{const r=await api.patch('/profile',{name,email,...(email!==user.email?{currentPassword}: {})});updateUser({name:r.data.name,email:r.data.email});setCurrentPassword('');setNotice('Perfil actualizado.');}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }

 async function changePassword(event){
  event.preventDefault();setPwdError('');setPwdNotice('');
  if(!isPasswordValid(pwd.newPassword)){setPwdError('La nueva contraseña no cumple los requisitos.');return;}
  if(pwd.newPassword!==pwd.confirm){setPwdError('La confirmación no coincide con la nueva contraseña.');return;}
  setPwdBusy(true);
  try{const r=await api.post('/profile/password',{currentPassword:pwd.currentPassword,newPassword:pwd.newPassword});setPwdNotice(r.data.message);setPwd(blankPassword);}
  catch(err){setPwdError(err.message);}finally{setPwdBusy(false);}
 }

 return <Stack spacing={3} sx={{maxWidth:720}}>
  <Typography variant="h1">Mi perfil</Typography>
  {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="success">{notice}</Alert>}
  <Paper variant="outlined" sx={{p:3}}><Stack spacing={3}>
   <Stack direction="row" spacing={2} alignItems="center">
    <Avatar sx={{width:64,height:64,bgcolor:'primary.main',color:'primary.contrastText',fontSize:24}}>{initials(user.name)}</Avatar>
    <Box><Typography variant="h2">{user.name}</Typography><Typography color="text.secondary">{user.email}</Typography>
     <Chip size="small" label={user.customRoleName||roleName[user.role]} sx={{mt:0.5}}/></Box>
   </Stack>
   <Stack component="form" onSubmit={save} spacing={2}>
    <TextField label="Nombre" value={name} onChange={e=>setName(e.target.value)} inputProps={{maxLength:150}} required/>
    <TextField label="Correo" type="email" value={email} onChange={e=>setEmail(e.target.value)} inputProps={{maxLength:150}} required/>
    {email!==user.email&&<PasswordField label="Contraseña actual" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required helperText="Necesaria para confirmar el cambio de correo."/>}
    <TextField label="Rol" value={user.customRoleName||roleName[user.role]} disabled helperText="Los roles solo los modifica un administrador."/>
    {createdAt&&<Typography variant="body2" color="text.secondary">Cuenta creada el {new Date(createdAt).toLocaleDateString('es')}</Typography>}
    <Button type="submit" variant="contained" disabled={busy||(name.trim()===user.name&&email===user.email)||name.trim().length<2} sx={{alignSelf:'flex-start'}}>Guardar cambios</Button>
   </Stack>
  </Stack></Paper>

  {user.role==='admin'&&<Paper variant="outlined" sx={{p:3}}><Stack direction={{xs:'column',sm:'row'}} spacing={2} justifyContent="space-between" alignItems={{sm:'center'}}>
   <Box><Typography variant="h2">Roles y permisos</Typography><Typography color="text.secondary" variant="body2">Crea roles personalizados, define sus permisos granulares y asigna cuentas desde un único lugar.</Typography></Box>
   <Button variant="outlined" onClick={()=>navigate('/admin/roles')} sx={{flexShrink:0}}>Gestionar roles</Button>
  </Stack></Paper>}
  <Paper variant="outlined" sx={{p:3}}><Stack component="form" onSubmit={changePassword} spacing={2}>
   <Typography variant="h2">Cambiar contraseña</Typography>
   {pwdError&&<Alert severity="error">{pwdError}</Alert>}{pwdNotice&&<Alert severity="success">{pwdNotice}</Alert>}
   <PasswordField label="Contraseña actual" autoComplete="current-password" value={pwd.currentPassword} onChange={e=>setPwd(c=>({...c,currentPassword:e.target.value}))} required/>
   <PasswordField label="Nueva contraseña" autoComplete="new-password" value={pwd.newPassword} onChange={e=>setPwd(c=>({...c,newPassword:e.target.value}))} required/>
   <PasswordRequirements password={pwd.newPassword}/>
   <PasswordField label="Confirmar nueva contraseña" autoComplete="new-password" value={pwd.confirm} onChange={e=>setPwd(c=>({...c,confirm:e.target.value}))} required/>
   <Divider/>
   <Button type="submit" variant="contained" disabled={pwdBusy} sx={{alignSelf:'flex-start'}}>Actualizar contraseña</Button>
   <Typography variant="body2" color="text.secondary">Al cambiarla se cerrarán tus sesiones abiertas en otros dispositivos.</Typography>
  </Stack></Paper>
 </Stack>;
}
