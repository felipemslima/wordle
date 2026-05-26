import type { GameMode } from '../types'
import { MODE_CONFIG } from '../types'

interface Props {
  mode: GameMode
  darkMode: boolean
  onToggleDark: () => void
  onHelp: () => void
  onStats: () => void
  onModeChange: (m: GameMode) => void
}

const MODES: GameMode[] = ['classic', 'dueto', 'quarteto']

export function Header({ mode, darkMode, onToggleDark, onHelp, onStats, onModeChange }: Props) {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        {/* left icons */}
        <div className="flex gap-1">
          <IconBtn onClick={onHelp} title="Como jogar" aria-label="ajuda">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </IconBtn>
        </div>

        {/* center: title + mode tabs */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-extrabold tracking-[.2em] leading-none dark:text-white">WORDLE PT</h1>
          <div className="flex rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
            {MODES.map(m => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={[
                  'px-3 py-0.5 transition-colors',
                  m === mode
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                ].join(' ')}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>
        </div>

        {/* right icons */}
        <div className="flex gap-1">
          <IconBtn onClick={onStats} title="Estatísticas" aria-label="estatísticas">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </IconBtn>
          <IconBtn onClick={onToggleDark} title="Alternar tema" aria-label="tema">
            {darkMode
              ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </IconBtn>
        </div>
      </div>
    </header>
  )
}

function IconBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      {children}
    </button>
  )
}
