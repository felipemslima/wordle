import { Modal } from './Modal'
import type { BoardState, GameMode } from '../../types'
import { buildShareText } from '../../utils/share'

interface Props {
  open: boolean
  onClose: () => void
  won: boolean
  secrets: string[]
  boards: BoardState[]
  attempts: number
  mode: GameMode
  onNewGame: () => void
}

const WIN_MSGS = ['Genial!', 'Incrível!', 'Ótimo!', 'Muito bem!', 'Boa!', 'Ufa!', 'Caramba!', 'Quase!', 'Ufa x2!']

export function ResultModal({ open, onClose, won, secrets, boards, attempts, mode, onNewGame }: Props) {
  const shareText = buildShareText(boards, mode, attempts, won)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      alert('Resultado copiado! 📋')
    } catch {
      prompt('Copie o resultado:', shareText)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-extrabold dark:text-white">
          {won ? (WIN_MSGS[attempts - 1] ?? 'Parabéns!') : 'Fim de jogo'}
        </h2>

        <div className="flex flex-wrap justify-center gap-2">
          {secrets.map((word, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Palavra {secrets.length > 1 ? i + 1 : ''}</p>
              <span className="text-lg font-extrabold tracking-widest text-green-600 dark:text-green-400">
                {word}
              </span>
            </div>
          ))}
        </div>

        {/* emoji preview */}
        <pre className="font-mono text-xs leading-tight whitespace-pre text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 w-full overflow-x-auto">
          {shareText}
        </pre>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg py-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Compartilhar
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-lg py-3 transition-colors"
          >
            Novo Jogo
          </button>
        </div>
      </div>
    </Modal>
  )
}
