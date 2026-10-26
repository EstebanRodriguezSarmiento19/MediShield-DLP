import { createTheme } from '@mui/material/styles';

/**
 * Tema centralizado de la aplicación.
 * Cualquier ajuste visual global (colores, tipografía, radios)
 * debe hacerse aquí, no en componentes individuales.
 *
 * Paleta pensada para un panel administrativo sobrio:
 * blancos, grises neutros y un azul oscuro corporativo.
 */
export function createAppTheme(mode = 'light', dense = false) {
  const dark = mode === 'dark';
  const border = dark ? '#2F3747' : '#E2E5EA';
  return createTheme({
  palette: {
    mode,
    primary: {
      main: dark ? '#7C9CF5' : '#1E2A44', // azul oscuro corporativo
      contrastText: dark ? '#0F1420' : '#FFFFFF',
    },
    secondary: {
      main: dark ? '#A0AEC0' : '#4A5568', // gris azulado para acentos secundarios
    },
    background: {
      default: dark ? '#0F1420' : '#F4F5F7',
      paper: dark ? '#171D2B' : '#FFFFFF',
    },
    text: {
      primary: dark ? '#E6E9EF' : '#1F2430',
      secondary: dark ? '#A3ACBA' : '#5B6472',
    },
    divider: border,
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
          borderBottom: `1px solid ${border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${border}`,
        },
      },
    },
    MuiTable: { defaultProps: { size: dense ? 'small' : 'medium' } },
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
}

export default createAppTheme();
