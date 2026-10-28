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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const updateUser = (patch) => {
    setUser((current) =>
      current ? { ...current, ...patch } : current
    );
  };

  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser
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

export function ProtectedRoute({ roles, manageUsers }) {
  const { user, loading, error } = useAuth();

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

  return <Outlet />;
}