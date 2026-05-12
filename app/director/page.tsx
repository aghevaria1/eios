import fs from 'node:fs'
import path from 'node:path'

function loadActiveTarget() {
  const configPath = path.join(process.cwd(), 'data', 'targets', 'config.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as { active_target: string }
  const targetPath = path.join(process.cwd(), 'data', 'targets', config.active_target, 'target.json')
  const target = JSON.parse(fs.readFileSync(targetPath, 'utf-8')) as { name: string }
  return target
}

export default function DirectorPage() {
  const target = loadActiveTarget()
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          EdgeInferenceOS v2 <span className="text-blue-400">— Director PM Operating Framework</span>
        </h1>
        <p className="text-gray-300 text-sm mb-1">Target: {target.name}</p>
        <p className="text-gray-500 text-sm">(under construction)</p>
      </div>
    </div>
  )
}
