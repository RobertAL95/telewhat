"use client";

import React, { useState } from "react";
import { TextField, Button, Alert } from "@mui/material";
import { useAuth } from "./AuthContext";

export default function RegisterForm() {
  const { setAuthState } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("Registro exitoso!");

    // Simulación de usuario autenticado
    setAuthState({
      isAuthenticated: true,
      user: { name: "Nuevo Usuario" },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField label="Nombre" fullWidth required />
      <TextField label="Correo" type="email" fullWidth required />
      <TextField label="Contraseña" type="password" fullWidth required />

      <Button type="submit" variant="contained" color="primary">
        Registrarse
      </Button>
    </form>
  );
}
