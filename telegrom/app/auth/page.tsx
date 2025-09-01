'use client'
import AuthCard from '@/app/components/auth/AuthCard'
import { AuthCardProvider } from '../context/AuthCardContext'

export default function RegistroPage() {
  return (
    <AuthCardProvider>
      <AuthCard />
    </AuthCardProvider>
  )
}
