'use client'
import { usePortada } from './Logica'
import { PortadaUI } from './UI'

export default function Portada() {
  const { goRegistro, goChat } = usePortada()

  return <PortadaUI onRegistro={goRegistro} onChat={goChat} />
}
