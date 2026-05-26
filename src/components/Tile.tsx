import { useEffect, useRef } from 'react'
import type { TileStatus } from '../types'

const STATUS_BG: Record<TileStatus, string> = {
  correct: 'bg-green-600  border-green-600  text-white',
  present: 'bg-yellow-500 border-yellow-500 text-white',
  absent:  'bg-zinc-600   border-zinc-600   text-white',
  tbd:     'bg-transparent dark:bg-transparent border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white',
  empty:   'bg-transparent dark:bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white',
}

interface Props {
  letter: string
  status: TileStatus
  /** animate flip to reveal color */
  reveal?: boolean
  /** delay for staggered flip (ms) */
  revealDelay?: number
  /** shake animation */
  shake?: boolean
  /** bounce animation (win) */
  bounce?: boolean
  /** cursor is on this tile */
  selected?: boolean
  /** tile is in current active row */
  active?: boolean
  onClick?: () => void
}

export function Tile({ letter, status, reveal, revealDelay = 0, shake, bounce, selected, active, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reveal) {
      el.style.animationDelay = `${revealDelay}ms`
      el.classList.add('tile-flip')
      const onEnd = () => {
        el.classList.remove('tile-flip')
        el.style.animationDelay = ''
      }
      el.addEventListener('animationend', onEnd, { once: true })
      return () => el.removeEventListener('animationend', onEnd)
    }
  }, [reveal, revealDelay])

  useEffect(() => {
    const el = ref.current
    if (!el || !shake) return
    el.classList.add('tile-shake')
    const onEnd = () => el.classList.remove('tile-shake')
    el.addEventListener('animationend', onEnd, { once: true })
    return () => el.removeEventListener('animationend', onEnd)
  }, [shake])

  useEffect(() => {
    const el = ref.current
    if (!el || !bounce) return
    el.style.animationDelay = `${revealDelay}ms`
    el.classList.add('tile-bounce')
    const onEnd = () => {
      el.classList.remove('tile-bounce')
      el.style.animationDelay = ''
    }
    el.addEventListener('animationend', onEnd, { once: true })
    return () => el.removeEventListener('animationend', onEnd)
  }, [bounce, revealDelay])

  const pop = letter && status === 'tbd'

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={[
        'relative flex items-center justify-center',
        'border-2 rounded font-extrabold uppercase select-none',
        'transition-colors duration-150',
        STATUS_BG[status],
        active ? 'cursor-pointer' : '',
        selected && active
          ? 'ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-400'
          : '',
        pop ? 'tile-pop' : '',
      ].filter(Boolean).join(' ')}
      style={{ aspectRatio: '1' }}
    >
      {letter}
    </div>
  )
}
