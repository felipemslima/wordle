import { useReducer, useCallback } from 'react'
import type { GameMode, GameState, BoardState, TileData, KeyStatus } from '../types'
// GameState now includes all animation/cursor fields
import { MODE_CONFIG } from '../types'
import { evaluate, mergePriority } from '../utils/evaluate'
import { ANSWERS, VALID_WORDS } from '../data/words'

// ─── helpers ──────────────────────────────────────────────────────────────────

function pickSecrets(count: number): string[] {
  const pool = [...ANSWERS]
  const picked: string[] = []
  while (picked.length < count) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

function emptyBoard(): BoardState {
  return { rows: [], solved: false }
}

function buildKeyStatuses(boards: BoardState[]): Record<string, KeyStatus> {
  const result: Record<string, KeyStatus> = {}
  for (const board of boards) {
    for (const row of board.rows) {
      for (const tile of row) {
        if (tile.status === 'empty' || tile.status === 'tbd') continue
        const prev = result[tile.letter] ?? 'unused'
        result[tile.letter] = mergePriority(prev, tile.status) as KeyStatus
      }
    }
  }
  return result
}

function initState(mode: GameMode): GameState {
  const cfg = MODE_CONFIG[mode]
  return {
    mode,
    secrets: pickSecrets(cfg.boards),
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

// ─── actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SELECT_COL'; col: number }
  | { type: 'SUBMIT'; result: TileData[][] | null }
  | { type: 'COMMIT_REVEAL'; tiles: TileData[][] }
  | { type: 'CLEAR_ANIMATE' }
  | { type: 'NEW_GAME'; mode: GameMode }

// ─── reducer ───────────────────────────────────────────────────────────────────

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ADD_LETTER': {
      if (state.gameOver || state.revealRow >= 0) return state
      const input = [...state.currentInput]
      input[state.selectedCol] = action.letter
      // advance cursor: next empty slot, or next slot, or wrap
      let next = state.selectedCol
      const nextEmpty = input.findIndex((l, i) => i > state.selectedCol && l === '')
      if (nextEmpty !== -1) next = nextEmpty
      else {
        const anyEmpty = input.findIndex(l => l === '')
        next = anyEmpty !== -1 ? anyEmpty : Math.min(state.selectedCol + 1, 4)
      }
      return { ...state, currentInput: input, selectedCol: next }
    }

    case 'REMOVE_LETTER': {
      if (state.gameOver || state.revealRow >= 0) return state
      const input = [...state.currentInput]
      if (input[state.selectedCol] !== '') {
        input[state.selectedCol] = ''
        return { ...state, currentInput: input }
      }
      // cursor on empty → go to previous filled
      for (let i = state.selectedCol - 1; i >= 0; i--) {
        if (input[i] !== '') {
          input[i] = ''
          return { ...state, currentInput: input, selectedCol: i }
        }
      }
      return state
    }

    case 'SELECT_COL': {
      if (state.gameOver || state.revealRow >= 0) return state
      return { ...state, selectedCol: action.col }
    }

    case 'SUBMIT': {
      if (!action.result) return { ...state, shakeRow: true }
      return { ...state, revealRow: state.currentRow }
    }

    case 'COMMIT_REVEAL': {
      const newBoards = state.boards.map((board, bi) => {
        const row = action.tiles[bi]
        const solved = board.solved || row.every(t => t.status === 'correct')
        return { rows: [...board.rows, row], solved }
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
        keyStatuses: buildKeyStatuses(newBoards),
        revealRow: -1,
        bounceRow: allSolved,
      }
    }

    case 'CLEAR_ANIMATE':
      return { ...state, shakeRow: false, bounceRow: false }

    case 'NEW_GAME':
      return initState(action.mode)

    default:
      return state
  }
}

// ─── public hook ───────────────────────────────────────────────────────────────

export function useGame(initialMode: GameMode = 'classic') {
  const [state, dispatch] = useReducer(reducer, initialMode, initState)

  const addLetter = useCallback((letter: string) => {
    dispatch({ type: 'ADD_LETTER', letter })
  }, [])

  const removeLetter = useCallback(() => {
    dispatch({ type: 'REMOVE_LETTER' })
  }, [])

  const selectCol = useCallback((col: number) => {
    dispatch({ type: 'SELECT_COL', col })
  }, [])

  const submitGuess = useCallback(() => {
    const guess = state.currentInput.join('')
    if (guess.length < 5 || state.currentInput.some(l => l === '')) {
      dispatch({ type: 'SUBMIT', result: null })
      return { error: 'short' as const }
    }
    if (!VALID_WORDS.has(guess)) {
      dispatch({ type: 'SUBMIT', result: null })
      return { error: 'invalid' as const }
    }
    // evaluate against all secrets
    const tiles: TileData[][] = state.secrets.map(secret =>
      evaluate(guess, secret).map((status, i) => ({ letter: guess[i], status }))
    )
    dispatch({ type: 'SUBMIT', result: tiles })
    return { tiles }
  }, [state.currentInput, state.secrets])

  const commitReveal = useCallback((tiles: TileData[][]) => {
    dispatch({ type: 'COMMIT_REVEAL', tiles })
  }, [])

  const clearAnimate = useCallback(() => {
    dispatch({ type: 'CLEAR_ANIMATE' })
  }, [])

  const newGame = useCallback((mode: GameMode) => {
    dispatch({ type: 'NEW_GAME', mode })
  }, [])

  return { state, addLetter, removeLetter, selectCol, submitGuess, commitReveal, clearAnimate, newGame }
}
