import { useState, useCallback } from 'react'
import type { GameMode, Stats } from '../types'

const KEY = (mode: GameMode) => `wordle-stats-${mode}`

function loadStats(mode: GameMode): Stats {
  try {
    const raw = localStorage.getItem(KEY(mode))
    if (raw) return JSON.parse(raw) as Stats
  } catch { /* ignore */ }
  return { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(9).fill(0) }
}

function saveStats(mode: GameMode, stats: Stats) {
  localStorage.setItem(KEY(mode), JSON.stringify(stats))
}

export function useStats(mode: GameMode) {
  const [stats, setStats] = useState<Stats>(() => loadStats(mode))

  const recordResult = useCallback((won: boolean, attempts: number) => {
    setStats(prev => {
      const next: Stats = {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        currentStreak: won ? prev.currentStreak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
        guessDistribution: prev.guessDistribution.map((v, i) =>
          won && i === attempts - 1 ? v + 1 : v
        ),
      }
      saveStats(mode, next)
      return next
    })
  }, [mode])

  const refreshStats = useCallback(() => {
    setStats(loadStats(mode))
  }, [mode])

  return { stats, recordResult, refreshStats }
}
