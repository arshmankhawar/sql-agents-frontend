import { useRef, useState } from 'react'
import { useUploads } from '../hooks/useUploads'

type Tab = 'csv' | 'document'

function deriveDatasetName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function UploadPanel({ onClose }: { onClose: () => void }) {
  const { datasets, documents, busy, uploadCsv, uploadDocument } = useUploads()
  const [tab, setTab] = useState<Tab>('csv')

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [csvDesc, setCsvDesc] = useState('')

  const [docFile, setDocFile] = useState<File | null>(null)
  const [docDesc, setDocDesc] = useState('')

  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const onCsvSubmit = async () => {
    if (!csvFile || !datasetName.trim()) {
      setFeedback({ ok: false, message: 'Choose a file and give the dataset a name.' })
      return
    }
    const res = await uploadCsv(csvFile, datasetName.trim(), csvDesc.trim() || undefined)
    setFeedback(res)
    if (res.ok) {
      setCsvFile(null)
      setDatasetName('')
      setCsvDesc('')
      if (csvInputRef.current) csvInputRef.current.value = ''
    }
  }

  const onDocSubmit = async () => {
    if (!docFile) {
      setFeedback({ ok: false, message: 'Choose a document to upload.' })
      return
    }
    const res = await uploadDocument(docFile, docDesc.trim() || undefined)
    setFeedback(res)
    if (res.ok) {
      setDocFile(null)
      setDocDesc('')
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  return (
    <div className="upload-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-header">
          <span className="upload-title">Upload data &amp; documents</span>
          <button className="upload-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="upload-tabs">
          <button
            className={`upload-tab ${tab === 'csv' ? 'upload-tab-active' : ''}`}
            onClick={() => setTab('csv')}
          >
            CSV / Excel → Database
          </button>
          <button
            className={`upload-tab ${tab === 'document' ? 'upload-tab-active' : ''}`}
            onClick={() => setTab('document')}
          >
            Document → File search
          </button>
        </div>

        {tab === 'csv' ? (
          <div className="upload-body">
            <p className="upload-hint">
              Upload a CSV or Excel file. It becomes a queryable table the agents can
              analyse alongside the built-in domains.
            </p>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="upload-file-input"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setCsvFile(f)
                if (f && !datasetName) setDatasetName(deriveDatasetName(f.name))
              }}
            />
            <input
              type="text"
              className="upload-text-input"
              placeholder="Dataset name (e.g. sales_2024)"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
            />
            <input
              type="text"
              className="upload-text-input"
              placeholder="Description (optional)"
              value={csvDesc}
              onChange={(e) => setCsvDesc(e.target.value)}
            />
            <button className="upload-submit" onClick={onCsvSubmit} disabled={busy}>
              {busy ? 'Uploading…' : 'Upload dataset'}
            </button>
          </div>
        ) : (
          <div className="upload-body">
            <p className="upload-hint">
              Upload a PDF, Word, Markdown, or text document. It is chunked and indexed
              for semantic file search and hybrid answers.
            </p>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.docx,.md,.txt"
              className="upload-file-input"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
            <input
              type="text"
              className="upload-text-input"
              placeholder="Description (optional, improves retrieval)"
              value={docDesc}
              onChange={(e) => setDocDesc(e.target.value)}
            />
            <button className="upload-submit" onClick={onDocSubmit} disabled={busy}>
              {busy ? 'Uploading…' : 'Upload document'}
            </button>
          </div>
        )}

        {feedback && (
          <div className={`upload-feedback ${feedback.ok ? 'upload-ok' : 'upload-err'}`}>
            {feedback.message}
          </div>
        )}

        <div className="upload-lists">
          <div className="upload-list-col">
            <div className="upload-list-label">Datasets ({datasets.length})</div>
            {datasets.length === 0 ? (
              <div className="upload-empty">No datasets yet</div>
            ) : (
              datasets.map((d) => (
                <div key={d.name} className="upload-list-item">
                  <span className="upload-item-name">{d.name}</span>
                  <span className="upload-item-meta">{d.row_count} rows</span>
                </div>
              ))
            )}
          </div>
          <div className="upload-list-col">
            <div className="upload-list-label">Documents ({documents.length})</div>
            {documents.length === 0 ? (
              <div className="upload-empty">No documents yet</div>
            ) : (
              documents.map((d) => (
                <div key={d.id} className="upload-list-item">
                  <span className="upload-item-name">{d.filename}</span>
                  <span className="upload-item-meta">{d.chunk_count} chunks</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
