// Traefik 3.0 — reverse proxy + Let's Encrypt automatico.
//
// Eh a primeira stack a subir no servidor: sem ela, nenhuma outra
// consegue fazer HTTPS via subdominio. Aurora recomenda como deploy #1
// depois do `aurora init`.
//
// Dashboard NAO eh exposto publicamente no v0.1 (precisaria de bcrypt
// pra basic auth, que adicionaria dep ou pre-compute). Quem quer ver
// dashboard usa SSH tunnel ate a porta 8080 interna.

import { defineStack } from "../../src/lib/stack-def.js"

export default defineStack({
  name: "traefik",
  displayName: "Traefik",
  category: "Infra & Reverse Proxy",
  description: "Reverse proxy v3.0 com Let's Encrypt automatico via TLS challenge.",
  version: "3.0",
  composeTemplate: "compose.tmpl",
  swarm: true,
  vars: [
    {
      name: "TRAEFIK_DOMAIN",
      prompt: "Dominio principal do servidor (so referencia, nao expoe Traefik):",
      type: "domain",
      placeholder: "seudominio.com",
    },
    {
      name: "TRAEFIK_LE_EMAIL",
      prompt: "Email pra Let's Encrypt (recebe avisos de expiracao):",
      type: "email",
      placeholder: "voce@seudominio.com",
    },
  ],
  primaryDomain: (v) => v.TRAEFIK_DOMAIN,
  teardown: ["docker stack rm traefik"],
})
