import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { Menu as MenuIcon, Security as SecurityIcon } from '@mui/icons-material';
import ProfileMenu from './ProfileMenu.jsx';

export default function Header({ onMenuClick }) {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        width: { md: `calc(100% - 280px)` }, 
        ml: { md: '280px' },
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo animado y moderno */}
          <SecurityIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(90deg, #00E5FF 0%, #2979FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            MediShield DLP
          </Typography>
        </Box>

        <ProfileMenu /> 
      </Toolbar>
    </AppBar>
  );
}