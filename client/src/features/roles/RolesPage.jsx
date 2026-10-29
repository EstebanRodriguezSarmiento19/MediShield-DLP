import { useState } from 'react';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import AccountsPanel from './AccountsPanel.jsx';
import CustomRolesPanel from './CustomRolesPanel.jsx';

/** Administración de acceso: solo visible para el rol administrador desde su perfil. */
export default function RolesPage() {
  const [tab, setTab] = useState(0);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Roles y permisos</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Gestiona las cuentas del sistema y define roles personalizados con permisos granulares.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Cuentas" />
        <Tab label="Roles personalizados" />
      </Tabs>

      {tab === 0 ? <AccountsPanel /> : <CustomRolesPanel />}
    </Stack>
  );
}
