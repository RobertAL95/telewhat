import axios from 'axios';

interface FormData {
  name: string;
  email: string;
  password: string;
}

// URL del backend expuesta al host
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const registerUser = async (data: FormData) => {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL no está definida");
  const response = await axios.post(`${API_URL}/auth/register`, data);
  return response.data;
};
