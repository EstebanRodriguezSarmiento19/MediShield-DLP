import { createTheme } from '@mui/material/styles';

// Paleta tomada de la referencia visual: fondo casi negro azulado, acento cian
// (identidad de MediShield), morado para etiquetas y verde/ámbar/rosa para estados.
const tones = {
  dark: {
    background: '#060A12',
    paper: '#0C1220',
    drawer: '#080D16',
    text: '#E6EDF7',
    muted: '#8A97AD',
    border: 'rgba(148, 163, 184, 0.14)',
    primary: '#00E5FF',
    primaryText: '#04111A',
    shadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 16px 40px -24px rgba(0,0,0,0.7)'
  },
  light: {
    background: '#F3F6FB',
    paper: '#FFFFFF',
    drawer: '#FFFFFF',
    text: '#0F1B2D',
    muted: '#5B6B82',
    border: 'rgba(15, 27, 45, 0.12)',
    primary: '#0891B2',
    primaryText: '#FFFFFF',
    shadow: '0 12px 28px -22px rgba(15, 27, 45, 0.35)'
  }
};

export const createAppTheme = (mode = 'dark', dense = false) => {
  const dark = mode === 'dark';
  const t = dark ? tones.dark : tones.light;

  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, light: '#6EFFFF', dark: '#00B2CC', contrastText: t.primaryText },
      secondary: { main: '#A78BFA', light: '#C4B5FD', dark: '#7C3AED', contrastText: '#FFFFFF' },
      background: { default: t.background, paper: t.paper },
      text: { primary: t.text, secondary: t.muted },
      divider: t.border,
      success: { main: dark ? '#34D399' : '#059669' },
      error: { main: dark ? '#F43F5E' : '#E11D48' },
      warning: { main: dark ? '#FBBF24' : '#D97706' },
      info: { main: dark ? '#38BDF8' : '#0284C7' }
    },

    shape: { borderRadius: 14 },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h2: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 },
      h3: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
      h4: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h5: { fontSize: '1.05rem', fontWeight: 600 },
      h6: { fontSize: '1rem', fontWeight: 600 },
      subtitle2: { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
      overline: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' }
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: 'tabular-nums' }
        }
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: t.paper,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            boxShadow: t.shadow,
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              borderColor: dark ? 'rgba(0, 229, 255, 0.22)' : 'rgba(8, 145, 178, 0.32)'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '9px 18px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease'
          },
          containedPrimary: {
            boxShadow: '0 8px 24px -10px rgba(0, 229, 255, 0.6)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 12px 28px -10px rgba(0, 229, 255, 0.75)'
            }
          },
          outlined: {
            borderWidth: '1px',
            '&:hover': { borderWidth: '1px' }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: dark ? 'rgba(255, 255, 255, 0.025)' : '#FFFFFF',
            transition: 'box-shadow 0.2s ease',
            '&.Mui-focused': {
              boxShadow: `0 0 0 4px ${dark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(8, 145, 178, 0.14)'}`
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: dark ? 'rgba(6, 10, 18, 0.72)' : 'rgba(243, 246, 251, 0.85)',
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${t.border}`,
            boxShadow: 'none',
            color: t.text
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: t.drawer,
            backgroundImage: 'none',
            borderRight: `1px solid ${t.border}`
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: t.border,
            paddingTop: dense ? 6 : 12,
            paddingBottom: dense ? 6 : 12
          },
          head: {
            color: t.muted,
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, minHeight: 44 }
        }
      }
    }
  });
};
