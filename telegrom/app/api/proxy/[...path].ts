// pages/api/proxy/[...path].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createProxyMiddleware } from 'http-proxy-middleware'

// Configuración del proxy
const proxy = createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:4000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '', // quita /api/proxy de la URL antes de enviarla al backend
  },
})

export const config = {
  api: {
    bodyParser: false, // dejamos que el backend maneje el body
  },
}

// Handler que usa el middleware
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Proxy target:", process.env.BACKEND_URL)
  console.log("Incoming path:", req.url)
  console.log("HTTP method:", req.method)
  
  return new Promise<void>((resolve, reject) => {
    proxy(req, res, (result: any) => {
      if (result instanceof Error) {
        console.error("Proxy error:", result)
        reject(result)
      } else {
        resolve()
      }
    })
  })
}
