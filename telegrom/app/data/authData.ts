// app/data/authData.tsx
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL no está definida')

interface User {
  id: string
  name: string
  email: string
  token?: string
}

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  const res = await axios.post(`${API_URL}/auth/register`, data)
  return res.data
}

export const loginUser = async (data: { email: string; password: string }) => {
  const res = await axios.post(`${API_URL}/auth/login`, data, { withCredentials: true })
  const { token, user } = res.data
  if (token) localStorage.setItem('token', token)
  return user as User
}

// --- NUEVO ---
// Devuelve el usuario logueado usando el token en localStorage
export const getLoggedUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const res = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data as User
  } catch (err) {
    console.error('No se pudo obtener usuario logueado', err)
    return null
  }
}
