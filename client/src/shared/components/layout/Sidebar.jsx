import { useState } from 'react';
import { Avatar, Box, Collapse, Divider, Drawer, ListItemButton, ListItemIcon, ListItemText, Stack, Tooltip, Typography, alpha } from '@mui/material';
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

// Carril compacto en escritorio; se expande al pasar el ratón o al enfocar un elemento.
export const DRAWER_WIDTH = 76;
const EXPANDED_WIDTH = 236;
const MOBILE_WIDTH = 264;

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

const itemSx = (active, expanded) => (theme) => ({
  minHeight: 44,
  px: expanded ? 1.25 : 0,
  justifyContent: expanded ? 'flex-start' : 'center',
  borderRadius: '12px',
  color: active ? 'primary.main' : 'text.secondary',
  bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  '&:hover': {
    color: active ? 'primary.main' : 'text.primary',
    bgcolor: active ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.text.primary, 0.05)
  }
});

export default function Sidebar({ mobileOpen, onClose, isMobile }) {
  const { user, can } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const expanded = isMobile || hovered;
  const width = isMobile ? MOBILE_WIDTH : hovered ? EXPANDED_WIDTH : DRAWER_WIDTH;

  const visible = (item) => {
    if (item.adminOnly) return user.role === 'admin';
    if (item.permission) return can(item.permission);
    return true;
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 2.25, px: 1.1, overflowX: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ mb: 3, px: expanded ? 0.5 : 0, justifyContent: expanded ? 'flex-start' : 'center', minHeight: 40 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main'
          }}
        >
          <SecurityIcon sx={{ color: 'primary.contrastText', fontSize: 22 }} />
        </Box>
        <Collapse in={expanded} orientation="horizontal" collapsedSize={0}>
          <Box sx={{ whiteSpace: 'nowrap', pr: 1 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>MediShield</Typography>
            <Typography variant="caption" color="text.secondary">Prevención DLP</Typography>
          </Box>
        </Collapse>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {SECTIONS.map((section) => {
          const items = section.items.filter(visible);
          if (!items.length) return null;
          return (
            <Box key={section.title} sx={{ mb: 1.5 }}>
              {expanded ? (
                <Typography
                  variant="overline"
                  sx={{ display: 'block', px: 1.25, pb: 0.75, color: 'text.secondary', fontSize: '0.62rem', whiteSpace: 'nowrap' }}
                >
                  {section.title}
                </Typography>
              ) : (
                <Divider sx={{ width: 24, mx: 'auto', my: 1.25 }} />
              )}

              <Stack spacing={0.5}>
                {items.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Tooltip
                      key={item.path}
                      title={item.label}
                      placement="right"
                      arrow
                      disableHoverListener={expanded}
                      disableFocusListener
                      disableTouchListener
                    >
                      <ListItemButton
                        component={NavLink}
                        to={item.path}
                        onClick={isMobile ? onClose : undefined}
                        aria-label={item.label}
                        sx={itemSx(active, expanded)}
                      >
                        <ListItemIcon sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}>
                          <Icon fontSize="small" />
                        </ListItemIcon>
                        <Collapse in={expanded} orientation="horizontal" collapsedSize={0}>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}
                            sx={{ ml: 1.25, my: 0 }}
                          />
                        </Collapse>
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: expanded ? 0.5 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}
      >
        <Avatar sx={{ width: 36, height: 36, flexShrink: 0, bgcolor: 'action.selected', color: 'text.primary', fontSize: 13, fontWeight: 700 }}>
          {initials(user.name)}
        </Avatar>
        <Collapse in={expanded} orientation="horizontal" collapsedSize={0}>
          <Box sx={{ whiteSpace: 'nowrap', pr: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user.customRoleName || roleName[user.role]}</Typography>
          </Box>
        </Collapse>
      </Stack>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onFocus: () => setHovered(true),
        onBlur: (event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
        }
      }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.22s ease, box-shadow 0.22s ease',
          boxShadow: hovered && !isMobile ? '16px 0 40px -18px rgba(0, 0, 0, 0.55)' : 'none',
          // Al expandirse, el carril queda por encima del header para no chocar con su título.
          zIndex: (theme) => (hovered && !isMobile ? theme.zIndex.drawer + 2 : theme.zIndex.drawer)
        }
      }}
    >
      {content}
    </Drawer>
  );
}
