import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { NavLink, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Panel de control', path: '/dashboard', icon: <DashboardOutlinedIcon /> },
  { label: 'Analisis DLP', path: '/transfers', icon: <SwapHorizOutlinedIcon /> },
  { label: 'Alertas', path: '/alerts', icon: <NotificationsNoneOutlinedIcon /> },
  { label: 'Auditoría', path: '/audit', icon: <FactCheckOutlinedIcon /> },
];

/**
 * Barra lateral de navegación principal.
 * La lista de items es estática por ahora; cuando exista
 * control de roles, se podrá filtrar según el usuario.
 */
function Sidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
          MediShield DLP
        </Typography>
      </Toolbar>

      <Box sx={{ overflow: 'auto', mt: 1 }}>
        <List>
          {navItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                selected={isSelected}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '&:hover': { backgroundColor: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
