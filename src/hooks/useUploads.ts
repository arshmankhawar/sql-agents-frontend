import { useCallback, useEffect, useState } from 'react'
import type { UploadedDataset, UploadedDocument } from '../types'
import { useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

interface UploadResult {
  ok: boolean
  message: string
}

/**
 * Drives the upload endpoints: CSV/Excel → DB tables and documents → vector
 * store, plus listing what has already been uploaded. Auth headers and 401
 * logout are shared with the rest of the app via useAuth.
 */
export function useUploads() {
  const { authHeaders, logout } = useAuth()
  const [datasets, setDatasets] = useState<UploadedDataset[]>([])
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [busy, setBusy] = useState(false)

  // Fetch the current lists WITHOUT touching React state — callers decide when
  // to commit the result. Keeping setState out of here lets both the mount
  // effect and refresh() apply state after the await boundary.
  const fetchLists = useCallback(async (): Promise<{
    datasets: UploadedDataset[]
    documents: UploadedDocument[]
  } | null> => {
    const [dRes, fRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/datasets`, { headers: { ...authHeaders() } }),
      fetch(`${API_BASE}/api/v1/files`, { headers: { ...authHeaders() } }),
    ])
    if (dRes.status === 401 || fRes.status === 401) {
      logout()
      return null
    }
    return {
      datasets: dRes.ok ? (await dRes.json()).datasets ?? [] : [],
      documents: fRes.ok ? (await fRes.json()).documents ?? [] : [],
    }
  }, [authHeaders, logout])

  const refresh = useCallback(async () => {
    try {
      const lists = await fetchLists()
      if (lists) {
        setDatasets(lists.datasets)
        setDocuments(lists.documents)
      }
    } catch {
      /* listing is best-effort; ignore transient errors */
    }
  }, [fetchLists])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const lists = await fetchLists()
        if (lists && !cancelled) {
          setDatasets(lists.datasets)
          setDocuments(lists.documents)
        }
      } catch {
        /* best-effort on mount */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchLists])

  const post = useCallback(
    async (path: string, form: FormData): Promise<UploadResult> => {
      setBusy(true)
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          method: 'POST',
          headers: { ...authHeaders() }, // do NOT set Content-Type: browser sets multipart boundary
          body: form,
        })
        if (res.status === 401) {
          logout()
          return { ok: false, message: 'Session expired — please sign in again' }
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          return { ok: false, message: data.detail ?? `Upload failed (HTTP ${res.status})` }
        }
        await refresh()
        return { ok: true, message: 'Uploaded successfully' }
      } catch (err) {
        return { ok: false, message: (err as Error).message }
      } finally {
        setBusy(false)
      }
    },
    [authHeaders, logout, refresh]
  )

  const uploadCsv = useCallback(
    (file: File, datasetName: string, description?: string) => {
      const form = new FormData()
      form.append('file', file)
      form.append('dataset_name', datasetName)
      if (description) form.append('description', description)
      return post('/api/v1/upload/csv', form)
    },
    [post]
  )

  const uploadDocument = useCallback(
    (file: File, description?: string) => {
      const form = new FormData()
      form.append('file', file)
      if (description) form.append('description', description)
      return post('/api/v1/upload/file', form)
    },
    [post]
  )

  return { datasets, documents, busy, refresh, uploadCsv, uploadDocument }
}
