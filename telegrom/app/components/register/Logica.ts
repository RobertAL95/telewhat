'use client'
import { useState } from 'react'

export function useRegistro() {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = () => {
    console.log('Usuario:', user, 'Password:', password)
    alert('Registro enviado')
  }

  const loginGoogle = () => {
    alert('Login con Google')
  }

  const loginGithub = () => {
    alert('Login con GitHub')
  }

  return {
    user, setUser,
    password, setPassword,
    onSubmit,
    loginGoogle,
    loginGithub
  }
}
