import { useCallback, useRef, useState } from 'react'
import type {
  ChartPayload,
  Phase,
  PipelineStats,
  SSEEvent,
  SSETask,
  TaskStatus,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function useSSEQuery() {
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [tasks, setTasks] = useState<SSETask[]>([])
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({})
  const [answer, setAnswer] = useState<string | null>(null)
  const [charts, setCharts] = useState<ChartPayload[]>([])
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setPhase('idle')
    setTasks([])
    setTaskStatuses({})
    setAnswer(null)
    setCharts([])
    setStats(null)
    setError(null)
  }, [])

  const submit = useCallback(
    async (query: string) => {
      reset()
      setIsLoading(true)
      setPhase('planning')

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(`${API_BASE}/api/v1/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE messages are delimited by blank lines (\n\n)
          const messages = buffer.split('\n\n')
          buffer = messages.pop() ?? ''

          for (const message of messages) {
            const dataLine = message.split('\n').find((l) => l.startsWith('data: '))
            if (!dataLine) continue
            const jsonStr = dataLine.slice(6)
            let ev: SSEEvent
            try {
              ev = JSON.parse(jsonStr)
            } catch {
              continue
            }

            switch (ev.event) {
              case 'planning_started':
                setPhase('planning')
                break

              case 'domains_identified':
                break

              case 'planning_complete':
                setTasks(ev.tasks)
                setTaskStatuses(
                  Object.fromEntries(ev.tasks.map((t) => [t.id, 'pending' as TaskStatus]))
                )
                setPhase('executing')
                break

              case 'task_started':
                setTaskStatuses((prev) => ({ ...prev, [ev.task_id]: 'running' }))
                break

              case 'task_completed':
                setTaskStatuses((prev) => ({ ...prev, [ev.task_id]: 'completed' }))
                break

              case 'synthesis_started':
                setPhase('synthesizing')
                break

              case 'synthesis_complete':
                setAnswer(ev.answer)
                setCharts(ev.charts)
                setStats(ev.stats)
                setPhase('done')
                setIsLoading(false)
                break

              case 'error':
                setError(ev.message)
                setPhase('error')
                setIsLoading(false)
                break
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message)
          setPhase('error')
          setIsLoading(false)
        }
      }
    },
    [reset]
  )

  return {
    isLoading,
    phase,
    tasks,
    taskStatuses,
    answer,
    charts,
    stats,
    error,
    submit,
    reset,
  }
}
