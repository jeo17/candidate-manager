import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
})

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED')
      return 'The server took too long to respond. Please try again.'
    if (error.response?.status === 404)
      return 'This candidate could not be found or has been deleted.'
    if (error.response && error.response.status >= 500)
      return 'The server is having trouble. Please try again shortly.'
    if (!error.response)
      return 'Unable to connect. Check that JSON Server is running and the API address is correct.'
  }
  return 'Something went wrong. Please try again.'
}
