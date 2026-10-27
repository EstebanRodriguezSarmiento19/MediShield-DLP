import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF', // Cian tecnológico (Cybersecurity vibe)
      light: '#6EFFFF',
      dark: '#00B2CC',
      contrastText: '#0A192F',
    },
    secondary: {
      main: '#2979FF', // Azul vibrante
      light: '#75A7FF',
      dark: '#004BA0',
    },
    background: {
      default: '#0A192F', // Fondo oscuro profundo
      paper: '#112240',   // Tarjetas ligeramente más claras
    },
    text: {
      primary: '#CCD6F6', // Texto principal claro
      secondary: '#8892B0', // Texto secundario apagado
    },
    success: { main: '#00E676' },
    error: { main: '#FF1744' },
    warning: { main: '#FFEA00' },
    info: { main: '#0288D1' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em', color: '#E6F1FF' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em', color: '#E6F1FF' },
    h3: { fontWeight: 600, color: '#E6F1FF' },
    h4: { fontWeight: 600, color: '#E6F1FF' },
    h5: { fontWeight: 600, color: '#E6F1FF' },
    h6: { fontWeight: 600, color: '#CCD6F6' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.5px' },
  },
  shape: {
    borderRadius: 16, // Bordes redondeados estilo BTO Digital
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          boxShadow: '0 4px 14px 0 rgba(0, 229, 255, 0.39)', // Glow effect
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 229, 255, 0.6)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 34, 64, 0.7)', // Glassmorphism base
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)', // Animación sutil al pasar el mouse
            boxShadow: '0 12px 40px 0 rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 25, 47, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A192F',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            color: '#00E5FF',
            '& .MuiListItemIcon-root': { color: '#00E5FF' },
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 229, 255, 0.15)',
            color: '#00E5FF',
            borderRight: '3px solid #00E5FF',
            '& .MuiListItemIcon-root': { color: '#00E5FF' },
          },
        },
      },
    },
  },
});