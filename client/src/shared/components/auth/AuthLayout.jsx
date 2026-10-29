import { Box, Stack, Typography } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

/** Marca de MediShield: distintivo cian con el icono de seguridad y el nombre. */
export function Brand({ compact = false }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: compact ? 34 : 38,
          height: compact ? 34 : 38,
          borderRadius: '11px',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #00E5FF 0%, #2979FF 100%)',
          boxShadow: '0 10px 26px -10px rgba(0, 229, 255, 0.7)'
        }}
      >
        <SecurityIcon sx={{ color: '#04111A', fontSize: compact ? 19 : 21 }} />
      </Box>
      <Typography sx={{ fontWeight: 800, letterSpacing: '-0.01em', fontSize: '1.05rem' }}>
        MediShield DLP
      </Typography>
    </Stack>
  );
}

/** Etiqueta encima del campo, como en la referencia visual. */
export function FieldLabel({ htmlFor, children }) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      variant="body2"
      sx={{ display: 'block', fontWeight: 600, color: 'text.primary', mt: 2.25, mb: 0.75 }}
    >
      {children}
    </Typography>
  );
}

// Ondas decorativas. Cada trazo se desplaza suavemente; con reduced-motion no se anima.
const WAVES = [
  { d: 'M-40 120 C 180 40, 340 40, 520 120 S 860 200, 1040 120 S 1380 40, 1480 120', color: '#00E5FF', opacity: 0.55, className: 'wave-a' },
  { d: 'M-40 250 C 160 170, 340 170, 520 250 S 860 330, 1040 250 S 1380 170, 1480 250', color: '#A78BFA', opacity: 0.45, className: 'wave-b' },
  { d: 'M-40 380 C 180 300, 340 300, 520 380 S 860 460, 1040 380 S 1380 300, 1480 380', color: '#34D399', opacity: 0.35, className: 'wave-c' },
  { d: 'M-40 510 C 160 430, 340 430, 520 510 S 860 590, 1040 510 S 1380 430, 1480 510', color: '#00E5FF', opacity: 0.4, className: 'wave-d' },
  { d: 'M-40 640 C 180 560, 340 560, 520 640 S 860 720, 1040 640 S 1380 560, 1480 640', color: '#A78BFA', opacity: 0.3, className: 'wave-e' },
  { d: 'M-40 770 C 160 690, 340 690, 520 770 S 860 850, 1040 770 S 1380 690, 1480 770', color: '#34D399', opacity: 0.3, className: 'wave-f' }
];

function HeroPanel() {
  return (
    <Box
      component="aside"
      sx={{
        position: 'relative',
        flex: '1 1 50%',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: { md: 5, lg: 7 },
        overflow: 'hidden',
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) => theme.palette.mode === 'dark' ? '#070B13' : '#EAF0F8',
        '@keyframes waveDrift': {
          from: { transform: 'translateX(-28px)' },
          to: { transform: 'translateX(28px)' }
        },
        '@keyframes glowPulse': {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 0.9 }
        },
        '& .wave-a, & .wave-b, & .wave-c, & .wave-d, & .wave-e, & .wave-f': {
          animation: 'waveDrift 14s ease-in-out infinite alternate',
          transformOrigin: 'center'
        },
        '& .wave-b': { animationDuration: '18s' },
        '& .wave-c': { animationDuration: '16s' },
        '& .wave-e': { animationDuration: '20s' },
        '& .glow': { animation: 'glowPulse 7s ease-in-out infinite' },
        '@media (prefers-reduced-motion: reduce)': {
          '& .wave-a, & .wave-b, & .wave-c, & .wave-d, & .wave-e, & .wave-f, & .glow': { animation: 'none' }
        }
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          <radialGradient id="authGlow" cx="75%" cy="88%" r="45%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse className="glow" cx="1080" cy="790" rx="620" ry="420" fill="url(#authGlow)" />
        {WAVES.map((wave) => (
          <path
            key={wave.className}
            className={wave.className}
            d={wave.d}
            fill="none"
            stroke={wave.color}
            strokeOpacity={wave.opacity}
            strokeWidth="1.2"
          />
        ))}
      </Box>

      <Brand />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 540 }}>
        <Typography variant="overline" sx={{ color: 'primary.main' }}>
          Prevención de fuga de datos
        </Typography>
        <Typography
          component="h2"
          sx={{
            mt: 1.5,
            fontSize: { md: '2.6rem', lg: '3.3rem' },
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: '-0.03em'
          }}
        >
          Proteja cada dato clínico{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>antes de que salga</Box>{' '}
          del sistema.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2.5, fontSize: '1.02rem', maxWidth: 460, lineHeight: 1.6 }}>
          Revise cada transferencia, valide al destinatario y actúe antes de que la información
          abandone el sistema.
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', boxShadow: '0 0 0 4px rgba(52, 211, 153, 0.15)' }} />
        <Typography variant="caption" color="text.secondary">
          Motor DLP en servidor · Análisis determinista · Datos sintéticos de laboratorio
        </Typography>
      </Stack>
    </Box>
  );
}

/**
 * Composición de autenticación: panel de marca a la izquierda y formulario a la derecha.
 * En pantallas pequeñas el panel de marca se oculta y la marca aparece sobre el formulario.
 */
export function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <HeroPanel />

      <Box component="main" sx={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2.5, sm: 4 }, py: { xs: 5, sm: 4 } }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            animation: 'authFadeUp 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
            '@keyframes authFadeUp': {
              from: { opacity: 0, transform: 'translateY(14px)' },
              to: { opacity: 1, transform: 'none' }
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        >
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
            <Brand compact />
          </Box>

          <Typography variant="overline" sx={{ color: 'secondary.main' }}>
            {eyebrow}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ mt: 0.75, fontSize: { xs: '1.75rem', sm: '2rem' } }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {subtitle}
          </Typography>

          {children}
        </Box>
      </Box>
    </Box>
  );
}
