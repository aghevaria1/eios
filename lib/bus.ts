import { EventEmitter } from 'events'
import { AnomalyEvent, PlacementDecision, SLAAlert } from './types'

class EIOSEventBus extends EventEmitter {
  private static instance: EIOSEventBus

  static getInstance(): EIOSEventBus {
    if (!EIOSEventBus.instance) {
      EIOSEventBus.instance = new EIOSEventBus()
      EIOSEventBus.instance.setMaxListeners(20)
    }
    return EIOSEventBus.instance
  }

  emitAnomaly(event: AnomalyEvent) {
    this.emit('node.anomaly.detected', event)
  }

  emitPlacement(decision: PlacementDecision) {
    this.emit('placement.decision', decision)
  }

  emitSLAAlert(alert: SLAAlert) {
    this.emit('sla.alert.fired', alert)
  }

  onAnomaly(handler: (event: AnomalyEvent) => void) {
    this.on('node.anomaly.detected', handler)
  }

  onPlacement(handler: (decision: PlacementDecision) => void) {
    this.on('placement.decision', handler)
  }

  onSLAAlert(handler: (alert: SLAAlert) => void) {
    this.on('sla.alert.fired', handler)
  }
}

export const bus = EIOSEventBus.getInstance()