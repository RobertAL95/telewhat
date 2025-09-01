'use client'

import { PortadaUI } from './UI'
import { usePortada } from './Logica'

export default function Portada() {
  const { goRegistro, goChat } = usePortada()
  return <PortadaUI onRegistro={goRegistro} onChat={goChat} />
}
