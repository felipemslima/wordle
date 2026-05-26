import { Tile } from './Tile'
import type { TileData, TileStatus } from '../types'

const FLIP_MS = 350
const STAGGER_MS = 250

interface Props {
  rows: TileData[][]
  currentInput: string[]
  currentRow: number
  maxRows: number
  solved: boolean
  revealingRow: number   // -1 = none, N = revealing row N
  shakeActive: boolean
  bounceActive: boolean
  selectedCol: number
  onSelectCol: (col: number) => void
  /** 1 = classic, 2 = dueto, 4 = quarteto */
  boardCount?: 1 | 2 | 4
}

const SIZE: Record<number, { w: string; h: string; text: string; gap: string }> = {
  1: { w: 'min(90vw, 340px)',  h: 'min(108vw, 408px)', text: 'text-2xl sm:text-3xl', gap: 'gap-1.5' },
  2: { w: 'min(42vw, 240px)',  h: 'min(50vw,  290px)', text: 'text-xl',              gap: 'gap-1'   },
  4: { w: 'min(22vw, 190px)',  h: 'min(26vw,  228px)', text: 'text-base',            gap: 'gap-1'   },
}

export function Board({
  rows, currentInput, currentRow, maxRows, solved,
  revealingRow, shakeActive, bounceActive,
  selectedCol, onSelectCol, boardCount = 1,
}: Props) {
  const sz = SIZE[boardCount] ?? SIZE[1]

  return (
    <div
      className={`grid ${sz.gap}`}
      style={{
        gridTemplateRows: `repeat(${maxRows}, 1fr)`,
        gridTemplateColumns: 'repeat(5, 1fr)',
        width: sz.w,
        height: sz.h,
      }}
    >
      {Array.from({ length: maxRows }, (_, row) => {
        const isCompleted = row < rows.length
        const isActive = row === currentRow && !solved
        const isRevealing = row === revealingRow

        return Array.from({ length: 5 }, (_, col) => {
          let letter = ''
          let status: TileStatus = 'empty'

          if (isCompleted) {
            letter = rows[row][col]?.letter ?? ''
            status = rows[row][col]?.status ?? 'absent'
          } else if (isActive) {
            letter = currentInput[col] ?? ''
            status = letter ? 'tbd' : 'empty'
          }

          const lastSolvedRow = solved ? rows.length - 1 : -1

          return (
            <div key={col} className={`${sz.text} w-full h-full`}>
              <Tile
                letter={letter}
                status={status}
                reveal={isRevealing}
                revealDelay={isRevealing ? col * STAGGER_MS : bounceActive && row === lastSolvedRow ? col * 80 : 0}
                shake={shakeActive && isActive}
                bounce={bounceActive && row === lastSolvedRow}
                selected={isActive && selectedCol === col}
                active={isActive}
                onClick={isActive ? () => onSelectCol(col) : undefined}
              />
            </div>
          )
        })
      })}
    </div>
  )
}

export { FLIP_MS, STAGGER_MS }
