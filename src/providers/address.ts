export function normalizeAddress(address: string) {
  const url = new URL(address.trim());
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
    throw new Error('Use HTTPS, or HTTP on localhost for development');
  if (url.username || url.password || url.search || url.hash)
    throw new Error('The address cannot contain credentials, a query, or a fragment');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url.href;
}

export function permissionPattern(address: string) {
  const url = new URL(normalizeAddress(address));
  return `${url.protocol}//${url.hostname}/*`;
}

export function isProviderIconPath(path: string) {
  if (path.length > 1024 || /[\\:#?\s]/.test(path)) return false;
  try {
    return path.split('/').every((segment) => {
      const decoded = decodeURIComponent(segment);
      return decoded !== '' && decoded !== '..' && !/[\\/%]/.test(decoded);
    });
  } catch {
    return false;
  }
}
