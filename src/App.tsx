import { useState } from 'react'
import './App.css'
import ComparisonPanel from './components/ComparisonPanel'
import Login from './components/Login'
import QueryInput from './components/QueryInput'
import UploadPanel from './components/UploadPanel'
import { useAuth } from './auth/AuthContext'
import { useComparison } from './hooks/useComparison'

const EXAMPLES = [
  'Compare average salaries between tech_startup and airport',
  'Show employee count by department across all domains',
  'List top earners in each domain',
]

export default function App() {
  const { isAuthenticated, logout } = useAuth()
  const compare = useComparison()
  const [showUpload, setShowUpload] = useState(false)

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner with-actions">
          <div className="header-brand">
            <span className="brand-mark">◆</span>
            <div className="brand-text">
              <span className="brand-name">SQL Analytics</span>
              <span className="brand-sub">Multi-agent pipeline</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="upload-button" onClick={() => setShowUpload(true)}>
              Upload data
            </button>
            <button className="logout-button" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {showUpload && <UploadPanel onClose={() => setShowUpload(false)} />}

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
