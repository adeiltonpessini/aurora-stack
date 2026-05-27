// PostgreSQL 16 — banco de dados base usado por varias outras stacks
// (n8n, Chatwoot, Mautic, Directus, etc). Sem porta exposta na host;
// outras stacks acessam via aurora-net por nome de service.

import { defineStack } from "../../src/lib/stack-def.js"

export default defineStack({
  name: "postgres",
  displayName: "PostgreSQL",
  category: "Bancos & Management",
  description: "Postgres 16 com volume persistente e healthcheck pg_isready.",
  version: "16",
  composeTemplate: "compose.tmpl",
  swarm: true,
  vars: [
    {
      name: "POSTGRES_DB",
      prompt: "Nome do banco inicial:",
      type: "text",
      default: "appdb",
      validate: (v) => (/^[a-z][a-z0-9_]*$/i.test(v) ? undefined : "Use so letras, numeros e underscore (sem comecar por numero)."),
    },
    {
      name: "POSTGRES_USER",
      prompt: "Usuario do banco:",
      type: "text",
      default: "appuser",
      validate: (v) => (/^[a-z][a-z0-9_]*$/i.test(v) ? undefined : "Use so letras, numeros e underscore."),
    },
    {
      name: "POSTGRES_PASSWORD",
      prompt: "Senha (gerada automaticamente se vazia):",
      type: "secret-generated",
      generatedBytes: 24,
    },
  ],
  // Postgres nao tem domain web — fica acessivel so via aurora-net.
  teardown: ["docker stack rm postgres"],
})
