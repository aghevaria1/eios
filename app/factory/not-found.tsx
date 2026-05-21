import Link from 'next/link'

export default function FactoryNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-white mb-2">Segment not found</h1>
      <p className="text-sm text-gray-400 mb-6">
        The requested segment does not exist in this target&apos;s configuration.
      </p>
      <Link
        href="/factory/segments/federal-hpc"
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors"
      >
        Back to Federal HPC
      </Link>
    </div>
  )
}
