async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const error = new Error('Can’t reach the Bug Hunt server. From the project folder, run npm run dev.');
    error.status = 0;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong.');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function itemQuery(filters) {
  const params = new URLSearchParams();
  params.set('q', filters.q || '');
  params.set('category', filters.category || 'All');
  params.set('status', filters.status || 'all');
  params.set('sort', filters.sort || 'newest');
  return params.toString();
}

export const api = {
  spec: () => request('/api/spec'),
  createSession: (playerName) => request('/api/sessions', { method: 'POST', body: { playerName } }),
  session: (id) => request(`/api/sessions/${id}`),
  items: (id, filters) => request(`/api/sessions/${id}/items?${itemQuery(filters)}`),
  addItem: (id, body) => request(`/api/sessions/${id}/items`, { method: 'POST', body }),
  updateItem: (id, itemId, body) =>
    request(`/api/sessions/${id}/items/${itemId}`, { method: 'PATCH', body }),
  stepItem: (id, itemId, direction) =>
    request(`/api/sessions/${id}/items/${itemId}/step`, { method: 'POST', body: { direction } }),
  deleteItem: (id, itemId) => request(`/api/sessions/${id}/items/${itemId}`, { method: 'DELETE' }),
  clearCompleted: (id) => request(`/api/sessions/${id}/clear-completed`, { method: 'POST', body: {} }),
  toggleAll: (id) => request(`/api/sessions/${id}/toggle-all`, { method: 'POST', body: {} }),
  resetList: (id) => request(`/api/sessions/${id}/reset-list`, { method: 'POST', body: {} }),
  fileReport: (id, body) => request(`/api/sessions/${id}/reports`, { method: 'POST', body }),
  debrief: (id) => request(`/api/sessions/${id}/debrief`),
  reveal: (id) => request(`/api/sessions/${id}/reveal`, { method: 'POST', body: {} }),
};
