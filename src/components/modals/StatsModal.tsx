import { Modal } from './Modal'
import type { Stats, GameMode } from '../../types'
import { MODE_CONFIG } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  stats: Stats
  mode: GameMode
}

export function StatsModal({ open, onClose, stats, mode }: Props) {
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0

  const maxDist = Math.max(...stats.guessDistribution, 1)
  const maxRows = MODE_CONFIG[mode].maxRows

  return (
    <Modal open={open} onClose={onClose} title="Estatísticas">
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Jogados', value: stats.gamesPlayed },
            { label: 'Vitórias', value: `${winRate}%` },
            { label: 'Sequência', value: stats.currentStreak },
            { label: 'Recorde', value: stats.maxStreak },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-2xl font-extrabold dark:text-white">{value}</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Distribuição de palpites
          </p>
          <div className="space-y-1">
            {stats.guessDistribution.slice(0, maxRows).map((count, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right font-bold dark:text-zinc-300">{i + 1}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden h-5">
                  <div
                    className="h-full bg-green-600 flex items-center justify-end pr-1.5 text-white font-bold transition-all duration-500"
                    style={{ width: `${Math.max((count / maxDist) * 100, count > 0 ? 8 : 0)}%` }}
                  >
                    {count > 0 ? count : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
