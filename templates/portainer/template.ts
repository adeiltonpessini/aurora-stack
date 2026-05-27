// Portainer CE em modo Swarm — UI pra gerenciar containers, services,
// stacks. Depois do Traefik, geralmente eh a #2 stack a subir.
//
// Setup: depende de Traefik (precisa do aurora-net + Let's Encrypt).
// Portainer cria o admin user no primeiro acesso via web; nao temos
// como pre-criar via env vars no v0.1 (Portainer nao suporta isso por
// default). A var PORTAINER_ADMIN_PASSWORD eh placeholder informativo
// — usuario seta na primeira tela web.

import { defineStack } from "../../src/lib/stack-def.js"

export default defineStack({
  name: "portainer",
  displayName: "Portainer CE",
  category: "Infra & Reverse Proxy",
  description: "Painel web Docker/Swarm. Cria admin no primeiro acesso.",
  version: "2.21",
  composeTemplate: "compose.tmpl",
  swarm: true,
  vars: [
    {
      name: "PORTAINER_DOMAIN",
      prompt: "Dominio do Portainer (ex: portainer.exemplo.com):",
      type: "domain",
      placeholder: "portainer.seudominio.com",
    },
  ],
  primaryDomain: (v) => v.PORTAINER_DOMAIN,
  teardown: ["docker stack rm portainer"],
})
