// Remove fundo branco do persoagem.png preservando detalhes internos
// (estrelas, brilhos, highlights claros do personagem).
//
// Estrategia: flood-fill a partir das bordas da imagem.
//   1. Identifica TODOS os pixels que sao "fundo branco" (dist <= INNER)
//   2. BFS partindo das 4 bordas (top/bottom/left/right) ate parar
//      em pixels coloridos do personagem.
//   3. So apaga pixels alcancaveis pelo flood — estrelas brancas
//      INTERNAS ficam intactas porque estao cercadas de cor escura
//      e nao sao alcancaveis pelo BFS.
//   4. Faixa antialias suave nos pixels da borda do personagem
//      (transicao branco→cor) pra nao serrilhar.

import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { createRequire } from "node:module"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, "..", "brand", "personagem-original.png")
const DST = join(__dirname, "..", "brand", "personagem-sem-fundo.png")

const require = createRequire(import.meta.url)
const sharp = require("f:/Projeto_berberai/aplicativo/node_modules/sharp")

const KEY = [255, 255, 255]
// INNER: pixel eh "fundo puro" se dist <= INNER. Mantemos 15 (faixa
// generosa — pega o gradiente sutil de compressao PNG sem comer
// detalhes coloridos do personagem porque o segundo filtro abaixo
// SO marca pixels com matiz neutra como fundo).
const INNER = 15
// OUTER: faixa de antialias da borda externa. Pixels entre INNER e
// OUTER recebem alpha proporcional pra suavizar transicao. Agora pode
// ser amplo porque a checagem de neutralidade no antialias garante
// que so pixels cinza/branco residuais sao tocados (cor fica intacta).
const OUTER = 140
// Tolerancia de neutralidade cromatica: max(R,G,B) - min(R,G,B).
// Pixel branco puro tem desv = 0; estrela com matiz azul/lilas tem
// desv > NEUTRAL_TOL e nao eh apagada.
const NEUTRAL_TOL = 8

