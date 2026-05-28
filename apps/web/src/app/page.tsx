import Link from "next/link"
import { CopyableCommand } from "@/components/CopyableCommand"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="container-max flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/personagem.png" alt="Aurora mascote" className="h-10 w-10" />
          <span className="text-xl font-semibold tracking-tight">
            Aurora <span className="text-aurora-lilac">Stack</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <a href="#stacks" className="hover:text-white">Catálogo</a>
          <a href="#comparativo" className="hover:text-white">Comparativo</a>
          <a href="https://github.com/adeiltonpessini/aurora-stack" target="_blank" rel="noreferrer" className="hover:text-white">
            GitHub →
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="container-max py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-aurora-violet/10 border border-aurora-violet/30 text-aurora-lilac mb-6">
            <span className="size-2 rounded-full bg-aurora-violet animate-pulse" />
            v0.1.0-alpha · em desenvolvimento ativo
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Transforme qualquer Linux em{" "}
            <span className="bg-aurora-flame bg-clip-text text-transparent">
              infraestrutura inteligente
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-xl">
            CLI brasileira de provisionamento Docker Swarm com 95 stacks pré-configuradas,
            IA conversacional opcional e foco em LGPD. Self-hosted. Open source.
          </p>

          <div className="mt-8">
            <CopyableCommand command="bash <(curl -sSL setup.aurora-mcp.com)" />
            <p className="mt-3 text-xs text-white/50">
              Debian 12 ou 13 · root · 3-5 min de setup completo
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#stacks" className="btn-primary">
              Ver catálogo
            </Link>
            <a
              href="https://github.com/adeiltonpessini/aurora-stack"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          {/* Halo pulsante atras do mascote — reforca o "flutuar no ar" */}
          <div
            className="absolute size-72 md:size-96 rounded-full bg-aurora-violet/40 animate-glow-pulse"
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/personagem.png"
            alt="Mascote Aurora — fantasma com chamas azuis e roxas"
            className="relative w-full max-w-md mx-auto animate-float
              motion-reduce:animate-none drop-shadow-[0_0_60px_rgba(129,98,255,0.4)]"
          />
        </div>
      </section>

      {/* Features */}
      <section className="container-max py-16 grid md:grid-cols-3 gap-6">
        <Feature
          title="Docker Swarm desde o início"
          body="Single-node manager por default, escalável depois sem refazer setup. Mesma arquitetura usada por produtos sérios em produção."
        />
        <Feature
          title="95 stacks first-party"
          body="Traefik, Portainer, n8n, Chatwoot, Postgres, Mongo, Ollama, Qdrant, Evolution API... paridade total com SetupOrion + extras Aurora."
        />
        <Feature
          title="IA conversacional opcional"
          body={`aurora ai "sobe n8n com backup diário" — entende portugues, propoe plano, espera você confirmar. Sem autonomia destrutiva.`}
        />
        <Feature
          title="LGPD by default"
          body="Telemetria opt-in (desligada). Nenhum dado do servidor sai sem permissão. Política de privacidade explícita."
        />
        <Feature
          title="Idempotente"
          body="Rodou `aurora init` duas vezes? Sem problema — pula etapas já feitas, atualiza defaults com valores atuais. Pode rodar 100 vezes."
        />
        <Feature
          title="Doctor inteligente"
          body="Health check completo: Docker, Swarm, rede, portas 80/443, DNS, espaço em disco, drift state vs swarm. Detecta problemas antes deles te paginar."
        />
      </section>

      {/* Install detail */}
      <section className="container-max py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Em 3 comandos</h2>
        <p className="mt-3 text-white/70 max-w-xl">
          Você precisa de uma VPS Debian 12 ou 13 com acesso root. O resto é com a Aurora.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Step
            n={1}
            title="Instalar"
            body="Bootstrap automático: Docker, Swarm, Node.js, AuroraNet, estrutura /opt/aurora, CLI global."
            cmd="bash <(curl -sSL setup.aurora-mcp.com)"
          />
          <Step
            n={2}
            title="Configurar"
            body="Wizard interativo: nome do servidor, email do admin, timezone, nome da rede Docker. Tudo persiste em /etc/aurora/server.yml."
            cmd="aurora init"
          />
          <Step
            n={3}
            title="Deploy"
            body="Wizard pergunta as vars de cada stack (domínio, email Let's Encrypt, senha) e sobe via Docker Swarm. Re-deploys preservam volumes."
            cmd="aurora deploy traefik"
          />
        </div>
      </section>

      {/* Stacks catalog */}
      <section id="stacks" className="container-max py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Catálogo v0.1</h2>
        <p className="mt-3 text-white/70 max-w-xl">
          3 stacks-piloto já funcionais. Mais 92 em rolling release até o v0.1 final.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Stack
            name="Traefik"
            version="v3.0"
            category="Reverse Proxy"
            body="HTTPS automático via Let's Encrypt (TLS challenge). Roteia subdomínios das outras stacks. Primeira stack a subir."
          />
          <Stack
            name="Portainer CE"
            version="v2.21"
            category="Painel"
            body="UI web pra gerenciar Docker/Swarm. Cria admin no primeiro acesso. Depende do Traefik."
          />
          <Stack
            name="PostgreSQL"
            version="v16"
            category="Banco"
            body="Postgres 16 com volume persistente, healthcheck pg_isready, sem porta exposta. Usado por n8n, Chatwoot, etc."
          />
        </div>

        <div className="mt-8 p-4 rounded-xl bg-aurora-violet/5 border border-aurora-violet/20">
          <p className="text-sm text-white/80">
            <strong>Próximos batches:</strong> n8n, Chatwoot, Evolution API, MinIO, Typebot,
            Mautic, Cal.com, Ollama, Qdrant, Langfuse... <span className="text-aurora-lilac">95 no total</span> até final do v0.1.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparativo" className="container-max py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Por que Aurora?</h2>
        <p className="mt-3 text-white/70 max-w-xl">
          Comparativo honesto vs alternativas do mesmo nicho.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-aurora-border">
              <tr className="text-white/60">
                <th className="py-3 font-medium">Aspecto</th>
                <th className="py-3 font-medium text-aurora-lilac">Aurora Stack</th>
                <th className="py-3 font-medium">SetupOrion</th>
                <th className="py-3 font-medium">Coolify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurora-border/50">
              <Row asp="IA conversacional" aur="✓ Opt-in (Plano C)" orion="—" coolify="—" />
              <Row asp="Estado central (idempotente)" aur="✓ /etc/aurora/server.yml" orion="—" coolify="✓ DB" />
              <Row asp="LGPD/idioma BR" aur="✓ Native pt-BR" orion="✓ pt-BR" coolify="EN apenas" />
              <Row asp="Docker Swarm" aur="✓ Default" orion="✓ Default" coolify="Compose" />
              <Row asp="UI web" aur="v0.2 (CLI primeiro)" orion="—" coolify="✓" />
              <Row asp="Open source" aur="ELv2" orion="MIT" coolify="Apache 2.0" />
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="container-max py-20">
        <div className="card text-center bg-gradient-to-br from-aurora-violet/10 to-aurora-cyan/5 border-aurora-violet/30">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pronto pra começar?
          </h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">
            Um VPS Debian limpo + esse comando + 5 minutos = infraestrutura production-ready.
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <CopyableCommand command="bash <(curl -sSL setup.aurora-mcp.com)" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-aurora-border mt-16">
        <div className="container-max py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/personagem.png" alt="" className="h-6 w-6" />
            <span>Aurora Stack — Elastic License v2 · 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/adeiltonpessini/aurora-stack" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <a href="https://aurora-mcp.com" target="_blank" rel="noreferrer" className="hover:text-white">Aurora MCP</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-white/70 text-sm leading-relaxed">{body}</p>
    </div>
  )
}

function Step({ n, title, body, cmd }: { n: number; title: string; body: string; cmd: string }) {
  return (
    <div className="card">
      <div className="size-10 rounded-xl bg-aurora-violet/20 border border-aurora-violet/40 flex items-center justify-center text-aurora-lilac font-bold">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-white/70 text-sm leading-relaxed">{body}</p>
      <pre className="code-block mt-4 text-aurora-cyan">{cmd}</pre>
    </div>
  )
}

function Stack({ name, version, category, body }: { name: string; version: string; category: string; body: string }) {
  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-xs text-white/50 font-mono">{version}</span>
      </div>
      <p className="text-xs text-aurora-cyan/80 mt-1">{category}</p>
      <p className="mt-3 text-white/70 text-sm leading-relaxed">{body}</p>
    </div>
  )
}

function Row({ asp, aur, orion, coolify }: { asp: string; aur: string; orion: string; coolify: string }) {
  return (
    <tr>
      <td className="py-3 font-medium">{asp}</td>
      <td className="py-3 text-aurora-lilac">{aur}</td>
      <td className="py-3 text-white/70">{orion}</td>
      <td className="py-3 text-white/70">{coolify}</td>
    </tr>
  )
}
