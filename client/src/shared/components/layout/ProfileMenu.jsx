
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';

import PersonOutlineIconModule from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsOutlinedIconModule from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutIconModule from '@mui/icons-material/Logout';

import icon from '../../utils/icon.js';
import { useAuth } from '../../../features/auth/AuthContext.jsx';
import { roleName, initials } from '../../utils/roles.js';

const LogoutIcon = icon(LogoutIconModule);
const AdminPanelSettingsOutlinedIcon = icon(
  AdminPanelSettingsOutlinedIconModule
);
const PersonOutlineIcon = icon(PersonOutlineIconModule);

/** Menú desplegable de perfil. */
export default function ProfileMenu({ onError }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchor, setAnchor] = useState(null);

  const close = () => setAnchor(null);

  const go = (path) => {
    close();
    navigate(path);
  };

  const items = [
    {
      label: 'Mi perfil',
      path: '/profile',
      icon: <PersonOutlineIcon fontSize="small" />
    },
  ];

  const handleLogout = async () => {
    close();

    try {
      await logout();
    } catch (e) {
      onError?.(e.message || 'No se pudo cerrar la sesión.');
    }
  };

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Menú de perfil"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        size="small"
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: 15
          }}
        >
          {initials(user.name)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 240,
              mt: 1
            }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Sesión iniciada como
          </Typography>

          <Typography fontWeight={600} noWrap>
            {user.name}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {roleName[user.role]}
          </Typography>
        </Box>

        <Divider />

        {items.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => go(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {item.label}
          </MenuItem>
        ))}

        {user.role === 'admin' && (
          <>
            <Divider />

            <MenuItem onClick={() => go('/admin/roles')}>
              <ListItemIcon>
                <AdminPanelSettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Administrar roles
            </MenuItem>
          </>
        )}

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  );
}
