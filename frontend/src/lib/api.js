export const getTelegramWebApp = () => window.Telegram?.WebApp || null;

export const getTelegramInitData = () => {
  const tg = getTelegramWebApp();
  return (tg?.initData || '').trim();
};

export const isTelegramWebAppAvailable = () => {
  return Boolean(getTelegramWebApp() && getTelegramInitData());
};

export const getTelegramUnsafeUser = () => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
};

export async function apiFetch(url, options = {}) {
  const initData = getTelegramInitData();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (initData) {
    headers.set('X-TG-Init-Data', initData);
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });
  return response;
}

export async function apiFetchJson(url, options = {}) {
  const response = await apiFetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    const message = data?.detail || data?.error || 'Request failed';
    throw new Error(message);
  }
  return data;
}
