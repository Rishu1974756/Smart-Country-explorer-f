export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('Unable to connect. Please check your internet connection.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    )
  }

  return data
}
