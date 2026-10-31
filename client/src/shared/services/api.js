const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
let csrfToken = '';
let refreshPromise;

async function send(path, options = {}) {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...options.headers
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'No se pudo completar la solicitud.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function refresh() {
  if (!refreshPromise) {
    refreshPromise = send('/auth/refresh', { method: 'POST', body: '{}' })
      .then(result => {
        csrfToken = result.data.csrfToken || '';
        return result;
      })
      .finally(() => { refreshPromise = undefined; });
  }
  return refreshPromise;
}

async function request(path, options = {}, { background = false } = {}) {
  try {
    return await send(path, options);
  } catch (error) {
    if (error.status !== 401 || path.startsWith('/auth/') || background) throw error;
    try {
      await refresh();
      return await send(path, options);
    } catch (retryError) {
      if (retryError.status === 401) window.dispatchEvent(new Event('session-expired'));
      throw retryError;
    }
  }
}

export default {
  get: (path, options) => request(path, {}, options),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: path => request(path, { method: 'DELETE' }),
  refresh,
  setCsrf: value => { csrfToken = value; }
};
