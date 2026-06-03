import { PrioritizationView } from '@/components/factory/prioritization-view'

// Partner Prioritization — the partner-onboarding operating tool for the
// AI Partner Solutions & OEM Ecosystem motion. Three components in one view:
//   1. Impact × Effort 2×2 (interactive scatter + live-sortable roadmap)
//   2. Metrics framework that switches by partner type (OEM vs ISV)
//   3. "Scale beyond +1 partner" — the three structural axes
//
// Fully self-contained: seed partners live in client state, sliders tune the
// selected partner live, no knowledge-engine load needed (unlike the other
// V3 routes). Kept as a thin server page → client view to match the
// architect / partner route convention.

export default function PrioritizationPage() {
  return <PrioritizationView />
}
