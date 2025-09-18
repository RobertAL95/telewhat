"use client";

import React, { useState } from "react";
import { TextField, Button, Alert } from "@mui/material";
import { useAuth } from "./AuthContext";
import { registerUser } from "../../app/data/authData";

export default function RegisterForm() {
  const { setAuthState } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form[0] as HTMLInputElement).value,
      email: (form[1] as HTMLInputElement).value,
      password: (form[2] as HTMLInputElement).value,
    };

    try {
      const res = await registerUser(data);
      console.log("Respuesta backend:", res);
      setSuccess("Registro exitoso!");
      setAuthState({
        isAuthenticated: true,
        user: { name: data.name },
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField label="Nombre" fullWidth required />
      <TextField label="Correo" type="email" fullWidth required />
      <TextField label="Contraseña" type="password" fullWidth required />

      <Button type="submit" variant="contained" color="primary" disabled={loading}>
        {loading ? "Registrando..." : "Registrarse"}
      </Button>
    </form>
  );
}
