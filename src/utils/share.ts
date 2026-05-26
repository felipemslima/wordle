import type { BoardState, GameMode } from '../types'
import { MODE_CONFIG } from '../types'

const EMOJI: Record<string, string> = {
  correct: '🟩',
  present: '🟨',
  absent:  '⬛',
  empty:   '⬜',
  tbd:     '⬜',
}

export function buildShareText(
  boards: BoardState[],
  mode: GameMode,
  attempts: number,
  won: boolean
): string {
  const cfg = MODE_CONFIG[mode]
  const result = won ? String(attempts) : 'X'
  let text = `Wordle PT · ${cfg.label} ${result}/${cfg.maxRows}\n\n`

  const rowCount = boards[0].rows.length
  for (let r = 0; r < rowCount; r++) {
    const parts = boards.map(b =>
      r < b.rows.length
        ? b.rows[r].map(t => EMOJI[t.status] ?? '⬛').join('')
        : '⬜⬜⬜⬜⬜'
    )
    text += parts.join(' ') + '\n'
  }

  return text.trim()
}
