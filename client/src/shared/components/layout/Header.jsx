import {useState} from 'react';
import {AppBar,Toolbar,Typography,Stack,Alert} from '@mui/material';
import ProfileMenu from './ProfileMenu.jsx';
export default function Header() {
 const [error,setError]=useState('');
 return <AppBar position="fixed" color="inherit" sx={{zIndex:t=>t.zIndex.drawer+1}}>
  <Toolbar sx={{justifyContent:'space-between'}}>
   <Typography variant="h2">MediShield DLP</Typography>
   <Stack direction="row" spacing={2} alignItems="center"><ProfileMenu onError={setError}/></Stack>
  </Toolbar>{error&&<Alert severity="error">{error}</Alert>}
 </AppBar>;
}
