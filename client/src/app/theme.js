import { createTheme } from '@mui/material/styles';

/**
 * Tema centralizado de la aplicación.
 * Cualquier ajuste visual global (colores, tipografía, radios)
 * debe hacerse aquí, no en componentes individuales.
 *
 * Paleta pensada para un panel administrativo sobrio:
 * blancos, grises neutros y un azul oscuro corporativo.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E2A44', // azul oscuro corporativo
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4A5568', // gris azulado para acentos secundarios
    },
    background: {
      default: '#F4F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2430',
      secondary: '#5B6472',
    },
    divider: '#E2E5EA',
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'Segoe UI',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '1.75rem', fontWeight: 600 },
    h2: { fontSize: '1.375rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E2E5EA',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E2E5EA',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
