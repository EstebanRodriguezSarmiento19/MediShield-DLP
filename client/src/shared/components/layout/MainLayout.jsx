import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      // Gradiente radial moderno inspirado en BTO Digital pero oscuro
      background: 'radial-gradient(circle at 50% 0%, #112240 0%, #0A192F 100%)',
    }}>
      <Header onMenuClick={handleDrawerToggle} />
      
      <Sidebar 
        mobileOpen={mobileOpen} 
        onClose={handleDrawerToggle} 
        isMobile={isMobile}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - 280px)` },
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar /> {/* Espaciador para el AppBar flotante */}
        
        {/* Contenedor con animación de entrada suave */}
        <Box sx={{ 
          animation: 'fadeInUp 0.6s ease-out',
          '@keyframes fadeInUp': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}