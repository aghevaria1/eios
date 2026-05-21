// Server-side data loaders for the active target's JSON files.
// All readers are sync fs reads — fine for server components, do not import in client code.

import fs from 'node:fs'
import path from 'node:path'
import type {
  PhaseGateFile,
  ProductsFile,
  RoadmapFile,
  Segment,
  SegmentId,
  Target,
  TargetConfig,
} from './types'

const TARGETS_DIR = path.join(process.cwd(), 'data', 'targets')

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

export function loadActiveTargetId(): string {
  const config = readJson<TargetConfig>(path.join(TARGETS_DIR, 'config.json'))
  return config.active_target
}

function targetDir(targetId?: string): string {
  return path.join(TARGETS_DIR, targetId ?? loadActiveTargetId())
}

export function loadTarget(targetId?: string): Target {
  return readJson<Target>(path.join(targetDir(targetId), 'target.json'))
}

export function loadSegments(targetId?: string): Segment[] {
  return readJson<Segment[]>(path.join(targetDir(targetId), 'segments.json'))
}

export function loadSegment(segmentId: SegmentId | string, targetId?: string): Segment | undefined {
  return loadSegments(targetId).find((s) => s.id === segmentId)
}

export function loadProducts(targetId?: string): ProductsFile {
  return readJson<ProductsFile>(path.join(targetDir(targetId), 'products.json'))
}

export function loadRoadmap(targetId?: string): RoadmapFile {
  return readJson<RoadmapFile>(path.join(targetDir(targetId), 'roadmap.json'))
}

export function loadPhaseGate(targetId?: string): PhaseGateFile {
  return readJson<PhaseGateFile>(path.join(targetDir(targetId), 'phase-gate.json'))
}
