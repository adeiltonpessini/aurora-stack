import { describe, it, expect } from "vitest"
import { translateDockerError } from "../src/lib/docker-errors.js"

function make(stderr: string, code = 1): Parameters<typeof translateDockerError>[0] {
  return { command: "docker stack deploy", stderr, code }
}

describe("translateDockerError", () => {
  it("detecta porta em uso e sugere lsof", () => {
    const out = translateDockerError(
      make(`Bind for 0.0.0.0:80 failed: port is already allocated`),
    )
    expect(out).toMatch(/Porta 80/i)
    expect(out).toMatch(/lsof -i :80/i)
  })

  it("detecta rede ausente e aponta aurora init", () => {
    const out = translateDockerError(make(`network aurora-net not found`))
    expect(out).toMatch(/Rede Docker "aurora-net" nao existe/i)
    expect(out).toMatch(/aurora init/i)
  })

  it("detecta imagem 404", () => {
    const out = translateDockerError(make(`Error: pull access denied for foo/bar`))
    expect(out).toMatch(/Imagem Docker nao encontrada/i)
  })

  it("detecta swarm nao iniciado", () => {
    const out = translateDockerError(make(`This node is not a swarm manager.`))
    expect(out).toMatch(/Swarm nao esta ativo/i)
    expect(out).toMatch(/aurora init/i)
  })

  it("detecta permission denied (nao-root)", () => {
    const out = translateDockerError(
      make(`Got permission denied while trying to connect to the Docker daemon socket`),
    )
    expect(out).toMatch(/Sem permissao/i)
    expect(out).toMatch(/usermod -aG docker/i)
  })

  it("detecta daemon offline", () => {
    const out = translateDockerError(
      make(`Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`),
    )
    expect(out).toMatch(/Docker daemon/i)
    expect(out).toMatch(/systemctl/i)
  })

  it("fallback mostra stderr cru se nao casou padrao", () => {
    const out = translateDockerError(make(`erro super esoterico que ninguem viu`))
    expect(out).toContain("erro super esoterico")
    expect(out).toMatch(/exit code 1/i)
  })
})
