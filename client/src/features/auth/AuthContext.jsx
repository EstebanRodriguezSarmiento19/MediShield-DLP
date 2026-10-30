import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import {
  Navigate,
  Outlet
} from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import api from '../../shared/services/api.js';

const Context = createContext(null);

// Debe coincidir con IDLE_MINUTES del servidor (server/src/features/auth/auth.js).
const IDLE_MS = 3 * 60 * 1000;
// Renueva la actividad en el servidor como máximo una vez por minuto mientras el usuario navega.
const PING_MS = 60 * 1000;
const IDLE_MESSAGE = 'Tu sesión se cerró por inactividad (3 minutos). Inicia sesión de nuevo.';
const EXPIRED_MESSAGE = 'Tu sesión ha expirado. Inicia sesión de nuevo.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');

  useEffect(() => {
    let active = true;

    api.get('/auth/me')
      .then((r) => {
        if (!active) return;

        api.setCsrf(r.data.csrfToken || '');
        setUser(r.data.user);
        setError('');
      })
      .catch((e) => {
        if (!active) return;

        if (e.status !== 401 && e.response?.status !== 401) {
          setError(
            e.message || 'No fue posible comprobar la sesión.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const clearSession = () => {
      setUser(null);
      api.setCsrf('');
      setSessionNotice(EXPIRED_MESSAGE);
    };

    window.addEventListener('session-expired', clearSession);

    return () => {
      window.removeEventListener('session-expired', clearSession);
    };
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', {
      email,
      password
    });

    api.setCsrf(r.data.csrfToken || '');
    setUser(r.data.user);
    setError('');

    return r.data.user;
  };

  // En modo laboratorio (registro directo) la contraseña viaja en la misma solicitud.
  // En modo con confirmación por correo se omite y se elige desde el enlace recibido.
  const register = async (name, email, password) => {
    const body = password === undefined ? { name, email } : { name, email, password };
    const r = await api.post('/auth/register', body);

    return r.data.message;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      api.setCsrf('');
      setUser(null);
      setError('');
    }
  };

  // Permisos efectivos calculados por el servidor. Solo ocultan opciones: el servidor valida cada petición.
  const can = (...keys) => keys.some(key => user?.permissions?.includes(key));

  const updateUser = (patch) => {
    setUser((current) =>
      current ? { ...current, ...patch } : current
    );
  };

  const clearSessionNotice = () => setSessionNotice('');

  // Cierre por inactividad: solo mientras hay una sesión iniciada.
  // La última actividad se comparte entre pestañas (localStorage), porque la sesión del servidor es única:
  // si usas otra pestaña, esta no debe cerrar la sesión. Como mucho cada minuto se avisa al servidor
  // para que su marca de actividad siga al día mientras la interfaz está en uso.
  useEffect(() => {
    if (!user) return undefined;

    const KEY = 'medishield_last_activity';
    let timer;
    let lastActivity = Date.now();
    let lastWrite = 0;
    let lastPing = Date.now();

    const writeShared = (now) => {
      try { localStorage.setItem(KEY, String(now)); } catch { /* almacenamiento no disponible */ }
    };

    const readShared = () => {
      try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; }
    };

    const expire = () => {
      setSessionNotice(IDLE_MESSAGE);
      logout();
    };

    const check = () => {
      const last = Math.max(readShared(), lastActivity);
      const remaining = IDLE_MS - (Date.now() - last);
      if (remaining <= 0) expire();
      else timer = setTimeout(check, remaining);
    };

    const reset = () => {
      const now = Date.now();
      lastActivity = now;
      if (now - lastWrite > 1000) {
        lastWrite = now;
        writeShared(now);
      }
      if (now - lastPing > PING_MS) {
        lastPing = now;
        api.get('/auth/me').catch(() => {});
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach((name) => window.addEventListener(name, reset, { passive: true }));
    writeShared(lastActivity);
    timer = setTimeout(check, IDLE_MS);

    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, reset));
    };
  }, [user]);

  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        can,
        sessionNotice,
        clearSessionNotice
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider.'
    );
  }

  return context;
};

export function ProtectedRoute({ roles, manageUsers, permission }) {
  const { user, loading, error, can } = useAuth();

  if (loading) {
    return (
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress aria-label="Comprobando sesión" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Alert severity="error">
        Tu rol no tiene acceso a esta página.
      </Alert>
    );
  }

  if (manageUsers && !user.canManageUsers) {
    return (
      <Alert severity="error">
        No tienes permiso para gestionar cuentas.
      </Alert>
    );
  }

  if (permission && !can(permission)) {
    return (
      <Alert severity="error">
        No tienes permiso para ver esta sección.
      </Alert>
    );
  }

  return <Outlet />;
}