async function main() {
  const buf = await readFile(SRC)
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  if (channels !== 4) throw new Error(`Esperava RGBA, recebi ${channels}`)

  const out = Buffer.from(data)
  const total = width * height

  // Mascara: 1 = "potencial fundo" (dist <= INNER do branco)
  const isBg = new Uint8Array(total)
  // Tambem guardamos a distancia pra usar no antialias depois
  const dist = new Float32Array(total)

  for (let i = 0; i < total; i++) {
    const o = i * 4
    const r = out[o], g = out[o + 1], b = out[o + 2]
    const dr = r - KEY[0]
    const dg = g - KEY[1]
    const db = b - KEY[2]
    const d = Math.sqrt(dr * dr + dg * dg + db * db)
    dist[i] = d

    if (d <= INNER) {
      // Branco puro? Confere se eh cromaticamente neutro.
      // Pixel com matiz (azul/lilas/rosa) tem max-min alto e NAO eh bg.
      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      if (maxC - minC <= NEUTRAL_TOL) {
        isBg[i] = 1
      }
    }
  }

  // Flood-fill BFS a partir das 4 bordas. Soh marca pixels que sao
  // "potencial fundo" E acessiveis pela borda. Estrelas internas
  // brancas ficam intocadas porque sao cercadas de pixels coloridos
  // que cortam o caminho.
  const visited = new Uint8Array(total)
  const queue = []

  // Seeds: todas as bordas
  for (let x = 0; x < width; x++) {
    const top = x
    const bottom = (height - 1) * width + x
    if (isBg[top] && !visited[top]) { visited[top] = 1; queue.push(top) }
    if (isBg[bottom] && !visited[bottom]) { visited[bottom] = 1; queue.push(bottom) }
  }
  for (let y = 0; y < height; y++) {
    const left = y * width
    const right = y * width + (width - 1)
    if (isBg[left] && !visited[left]) { visited[left] = 1; queue.push(left) }
    if (isBg[right] && !visited[right]) { visited[right] = 1; queue.push(right) }
  }

  // Fase 1: BFS apaga o fundo conectado a borda.
  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    out[idx * 4 + 3] = 0

    const x = idx % width
    const y = (idx - x) / width
    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
    ]
    for (const n of neighbors) {
      if (n < 0 || visited[n]) continue
      if (isBg[n]) {
        visited[n] = 1
        queue.push(n)
      }
    }
  }

  // Fase 2: borda antialias com profundidade. Pra cada pixel que
  // continua opaco mas tem dist do branco < OUTER, calcula alpha
  // proporcional MAS so se ele esta perto de um pixel ja apagado
  // (= esta na borda externa do personagem, nao em estrelas internas).
  //
  // "Perto" = qualquer um dos 8 vizinhos esta apagado (alpha 0).
  // Repetimos isso por N iteracoes pra dilatar a faixa, criando
  // uma rampa de alpha em vez de cliff. Resultado: borda macia.
  const RAMP_ITERS = 12 // profundidade da faixa antialias em pixels

  for (let iter = 0; iter < RAMP_ITERS; iter++) {
    // Snapshot do alpha atual pra nao propagar mudancas dentro da mesma iter
    const prevAlpha = new Uint8Array(total)
    for (let i = 0; i < total; i++) prevAlpha[i] = out[i * 4 + 3]

    for (let i = 0; i < total; i++) {
      if (prevAlpha[i] === 0) continue // ja apagado
      if (dist[i] >= OUTER) continue   // muito distante do branco — pixel solido interno

      // Aplica antialias com criterio: pixels claros + pouca matiz
      // (= residuo da transicao branco→cor) sao alvo natural. Pixels
      // bem coloridos das chamas/highlights ja sao saturados e ficam
      // totalmente opacos — evita halo.
      // Criterio: lightness >= 200 OU chroma baixo (max-min <= 30).
      // Isso pega cinzas claros e off-whites, deixa cores vibrantes em paz.
      const o = i * 4
      const r = out[o], g = out[o + 1], b = out[o + 2]
      const lightness = (r + g + b) / 3
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)
      const isAntialiasTarget = lightness >= 200 || chroma <= 30
      if (!isAntialiasTarget) continue

      const x = i % width
      const y = (i - x) / width

      // Checa se algum vizinho (8-conn) esta apagado ou semitransparente
      let minNeighborAlpha = 255
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const na = prevAlpha[ny * width + nx]
          if (na < minNeighborAlpha) minNeighborAlpha = na
        }
      }

      if (minNeighborAlpha === 255) continue // nao tem vizinho transparente, esta no interior

      // Calcula alpha alvo baseado na distancia ao branco. Pixel
      // mais perto do branco (menor dist) → mais transparente.
      const t = Math.max(0, Math.min(1, (dist[i] - INNER) / (OUTER - INNER)))
      const targetAlpha = Math.round(255 * t)

      // Pega o menor entre o alpha atual e o alvo (so reduz, nunca sobe)
      if (targetAlpha < out[i * 4 + 3]) {
        out[i * 4 + 3] = targetAlpha
      }
    }
  }

  // Fase 3: suavizacao SOH em pixels da borda externa (alpha ja
  // intermediario). Calculamos uma media local 3x3 dos alphas dos
  // pixels que sao OPACOS ou SEMITRANSPARENTES (nao puxamos do
  // transparente pra dentro = nao come o personagem). Resultado:
  // serrilha vira gradiente liso.
  const newAlphas = new Uint8Array(total)
  for (let i = 0; i < total; i++) newAlphas[i] = out[i * 4 + 3]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const a = out[i * 4 + 3]
      // Pixel solido OU transparente puro? Nao mexe.
      if (a === 0 || a === 255) continue

      // Pixel semitransparente — media dos vizinhos que NAO sao
      // totalmente transparentes (evita contaminar com vazio).
      let sum = 0, count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const na = out[(ny * width + nx) * 4 + 3]
          if (na > 0) {
            sum += na
            count++
          }
        }
      }
      if (count > 0) {
        newAlphas[i] = Math.round(sum / count)
      }
    }
  }

  for (let i = 0; i < total; i++) out[i * 4 + 3] = newAlphas[i]

  // Stats
  let trans = 0
  let edge = 0
  for (let i = 0; i < total; i++) {
    const a = out[i * 4 + 3]
    if (a === 0) trans++
    else if (a < 255) edge++
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(DST)

  console.log(`OK: ${DST}`)
  console.log(`  resolucao: ${width}x${height}`)
  console.log(`  pixels totalmente transparentes: ${trans.toLocaleString()} (${(trans / total * 100).toFixed(1)}%)`)
  console.log(`  pixels antialias na borda: ${edge.toLocaleString()} (${(edge / total * 100).toFixed(2)}%)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
