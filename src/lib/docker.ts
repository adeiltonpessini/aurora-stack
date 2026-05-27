// Wrappers sobre os comandos `docker` que o Aurora Stack precisa.
// Filosofia: cada função tem 1 responsabilidade, retorna boolean ou
// resultado simples. Erros do exec sobem (não engolimos) — quem chama
// decide.

import { exec } from "./exec.js"

export async function dockerInstalled(): Promise<boolean> {
  try {
    const r = await exec("docker", ["--version"], { timeoutMs: 5_000 })
    return r.code === 0
  } catch {
    return false
  }
}

export async function dockerSwarmActive(): Promise<boolean> {
  const r = await exec("docker", ["info", "--format", "{{.Swarm.LocalNodeState}}"], {
    timeoutMs: 10_000,
  })
  // Output simples: "active" / "inactive" / "pending" / "error"
  // Fallback: alguns docker mais antigos não suportam o --format. Procura "Swarm: active".
  if (r.code === 0) {
    const out = r.stdout.trim().toLowerCase()
    if (out === "active") return true
    if (out === "inactive" || out === "pending" || out === "error") return false
  }
  // Fallback: parse do `docker info` cru.
  const r2 = await exec("docker", ["info"], { timeoutMs: 10_000 })
  return /^\s*Swarm:\s*active\s*$/im.test(r2.stdout)
}

export async function swarmInit(): Promise<void> {
  const r = await exec("docker", ["swarm", "init"], { timeoutMs: 30_000 })
  if (r.code !== 0) {
    throw new Error(`docker swarm init falhou (code ${r.code}): ${r.stderr.trim()}`)
  }
}

export async function networkExists(name: string): Promise<boolean> {
  const r = await exec("docker", ["network", "ls", "--format", "{{.Name}}"], {
    timeoutMs: 10_000,
  })
  if (r.code !== 0) throw new Error(`docker network ls falhou: ${r.stderr.trim()}`)
  return r.stdout.split("\n").map((s) => s.trim()).includes(name)
}

export async function createOverlayNetwork(name: string): Promise<void> {
  const r = await exec(
    "docker",
    ["network", "create", "-d", "overlay", "--attachable", name],
    { timeoutMs: 15_000 },
  )
  if (r.code !== 0) {
    throw new Error(`docker network create falhou: ${r.stderr.trim()}`)
  }
}
