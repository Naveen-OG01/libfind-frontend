export const API_URL = (
  process.env.REACT_APP_API_URL || 'https://libfind-api.onrender.com'
).replace(/\/+$/, '');

export async function apiRequest(path, options = {}, tokenKey = 'student_token') {
  const headers = new Headers(options.headers || {});
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = result && typeof result === 'object'
      ? result.detail || result.message
      : result;
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return result;
}

export async function downloadReport(name) {
  const response = await fetch(`${API_URL}/api/admin/reports/${name}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
    },
  });
  if (!response.ok) {
    let message = `Could not download report (${response.status}).`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // The response may be plain text for proxy/server errors.
    }
    throw new Error(message);
  }

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `libfind_${name}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
