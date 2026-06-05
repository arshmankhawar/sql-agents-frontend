import type { Phase, SSETask, TaskStatus } from '../types'

interface Props {
  phase: Phase
  tasks: SSETask[]
  taskStatuses: Record<string, TaskStatus>
}

const DOMAIN_COLORS: Record<string, string> = {
  airport: '#38bdf8',
  tech_startup: '#a78bfa',
  restaurant: '#fb923c',
  global: '#34d399',
  default: '#71717a',
}

const DOMAIN_LABELS: Record<string, string> = {
  tech_startup: 'Tech Startup',
  airport: 'Airport',
  restaurant: 'Restaurant',
  global: 'Global',
}

const TYPE_ICON: Record<string, string> = {
  sql: '⬡',
  derived: '∑',
  plot: '◈',
}

function cleanDesc(desc: string, type: string): string {
  if (type === 'sql') {
    const m = desc.match(/\bfrom\b\s+(?:the\s+)?(\w+)/i)
    if (m) return m[1]
    const words = desc.replace(/fetch|get|select|retrieve|query/gi, '').trim().split(/\s+/)
    return words.slice(0, 3).join(' ')
  }
  if (type === 'derived') {
    return desc
      .replace(/^compute\s+/i, '')
      .replace(/^calculate\s+/i, '')
      .replace(/^determine\s+/i, '')
      .trim()
      .slice(0, 44)
  }
  return desc.slice(0, 44)
}

const PHASE_STEPS: { key: Phase; label: string }[] = [
  { key: 'planning', label: 'Planning' },
  { key: 'executing', label: 'Executing' },
  { key: 'synthesizing', label: 'Synthesizing' },
  { key: 'done', label: 'Done' },
]

const PHASE_ORDER: Phase[] = ['planning', 'executing', 'synthesizing', 'done', 'error']

function PhaseBar({ phase }: { phase: Phase }) {
  const current = PHASE_ORDER.indexOf(phase)

  return (
    <div className="phase-bar">
      {PHASE_STEPS.map((s, i) => {
        const idx = PHASE_ORDER.indexOf(s.key)
        const isDone = current > idx && phase !== 'error'
        const isActive = phase === s.key

        return (
          <div key={s.key} className="phase-bar-item">
            <div className={`phase-dot ${isActive ? 'phase-dot-active' : ''} ${isDone ? 'phase-dot-done' : ''}`}>
              {isDone ? '✓' : null}
            </div>
            <span className={`phase-bar-label ${isActive ? 'phase-bar-label-active' : ''} ${isDone ? 'phase-bar-label-done' : ''}`}>
              {s.label}
            </span>
            {i < PHASE_STEPS.length - 1 && (
              <div className={`phase-connector ${isDone ? 'phase-connector-done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TaskItem({ task, status }: { task: SSETask; status: TaskStatus }) {
  const color = DOMAIN_COLORS[task.domain] ?? DOMAIN_COLORS.default
  const icon = TYPE_ICON[task.task_type] ?? '·'
  const label = cleanDesc(task.description, task.task_type)

  return (
    <div className={`task-item task-item-${status}`} style={{ '--dc': color } as React.CSSProperties}>
      <span className="task-item-icon">{icon}</span>
      <span className="task-item-label">{label}</span>
      <span className={`task-item-status ${status}`}>
        {status === 'completed' ? '✓' : status === 'running' ? '●' : '○'}
      </span>
    </div>
  )
}

export default function PipelineProgress({ phase, tasks, taskStatuses }: Props) {
  const domains = [...new Set(tasks.map((t) => t.domain))]

  return (
    <div className="pipeline-progress">
      <PhaseBar phase={phase} />

      {tasks.length === 0 ? (
        <div className="planning-state">
          <div className="spinner" />
          <span>Planning agent tasks…</span>
        </div>
      ) : (
        <div className="task-domains">
          {domains.map((domain) => (
            <div key={domain} className="task-domain-group">
              <div
                className="task-domain-label"
                style={{ color: DOMAIN_COLORS[domain] ?? DOMAIN_COLORS.default }}
              >
                {DOMAIN_LABELS[domain] ?? domain}
              </div>
              <div className="task-domain-items">
                {tasks
                  .filter((t) => t.domain === domain)
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      status={taskStatuses[task.id] ?? 'pending'}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
