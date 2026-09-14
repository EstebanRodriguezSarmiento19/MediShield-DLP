import { useEffect, useState } from 'react';
import api from '../services/api.js';

/**
 * Hook que consulta GET /api/health y expone el estado de conexión.
 *
 * status: 'checking' | 'connected' | 'error'
 */
function useHealthCheck() {
  const [status, setStatus] = useState('checking');
  const [databaseStatus, setDatabaseStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;

    api
      .get('/health')
      .then((response) => {
        if (!isMounted) return;
        setStatus('connected');
        setDatabaseStatus(response.data.database);
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { status, databaseStatus };
}

export default useHealthCheck;
