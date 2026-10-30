import { Box, Stack, Typography, alpha } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

/** Marca de MediShield. */
export function Brand({ compact = false }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: compact ? 32 : 36,
          height: compact ? 32 : 36,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.5)}`,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1)
        }}
      >
        <SecurityIcon sx={{ color: 'primary.main', fontSize: compact ? 18 : 20 }} />
      </Box>
      <Typography sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>MediShield DLP</Typography>
    </Stack>
  );
}

// Tres decisiones reales del motor (ver dlp.service.js). Texto explicativo, no datos en vivo.
const DECISIONS = [
  { tone: 'success', name: 'Permitir', text: 'Destinatario autorizado y riesgo bajo. El correo sale por el canal controlado.' },
  { tone: 'warning', name: 'Alertar', text: 'El riesgo supera el umbral de revisión. Se retiene la transferencia y no se envía.' },
  { tone: 'error', name: 'Bloquear', text: 'Destinatario no autorizado, datos de alta sensibilidad hacia un dominio externo o riesgo alto.' }
];

/** Panel informativo a la derecha: patrón de puntos con un barrido lento y el flujo de decisiones. */
function DecisionPanel() {
  return (
    <Box
      component="aside"
      sx={{
        position: 'relative',
        flex: '1 1 52%',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        p: { md: 6, lg: 9 },
        overflow: 'hidden',
        borderLeft: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: (t) => (t.palette.mode === 'dark' ? '#0A1020' : '#E9EFF7'),
        '@keyframes scanSweep': {
          '0%': { transform: 'translateY(-40%)', opacity: 0 },
          '15%': { opacity: 1 },
          '85%': { opacity: 1 },
          '100%': { transform: 'translateY(260%)', opacity: 0 }
        },
        '& .scan': { animation: 'scanSweep 8s linear infinite' },
        '@media (prefers-reduced-motion: reduce)': { '& .scan': { animation: 'none' } }
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: (t) => `radial-gradient(${alpha(t.palette.primary.main, 0.22)} 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent)',
          maskImage: 'linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent)'
        }}
      />
      <Box
        className="scan"
        aria-hidden="true"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '30%',
          background: (t) => `linear-gradient(180deg, transparent, ${alpha(t.palette.primary.main, 0.12)}, transparent)`
        }}
      />

      <Box sx={{ position: 'relative' }}>
        <Typography variant="overline" sx={{ color: 'primary.main' }}>
          Flujo de decisión
        </Typography>
        <Typography sx={{ mt: 1.5, fontSize: { md: '2rem', lg: '2.4rem' }, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: 460 }}>
          Cada transferencia termina en una de tres decisiones.
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 4, maxWidth: 480 }}>
          {DECISIONS.map((decision) => (
            <Box
              key={decision.name}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: (t) => `1px solid ${t.palette.divider}`,
                borderLeft: (t) => `4px solid ${t.palette[decision.tone].main}`
              }}
            >
              <Typography sx={{ fontWeight: 700, color: `${decision.tone}.main` }}>{decision.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{decision.text}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

/** Composición de autenticación: formulario a la izquierda y panel explicativo a la derecha. */
export function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <Box
        component="main"
        sx={{
          flex: { md: '0 0 48%' },
          width: { xs: '100%', md: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 6, md: 7 },
          py: { xs: 5, md: 6 },
          animation: 'authIn 0.5s ease-out both',
          '@keyframes authIn': { from: { opacity: 0 }, to: { opacity: 1 } },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400, mx: { md: 'auto' } }}>
          <Box sx={{ mb: 5 }}>
            <Brand compact />
          </Box>

          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {eyebrow}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ mt: 0.5, fontSize: { xs: '1.7rem', sm: '1.9rem' } }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
            {subtitle}
          </Typography>

          {children}
        </Box>
      </Box>

      <DecisionPanel />
    </Box>
  );
}
