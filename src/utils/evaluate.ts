import type { TileStatus } from '../types'

export function evaluate(guess: string, secret: string): TileStatus[] {
  const result: TileStatus[] = Array(5).fill('absent')
  const secretArr = secret.split('')
  const used = Array(5).fill(false)

  for (let i = 0; i < 5; i++) {
    if (guess[i] === secretArr[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === secretArr[j]) {
        result[i] = 'present'
        used[j] = true
        break
      }
    }
  }
  return result
}

const STATUS_PRIORITY: Record<string, number> = { correct: 3, present: 2, absent: 1, unused: 0 }

export function mergePriority(a: string, b: string): string {
  return (STATUS_PRIORITY[a] ?? 0) >= (STATUS_PRIORITY[b] ?? 0) ? a : b
}
