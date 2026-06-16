import { useState } from 'react'
import type { ComparePhase, ComparisonResult } from '../types'

function fmt(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function fmtTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function ProgressDisplay({
  statusMessage,
  step,
  totalSteps,
}: {
  statusMessage: string
  step: number
  totalSteps: number
}) {
  const pct = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0
  return (
    <div className="compare-running">
      <div className="compare-running-header">
        <div className="compare-spinner" />
        <span className="compare-running-label">{statusMessage}</span>
        <span className="compare-step-count">
          {step}/{totalSteps}
        </span>
      </div>
      <div className="compare-progress-track">
        <div className="compare-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ResultDisplay({ result }: { result: ComparisonResult }) {
  const { baseline, improved } = result
  const [activeTab, setActiveTab] = useState<'baseline' | 'improved'>('improved')

  return (
    <div className="compare-result">
      <div className="compare-columns">
        <div className="compare-card compare-card-baseline">
          <div className="compare-card-header">
            <span className="compare-card-dot baseline-dot" />
            <span className="compare-card-title">Baseline</span>
            <span className="compare-card-sub">Isolated agents · full schema</span>
          </div>
          <div className="compare-metrics">
            <div className="metric-single">
              <span className="metric-big">{baseline.db_calls}</span>
              <span className="metric-unit">DB calls</span>
            </div>
            <div className="metric-single">
              <span className="metric-big">{fmtTokens(baseline.schema_tokens)}</span>
              <span className="metric-unit">schema tokens</span>
            </div>
            <div className="metric-single">
              <span className="metric-big">{fmt(baseline.elapsed_ms)}</span>
              <span className="metric-unit">wall time</span>
            </div>
          </div>
        </div>

        <div className="compare-vs">vs</div>

        <div className="compare-card compare-card-improved">
          <div className="compare-card-header">
            <span className="compare-card-dot improved-dot" />
            <span className="compare-card-title">Improved</span>
            <span className="compare-card-sub">Blackboard · FAISS · DAG</span>
          </div>
          <div className="compare-metrics">
            <div className="metric-single">
              <span className="metric-big">{improved.db_calls}</span>
              <span className="metric-unit">DB calls</span>
            </div>
            <div className="metric-single">
              <span className="metric-big">{fmtTokens(improved.schema_tokens)}</span>
              <span className="metric-unit">schema tokens</span>
            </div>
            <div className="metric-single">
              <span className="metric-big">{fmt(improved.elapsed_ms)}</span>
              <span className="metric-unit">wall time</span>
            </div>
          </div>
          {improved.cache_hits > 0 && (
            <div className="compare-cache-note">
              {improved.cache_hits} cache hit{improved.cache_hits !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="arch-tabs">
        <button
          className={`arch-tab ${activeTab === 'baseline' ? 'arch-tab-active' : ''}`}
          onClick={() => setActiveTab('baseline')}
        >
          Baseline answer
        </button>
        <button
          className={`arch-tab ${activeTab === 'improved' ? 'arch-tab-active' : ''}`}
          onClick={() => setActiveTab('improved')}
        >
          Improved answer
        </button>
      </div>

      <div className="arch-answer">
        <p className="arch-answer-text">
          {activeTab === 'baseline' ? baseline.answer : improved.answer}
        </p>
      </div>
    </div>
  )
}

interface Props {
  phase: ComparePhase
  statusMessage: string
  step: number
  totalSteps: number
  result: ComparisonResult | null
  error: string | null
}

export default function ComparisonPanel({
  phase,
  statusMessage,
  step,
  totalSteps,
  result,
  error,
}: Props) {
  if (phase === 'idle') return null

  return (
    <div className="comparison-panel">
      {phase === 'running' && (
        <ProgressDisplay statusMessage={statusMessage} step={step} totalSteps={totalSteps} />
      )}
      {phase === 'done' && result && <ResultDisplay result={result} />}
      {phase === 'error' && error && (
        <div className="error-card">
          <div className="error-card-icon">!</div>
          <div className="error-card-body">
            <span className="error-card-title">Request failed</span>
            <span className="error-card-message">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
