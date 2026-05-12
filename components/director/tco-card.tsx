import type { TCOModel } from '@/lib/director/types'

export function TCOCard({ tco }: { tco: TCOModel }) {
  const max = Math.max(tco.cornelis_3yr_tco_M, tco.nvidia_3yr_tco_M, tco.broadcom_3yr_tco_M)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">TCO Model</h2>
        <span className="text-[10px] text-gray-500 italic">Sliders Day 3 — static baseline shown</span>
      </div>
      <div className="text-xs text-gray-300 mb-4">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Scenario</div>
        <p>{tco.deployment_scenario}</p>
        <p className="text-gray-500 mt-1">
          Baseline: {tco.baseline_size.toLocaleString()} units · Horizon: {tco.default_horizon_years}yr
        </p>
      </div>
      <div className="space-y-2.5 mb-4">
        <Bar label="Cornelis" value={tco.cornelis_3yr_tco_M} max={max} color="bg-blue-500" />
        <Bar label="NVIDIA InfiniBand" value={tco.nvidia_3yr_tco_M} max={max} color="bg-green-700" />
        <Bar label="Broadcom + RoCEv2" value={tco.broadcom_3yr_tco_M} max={max} color="bg-purple-700" />
      </div>
      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Advantage drivers</div>
        <ul className="text-xs text-gray-200 list-disc list-inside space-y-1">
          {tco.advantage_drivers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : (value / max) * 100
  return (
    <div className="text-xs">
      <div className="flex justify-between mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-bold">${value}M</span>
      </div>
      <div className="bg-gray-800 rounded h-2 overflow-hidden">
        <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
