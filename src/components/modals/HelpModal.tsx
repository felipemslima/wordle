import { Modal } from './Modal'

const EXAMPLES = [
  { word: 'CAMPO', statuses: ['correct','absent','absent','absent','absent'], desc: <><strong>C</strong> está na posição certa.</> },
  { word: 'PEDRA', statuses: ['absent','present','absent','absent','absent'], desc: <><strong>E</strong> está na palavra, mas no lugar errado.</> },
  { word: 'FESTA', statuses: ['absent','absent','absent','absent','absent'], desc: <>Nenhuma letra está na palavra.</> },
]

const BG: Record<string, string> = {
  correct: 'bg-green-600 text-white',
  present: 'bg-yellow-500 text-white',
  absent:  'bg-zinc-400 dark:bg-zinc-600 text-white',
}

interface Props { open: boolean; onClose: () => void }

export function HelpModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Como Jogar">
      <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
        <p>Adivinhe o <strong className="dark:text-white">WORDLE</strong> em 6 tentativas.</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Cada palpite deve ser uma palavra de <strong>5 letras</strong>.</li>
          <li>Clique em qualquer posição para digitar fora de ordem.</li>
          <li>Pressione <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">Enter</kbd> para enviar.</li>
          <li>Palavras sem acento — ex: AVIAO, CORACAO (6 letras ✗).</li>
        </ul>
        <hr className="border-zinc-200 dark:border-zinc-700" />
        <p className="font-bold dark:text-white">Exemplos</p>
        {EXAMPLES.map(({ word, statuses, desc }, i) => (
          <div key={i} className="space-y-1">
            <div className="flex gap-1">
              {word.split('').map((l, j) => (
                <div key={j} className={`w-9 h-9 flex items-center justify-center rounded border-2 font-extrabold text-sm ${BG[statuses[j]] ?? 'border-zinc-300 dark:border-zinc-600 dark:text-white'}`}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs">{desc}</p>
          </div>
        ))}
        <hr className="border-zinc-200 dark:border-zinc-700" />
        <div className="space-y-1 text-xs">
          <p><strong className="dark:text-white">Dueto</strong> — 2 palavras simultâneas, 7 tentativas.</p>
          <p><strong className="dark:text-white">Quarteto</strong> — 4 palavras simultâneas, 9 tentativas.</p>
        </div>
      </div>
    </Modal>
  )
}
