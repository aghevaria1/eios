'use client'

import { useEffect, useState, useRef } from 'react'
import { NodeMetrics } from '../../lib/types'

interface AgentMessage {
  agent: string
  content: string
}

interface Incident {
  id: string
  nodeId: string
  customerId: string
  severity: string
  anomaly: string
  decision: string
  rca: string
  timestamp: number
}

export default function Dashboard() {
  const [nodes, setNodes] = useState<NodeMetrics[]>([])
  const [agentStreams, setAgentStreams] = useState<Record<string, string>>({
    telemetry: '',
    placement: '',
    sla: ''
  })
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)
  const [whatifQuery, setWhatifQuery] = useState('')
  const [whatifResponse, setWhatifResponse] = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [whatifRunning, setWhatifRunning] = useState(false)
  const [status, setStatus] = useState<string>('Initializing...')

  useEffect(() => {
    const es = new EventSource('/api/telemetry')
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (Array.isArray(data)) setNodes(data)
    }
    es.onerror = () => setStatus('Telemetry connection error')
    return () => es.close()
  }, [])

  useEffect(() => {
    fetchIncidents()
    const interval = setInterval(fetchIncidents, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchIncidents() {
    try {
      const res = await fetch('/api/incidents')
      if (res.ok) {
        const data = await res.json()
        setIncidents(data)
      }
    } catch {}
  }

  async function runAgents() {
    setAgentRunning(true)
    setAgentStreams({ telemetry: '', placement: '', sla: '' })
    setStatus('Running agent pipeline...')

    const res = await fetch('/api/agents/run', { method: 'POST' })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const payload = JSON.parse(line.slice(6))
        if (payload.type === 'stream') {
          setAgentStreams(prev => ({
            ...prev,
            [payload.payload.agent]: (prev[payload.payload.agent] || '') + payload.payload.token
          }))
        }
        if (payload.type === 'status') setStatus(payload.payload.message)
        if (payload.type === 'alert') fetchIncidents()
      }
    }
    setAgentRunning(false)
    setStatus('Pipeline complete')
  }

  async function runWhatIf() {
    if (!whatifQuery.trim()) return
    setWhatifRunning(true)
    setWhatifResponse('')

    const res = await fetch('/api/whatif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: whatifQuery })
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const payload = JSON.parse(line.slice(6))
        if (payload.token) setWhatifResponse(prev => prev + payload.token)
      }
    }
    setWhatifRunning(false)
  }

  function getNodeColor(node: NodeMetrics) {
    const memPct = (node.memUsedGB / node.memTotalGB) * 100
    if (node.util > 90 || node.tempC > 82 || memPct > 90) return 'border-red-500 bg-red-950'
    if (node.util > 75 || node.tempC > 75 || memPct > 80) return 'border-yellow-500 bg-yellow-950'
    return 'border-green-500 bg-green-950'
  }

  function getNodeDot(node: NodeMetrics) {
    const memPct = (node.memUsedGB / node.memTotalGB) * 100
    if (node.util > 90 || node.tempC > 82 || memPct > 90) return 'bg-red-400'
    if (node.util > 75 || node.tempC > 75 || memPct > 80) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 font-mono">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">EIOS <span className="text-blue-400">EdgeInferenceOS</span></h1>
            <p className="text-gray-400 text-sm">Multi-Agent AI Reasoning Layer · Edge Inference Infrastructure</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{status}</span>
            <button
              onClick={runAgents}
              disabled={agentRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-bold transition-colors"
            >
              {agentRunning ? '⚡ Running...' : '▶ Run Agents'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Panel 1 — Node Health */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Node Health</h2>
            <div className="space-y-2">
              {nodes.length === 0 && (
                <p className="text-gray-500 text-xs">Waiting for telemetry...</p>
              )}
              {nodes.map(node => (
                <div key={node.nodeId} className={`border rounded p-3 ${getNodeColor(node)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getNodeDot(node)}`} />
                      <span className="text-sm font-bold">{node.nodeId}</span>
                    </div>
                    <span className="text-xs text-gray-400">{node.tokensPerSec.toFixed(0)} tok/s</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-300">
                    <div>util <span className="text-white">{node.util.toFixed(1)}%</span></div>
                    <div>temp <span className="text-white">{node.tempC.toFixed(1)}C</span></div>
                    <div>mem <span className="text-white">{((node.memUsedGB/node.memTotalGB)*100).toFixed(0)}%</span></div>
                    <div>pwr <span className="text-white">{node.powerW.toFixed(0)}W</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2 — Agent Reasoning */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Agent Reasoning Chain</h2>
            <div className="space-y-3">
              {(['telemetry', 'placement', 'sla'] as const).map(agent => (
                <div key={agent} className="bg-gray-800 rounded p-3">
                  <div className="text-xs font-bold text-blue-400 mb-1 uppercase">
                    {agent === 'telemetry' ? '① Telemetry Agent' : agent === 'placement' ? '② Placement Agent' : '③ SLA Guardian'}
                  </div>
                  <div className="text-xs text-gray-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {agentStreams[agent] || <span className="text-gray-600">Waiting...</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3 — Incident Log */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Incident Log</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {incidents.length === 0 && (
                <p className="text-gray-500 text-xs">No incidents yet. Run agents to generate.</p>
              )}
              {incidents.map(inc => (
                <div key={inc.id} className="bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-700"
                  onClick={() => setExpandedIncident(expandedIncident === inc.id ? null : inc.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1 rounded ${inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? 'bg-red-800 text-red-200' : 'bg-yellow-800 text-yellow-200'}`}>
                        {inc.severity}
                      </span>
                      <span className="text-xs font-bold">{inc.nodeId}</span>
                      <span className="text-xs text-gray-400">{inc.customerId}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {expandedIncident === inc.id && (
                    <div className="mt-2 text-xs text-gray-300 whitespace-pre-wrap border-t border-gray-700 pt-2">
                      {inc.rca}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4 — What-If */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">What-If Query</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={whatifQuery}
                onChange={e => setWhatifQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runWhatIf()}
                placeholder="What if pod-alpha loses 40GB HBM3e at 3am peak?"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={runWhatIf}
                disabled={whatifRunning}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded text-xs font-bold transition-colors"
              >
                {whatifRunning ? '...' : 'Ask'}
              </button>
            </div>
            <div className="bg-gray-800 rounded p-3 max-h-52 overflow-y-auto">
              <div className="text-xs text-gray-300 whitespace-pre-wrap">
                {whatifResponse || <span className="text-gray-600">Ask a what-if question about your infrastructure...</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}