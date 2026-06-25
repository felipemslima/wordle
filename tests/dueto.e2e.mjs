/**
 * Puppeteer E2E tests for Dueto/Quarteto mode.
 * Reproduces: "first guess disappears when second guess submitted".
 *
 * Run: node tests/dueto.e2e.mjs [URL]
 * Default: starts a local server from serve_root/ at :5173
 *
 * To test against the live server:
 *   node tests/dueto.e2e.mjs http://163.176.129.114/wordle/
 */

import puppeteer from 'puppeteer'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = fileURLToPath(new URL('.', import.meta.url))
const SERVE_ROOT = resolve(__dir, '../serve_root')
const PORT = 5173
const LOCAL_URL = `http://localhost:${PORT}/wordle/`

const TARGET_URL = process.argv[2] ?? LOCAL_URL
const FLIP_WAIT = 2000
const USE_LOCAL = !process.argv[2]

// ─── minimal static server ─────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css',   '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon','.json':'application/json',
}

function startServer() {
  return new Promise((resolve, reject) => {
    const srv = createServer((req, res) => {
      let urlPath = req.url.split('?')[0]
      if (urlPath === '/wordle' || urlPath === '/wordle/') urlPath = '/wordle/index.html'
      const file = join(SERVE_ROOT, urlPath)
      if (existsSync(file)) {
        const ext = extname(file)
        res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
        res.end(readFileSync(file))
      } else {
        res.writeHead(404); res.end('not found')
      }
    })
    srv.listen(PORT, () => {
      console.log(`  Local server → http://localhost:${PORT}/wordle/`)
      resolve(srv)
    })
    srv.on('error', reject)
  })
}

// ─── test helpers ──────────────────────────────────────────────────────────

let passed = 0, failed = 0

function pass(name) { console.log(`  ✓ ${name}`); passed++ }
function fail(name, err) { console.error(`  ✗ ${name}: ${err?.message ?? err}`); failed++ }

async function waitFlip() { await new Promise(r => setTimeout(r, FLIP_WAIT)) }

async function clickKey(page, key) {
  // Keyboard buttons have no data-key — match by exact text content
  await page.evaluate((k) => {
    const btns = [...document.querySelectorAll('button')]
    const btn = btns.find(b => b.textContent.trim() === k)
    if (!btn) throw new Error(`key not found: ${k}`)
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
  }, key)
  await new Promise(r => setTimeout(r, 70))
}

async function typeWord(page, word) {
  for (const ch of word) await clickKey(page, ch)
}

/** Count rows with revealed colors (green/yellow/zinc) in board at index bi */
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

/** Check that the app loaded (header visible) */
async function waitForApp(page) {
  await page.waitForSelector('h1', { timeout: 8000 })
}

