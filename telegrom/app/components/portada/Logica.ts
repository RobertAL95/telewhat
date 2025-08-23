'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function usePortada() {
  const router = useRouter()

  const goRegistro = useCallback(() => {
    router.push('/registro')
  }, [router])

  const goChat = useCallback(() => {
    router.push('/chat')
  }, [router])

  return { goRegistro, goChat }
}
