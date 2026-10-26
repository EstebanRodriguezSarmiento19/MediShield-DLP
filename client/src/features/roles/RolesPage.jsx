import {useCallback,useEffect,useState} from 'react';
import {Alert,Box,Button,Checkbox,Chip,Dialog,DialogActions,DialogContent,DialogTitle,FormControlLabel,InputAdornment,
 MenuItem,Paper,Stack,Table,TableBody,TableCell,TableHead,TableRow,TextField,Typography} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../shared/services/api.js';
import {useAuth} from '../auth/AuthContext.jsx';
import {roleName} from '../../shared/utils/roles.js';

export default function RolesPage(){
 const {user}=useAuth();
 const [items,setItems]=useState([]),[search,setSearch]=useState(''),[roleFilter,setRoleFilter]=useState('');
 const [editing,setEditing]=useState(null),[form,setForm]=useState({role:'usuario',canManageUsers:false});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');

 const load=useCallback(async()=>{
  const params=new URLSearchParams();
  if(search.trim())params.set('search',search.trim());
  if(roleFilter)params.set('role',roleFilter);
  try{const r=await api.get(`/roles${params.size?`?${params}`:''}`);setItems(r.data);setError('');}
  catch(err){setError(err.message);}finally{setLoading(false);}
 },[search,roleFilter]);
 useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t);},[load]);

 function openEdit(account){setEditing(account);setForm({role:account.role,canManageUsers:account.canManageUsers});setNotice('');}
 async function save(event){
  event.preventDefault();setBusy(true);setError('');
  try{const r=await api.patch(`/roles/${editing.id}`,form);setNotice(r.data.message);setEditing(null);await load();}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 const unchanged=editing&&form.role===editing.role&&(form.role==='admin'||form.canManageUsers===(editing.role==='admin'?false:editing.canManageUsers));

 return <Stack spacing={3}>
  <Box><Typography variant="h1">Administrar roles</Typography>
   <Typography color="text.secondary">Solo los administradores pueden ver y modificar los roles y permisos de las cuentas registradas.</Typography></Box>
  {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="success">{notice}</Alert>}
  <Paper variant="outlined" sx={{p:2}}><Stack direction={{xs:'column',md:'row'}} spacing={2}>
   <TextField label="Buscar por nombre o correo" value={search} onChange={e=>setSearch(e.target.value)} fullWidth inputProps={{maxLength:100}}
    InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
   <TextField select label="Filtrar por rol" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} sx={{minWidth:220}}>
    <MenuItem value="">Todos los roles</MenuItem>
    {Object.entries(roleName).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}
   </TextField>
  </Stack></Paper>
  <Paper variant="outlined" sx={{overflowX:'auto'}}><Table><TableHead><TableRow>
   {['Nombre','Correo','Rol','Gestiona cuentas','Estado','Acciones'].map(l=><TableCell key={l}>{l}</TableCell>)}
  </TableRow></TableHead><TableBody>
   {items.map(a=><TableRow key={a.id}>
    <TableCell>{a.name}{a.id===user.id&&<Chip size="small" label="Tú" sx={{ml:1}}/>}</TableCell>
    <TableCell>{a.email}</TableCell><TableCell>{roleName[a.role]}</TableCell>
    <TableCell>{a.canManageUsers?'Sí':'No'}</TableCell>
    <TableCell><Chip size="small" color={a.status==='activo'?'success':'default'} label={a.status==='activo'?'Activa':'Desactivada'}/></TableCell>
    <TableCell><Button size="small" onClick={()=>openEdit(a)} disabled={a.id===user.id||a.status!=='activo'||busy}>Cambiar rol</Button></TableCell>
   </TableRow>)}
   {!loading&&!items.length&&<TableRow><TableCell colSpan={6} align="center">No hay usuarios que coincidan con la búsqueda.</TableCell></TableRow>}
  </TableBody></Table></Paper>
  <Dialog open={Boolean(editing)} onClose={()=>setEditing(null)} fullWidth maxWidth="xs"><Stack component="form" onSubmit={save}>
   <DialogTitle>Cambiar rol de {editing?.name}</DialogTitle>
   <DialogContent><Stack spacing={2} sx={{pt:1}}>
    <TextField select label="Rol" value={form.role} onChange={e=>setForm(c=>({...c,role:e.target.value}))}>
     {Object.entries(roleName).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    <FormControlLabel control={<Checkbox checked={form.role==='admin'||form.canManageUsers} disabled={form.role==='admin'}
     onChange={e=>setForm(c=>({...c,canManageUsers:e.target.checked}))}/>} label="Puede gestionar cuentas (invitar, editar, desactivar)"/>
    <Alert severity="warning">Al guardar se cerrarán las sesiones de esta persona y tendrá que iniciar sesión de nuevo.</Alert>
   </Stack></DialogContent>
   <DialogActions><Button onClick={()=>setEditing(null)}>Cancelar</Button><Button type="submit" variant="contained" disabled={busy||unchanged}>Guardar</Button></DialogActions>
  </Stack></Dialog>
 </Stack>;
}
