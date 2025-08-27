'use client'

import dynamic from 'next/dynamic'

const Portada = dynamic(() => import('../app/components/portada/Render'), { ssr: false })

export default function HomePage() {
  return <Portada />
}