// ─── tests ────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nWordle Dueto E2E — ${TARGET_URL}\n`)

  let server = null
  if (USE_LOCAL) server = await startServer()

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'],
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(12000)

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })
    await waitForApp(page)

    // ── 1. switch to Dueto ──────────────────────────────────────────────

    try {
      await page.click('button ::-p-text(Dueto)')
      await new Promise(r => setTimeout(r, 400))
      const count = await page.$$eval('.grid', gs => gs.length)
      if (count !== 2) throw new Error(`expected 2 boards, got ${count}`)
      pass('switch to Dueto: 2 boards visible')
    } catch (e) { fail('switch to Dueto', e) }

    // ── 2. first guess ──────────────────────────────────────────────────

    try {
      await typeWord(page, 'CARRO')
      await clickKey(page, 'ENTER')
      await waitFlip()

      const r0 = await countRevealedRows(page, 0)
      const r1 = await countRevealedRows(page, 1)
      if (r0 !== 1) throw new Error(`board[0] has ${r0} rows, expected 1`)
      if (r1 !== 1) throw new Error(`board[1] has ${r1} rows, expected 1`)
      pass('first guess: both boards show 1 completed row')
    } catch (e) { fail('first guess', e) }

    // ── 3. second guess — THE BUG: first row must not disappear ─────────

    try {
      await typeWord(page, 'CAMPO')
      await clickKey(page, 'ENTER')
      await waitFlip()

      const r0 = await countRevealedRows(page, 0)
      const r1 = await countRevealedRows(page, 1)
      if (r0 !== 2) throw new Error(`board[0] has ${r0} rows after 2nd guess — expected 2 (BUG: first row missing!)`)
      if (r1 !== 2) throw new Error(`board[1] has ${r1} rows after 2nd guess — expected 2 (BUG: first row missing!)`)
      pass('second guess: 2 cumulative rows on both boards (no row disappearing)')
    } catch (e) { fail('second guess — row persistence BUG', e) }

    // ── 4. third guess accumulates ──────────────────────────────────────

    try {
      await typeWord(page, 'BOTAS')
      await clickKey(page, 'ENTER')
      await waitFlip()
      const r0 = await countRevealedRows(page, 0)
      if (r0 !== 3) throw new Error(`board[0] has ${r0} rows, expected 3`)
      pass('third guess: 3 rows accumulated')
    } catch (e) { fail('third guess', e) }

    // ── 4b. REGRESSÃO: Enter não reseta o jogo quando botão Dueto está focado ──
    // Bug original: clicar "Dueto" foca o botão; pressionar Enter para submeter
    // chute disparava click no botão focado → newGame() → jogo resetava

    try {
      // reload para estado limpo
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })
      await waitForApp(page)

      // clica Dueto (botão fica focado)
      await page.click('button ::-p-text(Dueto)')
      await new Promise(r => setTimeout(r, 300))

      // tipo palavra via teclado físico (não clickKey) + Enter físico
      await page.keyboard.type('CARRO', { delay: 80 })
      await page.keyboard.press('Enter')
      await waitFlip()

      const r0 = await countRevealedRows(page, 0)
      if (r0 !== 1) throw new Error(`board[0] tem ${r0} linhas — Enter provavelmente resetou o jogo (esperava 1)`)

      // segundo chute com Enter físico
      await page.keyboard.type('CAMPO', { delay: 80 })
      await page.keyboard.press('Enter')
      await waitFlip()

      const r0b = await countRevealedRows(page, 0)
      if (r0b !== 2) throw new Error(`board[0] tem ${r0b} linhas após 2º chute — esperava 2 (bug: 1º some)`)
      pass('regressão Enter-foco: 2 chutes via teclado físico preservam linhas')
    } catch (e) { fail('regressão Enter-foco (BUG PRINCIPAL)', e) }

    // ── 5. switch to Quarteto ───────────────────────────────────────────

    try {
      await page.click('button ::-p-text(Quarteto)')
      await new Promise(r => setTimeout(r, 400))
      const count = await page.$$eval('.grid', gs => gs.length)
      if (count !== 4) throw new Error(`expected 4 boards, got ${count}`)
      pass('switch to Quarteto: 4 boards visible')
    } catch (e) { fail('switch to Quarteto', e) }

    // ── 6. Quarteto: 2 guesses on all 4 boards ──────────────────────────

    try {
      for (const word of ['CARRO', 'CAMPO']) {
        await typeWord(page, word)
        await clickKey(page, 'ENTER')
        await waitFlip()
      }
      for (let b = 0; b < 4; b++) {
        const rows = await countRevealedRows(page, b)
        if (rows !== 2) throw new Error(`board[${b}] has ${rows} rows, expected 2`)
      }
      pass('Quarteto: 2 guesses accumulated on all 4 boards')
    } catch (e) { fail('Quarteto row accumulation', e) }

  } finally {
    await browser.close()
    if (server) server.close()
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  if (failed > 0) process.exitCode = 1
}

run().catch(err => { console.error(err); process.exitCode = 1 })
