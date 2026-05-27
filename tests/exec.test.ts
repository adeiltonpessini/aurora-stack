import { describe, it, expect } from "vitest"
import { exec } from "../src/lib/exec.js"

describe("exec()", () => {
  it("retorna stdout de comando simples", async () => {
    const result = await exec("node", ["-e", "console.log('hello')"])
    expect(result.code).toBe(0)
    expect(result.stdout.trim()).toBe("hello")
    expect(result.stderr).toBe("")
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("captura stderr separado", async () => {
    const result = await exec("node", ["-e", "console.error('oops'); process.exit(1)"])
    expect(result.code).toBe(1)
    expect(result.stderr.trim()).toBe("oops")
  })

  it("respeita timeoutMs e mata o processo", async () => {
    await expect(
      exec("node", ["-e", "setTimeout(()=>{}, 5000)"], { timeoutMs: 200 }),
    ).rejects.toThrow(/timed out/)
  })

  it("passa input via stdin", async () => {
    const result = await exec("node", ["-e", "process.stdin.on('data', d=>process.stdout.write(d))"], {
      input: "ping",
    })
    expect(result.stdout).toBe("ping")
  })
})
