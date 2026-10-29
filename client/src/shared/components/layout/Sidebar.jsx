import { Avatar, Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography, alpha } from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  Assignment,
  ContactMail,
  DashboardOutlined,
  NotificationsActive,
  People,
  Rule,
  Science,
  Security as SecurityIcon,
  SwapHoriz
} from '@mui/icons-material';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth/AuthContext.jsx';
import { initials, roleName } from '../../utils/roles.js';

export const DRAWER_WIDTH = 264;

// Cada entrada declara el permiso que la muestra. El servidor vuelve a comprobarlo en cada endpoint.
const SECTIONS = [
  {
    title: 'Principal',
    items: [
      { label: 'Panel de control', path: '/dashboard', icon: DashboardOutlined },
      { label: 'Transferencias', path: '/transfers', icon: SwapHoriz, permission: 'transferencias.enviar' },
      { label: 'Destinatarios', path: '/recipients', icon: ContactMail }
    ]
  },
  {
    title: 'Control',
    items: [
      { label: 'Reglas DLP', path: '/rules', icon: Rule, permission: 'reglas.ver' },
      { label: 'Alertas', path: '/alerts', icon: NotificationsActive, permission: 'alertas.ver' },
      { label: 'Auditoría', path: '/audit', icon: Assignment, permission: 'auditoria.ver' },
      { label: 'Seguridad y pruebas', path: '/security-validation', icon: Science, permission: 'seguridad.ver' }
    ]
  },
  {
    title: 'Administración',
    items: [
      { label: 'Cuentas', path: '/users', icon: People, permission: 'usuarios.gestionar' },
      { label: 'Roles y permisos', path: '/admin/roles', icon: AdminPanelSettingsOutlined, adminOnly: true }
    ]
  }
];

const navItemSx = (theme) => ({
  position: 'relative',
  mx: 1.25,
  my: 0.25,
  px: 1.5,
  py: 1,
  borderRadius: '10px',
  color: 'text.secondary',
  '&:hover': { color: 'text.primary', bgcolor: alpha(theme.palette.primary.main, 0.06) },
  '&.Mui-selected': {
    color: 'primary.main',
    bgcolor: alpha(theme.palette.primary.main, 0.12),
    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
  },
  '&.Mui-selected::before': {
    content: '""',
    position: 'absolute',
    left: -6,
    top: 9,
    bottom: 9,
    width: 3,
    borderRadius: 2,
    bgcolor: 'primary.main'
  }
});

export default function Sidebar({ mobileOpen, onClose, isMobile }) {
  const { user, can } = useAuth();
  const location = useLocation();

  const visible = (item) => {
    if (item.adminOnly) return user.role === 'admin';
    if (item.permission) return can(item.permission);
    return true;
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 1, py: 1, mb: 2.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '11px',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #00E5FF 0%, #2979FF 100%)',
            boxShadow: '0 10px 26px -12px rgba(0, 229, 255, 0.8)'
          }}
        >
          <SecurityIcon sx={{ color: '#04111A', fontSize: 21 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>MediShield</Typography>
          <Typography sx={{ color: 'primary.main', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.16em' }}>
            DLP · PREVENCIÓN
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
        {SECTIONS.map((section) => {
          const items = section.items.filter(visible);
          if (!items.length) return null;
          return (
            <Box key={section.title} sx={{ mb: 2 }}>
              <Typography
                variant="overline"
                sx={{ display: 'block', px: 2, pb: 0.5, color: 'text.secondary', fontSize: '0.64rem' }}
              >
                {section.title}
              </Typography>
              <List dense disablePadding>
                {items.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <ListItemButton
                      key={item.path}
                      component={NavLink}
                      to={item.path}
                      selected={active}
                      onClick={isMobile ? onClose : undefined}
                      sx={navItemSx}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 500 }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1, py: 0.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {initials(user.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
          <Typography noWrap variant="caption" color="text.secondary">
            {user.customRoleName || roleName[user.role]}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' }
      }}
    >
      {content}
    </Drawer>
  );
}
