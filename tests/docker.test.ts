import { describe, it, expect, vi, beforeEach } from "vitest"
import * as execModule from "../src/lib/exec.js"
import {
  dockerInstalled,
  dockerSwarmActive,
  swarmInit,
  networkExists,
  createOverlayNetwork,
} from "../src/lib/docker.js"

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("docker wrappers", () => {
  it("dockerInstalled() = true quando `docker --version` retorna 0", async () => {
    vi.spyOn(execModule, "exec").mockResolvedValueOnce({
      code: 0,
      stdout: "Docker version 24.0.7",
      stderr: "",
      durationMs: 50,
    })
    expect(await dockerInstalled()).toBe(true)
  })

  it("dockerInstalled() = false quando exec falha (ENOENT)", async () => {
    vi.spyOn(execModule, "exec").mockRejectedValueOnce(new Error("spawn docker ENOENT"))
    expect(await dockerInstalled()).toBe(false)
  })

  it("dockerSwarmActive() = true quando `docker info` mostra Swarm: active", async () => {
    const execSpy = vi.spyOn(execModule, "exec")
    execSpy.mockResolvedValueOnce({
      code: 0,
      stdout: "Swarm: active\nNodes: 1\n",
      stderr: "",
      durationMs: 80,
    })
    // Fallback path: segunda chamada exec com docker info cru
    execSpy.mockResolvedValueOnce({
      code: 0,
      stdout: "Swarm: active\nNodes: 1\n",
      stderr: "",
      durationMs: 80,
    })
    expect(await dockerSwarmActive()).toBe(true)
  })

  it("dockerSwarmActive() = false quando inativo", async () => {
    const execSpy = vi.spyOn(execModule, "exec")
    execSpy.mockResolvedValueOnce({
      code: 0,
      stdout: "Swarm: inactive\n",
      stderr: "",
      durationMs: 60,
    })
    // Fallback path: segunda chamada não é necessária pois "inactive" é detectado
    // na primeira chamada, mas os dados de formato --format nunca vêm sozinhos como
    // "inactive". Preparamos fallback mesmo assim.
    execSpy.mockResolvedValueOnce({
      code: 0,
      stdout: "Swarm: inactive\n",
      stderr: "",
      durationMs: 60,
    })
    expect(await dockerSwarmActive()).toBe(false)
  })

  it("swarmInit() roda docker swarm init", async () => {
    const spy = vi.spyOn(execModule, "exec").mockResolvedValueOnce({
      code: 0,
      stdout: "Swarm initialized",
      stderr: "",
      durationMs: 200,
    })
    await swarmInit()
    expect(spy).toHaveBeenCalledWith("docker", ["swarm", "init"], expect.any(Object))
  })

  it("networkExists('aurora-net') = true quando docker network ls lista", async () => {
    vi.spyOn(execModule, "exec").mockResolvedValueOnce({
      code: 0,
      stdout: "aurora-net\nbridge\nhost\n",
      stderr: "",
      durationMs: 30,
    })
    expect(await networkExists("aurora-net")).toBe(true)
  })

  it("networkExists() = false quando ausente", async () => {
    vi.spyOn(execModule, "exec").mockResolvedValueOnce({
      code: 0,
      stdout: "bridge\nhost\n",
      stderr: "",
      durationMs: 30,
    })
    expect(await networkExists("aurora-net")).toBe(false)
  })

  it("createOverlayNetwork() chama docker network create -d overlay --attachable", async () => {
    const spy = vi.spyOn(execModule, "exec").mockResolvedValueOnce({
      code: 0,
      stdout: "xyz123",
      stderr: "",
      durationMs: 100,
    })
    await createOverlayNetwork("aurora-net")
    expect(spy).toHaveBeenCalledWith(
      "docker",
      ["network", "create", "-d", "overlay", "--attachable", "aurora-net"],
      expect.any(Object),
    )
  })
})
