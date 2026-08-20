async function requestCalculations(path, options = {}) {
  const response = await fetch(`/api/calculations${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || 'Request failed.');
    error.code = body.code || 'request_failed';
    throw error;
  }

  return body;
}

export function listSavedCalculations(type) {
  const params = type ? `?type=${encodeURIComponent(type)}` : '';
  return requestCalculations(`/${params}`);
}

export function getSavedCalculation(id) {
  return requestCalculations(`/${encodeURIComponent(id)}`);
}

export function createSavedCalculation({ type, name, inputState, resultSnapshot }) {
  return requestCalculations('/', {
    method: 'POST',
    body: JSON.stringify({ type, name, inputState, resultSnapshot })
  });
}

export function updateSavedCalculation(id, { name, inputState, resultSnapshot }) {
  return requestCalculations(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ name, inputState, resultSnapshot })
  });
}

export function deleteSavedCalculation(id) {
  return requestCalculations(`/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}
