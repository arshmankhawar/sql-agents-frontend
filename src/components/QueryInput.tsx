import { type FormEvent, useState } from 'react'

interface Props {
  onSubmit: (query: string) => void
  onReset: () => void
  isLoading: boolean
  placeholder?: string
  examples?: string[]
}

const DEFAULT_EXAMPLES = [
  'Compare average salaries between tech_startup and airport',
  'Top 5 highest paid employees across all domains',
  'Salary distribution by department at the restaurant',
]

export default function QueryInput({
  onSubmit,
  onReset,
  isLoading,
  placeholder = 'Ask anything about the data…',
  examples = DEFAULT_EXAMPLES,
}: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q) onSubmit(q)
  }

  return (
    <div className="query-input-wrapper">
      <form onSubmit={handleSubmit} className="query-form">
        <div className="query-row">
          <input
            className="query-field"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          {isLoading ? (
            <button type="button" className="btn btn-cancel" onClick={onReset}>
              Stop
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
              Run →
            </button>
          )}
        </div>
      </form>
      {!isLoading && (
        <div className="examples">
          {examples.map((ex) => (
            <button
              key={ex}
              className="example-chip"
              onClick={() => {
                setValue(ex)
                onSubmit(ex)
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
