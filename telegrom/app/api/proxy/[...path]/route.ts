// app/api/proxy/[...path]/route.ts
import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

// Este log confirma que la ruta del proxy se cargó
console.log('[PROXY ROUTE LOADED]')

async function handleRequest(req: NextRequest, context: { params: { path: string[] } }) {
  const { params } = context
  const targetUrl = `${BACKEND_URL}/${params.path.join('/')}`

  console.log('[PROXY] Method:', req.method, 'Target:', targetUrl)

  // Copiamos headers y eliminamos host para evitar conflictos
  const headers: Record<string, string> = Object.fromEntries(req.headers)
  delete headers['host']

  // Para métodos que envían body, usamos ArrayBuffer para soportar JSON o FormData
  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buffer = await req.arrayBuffer()
    body = buffer
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    })

    // Reenviamos headers y status al frontend
    const resHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      resHeaders[key] = value
    })

    const resBody = await response.arrayBuffer()
    return new Response(resBody, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (err) {
    console.error('[PROXY ERROR]', err)
    return new Response(JSON.stringify({ error: 'Proxy failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Exportamos cada método explícitamente
export async function GET(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context)
}

export async function POST(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context)
}

export async function PUT(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context)
}

export async function DELETE(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context)
}
