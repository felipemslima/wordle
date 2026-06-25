/**
 * Demo interativo: joga uma rodada completa no modo Dueto com browser visível.
 * Verifica que cada chute acumula corretamente nos dois boards.
 *
 * Run: node tests/dueto.demo.mjs
 */

import puppeteer from 'puppeteer'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir  = fileURLToPath(new URL('.', import.meta.url))
const SERVE_ROOT = resolve(__dir, '../serve_root')
const PORT      = 5174
const LOCAL_URL = `http://localhost:${PORT}/wordle/`
const SLOW   = 120   // ms entre ações (visível para humano)
const FLIP   = 2200  // ms para animação de flip completar

// ─── servidor local ──────────────────────────────────────────────────────────

const MIME = {
  '.html':'text/html','.js':'application/javascript',
  '.css':'text/css',  '.svg':'image/svg+xml', '.json':'application/json',
}

function startServer() {
  return new Promise((res, rej) => {
    const srv = createServer((req, resp) => {
      let p = req.url.split('?')[0]
      if (p === '/wordle' || p === '/wordle/') p = '/wordle/index.html'
      const file = join(SERVE_ROOT, p)
      if (existsSync(file)) {
        resp.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
        resp.end(readFileSync(file))
      } else { resp.writeHead(404); resp.end() }
    })
    srv.listen(PORT, () => res(srv))
    srv.on('error', rej)
  })
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function clickKey(page, key) {
  await page.evaluate((k) => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === k)
    if (!btn) throw new Error(`tecla não encontrada: ${k}`)
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
  }, key)
  await new Promise(r => setTimeout(r, SLOW))
}

async function typeWord(page, word) {
  console.log(`    digitando: ${word}`)
  for (const ch of word) await clickKey(page, ch)
}

async function submit(page) {
  await clickKey(page, 'ENTER')
  await new Promise(r => setTimeout(r, FLIP))
}

async function countRevealedRows(page, bi) {
  return page.evaluate((bi) => {
    const grids = document.querySelectorAll('.grid')
    if (!grids[bi]) return -1
    const colored = grids[bi].querySelectorAll(
      '[class*="bg-green-6"],[class*="bg-yellow-5"],[class*="bg-zinc-6"]'
    )
    return Math.floor(colored.length / 5)
  }, bi)
}

async function getSecrets(page) {
  // Extrai as palavras secretas dos badges "✓ PALAVRA" que aparecem ao resolver,
  // ou lê diretamente do bundle via window.__secrets injetado abaixo.
  return page.evaluate(() => window.__wordle_secrets ?? [])
}

// ─── injeção: expõe os secrets no window quando o jogo inicia ────────────────
async function injectSecretsHook(page) {
  await page.evaluateOnNewDocument(() => {
    const orig = Math.random
    let calls = 0
    // não modifica Math.random — apenas observa o estado React depois do load
    window.__getSecrets = () => {
      const root = document.getElementById('root')
      if (!root) return []
      // tenta achar texto dos badges resolvidos ou do modal de resultado
      const badges = [...document.querySelectorAll('.bg-green-600.text-white')]
      return badges
        .map(b => b.textContent.replace('✓','').trim())
        .filter(t => t.length === 5)
    }
  })
}

// ─── runner ──────────────────────────────────────────────────────────────────

let passed = 0, failed = 0
function pass(msg) { console.log(`  ✓ ${msg}`); passed++ }
function fail(msg, err) { console.error(`  ✗ ${msg}: ${err?.message ?? err}`); failed++ }

async function run() {
  console.log('\n🎮 Wordle Dueto — Demo ao vivo\n')

  const server = await startServer()
  console.log(`  Servidor local: ${LOCAL_URL}\n`)

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: SLOW,
    defaultViewport: { width: 480, height: 820 },
    args: ['--no-sandbox', '--window-size=480,900'],
  })

  const page = await browser.newPage()
  await injectSecretsHook(page)
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle0' })
  await page.waitForSelector('h1', { timeout: 8000 })

  // ── 1. modo Dueto ───────────────────────────────────────────────────────────

  console.log('  [1] Ativando modo Dueto…')
  try {
    await page.click('button ::-p-text(Dueto)')
    await new Promise(r => setTimeout(r, 600))
    const n = await page.$$eval('.grid', gs => gs.length)
    if (n !== 2) throw new Error(`esperava 2 boards, encontrou ${n}`)
    pass('modo Dueto ativo — 2 boards visíveis')
  } catch (e) { fail('modo Dueto', e); await browser.close(); server.close(); return }

  // chutes a usar (todos válidos no dicionário)
  const GUESSES = ['CANTO', 'BANCO', 'CARRO', 'CAMPO', 'BOTAS', 'GATOS', 'ABALA']

  let gameOver = false

  for (let i = 0; i < GUESSES.length && !gameOver; i++) {
    const word = GUESSES[i]
    const expectedRows = i + 1
    console.log(`\n  [${i + 2}] Chute ${i + 1}: ${word}`)

    try {
      await typeWord(page, word)
      await submit(page)

      const r0 = await countRevealedRows(page, 0)
      const r1 = await countRevealedRows(page, 1)

      if (r0 !== expectedRows) throw new Error(`board[0]: ${r0} linhas, esperava ${expectedRows}`)
      if (r1 !== expectedRows) throw new Error(`board[1]: ${r1} linhas, esperava ${expectedRows}`)
      pass(`chute ${i + 1} — ambos boards têm ${expectedRows} linha(s) acumulada(s)`)

      // verifica se o jogo terminou (modal de resultado aparece)
      const resultVisible = await page.$eval(
        '[class*="fixed"][class*="inset-0"][class*="z-50"]',
        () => true
      ).catch(() => false)

      if (resultVisible) {
        console.log('\n  🏁 Jogo encerrado (modal de resultado visível)')
        gameOver = true
      }
    } catch (e) {
      fail(`chute ${i + 1} (${word})`, e)
    }
  }

  // screenshot final
  const shot = resolve(__dir, '../dist/dueto-demo-result.png')
  await page.screenshot({ path: shot, fullPage: false })
  console.log(`\n  📸 Screenshot salva em: dist/dueto-demo-result.png`)

  console.log(`\n  ${passed} passou, ${failed} falhou`)
  console.log('  (fechando browser em 4s…)\n')
  await new Promise(r => setTimeout(r, 4000))

  await browser.close()
  server.close()
  if (failed > 0) process.exitCode = 1
}

run().catch(err => { console.error(err); process.exitCode = 1 })
