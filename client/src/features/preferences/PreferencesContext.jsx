import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {ThemeProvider,CssBaseline,useMediaQuery} from '@mui/material';
import {createAppTheme} from '../../app/theme.js';

const KEY='medishield_preferences';
const defaults={theme:'system',dense:false};
const Context=createContext(null);

function read(){
 try{
  const stored=JSON.parse(localStorage.getItem(KEY)||'{}');
  return {
   theme:['light','dark','system'].includes(stored.theme)?stored.theme:defaults.theme,
   dense:typeof stored.dense==='boolean'?stored.dense:defaults.dense,
  };
 }catch{return defaults;}
}

/** Preferencias visuales por navegador (tema y densidad de tablas). Envuelve el ThemeProvider. */
export function PreferencesProvider({children}){
 const [prefs,setPrefs]=useState(read);
 const systemDark=useMediaQuery('(prefers-color-scheme: dark)');
 const mode=prefs.theme==='system'?(systemDark?'dark':'light'):prefs.theme;
 const theme=useMemo(()=>createAppTheme(mode,prefs.dense),[mode,prefs.dense]);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{/* almacenamiento no disponible */}},[prefs]);
 const update=patch=>setPrefs(current=>({...current,...patch}));
 const reset=()=>setPrefs(defaults);
 return <Context.Provider value={{prefs,update,reset}}>
  <ThemeProvider theme={theme}><CssBaseline/>{children}</ThemeProvider>
 </Context.Provider>;
}
export const usePreferences=()=>useContext(Context);
