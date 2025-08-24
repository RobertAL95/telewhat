'use client'
import { useRegistro } from './Logica'
import { RegistroUI } from './UI'

export default function Registro() {
  const logic = useRegistro()
  return <RegistroUI {...logic} />
}
