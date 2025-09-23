import axios from 'axios';

interface FormData {
  name?: string;
  email: string;
  password: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está definida");
}

// Registro
export const registerUser = async (data: FormData) => {
  const response = await axios.post(`${API_URL}/auth/register`, data);
  return response.data;
};

// Login
export const loginUser = async (data: FormData) => {
  const response = await axios.post(`${API_URL}/auth/login`, data, {
    withCredentials: true, // por si usas cookies en algún momento
  });

  // El backend devuelve { token }, lo guardamos en localStorage
  const { token } = response.data;
  if (token) {
    localStorage.setItem('token', token);
  }

  return token;
};
