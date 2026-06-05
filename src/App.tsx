import './App.css'
import ComparisonPanel from './components/ComparisonPanel'
import QueryInput from './components/QueryInput'
import { useComparison } from './hooks/useComparison'

const EXAMPLES = [
  'Compare average salaries between tech_startup and airport',
  'Show employee count by department across all domains',
  'List top earners in each domain',
]

export default function App() {
  const compare = useComparison()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-mark">◆</span>
            <div className="brand-text">
              <span className="brand-name">SQL Analytics</span>
              <span className="brand-sub">Multi-agent pipeline</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <QueryInput
          onSubmit={(q) => compare.run(q, 1)}
          onReset={compare.cancel}
          isLoading={compare.isRunning}
          examples={EXAMPLES}
        />

        <ComparisonPanel
          phase={compare.phase}
          statusMessage={compare.statusMessage}
          step={compare.step}
          totalSteps={compare.totalSteps}
          result={compare.result}
          error={compare.error}
        />
      </main>
    </div>
  )
}
