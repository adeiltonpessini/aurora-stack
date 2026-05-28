import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Aurora Stack trata dados pessoais e operacionais. LGPD-friendly por design.",
}

// Pagina de privacidade — espelhada do BarberAI com adaptacoes pro
// Aurora Stack (que coleta MUITO menos por ser ferramenta de servidor,
// nao SaaS multi-tenant).

export default function Privacidade() {
  return (
    <main className="min-h-screen">
      <header className="container-max py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/personagem.png" alt="" className="h-10 w-10" />
          <span className="text-xl font-semibold">Aurora <span className="text-aurora-lilac">Stack</span></span>
        </Link>
        <Link href="/" className="text-sm text-white/70 hover:text-white">← Voltar</Link>
      </header>

      <article className="container-max py-12 prose prose-invert max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade</h1>
        <p className="text-white/60 text-sm mt-2">Última atualização: 27 de maio de 2026</p>

        <section className="mt-10 space-y-4 text-white/80 leading-relaxed">
          <h2 className="text-2xl font-semibold text-white">1. Resumo executivo</h2>
          <p>
            <strong>Aurora Stack é uma CLI que roda no SEU servidor.</strong> Não somos um SaaS multi-tenant.
            O fluxo principal — instalar, configurar, deployar stacks — acontece 100% no seu hardware.
            Coletamos zero dados operacionais por default.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10">2. O que chega aos nossos servidores</h2>
          <h3 className="text-lg font-semibold mt-6">2.1 Bootstrap do setup.sh</h3>
          <p>
            Quando você roda <code>bash &lt;(curl -sSL setup.aurora-mcp.com)</code>, o request HTTP
            chega ao Cloudflare e ao nosso nginx. Coletamos automaticamente (logs padrão de servidor web):
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Endereço IP de origem (para mitigar abuso/DDoS)</li>
            <li>User-Agent (curl version, normalmente)</li>
            <li>Timestamp</li>
          </ul>
          <p>
            Retenção: 30 dias nos logs do Cloudflare (config padrão) e 7 dias nos logs do servidor.
            Não correlacionamos esses dados com nenhuma conta — não há conta no Aurora Stack v0.1.
          </p>

          <h3 className="text-lg font-semibold mt-6">2.2 IA conversacional (opcional, Plano C)</h3>
          <p>
            Se você habilitar a IA conversacional (<code>aurora ai &quot;...&quot;</code>), a frase em pt-BR
            mais um snapshot do <strong>catálogo de stacks instaladas</strong> (sem credenciais, sem
            dados de aplicação) é enviada para o endpoint <code>aurora-mcp.com/api/v1/ai/intent</code>.
          </p>
          <p>
            <strong>O que NÃO é enviado:</strong> conteúdo de bancos de dados, env vars, logs de
            container, IPs internos, nomes de domínio configurados nas suas stacks.
          </p>

          <h3 className="text-lg font-semibold mt-6">2.3 Telemetria (opt-in, padrão DESLIGADA)</h3>
          <p>
            Se você ativar com <code>aurora config set telemetry true</code>, enviamos:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Versão da CLI</li>
            <li>Versão do SO (ex: &quot;debian 13&quot;)</li>
            <li>Nome da stack deployada (ex: &quot;traefik&quot;, sem incluir domínios ou senhas)</li>
            <li>Sucesso ou falha do comando</li>
            <li>País (anonimizado a partir do IP)</li>
          </ul>
          <p>
            Pra desligar: <code>aurora config set telemetry false</code>. Pra apagar registros
            históricos: contato em <a href="mailto:privacidade@aurora-mcp.com" className="text-aurora-lilac underline">privacidade@aurora-mcp.com</a>.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10">3. Cookies e analytics no site</h2>
          <p>
            Este site (<code>stack.aurora-mcp.com</code>) usa:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Cloudflare Web Analytics</strong> — sem cookies, sem fingerprinting, sem PII. Conforme LGPD.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-10">4. Seus direitos (LGPD art. 18)</h2>
          <p>
            Como tratamos pouco dado pessoal, a maioria dos direitos LGPD se resolve rápido:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Acesso, correção, exclusão:</strong> escreva para <a href="mailto:privacidade@aurora-mcp.com" className="text-aurora-lilac underline">privacidade@aurora-mcp.com</a></li>
            <li><strong>Portabilidade:</strong> exportamos seus registros de telemetria em JSON, se houver</li>
            <li><strong>Revogação de consentimento:</strong> desligue a telemetria a qualquer momento via CLI</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-10">5. Encarregado (DPO)</h2>
          <p>
            Adeilton Pessini — <a href="mailto:privacidade@aurora-mcp.com" className="text-aurora-lilac underline">privacidade@aurora-mcp.com</a>
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10">6. Operadores e subprocessadores</h2>
          <p>
            Para hospedar este site e processar IA, usamos:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Cloudflare</strong> (CDN, DNS, Web Analytics) — EUA, com cláusulas LGPD</li>
            <li><strong>Anthropic</strong> (modelo de IA por trás do <code>aurora ai</code>) — EUA, não treina nos prompts da API</li>
            <li><strong>Servidor de origem</strong> hospedado no Brasil (Hetzner Falkenstein não, Contabo/Hostinger BR sim — depende da fase)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-10">7. Alterações</h2>
          <p>
            Atualizações desta política são publicadas aqui com data de revisão. Mudanças
            relevantes são anunciadas no README do GitHub e no CHANGELOG.
          </p>
        </section>

        <div className="mt-16 pt-8 border-t border-aurora-border text-sm text-white/60">
          <Link href="/" className="hover:text-white">← Voltar pra home</Link>
        </div>
      </article>
    </main>
  )
}
