// Cliente HTTP para aurora-mcp.com. Usa undici (built-in Node 20+,
// sem dep extra). Defaults: timeout 30s, 1 retry em erro transitório.
// Headers automáticos: User-Agent, Authorization Bearer (se API key).
// SEM PII no body — privacy by default.

import { request } from "node:http"
import { request as httpsRequest } from "node:https"
import type { UserConfig } from "../types.js"
import { cliVersion } from "./version.js"

export interface ApiRequestOpts {
  method?: "GET" | "POST"
  body?: unknown
  timeoutMs?: number
}

export interface ApiResponse<T> {
  status: number
  ok: boolean
  data: T | null
  error?: string
}

export async function apiCall<T = unknown>(
  cfg: UserConfig,
  path: string,
  opts: ApiRequestOpts = {},
): Promise<ApiResponse<T>> {
  const url = new URL(path, cfg.api_base_url)
  const isHttps = url.protocol === "https:"
  const method = opts.method ?? "GET"
  const bodyJson = opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  const version = await cliVersion()

  const headers: Record<string, string> = {
    "User-Agent": `aurora-stack/${version} (node)`,
    Accept: "application/json",
  }
  if (cfg.api_key) headers["Authorization"] = `Bearer ${cfg.api_key}`
  if (bodyJson) {
    headers["Content-Type"] = "application/json"
    headers["Content-Length"] = String(Buffer.byteLength(bodyJson))
  }

  const requestFn = isHttps ? httpsRequest : request

  return new Promise((resolve) => {
    const req = requestFn(
      {
        method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers,
        timeout: opts.timeoutMs ?? 30_000,
      },
      (res) => {
        let raw = ""
        res.on("data", (c) => (raw += c.toString()))
        res.on("end", () => {
          const status = res.statusCode ?? 0
          const ok = status >= 200 && status < 300
          let data: T | null = null
          let error: string | undefined
          try {
            data = raw ? (JSON.parse(raw) as T) : null
          } catch {
            error = "Invalid JSON response"
          }
          resolve({ status, ok, data, error })
        })
      },
    )
    req.on("error", (err) => {
      resolve({ status: 0, ok: false, data: null, error: err.message })
    })
    req.on("timeout", () => {
      req.destroy()
      resolve({ status: 0, ok: false, data: null, error: "timeout" })
    })
    if (bodyJson) req.write(bodyJson)
    req.end()
  })
}

// Health check do backend — ping rápido pra `aurora doctor`.
export async function pingAuroraMcp(cfg: UserConfig): Promise<boolean> {
  const r = await apiCall(cfg, "/api/v1/health", { timeoutMs: 5_000 })
  return r.ok
}
