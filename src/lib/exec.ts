// Wrapper sobre child_process.spawn que retorna ExecResult tipado.
// Por que não usar `execa`: 0 deps extra + controle total sobre stderr,
// timeout, env, cwd. Trade-off: ~50 linhas pra escrever vs 1 dep.

import { spawn, SpawnOptions } from "node:child_process"
import type { ExecResult } from "../types.js"

export interface ExecOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeoutMs?: number // 0 = sem timeout
  input?: string // stdin
}

export async function exec(
  cmd: string,
  args: string[],
  opts: ExecOptions = {},
): Promise<ExecResult> {
  const start = Date.now()
  const spawnOpts: SpawnOptions = {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    stdio: ["pipe", "pipe", "pipe"],
  }

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, spawnOpts)
    let stdout = ""
    let stderr = ""
    let timedOut = false
    const timeoutHandle = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true
          child.kill("SIGTERM")
        }, opts.timeoutMs)
      : null

    child.stdout?.on("data", (d) => (stdout += d.toString()))
    child.stderr?.on("data", (d) => (stderr += d.toString()))

    if (opts.input !== undefined) {
      child.stdin?.write(opts.input)
      child.stdin?.end()
    }

    child.on("close", (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      const durationMs = Date.now() - start
      if (timedOut) {
        reject(new Error(`Command timed out after ${opts.timeoutMs}ms: ${cmd} ${args.join(" ")}`))
        return
      }
      resolve({ code: code ?? -1, stdout, stderr, durationMs })
    })

    child.on("error", (err) => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      reject(err)
    })
  })
}
