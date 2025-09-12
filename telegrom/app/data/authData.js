import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/auth"; 
// 👆 cambia al dominio de tu backend

// 🔹 Registro tradicional
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true, // útil si usas cookies/sesiones
    });
    return response.data;
  } catch (error) {
    console.error("Error en registerUser:", error);
    throw error.response?.data || error.message;
  }
};

// 🔹 Registro/Login social
export const socialRegister = async (provider) => {
  try {
    // redirección al backend según el proveedor
    window.location.href = `${API_URL}/auth/${provider}`;
  } catch (error) {
    console.error("Error en socialRegister:", error);
    throw error;
  }
};
