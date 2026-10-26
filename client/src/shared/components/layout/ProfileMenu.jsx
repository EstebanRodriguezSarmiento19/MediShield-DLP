import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Avatar,Box,Divider,IconButton,ListItemIcon,Menu,MenuItem,Typography} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import {useAuth} from '../../../features/auth/AuthContext.jsx';
import {roleName,initials} from '../../utils/roles.js';

/** Menú desplegable de perfil (círculo con iniciales, estilo GitHub). */
export default function ProfileMenu({onError}){
 const {user,logout}=useAuth(),navigate=useNavigate();
 const [anchor,setAnchor]=useState(null);
 const close=()=>setAnchor(null);
 const go=path=>{close();navigate(path);};
 const items=[
  {label:'Mi perfil',path:'/profile',icon:<PersonOutlineIcon fontSize="small"/>},
  {label:'Preferencias',path:'/preferences',icon:<TuneIcon fontSize="small"/>},
  {label:'Ajustes',path:'/settings',icon:<SettingsOutlinedIcon fontSize="small"/>},
 ];
 return <>
  <IconButton onClick={e=>setAnchor(e.currentTarget)} aria-label="Menú de perfil" aria-haspopup="menu" aria-expanded={Boolean(anchor)} size="small">
   <Avatar sx={{width:36,height:36,bgcolor:'primary.main',color:'primary.contrastText',fontSize:15}}>{initials(user.name)}</Avatar>
  </IconButton>
  <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} anchorOrigin={{vertical:'bottom',horizontal:'right'}} transformOrigin={{vertical:'top',horizontal:'right'}}
   slotProps={{paper:{sx:{minWidth:240,mt:1}}}}>
   <Box sx={{px:2,py:1}}><Typography variant="body2" color="text.secondary">Sesión iniciada como</Typography>
    <Typography fontWeight={600} noWrap>{user.name}</Typography>
    <Typography variant="caption" color="text.secondary">{roleName[user.role]}</Typography></Box>
   <Divider/>
   {items.map(i=><MenuItem key={i.path} onClick={()=>go(i.path)}><ListItemIcon>{i.icon}</ListItemIcon>{i.label}</MenuItem>)}
   {user.role==='admin'&&[<Divider key="d"/>,
    <MenuItem key="roles" onClick={()=>go('/admin/roles')}><ListItemIcon><AdminPanelSettingsOutlinedIcon fontSize="small"/></ListItemIcon>Administrar roles</MenuItem>]}
   <Divider/>
   <MenuItem onClick={()=>{close();logout().catch(e=>onError?.(e.message));}}><ListItemIcon><LogoutIcon fontSize="small"/></ListItemIcon>Cerrar sesión</MenuItem>
  </Menu>
 </>;
}
