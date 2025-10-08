"use client";

import AuthLayout from "./AuthLayout";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useAuth } from '../../context/AuthContext';


export default function AuthComponent() {
  const { authMode } = useAuth();

  return (
    <AuthLayout>
      {authMode === "login" ? <LoginForm /> : <RegisterForm />}
    </AuthLayout>
  );
}
