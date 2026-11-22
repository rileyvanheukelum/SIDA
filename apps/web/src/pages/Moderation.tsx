import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import './Moderation.css'

const API_URL = 'http://localhost:3000/api'

type ModerationStatus = 'APPROVED' | 'DENIED'

type ModerationWork = {
  id: string
  title: string
  description: string | null
  category: string
  mediaUrl: string
  thumbnailUrl: string | null
  createdAt: string
  reviewedAt?: string | null
  reviewNotes?: string | null
  status?: ModerationStatus
  member: {
    id: string
    name: string
    email: string
  }
  commissionRequest: {
    id: string
    title: string
    status: string
  } | null
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  }).format(new Date(date))
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}

export function Moderation() {
  const { accessToken } = useAuth()

  const [pending, setPending] = useState<ModerationWork[]>([])
  const [history, setHistory] = useState<ModerationWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [completeCommission, setCompleteCommission] = useState<Record<string, boolean>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  async function loadQueue() {
    if (!accessToken) {
      setError('You must be logged in to view the moderation queue.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/moderation/queue`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        throw new Error(`Unable to load the moderation queue (${response.status}).`)
      }
      const data: ModerationWork[] = await response.json()
      setPending(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the moderation queue.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadHistory() {
    if (!accessToken) {
      setHistoryError('You must be logged in to view moderation history.')
      setIsHistoryLoading(false)
      return
    }

    setIsHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await fetch(`${API_URL}/moderation/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        throw new Error(`Unable to load moderation history (${response.status}).`)
      }
      const data: ModerationWork[] = await response.json()
      setHistory(data)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Unable to load moderation history.')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
    loadHistory()
    // The requests should be refreshed when the authenticated session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  function toggleQueue(workId: string) {
    setExpandedQueue((current) => (current === workId ? null : workId))
  }

  function toggleHistory(workId: string) {
    setExpandedHistory((current) => (current === workId ? null : workId))
  }

  async function reviewWork(workId: string, decision: 'approve' | 'deny') {
    if (!accessToken) {
      setError('You must be logged in to review submissions.')
      return
    }

    setProcessingId(workId)
    setError(null)

    try {
      const shouldCompleteCommission =
        decision === 'approve' && completeCommission[workId] === true

      const response = await fetch(`${API_URL}/moderation/${workId}/${decision}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes: reviewNotes[workId]?.trim() || null,
          completeCommission: shouldCompleteCommission,
        }),
      })

      if (!response.ok) {
        throw new Error(`Unable to ${decision} this submission (${response.status}).`)
      }

      const reviewedWork: ModerationWork = await response.json()
      setPending((current) => current.filter((work) => work.id !== workId))
      setCompleteCommission((current) => {
        const next = { ...current }
        delete next[workId]
        return next
      })
      setReviewNotes((current) => {
        const next = { ...current }
        delete next[workId]
        return next
      })
      setExpandedQueue((current) => (current === workId ? null : current))

      await loadHistory()
      if (reviewedWork.reviewedAt) {
        setHistory((current) => {
          const exists = current.some((work) => work.id === reviewedWork.id)
          return exists
            ? current.map((work) => (work.id === reviewedWork.id ? reviewedWork : work))
            : [reviewedWork, ...current]
        })
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reviewing this submission.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <main className="moderation-page">
      <header className="moderation-header">
        <div className="moderation-intro">
          <p className="type-body-2">REVIEW SUBMISSIONS</p>
          <h1 className="type-header">Moderation</h1>
          <p className="type-body-2">
            Review member submissions before they are published publicly.
          </p>
        </div>
      </header>

      {error && <div className="moderation-alert" role="alert">{error}</div>}

      <div className="moderation-panel">
        <section className="moderation-section" aria-labelledby="pending-heading">
          <div className="moderation-section-heading">
            <div className="moderation-section-copy">
              <h2 id="pending-heading" className="type-subheading-1">Pending Review</h2>
              <p>Work submissions that are pending approval to be published.</p>
            </div>
            <span className="moderation-count moderation-count-pending" aria-label={`${pending.length} pending submissions`}>
              {pending.length}
            </span>
          </div>

          {isLoading ? (
            <p className="moderation-message">Loading moderation queue...</p>
          ) : pending.length === 0 ? (
            <div className="moderation-empty">
              <h3 className="type-subheading-3">Queue is clear</h3>
              <p className="type-body-2">There are currently no pending submissions to review.</p>
            </div>
          ) : (
            <div className="moderation-list">
              {pending.map((work) => {
                const isExpanded = expandedQueue === work.id
                const isProcessing = processingId === work.id

                return (
                  <article key={work.id} className={`moderation-item ${isExpanded ? 'is-expanded' : ''}`}>
                    <button
                      type="button"
                      className="moderation-item-toggle"
                      aria-expanded={isExpanded}
                      onClick={() => toggleQueue(work.id)}
                      disabled={processingId !== null}
                    >
                      <span className="moderation-item-title">{work.title}</span>
                      <span className="moderation-status moderation-status-pending">Pending Review</span>
                      <span className={`moderation-chevron ${isExpanded ? 'is-open' : ''}`} aria-hidden="true" />
                    </button>

                    {isExpanded && (
                      <div className="moderation-item-content">
                        <div className="moderation-work-details">
                          <div className="moderation-work-information">
                            <p className="moderation-category">{work.category}</p>
                            <p className="moderation-description">
                              {work.description || 'No description provided.'}
                            </p>

                            <div className="moderation-meta">
                              <span><strong>Submitted By:</strong> {work.member.name}</span>
                              <span><strong>Email:</strong> {work.member.email}</span>
                            </div>

                            <div className="moderation-review-row">
                              <label className="moderation-notes-field" htmlFor={`review-notes-${work.id}`}>
                                <span className="moderation-notes-label">Review Notes</span>
                                <textarea
                                  id={`review-notes-${work.id}`}
                                  className="moderation-notes-input"
                                  value={reviewNotes[work.id] ?? ''}
                                  onChange={(event) =>
                                    setReviewNotes((current) => ({ ...current, [work.id]: event.target.value }))
                                  }
                                  placeholder="Any comments or notes regarding the approval or denial of the submission."
                                  maxLength={2000}
                                  rows={3}
                                  disabled={processingId !== null}
                                />
                              </label>
                              <span className="moderation-submission-date">
                                <strong>Submission Date:</strong> {formatDate(work.createdAt)}
                              </span>
                            </div>

                            {work.commissionRequest && (
                              <div className="moderation-commission">
                                <p className="moderation-commission-label">Commission</p>
                                <strong>{work.commissionRequest.title}</strong>
                                <span>Status: {formatStatus(work.commissionRequest.status)}</span>
                              </div>
                            )}

                            {work.commissionRequest?.status === 'IN_PROGRESS' && (
                              <label className="moderation-completion">
                                <input
                                  type="checkbox"
                                  checked={completeCommission[work.id] === true}
                                  onChange={(event) =>
                                    setCompleteCommission((current) => ({ ...current, [work.id]: event.target.checked }))
                                  }
                                  disabled={processingId !== null}
                                />
                                <span>
                                  <strong>Complete commission</strong>
                                  <span>Mark this commission as completed when approving this work.</span>
                                </span>
                              </label>
                            )}

                            <div className="moderation-action-buttons">
                              <button
                                type="button"
                                className="moderation-button moderation-button-approve"
                                disabled={processingId !== null}
                                onClick={() => reviewWork(work.id, 'approve')}
                              >
                                {isProcessing ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="moderation-button moderation-button-deny"
                                disabled={processingId !== null}
                                onClick={() => reviewWork(work.id, 'deny')}
                              >
                                {isProcessing ? 'Processing...' : 'Deny'}
                              </button>
                            </div>
                          </div>

                          <div className="moderation-work-preview">
                            <img src={work.mediaUrl} alt={`Submitted work: ${work.title}`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="moderation-section moderation-history" aria-labelledby="history-heading">
          <div className="moderation-section-heading">
            <div className="moderation-section-copy">
              <h2 id="history-heading" className="type-subheading-1">Moderation History</h2>
              <p>A record of submissions that have previously been approved or denied.</p>
            </div>
            <span className="moderation-count moderation-count-history" aria-label={`${history.length} reviewed submissions`}>
              {history.length}
            </span>
          </div>

          {historyError && <div className="moderation-alert" role="alert">{historyError}</div>}

          {isHistoryLoading ? (
            <p className="moderation-message">Loading moderation history...</p>
          ) : history.length === 0 ? (
            <div className="moderation-empty">
              <h3 className="type-subheading-3">No reviewed submissions</h3>
              <p className="type-body-2">Reviewed submissions will appear here.</p>
            </div>
          ) : (
            <div className="moderation-list">
              {history.map((work) => {
                const isExpanded = expandedHistory === work.id
                const approved = work.status === 'APPROVED'

                return (
                  <article key={work.id} className={`moderation-item moderation-history-item ${isExpanded ? 'is-expanded' : ''}`}>
                    <button
                      type="button"
                      className="moderation-item-toggle"
                      aria-expanded={isExpanded}
                      onClick={() => toggleHistory(work.id)}
                    >
                      <span className="moderation-item-title">{work.title}</span>
                      <span className={`moderation-status ${approved ? 'moderation-status-approved' : 'moderation-status-denied'}`}>
                        {approved ? 'Approved' : 'Denied'}
                      </span>
                      <span className={`moderation-chevron ${isExpanded ? 'is-open' : ''}`} aria-hidden="true" />
                    </button>

                    {isExpanded && (
                      <div className="moderation-item-content">
                        <div className="moderation-work-details">
                          <div className="moderation-work-information">
                            <p className="moderation-category">{work.category}</p>
                            <p className="moderation-description">
                              {work.description || 'No description provided.'}
                            </p>
                            <div className="moderation-meta">
                              <span><strong>Submitted By:</strong> {work.member.name}</span>
                              <span><strong>Email:</strong> {work.member.email}</span>
                              <span><strong>Submission Date:</strong> {formatDate(work.createdAt)}</span>
                              {work.reviewedAt && <span><strong>Reviewed:</strong> {formatDate(work.reviewedAt)}</span>}
                            </div>
                            {work.reviewNotes && (
                              <div className="moderation-history-notes">
                                <strong>Review Notes</strong>
                                <p>{work.reviewNotes}</p>
                              </div>
                            )}
                            {work.commissionRequest && (
                              <div className="moderation-commission">
                                <p className="moderation-commission-label">Commission</p>
                                <strong>{work.commissionRequest.title}</strong>
                                <span>Status: {formatStatus(work.commissionRequest.status)}</span>
                              </div>
                            )}
                          </div>
                          <div className="moderation-work-preview">
                            <img src={work.mediaUrl} alt={`Submitted work: ${work.title}`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}