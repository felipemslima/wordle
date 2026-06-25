/**
 * Unit tests for the Dueto/Quarteto game reducer logic.
 * No browser, no build — pure Node.js (node:test).
 *
 * Run: node --test tests/reducer.test.mjs
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

// ─── minimal evaluate (mirrors src/utils/evaluate.ts) ────────────────────────

function evaluate(guess, secret) {
  const result = Array(5).fill('absent')
  const secretArr = secret.split('')
  const used = Array(5).fill(false)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secretArr[i]) { result[i] = 'correct'; used[i] = true }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === secretArr[j]) { result[i] = 'present'; used[j] = true; break }
    }
  }
  return result
}

// ─── reducer (mirrors src/hooks/useGame.ts) ───────────────────────────────────

const MODE_CONFIG = {
  classic:  { boards: 1, maxRows: 6 },
  dueto:    { boards: 2, maxRows: 7 },
  quarteto: { boards: 4, maxRows: 9 },
}

function emptyBoard() {
  return { rows: [], solved: false, solvedAtRow: -1 }
}

function initState(mode) {
  const cfg = MODE_CONFIG[mode]
  return {
    mode,
    secrets: Array.from({ length: cfg.boards }, () => 'BANCO'),
    boards: Array.from({ length: cfg.boards }, emptyBoard),
    currentInput: Array(5).fill(''),
    selectedCol: 0,
    currentRow: 0,
    maxRows: cfg.maxRows,
    gameOver: false,
    won: false,
    keyStatuses: {},
    shakeRow: false,
    revealRow: -1,
    bounceRow: false,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SUBMIT': {
      if (!action.result) return { ...state, shakeRow: true }
      return { ...state, revealRow: state.currentRow }
    }

    case 'COMMIT_REVEAL': {
      const newBoards = state.boards.map((board, bi) => {
        const row = action.tiles[bi]
        const justSolved = !board.solved && row.every(t => t.status === 'correct')
        const solved = board.solved || justSolved
        const solvedAtRow = justSolved ? state.currentRow : board.solvedAtRow
        return { rows: [...board.rows, row], solved, solvedAtRow }
      })
      const allSolved = newBoards.every(b => b.solved)
      const nextRow = state.currentRow + 1
      const lost = !allSolved && nextRow >= state.maxRows
      const over = allSolved || lost
      return {
        ...state,
        boards: newBoards,
        currentInput: Array(5).fill(''),
        selectedCol: 0,
        currentRow: nextRow,
        gameOver: over,
        won: allSolved,
        revealRow: -1,
        bounceRow: allSolved,
      }
    }

    case 'NEW_GAME':
      return initState(action.mode)

    default:
      return state
  }
}

// ─── helper: build tiles for a guess against all secrets ─────────────────────

function makeTiles(guess, secrets) {
  return secrets.map(secret =>
    evaluate(guess, secret).map((status, i) => ({ letter: guess[i], status }))
  )
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('evaluate()', () => {
  test('correct word returns all correct', () => {
    assert.deepEqual(evaluate('BANCO', 'BANCO'), ['correct','correct','correct','correct','correct'])
  })

  test('absent word returns all absent', () => {
    const result = evaluate('ZZZZZ', 'BANCO')
    assert.deepEqual(result, ['absent','absent','absent','absent','absent'])
  })

  test('present letter', () => {
    // B is in BANCO but not at position 0 in XBXXX
    const result = evaluate('XBXXX', 'BANCO')
    assert.equal(result[1], 'present') // B at pos 1 is present (it's at pos 0 in BANCO)
  })
})

describe('Classic mode — reducer state transitions', () => {
  test('initial state has 1 board, 0 rows, currentRow 0', () => {
    const s = initState('classic')
    assert.equal(s.boards.length, 1)
    assert.equal(s.boards[0].rows.length, 0)
    assert.equal(s.currentRow, 0)
    assert.equal(s.revealRow, -1)
  })

  test('SUBMIT sets revealRow', () => {
    let s = initState('classic')
    const tiles = makeTiles('CARRO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles })
    assert.equal(s.revealRow, 0)
  })

  test('COMMIT_REVEAL adds row and advances currentRow', () => {
    let s = initState('classic')
    const tiles = makeTiles('CARRO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles })
    assert.equal(s.boards[0].rows.length, 1, 'board should have 1 row after first guess')
    assert.equal(s.currentRow, 1)
    assert.equal(s.revealRow, -1)
  })

  test('two guesses → board has 2 rows', () => {
    let s = initState('classic')
    const tiles1 = makeTiles('CARRO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles1 })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: tiles1 })

    const tiles2 = makeTiles('CAMPO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles2 })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: tiles2 })

    assert.equal(s.boards[0].rows.length, 2, 'board should have 2 rows after two guesses')
    assert.equal(s.currentRow, 2)
  })
})

describe('Dueto mode — MAIN BUG: rows must persist across guesses', () => {
  test('initial state has 2 boards, each with 0 rows', () => {
    const s = initState('dueto')
    assert.equal(s.boards.length, 2)
    assert.equal(s.boards[0].rows.length, 0)
    assert.equal(s.boards[1].rows.length, 0)
  })

  test('after 1st guess: each board has exactly 1 row', () => {
    let s = initState('dueto')
    const tiles = makeTiles('CARRO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles })

    assert.equal(s.boards[0].rows.length, 1, 'board[0] should have 1 row')
    assert.equal(s.boards[1].rows.length, 1, 'board[1] should have 1 row')
    assert.equal(s.currentRow, 1)
  })

  test('after 2nd guess: each board has 2 rows — FIRST GUESS MUST NOT DISAPPEAR', () => {
    let s = initState('dueto')
    const tiles1 = makeTiles('CARRO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles1 })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: tiles1 })

    const tiles2 = makeTiles('CAMPO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: tiles2 })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: tiles2 })

    assert.equal(s.boards[0].rows.length, 2, 'board[0]: first guess must not disappear on second commit')
    assert.equal(s.boards[1].rows.length, 2, 'board[1]: first guess must not disappear on second commit')
    assert.equal(s.currentRow, 2)
    // first row is still the first guess
    assert.equal(s.boards[0].rows[0][0].letter, 'C', 'first row, first letter should be C (from CARRO)')
    assert.equal(s.boards[0].rows[1][0].letter, 'C', 'second row, first letter should be C (from CAMPO)')
  })

  test('after 3rd guess: each board has 3 rows', () => {
    let s = initState('dueto')
    for (const word of ['CARRO', 'CAMPO', 'BOTAS']) {
      const tiles = makeTiles(word, s.secrets)
      s = reducer(s, { type: 'SUBMIT', result: tiles })
      s = reducer(s, { type: 'COMMIT_REVEAL', tiles })
    }
    assert.equal(s.boards[0].rows.length, 3)
    assert.equal(s.boards[1].rows.length, 3)
  })
})

describe('Dueto mode — solvedAtRow tracks the correct solve row', () => {
  test('solvedAtRow is -1 while unsolved', () => {
    let s = initState('dueto')
    const tiles = makeTiles('CARRO', s.secrets) // wrong guess
    s = reducer(s, { type: 'SUBMIT', result: tiles })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles })
    assert.equal(s.boards[0].solvedAtRow, -1)
    assert.equal(s.boards[1].solvedAtRow, -1)
  })

  test('solvedAtRow is set to the row index when solved', () => {
    let s = initState('dueto') // secrets are both BANCO
    const wrongTiles = makeTiles('CARRO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: wrongTiles })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: wrongTiles })
    assert.equal(s.currentRow, 1)

    // now solve at row 1
    const correctTiles = makeTiles('BANCO', s.secrets)
    s = reducer(s, { type: 'SUBMIT', result: correctTiles })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: correctTiles })

    assert.equal(s.boards[0].solvedAtRow, 1, 'solved at row index 1 (second guess)')
    assert.equal(s.boards[1].solvedAtRow, 1)
    assert.equal(s.won, true)
  })

  test('solvedAtRow does NOT drift when more guesses are added after individual solve', () => {
    // board 0 and board 1 have DIFFERENT secrets
    let s = initState('dueto')
    s = { ...s, secrets: ['BANCO', 'CARRO'] } // board 0 = BANCO, board 1 = CARRO

    // guess 1: correct for board 0 (BANCO), wrong for board 1 (CARRO)
    const tiles1 = s.secrets.map(secret =>
      evaluate('BANCO', secret).map((status, i) => ({ letter: 'BANCO'[i], status }))
    )
    s = reducer(s, { type: 'SUBMIT', result: tiles1 })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: tiles1 })

    assert.equal(s.boards[0].solved, true, 'board 0 solved at guess 1')
    assert.equal(s.boards[0].solvedAtRow, 0, 'board 0 solvedAtRow should be 0')
    assert.equal(s.boards[1].solved, false, 'board 1 still unsolved')

    // guess 2: wrong for board 1
    const tiles2 = s.secrets.map(secret =>
      evaluate('CAMPO', secret).map((status, i) => ({ letter: 'CAMPO'[i], status }))
    )
    s = reducer(s, { type: 'SUBMIT', result: tiles2 })
    s = reducer(s, { type: 'COMMIT_REVEAL', tiles: tiles2 })

    // board 0's solvedAtRow should STILL be 0, not 1
    assert.equal(s.boards[0].solvedAtRow, 0, 'board 0 solvedAtRow must not drift after more guesses')
    assert.equal(s.boards[0].rows.length, 2, 'board 0 still gets new rows appended')
  })
})

describe('Quarteto mode — 4 boards', () => {
  test('initial state has 4 boards', () => {
    const s = initState('quarteto')
    assert.equal(s.boards.length, 4)
    assert.equal(s.maxRows, 9)
  })

  test('two guesses: all 4 boards accumulate rows', () => {
    let s = initState('quarteto')
    for (const word of ['CARRO', 'CAMPO']) {
      const tiles = makeTiles(word, s.secrets)
      s = reducer(s, { type: 'SUBMIT', result: tiles })
      s = reducer(s, { type: 'COMMIT_REVEAL', tiles })
    }
    for (let b = 0; b < 4; b++) {
      assert.equal(s.boards[b].rows.length, 2, `board[${b}] should have 2 rows`)
    }
  })
})
