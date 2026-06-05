import type { PipelineStats } from '../types'

interface Props {
  answer: string
  stats: PipelineStats | null
}

export default function ResultsPanel({ answer, stats }: Props) {
  return (
    <div className="results-panel">
      <div className="results-label">Answer</div>
      <p className="results-answer">{answer}</p>

      {stats && (
        <div className="results-meta">
          <span className="meta-item">
            <span className="meta-num">{(stats.total_ms / 1000).toFixed(1)}s</span>
            <span className="meta-sep">·</span>
          </span>
          <span className="meta-item">
            <span className="meta-num">{stats.plan_ms}ms</span>
            <span className="meta-desc"> plan</span>
            <span className="meta-sep">·</span>
          </span>
          <span className="meta-item">
            <span className="meta-num">{stats.exec_ms}ms</span>
            <span className="meta-desc"> exec</span>
            <span className="meta-sep">·</span>
          </span>
          <span className="meta-item">
            <span className="meta-num">{stats.synth_ms}ms</span>
            <span className="meta-desc"> synth</span>
            <span className="meta-sep">·</span>
          </span>
          <span className="meta-item">
            <span className="meta-num">{stats.db_calls}</span>
            <span className="meta-desc"> DB {stats.db_calls === 1 ? 'query' : 'queries'}</span>
          </span>
          {stats.cache_hits > 0 && (
            <span className="meta-item">
              <span className="meta-sep">·</span>
              <span className="meta-num meta-green">{stats.cache_hits}</span>
              <span className="meta-desc"> cached</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
