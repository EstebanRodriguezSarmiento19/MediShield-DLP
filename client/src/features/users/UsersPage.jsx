import {useEffect,useState} from 'react';
import {Alert,Box,Button,Checkbox,Chip,Dialog,DialogActions,DialogContent,DialogTitle,FormControlLabel,
 MenuItem,Paper,Stack,Table,TableBody,TableCell,TableHead,TableRow,TextField,Typography} from '@mui/material';
import api from '../../shared/services/api.js';
import {useAuth} from '../auth/AuthContext.jsx';

const blank={name:'',email:'',role:'usuario',canManageUsers:false};
const roleName={admin:'Administrador',analista:'Analista',usuario:'Usuario'};
export default function UsersPage(){
 const {user}=useAuth();
 const [items,setItems]=useState([]),[form,setForm]=useState(blank),[editing,setEditing]=useState(null);
 const [passwordTarget,setPasswordTarget]=useState(null),[newPassword,setNewPassword]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){try{const result=await api.get('/users');setItems(result.data);}catch(err){setError(err.message);}}
 useEffect(()=>{load();},[]);
 function change(field,value){setForm(current=>({...current,[field]:value}));}
 function openEdit(account){setEditing(account);setForm({name:account.name,email:account.email,role:account.role,canManageUsers:account.canManageUsers});setError('');setNotice('');}
 function closeEdit(){setEditing(null);setForm(blank);}
 function closePassword(){setPasswordTarget(null);setNewPassword('');}
 async function run(action){setBusy(true);setError('');setNotice('');try{const response=await action();setNotice(response?.data?.message||'Cambio guardado.');await load();return true;}
  catch(err){setError(err.message);return false;}finally{setBusy(false);}}
 async function create(event){event.preventDefault();const ok=await run(()=>api.post('/users',form));if(ok)setForm(blank);}
 async function save(event){event.preventDefault();const ok=await run(()=>api.patch(`/users/${editing.id}`,form));if(ok)closeEdit();}
 async function changePassword(event){
  event.preventDefault();
  const ok=await run(()=>api.post(`/users/${passwordTarget.id}/password`,{newPassword}));
  if(ok)closePassword();
 }
 async function deactivate(account){if(!window.confirm(`¿Desactivar la cuenta de ${account.name}? Se cerrarán sus sesiones y se conservará el historial de auditoría.`))return;
  await run(()=>api.delete(`/users/${account.id}`));}
 return <Stack spacing={3}>
  <Box><Typography variant="h1">Cuentas y permisos</Typography>
   <Typography color="text.secondary">Crea cuentas mediante una invitación privada. Cada persona elige su contraseña desde un enlace de un solo uso.</Typography></Box>
  {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="success">{notice}</Alert>}
  <Paper variant="outlined" sx={{p:3}}><Stack component="form" onSubmit={create} spacing={2}>
   <Typography variant="h2">Nueva cuenta</Typography>
   <Stack direction={{xs:'column',md:'row'}} spacing={2}>
    <TextField label="Nombre" value={form.name} onChange={event=>change('name',event.target.value)} inputProps={{maxLength:150}} required fullWidth/>
    <TextField label="Correo real" type="email" value={form.email} onChange={event=>change('email',event.target.value)} inputProps={{maxLength:150}} required fullWidth/>
    <TextField select label="Rol" value={form.role} onChange={event=>change('role',event.target.value)} fullWidth>
     {Object.entries(roleName).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
   </Stack>
   <FormControlLabel control={<Checkbox checked={form.role==='admin'||form.canManageUsers} disabled={form.role==='admin'} onChange={event=>change('canManageUsers',event.target.checked)}/>} label="Puede gestionar cuentas y permisos"/>
   <Button type="submit" variant="contained" disabled={busy} sx={{alignSelf:'flex-start'}}>Crear y enviar invitación</Button>
  </Stack></Paper>
  <Paper variant="outlined" sx={{overflowX:'auto'}}><Table><TableHead><TableRow>
   {['Nombre','Correo','Rol','Gestión de cuentas','Estado','Acciones'].map(label=><TableCell key={label}>{label}</TableCell>)}
  </TableRow></TableHead><TableBody>{items.map(account=><TableRow key={account.id}>
   <TableCell>{account.name}</TableCell><TableCell>{account.email}</TableCell><TableCell>{roleName[account.role]}</TableCell>
   <TableCell>{account.canManageUsers?'Sí':'No'}</TableCell>
   <TableCell><Chip size="small" color={account.status==='activo'?'success':'default'} label={account.status==='activo'?'Activa':'Desactivada'}/></TableCell>
   <TableCell><Stack direction="row" spacing={1}>
    {account.status==='activo'?<>
     <Button size="small" onClick={()=>openEdit(account)} disabled={busy}>Editar</Button>
     {account.id!==user.id&&<><Button size="small" onClick={()=>run(()=>api.post(`/users/${account.id}/invite`,{}))} disabled={busy}>Reenviar invitación</Button>
     <Button size="small" onClick={()=>setPasswordTarget(account)} disabled={busy}>Cambiar contraseña</Button>
      <Button size="small" color="error" onClick={()=>deactivate(account)} disabled={busy}>Desactivar</Button></>}
    </>:<Button size="small" onClick={()=>run(()=>api.post(`/users/${account.id}/reactivate`,{}))} disabled={busy}>Reactivar e invitar</Button>}
   </Stack></TableCell>
  </TableRow>)}</TableBody></Table></Paper>
  <Alert severity="info">Desactivar una cuenta impide el acceso de inmediato. Su registro se conserva porque las transferencias y la auditoría deben seguir vinculadas a quien las realizó.</Alert>
  <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth="sm"><Stack component="form" onSubmit={save}>
   <DialogTitle>Editar cuenta</DialogTitle><DialogContent><Stack spacing={2} sx={{pt:1}}>
    <TextField label="Nombre" value={form.name} onChange={event=>change('name',event.target.value)} inputProps={{maxLength:150}} required/>
    <TextField label="Correo" type="email" value={form.email} onChange={event=>change('email',event.target.value)} inputProps={{maxLength:150}} required/>
    <TextField select label="Rol" value={form.role} onChange={event=>change('role',event.target.value)}>
     {Object.entries(roleName).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    <FormControlLabel control={<Checkbox checked={form.role==='admin'||form.canManageUsers} disabled={form.role==='admin'} onChange={event=>change('canManageUsers',event.target.checked)}/>} label="Puede gestionar cuentas y permisos"/>
    {editing?.id===user.id&&<Alert severity="info">Puedes modificar tu nombre aquí. Tus propios permisos y correo están protegidos para evitar que pierdas el acceso.</Alert>}
    {editing&&form.email!==editing.email&&<Alert severity="warning">Al cambiar el correo se cerrarán las sesiones, se invalidará la contraseña anterior y se enviará una invitación al nuevo correo.</Alert>}
   </Stack></DialogContent><DialogActions><Button onClick={closeEdit}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy}>Guardar</Button></DialogActions>
  </Stack></Dialog>
  <Dialog open={Boolean(passwordTarget)} onClose={closePassword} fullWidth maxWidth="sm">
   <Stack component="form" onSubmit={changePassword}>
    <DialogTitle>Cambiar contraseña de {passwordTarget?.name}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{pt:1}}>
     <TextField label="Nueva contraseña" type="password" value={newPassword} onChange={event=>setNewPassword(event.target.value)} inputProps={{minLength:15,maxLength:128}} helperText="Entre 15 y 128 caracteres." required/>
     <Alert severity="info">La contraseña de un solo carácter se rechazará. Al guardar se cerrarán las sesiones del usuario.</Alert>
    </Stack></DialogContent>
    <DialogActions><Button onClick={closePassword}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy}>Guardar contraseña</Button></DialogActions>
   </Stack>
  </Dialog>
 </Stack>;
}
