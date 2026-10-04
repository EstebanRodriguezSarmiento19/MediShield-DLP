import {createContext,useContext,useEffect,useState} from 'react';
import {Navigate,Outlet} from 'react-router-dom';
import {Alert,CircularProgress,Box} from '@mui/material';
import api from '../../shared/services/api.js';
const Context=createContext(null);
export function AuthProvider({children}) {
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{api.get('/auth/me').then(r=>{api.setCsrf(r.data.csrfToken);setUser(r.data.user);})
  .catch(e=>{if(e.status!==401)setError(e.message);}).finally(()=>setLoading(false));},[]);
 useEffect(()=>{const clear=()=>{setUser(null);api.setCsrf('');};window.addEventListener('session-expired',clear);return()=>window.removeEventListener('session-expired',clear);},[]);
 const login=async(email,password)=>{const r=await api.post('/auth/login',{email,password});api.setCsrf(r.data.csrfToken);setUser(r.data.user);setError('');};
 const logout=async()=>{await api.post('/auth/logout',{});api.setCsrf('');setUser(null);};
 return <Context.Provider value={{user,loading,error,login,logout}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
export function ProtectedRoute({roles}) {
 const {user,loading,error}=useAuth();
 if(loading)return <Box sx={{p:5}}><CircularProgress aria-label="Comprobando sesión"/></Box>;
 if(error)return <Alert severity="error">{error}</Alert>;
 if(!user)return <Navigate to="/login" replace/>;
 if(roles&&!roles.includes(user.role))return <Alert severity="error">Tu rol no tiene acceso a esta página.</Alert>;
 return <Outlet/>;
}
