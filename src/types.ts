export interface BaseEvent {
  event: string
  ts: number
}

export interface PlanningStartedEvent extends BaseEvent {
  event: 'planning_started'
}

export interface DomainsIdentifiedEvent extends BaseEvent {
  event: 'domains_identified'
  domains: string[]
  requires_cross_domain_plot: boolean
}

export interface SSETask {
  id: string
  description: string
  task_type: 'sql' | 'derived' | 'plot'
  domain: string
  depends_on: string[]
}

export interface PlanningCompleteEvent extends BaseEvent {
  event: 'planning_complete'
  task_count: number
  tasks: SSETask[]
}

export interface TaskStartedEvent extends BaseEvent {
  event: 'task_started'
  task_id: string
  task_type: 'sql' | 'derived' | 'plot'
  domain: string
  description: string
}

export interface TaskCompletedEvent extends BaseEvent {
  event: 'task_completed'
  task_id: string
  task_type: 'sql' | 'derived' | 'plot'
  domain: string
  description: string
  source: 'owner' | 'subscriber' | 'cache' | 'derived' | 'blackboard' | 'unknown'
  row_count: number
  elapsed_ms: number
}

export interface SynthesisStartedEvent extends BaseEvent {
  event: 'synthesis_started'
}

export interface ChartDataset {
  label: string
  data: number[]
}

export interface ChartPayload {
  task_id: string
  chart_type: 'bar_chart' | 'line_chart' | 'pie_chart' | 'table'
  title: string
  labels?: string[]
  datasets?: ChartDataset[]
  values?: number[]
  columns?: string[]
  rows?: Record<string, unknown>[]
}

export interface PipelineStats {
  plan_ms: number
  exec_ms: number
  synth_ms: number
  total_ms: number
  db_calls: number
  cache_hits: number
}

export interface SynthesisCompleteEvent extends BaseEvent {
  event: 'synthesis_complete'
  answer: string
  charts: ChartPayload[]
  stats: PipelineStats
}

export interface ErrorEvent extends BaseEvent {
  event: 'error'
  message: string
  phase: string
}

export type SSEEvent =
  | PlanningStartedEvent
  | DomainsIdentifiedEvent
  | PlanningCompleteEvent
  | TaskStartedEvent
  | TaskCompletedEvent
  | SynthesisStartedEvent
  | SynthesisCompleteEvent
  | ErrorEvent

export type TaskStatus = 'pending' | 'running' | 'completed'
export type Phase = 'idle' | 'planning' | 'executing' | 'synthesizing' | 'done' | 'error'

// ── Comparison types ──────────────────────────────────────────────────────────

export type CompareMode = 1 | 2 | 3
export type ComparePhase = 'idle' | 'running' | 'done' | 'error'

export interface CompareSystemMetrics {
  db_calls: number
  schema_tokens: number
  elapsed_ms: number
  answer: string
}

export interface ImprovedMetrics extends CompareSystemMetrics {
  cache_hits: number
}

export interface CompareDelta {
  db_calls_saved: number
  db_calls_saved_pct: number
  schema_tokens_saved: number
  schema_tokens_saved_pct: number
  time_diff_ms: number
  winner: 'baseline' | 'improved'
}

export interface ComparisonResult {
  event: 'comparison_complete'
  mode: CompareMode
  latency_ms: number
  baseline: CompareSystemMetrics
  improved: ImprovedMetrics
  delta: CompareDelta
}
