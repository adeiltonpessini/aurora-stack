import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://stack.aurora-mcp.com"),
  title: {
    default: "Aurora Stack — transforme qualquer Linux em infraestrutura inteligente",
    template: "%s — Aurora Stack",
  },
  description:
    "CLI brasileira de provisionamento Docker Swarm com 95 stacks pre-configuradas, IA conversacional opcional e foco em LGPD. Self-hosted, ELv2.",
  openGraph: {
    title: "Aurora Stack",
    description:
      "Um comando, qualquer Linux vira infraestrutura production-ready. 95 stacks, IA opcional, BR-first.",
    type: "website",
    locale: "pt_BR",
    url: "https://stack.aurora-mcp.com",
    siteName: "Aurora Stack",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
