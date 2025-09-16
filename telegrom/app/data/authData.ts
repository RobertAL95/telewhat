// data/authData.ts
import axios from 'axios'

interface FormData {
  name: string
  email: string
  password: string
}

// Usamos el proxy que apunta a tu backend
const API_URL = '/api/proxy'

// Registro normal
export const registerUser = async (data: FormData) => {
  const res = await axios.post(`${API_URL}/auth/register`, data)
  return res.data
}

// Registro con redes sociales (simulación por ahora)
export const socialRegister = async (provider: 'google' | 'linkedin' | 'github') => {
  const res = await axios.post(`${API_URL}/auth/social-register`, { provider })
  return res.data
}
