import type { KeyStatus } from '../types'

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

const STATUS_CLS: Record<KeyStatus, string> = {
  correct: 'bg-green-600  text-white',
  present: 'bg-yellow-500 text-white',
  absent:  'bg-zinc-600   text-white',
  unused:  'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100',
}

interface Props {
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
  disabled?: boolean
}

export function Keyboard({ keyStatuses, onKey, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[500px] px-1 select-none">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5">
          {row.map(key => {
            const isWide = key === 'ENTER' || key === '⌫'
            const status = keyStatuses[key] ?? 'unused'
            return (
              <button
                key={key}
                disabled={disabled}
                onPointerDown={e => { e.preventDefault(); onKey(key) }}
                className={[
                  'flex items-center justify-center rounded font-bold uppercase',
                  'transition-colors duration-100 active:scale-95',
                  'h-14 text-sm',
                  isWide ? 'px-3 flex-[1.5]' : 'flex-1',
                  'max-w-[2.8rem]',
                  isWide ? 'max-w-[4rem]' : '',
                  STATUS_CLS[status],
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                ].filter(Boolean).join(' ')}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
