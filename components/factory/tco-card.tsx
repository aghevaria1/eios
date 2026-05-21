'use client'

import { useState } from 'react'
import type { TCOModel } from '@/lib/factory/types'

const CAPEX_RATIO = 0.7
const CAPEX_EXPONENT = 1.0
const OPEX_EXPONENT = 0.7
const LEAD_TIME_PENALTY_PER_WEEK = 0.005

function computeTCO(
  baseTCO: number,
  curSize: number,
  defaultSize: number,
  curLeadTime: number,
  defaultLeadTime: number,
): number {
  const sizeFactor = curSize / defaultSize
  const capExNew = baseTCO * CAPEX_RATIO * Math.pow(sizeFactor, CAPEX_EXPONENT)
  const opExNew = baseTCO * (1 - CAPEX_RATIO) * Math.pow(sizeFactor, OPEX_EXPONENT)
  const subtotal = capExNew + opExNew
  const leadTimeDelta = Math.max(0, curLeadTime - defaultLeadTime)
  const multiplier = 1 + leadTimeDelta * LEAD_TIME_PENALTY_PER_WEEK
  return subtotal * multiplier
}

export function TCOCard({ tco, unit }: { tco: TCOModel; unit: string }) {
  const defaultSize = tco.sensitivity_inputs.deployment_size.default
  const defaultLeadTime = tco.sensitivity_inputs.supply_lead_time_weeks.default
  const sizeRange = tco.sensitivity_inputs.deployment_size
  const leadTimeRange = tco.sensitivity_inputs.supply_lead_time_weeks

  const [size, setSize] = useState(defaultSize)
  const [leadTime, setLeadTime] = useState(defaultLeadTime)

  const cornelis = computeTCO(tco.cornelis_3yr_tco_M, size, defaultSize, leadTime, defaultLeadTime)
  const nvidia = computeTCO(tco.nvidia_3yr_tco_M, size, defaultSize, leadTime, defaultLeadTime)
  const broadcom = computeTCO(tco.broadcom_3yr_tco_M, size, defaultSize, leadTime, defaultLeadTime)
  const maxVal = Math.max(cornelis, nvidia, broadcom)

  return (
    <div className="bg-gray-900 border border-gray-800 border-l-[3px] border-l-[#C9A352] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C9A352] shrink-0" />
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">TCO Model</h2>
        </div>
        <span className="text-[10px] text-gray-500 italic">
          Adjust deployment size and supply lead time to model your scenario
        </span>
      </div>

      <div className="text-xs text-gray-300 mb-4">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Scenario</div>
        <p>{tco.deployment_scenario}</p>
        <p className="text-gray-500 mt-1">
          Default baseline: {tco.baseline_size.toLocaleString()} {unit} · {defaultLeadTime}-week supply · {tco.default_horizon_years}yr horizon
        </p>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Deployment size</span>
            <span className="text-white font-bold">
              {size.toLocaleString()} {unit}
            </span>
          </div>
          <input
            type="range"
            min={sizeRange.min}
            max={sizeRange.max}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-blue-500"
            aria-label="Deployment size"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>{sizeRange.min.toLocaleString()}</span>
            <span>{sizeRange.max.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Supply lead time</span>
            <span className="text-white font-bold">{leadTime} weeks</span>
          </div>
          <input
            type="range"
            min={leadTimeRange.min}
            max={leadTimeRange.max}
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="w-full accent-amber-500"
            aria-label="Supply lead time in weeks"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>{leadTimeRange.min} wk</span>
            <span>{leadTimeRange.max} wk</span>
          </div>
          <p className="text-[10px] text-gray-500 italic mt-1.5">
            Lead-time penalty represents compute idle cost during deployment delay (~0.5% TCO per additional week beyond default).
          </p>
        </div>
      </div>

      <div className="text-[11px] text-gray-300 mb-2 border-t border-gray-800 pt-3">
        <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Current scenario:</span>{' '}
        <span className="text-white">{size.toLocaleString()} {unit}</span>
        <span className="text-gray-500"> · </span>
        <span className="text-white">{leadTime}-week supply</span>
      </div>

      <div className="space-y-2.5 mb-4">
        <Bar label="Cornelis" value={cornelis} max={maxVal} color="bg-blue-500" />
        <Bar label="NVIDIA InfiniBand" value={nvidia} max={maxVal} color="bg-green-700" />
        <Bar label="Broadcom + RoCEv2" value={broadcom} max={maxVal} color="bg-purple-700" />
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
        <span className="text-white font-bold">${value.toFixed(1)}M</span>
      </div>
      <div className="bg-gray-800 rounded h-2 overflow-hidden">
        <div className={`${color} h-full transition-all duration-150`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
