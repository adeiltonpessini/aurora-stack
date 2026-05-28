/** @type {import('next').NextConfig} */
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Headers de seguranca globais (mesmos do BarberAI). CSP fica no
// middleware (futuro). Por enquanto so basics.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig = {
  // Standalone: gera dist node-pronto em .next/standalone com server.js
  // + dependencias minimas. Mesmo padrao do BarberAI. Dockerfile copia
  // soh standalone + .next/static + public — imagem ~150MB.
  output: "standalone",
  outputFileTracingRoot: __dirname,

  // Sem telemetria do Next.
  poweredByHeader: false,

  // Headers fixos pra todas as paginas.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // setup.sh: nao cachear forte (queremos updates rapidos quando
      // o git mudar). max-age curto + must-revalidate.
      {
        source: "/setup.sh",
        headers: [
          { key: "Content-Type", value: "text/x-shellscript; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
    ]
  },

  // Otimizacao de imagens off no standalone simples (sem sharp em
  // runtime). Banner do mascote eh pequeno e ja otimizado.
  images: { unoptimized: true },
}

export default nextConfig
