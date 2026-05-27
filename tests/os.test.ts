import { describe, it, expect, vi, beforeEach } from "vitest"
import { detectOs } from "../src/lib/os.js"

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}))

describe("detectOs()", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── SOs suportados ───────────────────────────────────────────────

  it("detecta Debian 12 (Bookworm) como suportado", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockResolvedValueOnce(
      `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nID=debian\nVERSION_ID="12"\n`,
    )
    const os = await detectOs()
    expect(os.id).toBe("debian")
    expect(os.versionId).toBe("12")
    expect(os.isSupported).toBe(true)
  })

  it("detecta Debian 13 (Trixie) como suportado", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockResolvedValueOnce(
      `PRETTY_NAME="Debian GNU/Linux 13 (trixie)"\nID=debian\nVERSION_ID="13"\n`,
    )
    const os = await detectOs()
    expect(os.id).toBe("debian")
    expect(os.versionId).toBe("13")
    expect(os.isSupported).toBe(true)
  })

  // ─── SOs NÃO suportados ───────────────────────────────────────────

  it("marca Debian 11 como NÃO suportado (EOL próximo)", async () => {
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

  it("marca Fedora como NÃO suportado (não é apt-based)", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockResolvedValueOnce(
      `PRETTY_NAME="Fedora Linux 39 (Workstation Edition)"\nID=fedora\nVERSION_ID="39"\n`,
    )
    const os = await detectOs()
    expect(os.isSupported).toBe(false)
  })

  // ─── Edge cases ───────────────────────────────────────────────────

  it("lida com /etc/os-release ausente (não-Linux)", async () => {
    const { readFile } = await import("node:fs/promises")
    ;(readFile as any).mockRejectedValueOnce(new Error("ENOENT"))
    const os = await detectOs()
    expect(os.id).toBe("unknown")
    expect(os.isSupported).toBe(false)
  })
})
