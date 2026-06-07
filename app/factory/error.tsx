'use client'

export default function FactoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-400 mb-2">An error occurred while rendering this view.</p>
      {error.message && (
        <p className="text-xs text-gray-500 italic mb-6 max-w-2xl mx-auto">{error.message}</p>
      )}
      <button
        onClick={() => reset()}
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
