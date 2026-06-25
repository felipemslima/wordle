import { useEffect, useState } from 'react'

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#a855f7','#06b6d4','#f97316','#ef4444']

interface Piece {
  id: number
  color: string
  left: string
  delay: string
  size: string
  duration: string
  round: boolean
}

function makePieces(): Piece[] {
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 0.7).toFixed(3)}s`,
    size: `${5 + Math.random() * 8}px`,
    duration: `${(0.8 + Math.random() * 0.8).toFixed(3)}s`,
    round: Math.random() > 0.4,
  }))
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (active) setPieces(makePieces())
  }, [active])

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: p.round ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
