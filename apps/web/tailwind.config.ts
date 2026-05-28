import type { Config } from "tailwindcss"

// Paleta Aurora — teal/navy/roxo, em sintonia com o personagem do
// mascote (chamas azuis + capa roxa).
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        aurora: {
          // Roxo principal do mascote
          violet: "#8162FF",
          // Azul ciano das chamas
          cyan: "#5AC8FF",
          // Lilás brilhante (texto AURORA do banner)
          lilac: "#C9A6FF",
          // Background escuro (modo padrão)
          bg: "#0B0A14",
          // Cards/superfícies elevadas
          surface: "#15131F",
          // Bordas sutis
          border: "#2A2440",
        },
      },
      fontFamily: {
        // Stack font segura: tema "tech moderno" + fallback nativo
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        // Gradient assinatura Aurora (chamas do mascote)
        "aurora-flame": "linear-gradient(135deg, #5AC8FF 0%, #8162FF 50%, #C9A6FF 100%)",
      },
      keyframes: {
        // Flutuacao: sobe/desce suave + leve rotacao = sensacao de voo.
        // Os dois eixos com timings ligeiramente diferentes evitam que
        // o movimento pareca mecanico (loop obvio).
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-18px) rotate(1.5deg)" },
        },
        // Halo pulsando junto — reforca o "flutuar no ar".
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55", filter: "blur(40px)" },
          "50%": { opacity: "0.85", filter: "blur(52px)" },
        },
        // Orbs ambientes do fundo: deriva lenta e organica (parallax fake).
        "drift-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -24px) scale(1.06)" },
          "66%": { transform: "translate(-24px, 18px) scale(0.96)" },
        },
        // Gradiente "respirando" — pan horizontal no aurora-flame.
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        // Brilho que cruza superficies (botoes/badges/comando) no hover.
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        // Reveal padrao usado pelo ScrollReveal (quando JS marca .is-visible).
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Cursor do terminal piscando.
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 5s ease-in-out infinite",
        "drift-slow": "drift-slow 18s ease-in-out infinite",
        "gradient-pan": "gradient-pan 8s ease-in-out infinite",
        shimmer: "shimmer 1.1s ease-in-out",
        "fade-in-up": "fade-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        blink: "blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
}

export default config
