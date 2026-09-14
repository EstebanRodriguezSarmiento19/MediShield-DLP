import { AppBar, Toolbar, Typography, Box } from '@mui/material';

/**
 * Encabezado superior. Por ahora solo muestra un título fijo;
 * más adelante puede incluir el usuario autenticado, notificaciones, etc.
 */
function Header() {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        backgroundColor: 'background.paper',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h2" color="text.primary">
          MediShield DLP
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Prevención de pérdida de datos médicos
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
