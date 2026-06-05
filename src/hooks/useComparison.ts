import { useCallback, useRef, useState } from 'react'
import type { CompareMode, ComparePhase, ComparisonResult } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function useComparison() {
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState<ComparePhase>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [step, setStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(3)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setIsRunning(false)
    setPhase('idle')
    setStatusMessage('')
    setStep(0)
    setResult(null)
    setError(null)
  }, [])

  const run = useCallback(
    async (query: string, mode: CompareMode) => {
      cancel()
      setIsRunning(true)
      setPhase('running')
      setResult(null)
      setError(null)
      setStatusMessage('Initializing comparison…')
      setStep(0)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(`${API_BASE}/api/v1/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, mode }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const messages = buffer.split('\n\n')
          buffer = messages.pop() ?? ''

          for (const message of messages) {
            const dataLine = message.split('\n').find((l) => l.startsWith('data: '))
            if (!dataLine) continue
            let ev: Record<string, unknown>
            try {
              ev = JSON.parse(dataLine.slice(6))
            } catch {
              continue
            }

            if (ev.event === 'compare_status') {
              setStatusMessage(ev.message as string)
              setStep(ev.step as number)
              setTotalSteps(ev.total as number)
            } else if (ev.event === 'comparison_complete') {
              setResult(ev as unknown as ComparisonResult)
              setPhase('done')
              setIsRunning(false)
            } else if (ev.event === 'error') {
              setError(ev.message as string)
              setPhase('error')
              setIsRunning(false)
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message)
          setPhase('error')
          setIsRunning(false)
        }
      }
    },
    [cancel]
  )

  return { isRunning, phase, statusMessage, step, totalSteps, result, error, run, cancel }
}
