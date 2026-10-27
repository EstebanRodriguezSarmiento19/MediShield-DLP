import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar
} from '@mui/material';

import {
  NavLink,
  useLocation
} from 'react-router-dom';

import { useAuth } from '../../../features/auth/AuthContext.jsx';

const items = [
  ['Panel de control', '/dashboard'],

  ['Transferencias', '/transfers', ['admin', 'usuario']],

  ['Destinatarios', '/recipients'],

  ['Reglas DLP', '/rules', ['admin', 'analista']],

  ['Alertas', '/alerts', ['admin', 'analista']],

  ['Auditoría', '/audit', ['admin', 'analista']],

  [
    'Seguridad y pruebas',
    '/security-validation',
    ['admin', 'analista']
  ]
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 230,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 230,
          boxSizing: 'border-box'
        }
      }}
    >

      <Toolbar />

      <List>

        {items
          .filter(
            item =>
              !item[2] ||
              item[2].includes(user.role)
          )
          .map(([name, path]) => (

            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              selected={
                location.pathname === path
              }
            >
              <ListItemText
                primary={name}
              />
            </ListItemButton>

          ))}

      </List>

    </Drawer>
  );
}