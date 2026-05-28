/** @type {import('next').NextConfig} */
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))

// CSP da landing. A pagina e estatica: sem scripts externos, sem
// analytics, sem fontes remotas, sem APIs. Logo, restringimos quase
// tudo a 'self'. Excecoes:
//  - script-src 'unsafe-inline': o Next App Router (sem middleware/nonce)
//    injeta o runtime de hidratacao inline. Sem nonce, e o unico jeito.
//    Risco baixo aqui porque nao ha entrada de usuario (zero superficie XSS).
//  - style-src 'unsafe-inline': Tailwind + estilos inline do Next.
//  - img-src data:: imagens otimizadas/SVG inline do Next.
//  - frame-ancestors 'none': reforca o X-Frame-Options (anti-clickjacking).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

// Headers de seguranca globais (mesmos do BarberAI) + CSP.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
