import { useLocation } from 'react-router-dom';
import { AppBar, Box, IconButton, Stack, Toolbar, Tooltip, Typography, useTheme } from '@mui/material';
import { DarkMode, LightMode, Menu as MenuIcon } from '@mui/icons-material';
import ProfileMenu from './ProfileMenu.jsx';
import { DRAWER_WIDTH } from './Sidebar.jsx';
import { usePreferences } from '../../../features/preferences/PreferencesContext.jsx';

const TITLES = [
  ['/dashboard', 'Panel de control'],
  ['/transfers', 'Transferencias'],
  ['/recipients', 'Destinatarios'],
  ['/rules', 'Reglas DLP'],
  ['/alerts', 'Alertas'],
  ['/audit', 'Auditoría'],
  ['/security-validation', 'Seguridad y pruebas'],
  ['/users', 'Cuentas'],
  ['/admin/roles', 'Roles y permisos'],
  ['/profile', 'Mi perfil'],
  ['/preferences', 'Preferencias']
];

export default function Header({ onMenuClick }) {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { update } = usePreferences();
  const isDark = theme.palette.mode === 'dark';
  const title = TITLES.find(([path]) => pathname.startsWith(path))?.[1] ?? 'MediShield DLP';

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        zIndex: (t) => t.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2, px: { xs: 2, md: 3 }, minHeight: 64 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <IconButton edge="start" onClick={onMenuClick} sx={{ display: { md: 'none' } }} aria-label="Abrir menú">
            <MenuIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Sala de control
            </Typography>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
              {title}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
            <IconButton
              onClick={() => update({ theme: isDark ? 'light' : 'dark' })}
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
          <ProfileMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
