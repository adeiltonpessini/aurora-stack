// Paleta + helpers visuais Aurora. Cores hex equivalentes:
//   teal:  #21958F (RGB 33,149,143)  → chalk não tem hex, usamos rgb()
//   navy:  #192129 (RGB 25,33,41)
//   gold:  #c89b3c
// chalk.rgb retorna função que colore o texto.

import chalk from "chalk"

export const aurora = {
  teal: chalk.rgb(33, 149, 143),
  navy: chalk.rgb(25, 33, 41),
  gold: chalk.rgb(200, 155, 60),
  dim: chalk.gray,
  ok: chalk.green,
  err: chalk.red,
  warn: chalk.yellow,
  bold: chalk.bold,
}

export const banner = `
${aurora.teal("╔════════════════════════════════════════════════════╗")}
${aurora.teal("║")}  ${aurora.bold(aurora.teal("AURORA STACK"))} ${aurora.dim("— transforme qualquer Linux")}  ${aurora.teal("║")}
${aurora.teal("║")}  ${aurora.dim("em infraestrutura inteligente")}                  ${aurora.teal("║")}
${aurora.teal("╚════════════════════════════════════════════════════╝")}
`

export function printBanner(): void {
  console.log(banner)
}
