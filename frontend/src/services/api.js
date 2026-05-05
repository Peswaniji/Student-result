import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const fileBaseUrl = baseURL.replace(/\/api$/, '')

export function getAuthToken() {
  return window.localStorage.getItem('srms_token')
}

export function setAuthToken(token) {
  window.localStorage.setItem('srms_token', token)
}

export function clearAuthToken() {
  window.localStorage.removeItem('srms_token')
}

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong'
}

// export function getErrorMessage(error) {
//   return error?.response?.data?.message || error?.message || 'Something went wrong'
// }