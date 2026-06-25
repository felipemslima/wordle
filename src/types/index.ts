export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'tbd'
export type KeyStatus = 'correct' | 'present' | 'absent' | 'unused'
export type GameMode = 'classic' | 'dueto' | 'quarteto'

export interface TileData {
  letter: string
  status: TileStatus
}

export interface BoardState {
  rows: TileData[][]
  solved: boolean
  solvedAtRow: number  // -1 while unsolved; set to currentRow when solved
}

export interface GameState {
  mode: GameMode
  secrets: string[]
  boards: BoardState[]
  currentInput: string[]
  selectedCol: number
  currentRow: number
  maxRows: number
  gameOver: boolean
  won: boolean
  keyStatuses: Record<string, KeyStatus>
  shakeRow: boolean
  revealRow: number
  bounceRow: boolean
}

export interface Stats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  guessDistribution: number[]
}

export const MODE_CONFIG: Record<GameMode, { boards: number; maxRows: number; label: string; emoji: string }> = {
  classic:  { boards: 1, maxRows: 6, label: 'Clássico',  emoji: '🟩' },
  dueto:    { boards: 2, maxRows: 7, label: 'Dueto',     emoji: '🔵' },
  quarteto: { boards: 4, maxRows: 9, label: 'Quarteto',  emoji: '🟣' },
}
