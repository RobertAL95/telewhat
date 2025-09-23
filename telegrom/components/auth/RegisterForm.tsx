"use client";

import React, { useState } from "react";
import { TextField, Button, Alert, Link, Box } from "@mui/material";
import { useAuth } from "./AuthContext";
import { registerUser } from "../../app/data/authData";

export default function RegisterForm() {
  const { setAuthState, setIsRegister } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await registerUser(formData);
      console.log("Respuesta backend:", res);
      setSuccess("Registro exitoso!");

      // Guardar usuario en contexto
      setAuthState({
        isAuthenticated: true,
        user: { name: formData.name, email: formData.email },
      });

      // Vuelve al login
      setIsRegister(false);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "Error al registrar"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      display="flex"
      flexDirection="column"
      gap={2}
    >
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleChange}
        fullWidth
        required
      />
      <TextField
        label="Correo"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        required
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        fullWidth
        required
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
      >
        {loading ? "Registrando..." : "Registrarse"}
      </Button>

      <Link
        component="button"
        variant="body2"
        onClick={() => setIsRegister(false)}
      >
        ¿Ya tienes cuenta? Inicia sesión aquí
      </Link>
    </Box>
  );
}
