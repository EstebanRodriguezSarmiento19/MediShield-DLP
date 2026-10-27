import {Box,Button,FormControlLabel,Paper,Stack,Switch,ToggleButton,ToggleButtonGroup,Typography} from '@mui/material';
import {usePreferences} from './PreferencesContext.jsx';

export default function PreferencesPage(){
 const {prefs,update,reset}=usePreferences();
 return <Stack spacing={3} sx={{maxWidth:720}}>
  <Box><Typography variant="h1">Preferencias</Typography>
   <Typography color="text.secondary">Personaliza cómo ves MediShield DLP. Se guardan solo en este navegador.</Typography></Box>
  <Paper variant="outlined" sx={{p:3}}><Stack spacing={3}>
   <Box><Typography variant="h2" gutterBottom>Apariencia</Typography>
    <ToggleButtonGroup exclusive value={prefs.theme} onChange={(_e,value)=>value&&update({theme:value})} aria-label="Tema">
     <ToggleButton value="light">Claro</ToggleButton><ToggleButton value="dark">Oscuro</ToggleButton><ToggleButton value="system">Sistema</ToggleButton>
    </ToggleButtonGroup></Box>
   <FormControlLabel control={<Switch checked={prefs.dense} onChange={e=>update({dense:e.target.checked})}/>} label="Tablas compactas (más filas en pantalla)"/>
   <Button onClick={reset} sx={{alignSelf:'flex-start'}}>Restablecer valores</Button>
  </Stack></Paper>
 </Stack>;
}
