import { describe, it, expect, vi, beforeEach } from "vitest"
import { detectOs } from "../src/lib/os.js"

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}))

const mockReadFile = vi.hoisted(() => vi.fn())

describe("detectOs()", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("detecta Debian 12 como suportado", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockResolvedValueOnce(
      `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nID=debian\nVERSION_ID="12"\n`,
    )
    const os = await detectOs()
    expect(os.id).toBe("debian")
    expect(os.versionId).toBe("12")
    expect(os.isSupported).toBe(true)
  })

  it("marca Debian 11 como NÃO suportado", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockResolvedValueOnce(
      `PRETTY_NAME="Debian GNU/Linux 11 (bullseye)"\nID=debian\nVERSION_ID="11"\n`,
    )
    const os = await detectOs()
    expect(os.isSupported).toBe(false)
  })

  it("marca Ubuntu como NÃO suportado (v0.1 = só Debian)", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockResolvedValueOnce(
      `PRETTY_NAME="Ubuntu 22.04.3 LTS"\nID=ubuntu\nVERSION_ID="22.04"\n`,
    )
    const os = await detectOs()
    expect(os.isSupported).toBe(false)
  })

  it("lida com /etc/os-release ausente (não-Linux)", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockRejectedValueOnce(new Error("ENOENT"))
    const os = await detectOs()
    expect(os.id).toBe("unknown")
    expect(os.isSupported).toBe(false)
  })
})
