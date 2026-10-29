import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: dark
          ? 'radial-gradient(1100px 560px at 88% -12%, rgba(0, 229, 255, 0.08), transparent 60%), radial-gradient(900px 480px at -8% 112%, rgba(167, 139, 250, 0.06), transparent 55%)'
          : 'none'
      }}
    >
      <Header onMenuClick={() => setMobileOpen((open) => !open)} />

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} isMobile={isMobile} />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>
        <Toolbar sx={{ minHeight: 64 }} />
        <Box
          sx={{
            animation: 'pageIn 0.5s ease-out',
            '@keyframes pageIn': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'none' }
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
