'use client'

// 3-way partner-type toggle: OEM / ISV / Neocloud-as-channel.
// System integrators + distributors consciously OUT of scope (no seeded
// data — see lens footer).

export type PartnerType = 'oem' | 'isv' | 'neocloud'

interface Props {
  partnerType: PartnerType
  onSelect: (t: PartnerType) => void
}

export function PartnerTypeToggle({ partnerType, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900/30">
      <div className="border-b border-gray-800 px-5 py-3">
        <div className="text-[10px] font-mono tracking-widest text-gray-500">
          PARTNER TYPE
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Three types in scope. Toggle teaches the role distinction.
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-3 md:divide-x md:divide-y-0">
        <Tab
          label="OEM"
          sublabel="System builders (Dell + Lenovo/Supermicro/HPE equiv)"
          selected={partnerType === 'oem'}
          onClick={() => onSelect('oem')}
        />
        <Tab
          label="ISV"
          sublabel="Software / orchestration (Red Hat · VMware · Nutanix · VAST)"
          selected={partnerType === 'isv'}
          onClick={() => onSelect('isv')}
        />
        <Tab
          label="NEOCLOUD-as-CHANNEL"
          sublabel="GPU-rental clouds · customer AND go-to-market"
          selected={partnerType === 'neocloud'}
          onClick={() => onSelect('neocloud')}
        />
      </div>
    </div>
  )
}

function Tab({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string
  sublabel: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left px-5 py-4 transition-colors',
        selected ? 'bg-[#76B900]/10' : 'hover:bg-gray-900/60',
        selected
          ? 'border-l-2 border-l-[#76B900] md:border-l-0 md:border-b-2 md:border-b-[#76B900]'
          : 'border-l-2 border-l-transparent md:border-l-0 md:border-b-2 md:border-b-transparent',
      ].join(' ')}
    >
      <div
        className={`text-sm font-semibold leading-tight ${
          selected ? 'text-[#76B900]' : 'text-gray-300'
        }`}
      >
        {label}
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest">
        <span className={selected ? 'text-[#76B900]/70' : 'text-gray-500'}>
          {sublabel}
        </span>
      </div>
    </button>
  )
}
