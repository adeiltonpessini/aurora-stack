import Link from "next/link"
import { CopyableCommand } from "@/components/CopyableCommand"
import { ScrollReveal } from "@/components/ScrollReveal"

const GITHUB = "https://github.com/adeiltonpessini/aurora-stack"
const INSTALL_CMD = "bash <(curl -sSL setup.aurora-mcp.com)"

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ===================== NAV ===================== */}
      <header className="sticky top-0 z-50 border-b border-aurora-border/60 bg-aurora-bg/70 backdrop-blur-md supports-[backdrop-filter]:bg-aurora-bg/55">
        <div className="container-max flex items-center justify-between py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icone-96.png"
              alt="Aurora mascote"
              className="h-9 w-9 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-lg font-semibold tracking-tight">
              Aurora <span className="text-aurora-lilac">Stack</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#diferenciais" className="transition-colors hover:text-white">Diferenciais</a>
            <a href="#stacks" className="transition-colors hover:text-white">Catálogo</a>
            <a href="#comparativo" className="transition-colors hover:text-white">Comparativo</a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-aurora-border bg-white/[0.03] px-3 py-1.5 transition-colors hover:border-aurora-violet/40 hover:text-white"
            >
              <GitHubMark className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative">
        {/* Fundo: malha de pontos + orbs ambientes em deriva lenta */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid" />
          <div className="absolute -left-24 top-10 size-[28rem] rounded-full bg-aurora-violet/20 blur-3xl animate-drift-slow motion-reduce:animate-none" />
          <div className="absolute -right-24 top-40 size-[24rem] rounded-full bg-aurora-cyan/15 blur-3xl animate-drift-slow [animation-delay:-6s] motion-reduce:animate-none" />
        </div>

        <div className="container-max grid items-center gap-10 py-16 md:grid-cols-2 md:gap-12 md:py-24">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-aurora-violet/30 bg-aurora-violet/10 px-3 py-1 text-sm text-aurora-lilac">
              <span className="size-2 animate-pulse rounded-full bg-aurora-violet motion-reduce:animate-none" />
              v0.1.0-alpha · em desenvolvimento ativo
            </p>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Um comando transforma{" "}
              <br className="hidden sm:block" />
              qualquer Linux em{" "}
              <span className="bg-aurora-flame bg-clip-text text-transparent text-flame-animated">
                infraestrutura inteligente
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-white/70">
              CLI brasileira de provisionamento <strong className="font-semibold text-white/90">Docker Swarm</strong> com
              95 stacks pré-configuradas, IA conversacional opcional e foco em LGPD. Self-hosted. Open source.
            </p>

            {/* Badges de prova */}
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="chip">🐳 Docker Swarm</span>
              <span className="chip">🛡️ LGPD by default</span>
              <span className="chip">📜 Elastic License v2</span>
              <span className="chip">🇧🇷 pt-BR nativo</span>
            </div>

            <div className="mt-8">
              <CopyableCommand command={INSTALL_CMD} />
              <p className="mt-3 text-xs text-white/50">
                Debian 12/13 ou Ubuntu 22.04/24.04 LTS · root · 3-5 min de setup completo
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#stacks" className="btn-primary">
                Ver catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="btn-secondary">
                <GitHubMark className="h-4 w-4" />
                Ver no GitHub
              </a>
            </div>
          </div>

          {/* Mascote flutuante — MANTIDO (o dono amou) */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute size-72 animate-glow-pulse rounded-full bg-aurora-violet/40 motion-reduce:animate-none md:size-96"
              aria-hidden="true"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/personagem.png"
              alt="Mascote Aurora — fantasma com chamas azuis e roxas"
              className="relative mx-auto w-full max-w-md animate-float drop-shadow-[0_0_60px_rgba(129,98,255,0.4)] motion-reduce:animate-none"
            />
          </div>
        </div>

        {/* Faixa de metricas */}
        <div className="container-max">
          <ScrollReveal className="grid grid-cols-2 gap-4 rounded-2xl border border-aurora-border bg-aurora-surface/60 p-6 backdrop-blur md:grid-cols-4">
            <Metric value="95" label="stacks first-party" />
            <Metric value="1" label="comando pra começar" />
            <Metric value="3-5 min" label="setup completo" />
            <Metric value="100%" label="self-hosted" />
          </ScrollReveal>
        </div>
      </section>

      {/* ===================== DIFERENCIAIS ===================== */}
      <section id="diferenciais" className="container-max py-20 md:py-28">
        <ScrollReveal className="max-w-2xl">
          <p className="eyebrow">Por que existe</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Não é só um script. É uma plataforma que{" "}
            <span className="bg-aurora-flame bg-clip-text text-transparent">pensa junto</span>.
          </h2>
          <p className="mt-3 text-white/70">
            Quatro decisões de arquitetura que separam a Aurora de um setup.sh comum.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {DIFERENCIAIS.map((d, i) => (
            <ScrollReveal key={d.title} delay={i * 80}>
              <article className="card-hover group h-full">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-aurora-violet/30 bg-aurora-violet/10 text-aurora-lilac transition-colors group-hover:border-aurora-violet/60">
                    {d.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{d.body}</p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===================== FEATURES (grade compacta) ===================== */}
      <section className="container-max pb-8">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 70}>
              <div className="card-hover h-full">
                <span className="text-2xl" aria-hidden="true">{f.emoji}</span>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{f.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===================== EM 3 COMANDOS ===================== */}
      <section className="container-max py-20 md:py-28">
        <ScrollReveal className="max-w-2xl">
          <p className="eyebrow">Do zero ao deploy</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Em 3 comandos</h2>
          <p className="mt-3 text-white/70">
            Você precisa de uma VPS Debian 12/13 ou Ubuntu 22.04/24.04 LTS com acesso root. O resto é com a Aurora.
          </p>
        </ScrollReveal>

        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          {/* Linha conectora sutil entre os passos (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-aurora-violet/30 to-transparent md:block"
          />
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 90}>
              <div className="card-hover relative h-full">
                <div className="flex size-12 items-center justify-center rounded-xl border border-aurora-violet/40 bg-aurora-bg text-lg font-bold text-aurora-lilac">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.body}</p>
                <pre className="code-block mt-4 text-aurora-cyan">
                  <span className="select-none text-white/40">$ </span>
                  {s.cmd}
                </pre>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===================== CATÁLOGO ===================== */}
      <section id="stacks" className="container-max py-20 md:py-28">
        <ScrollReveal className="max-w-2xl">
          <p className="eyebrow">Catálogo v0.1</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            3 stacks-piloto prontas. <span className="text-aurora-lilac">92 a caminho.</span>
          </h2>
          <p className="mt-3 text-white/70">
            As três fundações já funcionam de ponta a ponta. O resto entra em rolling release até o v0.1 final.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILOT_STACKS.map((s, i) => (
            <ScrollReveal key={s.name} delay={i * 80}>
              <div className="card-hover group relative h-full overflow-hidden">
                {/* brilho de borda no hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora-cyan/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <span className="font-mono text-xs text-white/50">{s.version}</span>
                </div>
                <p className="mt-1 inline-flex rounded-md bg-aurora-cyan/10 px-2 py-0.5 text-xs text-aurora-cyan">
                  {s.category}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Nuvem de categorias — mostra a amplitude das 95 */}
        <ScrollReveal className="mt-12">
          <div className="rounded-2xl border border-aurora-border bg-aurora-surface/50 p-6 md:p-8">
            <p className="text-sm text-white/60">
              <span className="font-semibold text-white/90">95 stacks no total</span>, organizadas por categoria:
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-aurora-lilac/80">
                    {cat.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cat.items.map((item) => (
                      <span key={item} className="chip">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/40">
              … e mais dezenas. Paridade total com SetupOrion + extras Aurora.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ===================== COMPARATIVO ===================== */}
      <section id="comparativo" className="container-max py-20 md:py-28">
        <ScrollReveal className="max-w-2xl">
          <p className="eyebrow">Comparativo honesto</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Por que Aurora?</h2>
          <p className="mt-3 text-white/70">
            Lado a lado com as alternativas do mesmo nicho — sem maquiagem.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-10 overflow-x-auto rounded-2xl border border-aurora-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-aurora-border text-white/60">
                <th className="px-5 py-4 font-medium">Aspecto</th>
                <th className="bg-aurora-violet/10 px-5 py-4 font-semibold text-aurora-lilac">
                  <span className="inline-flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icone-96.png" alt="" className="h-5 w-5" />
                    Aurora Stack
                  </span>
                </th>
                <th className="px-5 py-4 font-medium">SetupOrion</th>
                <th className="px-5 py-4 font-medium">Coolify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurora-border/50">
              {COMPARISON.map((row) => (
                <tr key={row.asp} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-4 font-medium">{row.asp}</td>
                  <td className="bg-aurora-violet/[0.06] px-5 py-4">
                    <Cell value={row.aur} highlight />
                  </td>
                  <td className="px-5 py-4 text-white/70">
                    <Cell value={row.orion} />
                  </td>
                  <td className="px-5 py-4 text-white/70">
                    <Cell value={row.coolify} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollReveal>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="container-max py-20 md:py-24">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border-gradient p-10 text-center md:p-16">
            {/* glow de fundo do CTA */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 -z-0 size-[30rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-aurora-violet/20 blur-3xl"
            />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Pronto pra{" "}
                <span className="bg-aurora-flame bg-clip-text text-transparent text-flame-animated">começar</span>?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/70">
                Um VPS limpo + esse comando + 5 minutos = infraestrutura production-ready.
              </p>
              <div className="mx-auto mt-8 max-w-xl">
                <CopyableCommand command={INSTALL_CMD} />
              </div>
              <p className="mt-4 text-xs text-white/40">
                Debian 12/13 ou Ubuntu 22.04/24.04 LTS · acesso root
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-aurora-border">
        <div className="container-max flex flex-col items-center justify-between gap-4 py-10 text-sm text-white/60 md:flex-row">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icone-96.png" alt="" className="h-6 w-6" />
            <span>Aurora Stack — Elastic License v2 · 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={GITHUB} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">GitHub</a>
            <Link href="/privacidade" className="transition-colors hover:text-white">Privacidade</Link>
            <a href="https://aurora-mcp.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">Aurora MCP</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ============================================================
   DADOS
   ============================================================ */

const DIFERENCIAIS = [
  {
    title: "IA conversacional opcional",
    icon: <SparklesIcon />,
    body: `aurora ai "sobe n8n com backup diário" — entende português, propõe um plano e espera você confirmar. Sem autonomia destrutiva, sempre opt-in.`,
  },
  {
    title: "Estado central idempotente",
    icon: <LayersIcon />,
    body: "Tudo vive em /etc/aurora/server.yml. Rodou aurora init duas vezes? Pula o que já existe, atualiza defaults. Pode rodar 100 vezes sem medo.",
  },
  {
    title: "Doctor inteligente",
    icon: <PulseIcon />,
    body: "Health check completo: Docker, Swarm, rede, portas 80/443, DNS, disco e drift do estado vs swarm. Detecta o problema antes dele te paginar.",
  },
  {
    title: "LGPD by default",
    icon: <ShieldIcon />,
    body: "Telemetria opt-in (desligada de fábrica). Nenhum dado do seu servidor sai sem permissão explícita. Política de privacidade clara.",
  },
] as const

const FEATURES = [
  {
    emoji: "🐳",
    title: "Docker Swarm desde o início",
    body: "Single-node manager por default, escalável depois sem refazer setup. A mesma arquitetura de produtos sérios em produção.",
  },
  {
    emoji: "📦",
    title: "95 stacks first-party",
    body: "Traefik, Portainer, n8n, Chatwoot, Postgres, Mongo, Ollama, Qdrant, Evolution API… paridade com SetupOrion + extras Aurora.",
  },
  {
    emoji: "🇧🇷",
    title: "Brasileira de verdade",
    body: "pt-BR nativo na CLI, nos wizards e nas mensagens. Documentação e suporte pensados pra quem opera VPS no Brasil.",
  },
] as const

const STEPS = [
  {
    n: 1,
    title: "Instalar",
    body: "Bootstrap automático: Docker, Swarm, Node.js, AuroraNet, estrutura /opt/aurora e a CLI global.",
    cmd: "bash <(curl -sSL setup.aurora-mcp.com)",
  },
  {
    n: 2,
    title: "Configurar",
    body: "Wizard interativo: nome do servidor, e-mail do admin, timezone e rede Docker. Tudo persiste em /etc/aurora/server.yml.",
    cmd: "aurora init",
  },
  {
    n: 3,
    title: "Deploy",
    body: "O wizard pergunta as vars de cada stack (domínio, e-mail Let's Encrypt, senha) e sobe via Swarm. Re-deploys preservam volumes.",
    cmd: "aurora deploy traefik",
  },
] as const

const PILOT_STACKS = [
  {
    name: "Traefik",
    version: "v3.0",
    category: "Reverse Proxy",
    body: "HTTPS automático via Let's Encrypt (TLS challenge). Roteia os subdomínios das outras stacks. A primeira a subir.",
  },
  {
    name: "Portainer CE",
    version: "v2.21",
    category: "Painel",
    body: "UI web pra gerenciar Docker/Swarm. Cria o admin no primeiro acesso. Depende do Traefik.",
  },
  {
    name: "PostgreSQL",
    version: "v16",
    category: "Banco",
    body: "Postgres 16 com volume persistente, healthcheck pg_isready e sem porta exposta. Base de n8n, Chatwoot e cia.",
  },
] as const

const CATEGORIES = [
  { name: "Proxy & Rede", items: ["Traefik", "Nginx", "Cloudflared"] },
  { name: "Painéis", items: ["Portainer", "Grafana", "Uptime Kuma"] },
  { name: "Bancos", items: ["PostgreSQL", "MongoDB", "Redis", "MinIO"] },
  { name: "Automação", items: ["n8n", "Typebot", "Cal.com", "Mautic"] },
  { name: "IA & Vetores", items: ["Ollama", "Qdrant", "Langfuse"] },
  { name: "Comunicação", items: ["Chatwoot", "Evolution API"] },
] as const

const COMPARISON = [
  { asp: "IA conversacional", aur: "✓ Opt-in (Plano C)", orion: "—", coolify: "—" },
  { asp: "Estado central (idempotente)", aur: "✓ /etc/aurora/server.yml", orion: "—", coolify: "✓ DB" },
  { asp: "LGPD / idioma BR", aur: "✓ Native pt-BR", orion: "✓ pt-BR", coolify: "EN apenas" },
  { asp: "Docker Swarm", aur: "✓ Default", orion: "✓ Default", coolify: "Compose" },
  { asp: "UI web", aur: "v0.2 (CLI primeiro)", orion: "—", coolify: "✓" },
  { asp: "Open source", aur: "ELv2", orion: "MIT", coolify: "Apache 2.0" },
] as const

/* ============================================================
   COMPONENTES AUXILIARES
   ============================================================ */

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center md:text-left">
      <p className="bg-aurora-flame bg-clip-text text-2xl font-bold text-transparent md:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
  )
}

// Renderiza uma celula da tabela: se comeca com "✓", pinta o check de
// verde-lilas e mantem o resto do texto legivel.
function Cell({ value, highlight = false }: { value: string; highlight?: boolean }) {
  const isCheck = value.startsWith("✓")
  if (isCheck) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${highlight ? "text-aurora-lilac" : ""}`}>
        <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>{value.slice(1).trim()}</span>
      </span>
    )
  }
  if (value === "—") {
    return <span className="text-white/30">—</span>
  }
  return <span className={highlight ? "font-medium text-aurora-lilac" : ""}>{value}</span>
}

/* ============================================================
   ÍCONES (SVG inline — sem libs)
   ============================================================ */

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.8 4.6L18.4 9.4 13.8 11.2 12 15.8 10.2 11.2 5.6 9.4 10.2 7.6 12 3z" />
      <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
