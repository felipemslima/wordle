import { useEffect, useCallback, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Board, FLIP_MS, STAGGER_MS } from './components/Board'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { HelpModal } from './components/modals/HelpModal'
import { StatsModal } from './components/modals/StatsModal'
import { ResultModal } from './components/modals/ResultModal'
import { useGame } from './hooks/useGame'
import { useStats } from './hooks/useStats'
import { useToast } from './hooks/useToast'
import type { GameMode } from './types'
import { MODE_CONFIG } from './types'

const ACCENT_MAP: Record<string, string> = {
  'Á':'A','À':'A','Â':'A','Ã':'A',
  'É':'E','È':'E','Ê':'E',
  'Í':'I','Ì':'I','Î':'I',
  'Ó':'O','Ò':'O','Ô':'O','Õ':'O',
  'Ú':'U','Ù':'U','Û':'U',
  'Ç':'C','Ñ':'N',
}

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark(d => !d)] as const
}

export default function App() {
  const [mode, setMode] = useState<GameMode>('classic')
  const [darkMode, toggleDark] = useDarkMode()
  const [showHelp, setShowHelp] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const { state, addLetter, removeLetter, selectCol, submitGuess, commitReveal, clearAnimate, newGame } = useGame(mode)
  const { stats, recordResult, refreshStats } = useStats(mode)
  const { message: toast, showToast } = useToast()

  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTiles = useRef<Parameters<typeof commitReveal>[0] | null>(null)

  const handleSubmit = useCallback(() => {
    const result = submitGuess()
    if ('error' in result) {
      showToast(result.error === 'short' ? 'Palpite incompleto!' : 'Palavra não encontrada!')
      return
    }
    const totalFlip = (5 - 1) * STAGGER_MS + FLIP_MS + 50
    pendingTiles.current = result.tiles!
    revealTimer.current = setTimeout(() => {
      commitReveal(pendingTiles.current!)
    }, totalFlip)
  }, [submitGuess, commitReveal, showToast])

  // Physical keyboard — handleSubmit in deps to avoid stale closure
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (showHelp || showStats || showResult) return
      const raw = e.key.toUpperCase()
      if (raw === 'ENTER') { handleSubmit(); return }
      if (raw === 'BACKSPACE') { removeLetter(); return }
      const ch = ACCENT_MAP[raw] ?? raw
      if (/^[A-Z]$/.test(ch)) addLetter(ch)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHelp, showStats, showResult, handleSubmit, addLetter, removeLetter])

  // Handle key press from virtual keyboard
  const handleKey = useCallback((key: string) => {
    if (key === 'ENTER') handleSubmit()
    else if (key === '⌫') removeLetter()
    else addLetter(key)
  }, [handleSubmit, removeLetter, addLetter])

  // After commit: check game over
  useEffect(() => {
    if (!state.gameOver) return
    const delay = state.won ? (5 - 1) * 80 + 600 + 200 : 400
    const t = setTimeout(() => {
      recordResult(state.won, state.currentRow)
      refreshStats()
      setShowResult(true)
    }, delay)
    return () => clearTimeout(t)
  }, [state.gameOver])

  // Clear shake/bounce
  useEffect(() => {
    if (!state.shakeRow && !state.bounceRow) return
    const t = setTimeout(clearAnimate, 600)
    return () => clearTimeout(t)
  }, [state.shakeRow, state.bounceRow])

  const handleModeChange = (m: GameMode) => {
    setMode(m)
    setShowResult(false)
    newGame(m)
  }

  const handleNewGame = () => {
    setShowResult(false)
    newGame(mode)
  }

  const cfg = MODE_CONFIG[mode]

  return (
    <div className="min-h-dvh flex flex-col bg-white dark:bg-zinc-950 transition-colors">
      <Header
        mode={mode}
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onHelp={() => setShowHelp(true)}
        onStats={() => { refreshStats(); setShowStats(true) }}
        onModeChange={handleModeChange}
      />

      <Toast message={toast} />

      <main className="flex-1 flex flex-col items-center justify-between py-4 gap-4">
        {/* Boards */}
        <div className={[
          'flex justify-center',
          mode === 'quarteto' ? 'flex-nowrap gap-2 w-full px-2' : 'flex-wrap gap-3',
          mode === 'classic'  ? 'max-w-sm'  : '',
          mode === 'dueto'    ? 'max-w-2xl' : '',
        ].join(' ')}>
          {state.boards.map((board, bi) => (
            <div key={bi} className="relative">
              {board.solved && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 whitespace-nowrap">
                  ✓ {state.secrets[bi]}
                </div>
              )}
              <Board
                rows={board.rows}
                currentInput={state.currentInput}
                currentRow={state.currentRow}
                maxRows={state.maxRows}
                solved={board.solved}
                revealingRow={state.revealRow}
                shakeActive={state.shakeRow}
                bounceActive={state.bounceRow}
                selectedCol={state.selectedCol}
                onSelectCol={selectCol}
                boardCount={cfg.boards as 1 | 2 | 4}
              />
            </div>
          ))}
        </div>

        {/* Keyboard */}
        <Keyboard
          keyStatuses={state.keyStatuses}
          onKey={handleKey}
          disabled={state.gameOver || state.revealRow >= 0}
        />
      </main>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <StatsModal open={showStats} onClose={() => setShowStats(false)} stats={stats} mode={mode} />
      <ResultModal
        open={showResult}
        onClose={() => setShowResult(false)}
        won={state.won}
        secrets={state.secrets}
        boards={state.boards}
        attempts={state.currentRow}
        mode={mode}
        onNewGame={handleNewGame}
      />
    </div>
  )
}
