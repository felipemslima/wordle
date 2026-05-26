interface Props { message: string | null }

export function Toast({ message }: Props) {
  return (
    <div
      className={[
        'fixed top-16 left-1/2 -translate-x-1/2 z-50',
        'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
        'px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg',
        'pointer-events-none transition-all duration-300',
        message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      ].join(' ')}
    >
      {message ?? ''}
    </div>
  )
}
