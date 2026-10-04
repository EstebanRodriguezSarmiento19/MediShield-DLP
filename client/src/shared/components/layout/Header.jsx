import {useState} from 'react';
import {AppBar,Toolbar,Typography,Button,Stack,Alert} from '@mui/material';
import {useAuth} from '../../../features/auth/AuthContext.jsx';
export default function Header() {
 const {user,logout}=useAuth();const [error,setError]=useState('');
 return <AppBar position="fixed" color="inherit" sx={{zIndex:t=>t.zIndex.drawer+1}}>
  <Toolbar sx={{justifyContent:'space-between'}}>
   <Typography variant="h2">MediShield DLP</Typography>
   <Stack direction="row" spacing={2} alignItems="center">
    <Typography variant="body2">{user.name} · {user.role}</Typography>
    <Button onClick={()=>logout().catch(e=>setError(e.message))}>Cerrar sesión</Button>
   </Stack>
  </Toolbar>{error&&<Alert severity="error">{error}</Alert>}
 </AppBar>;
}
