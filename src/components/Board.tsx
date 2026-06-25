import { useEffect, useRef, useState } from 'react'
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
  solvedAtRow: number
  revealingRow: number
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
  rows, currentInput, currentRow, maxRows, solved, solvedAtRow,
  revealingRow, shakeActive, bounceActive,
  selectedCol, onSelectCol, boardCount = 1,
}: Props) {
  const sz = SIZE[boardCount] ?? SIZE[1]

  // Per-board bounce: fires when this board's solved flips from false → true
  const prevSolved = useRef(solved)
  const [localBounce, setLocalBounce] = useState(false)
  const [boardFlash, setBoardFlash] = useState(false)

  useEffect(() => {
    if (!prevSolved.current && solved) {
      setLocalBounce(true)
      setBoardFlash(true)
      const t1 = setTimeout(() => setLocalBounce(false), 100 + 4 * 80 + 700)
      const t2 = setTimeout(() => setBoardFlash(false), 900)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    prevSolved.current = solved
  }, [solved])

  const effectiveBounce = localBounce || bounceActive

  return (
    <div
      className={`grid ${sz.gap}${boardFlash ? ' board-flash' : ''}`}
      style={{
        gridTemplateRows: `repeat(${maxRows}, 1fr)`,
        gridTemplateColumns: 'repeat(5, 1fr)',
        width: sz.w,
        height: sz.h,
        borderRadius: '4px',
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

          return (
            <div key={col} className={`${sz.text} w-full h-full`}>
              <Tile
                letter={letter}
                status={status}
                reveal={isRevealing}
                revealDelay={isRevealing ? col * STAGGER_MS : effectiveBounce && row === solvedAtRow ? col * 80 : 0}
                shake={shakeActive && isActive}
                bounce={effectiveBounce && row === solvedAtRow}
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
