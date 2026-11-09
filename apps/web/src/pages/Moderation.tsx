import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

  const [completeCommission, setCompleteCommission] = useState<
    Record<string, boolean>
  >({})

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
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(
          `Unable to load the moderation queue (${response.status}).`,
        )
      }

      const data: ModerationWork[] = await response.json()
      setPending(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the moderation queue.',
      )
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
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(
          `Unable to load moderation history (${response.status}).`,
        )
      }

      const data: ModerationWork[] = await response.json()
      setHistory(data)
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : 'Unable to load moderation history.',
      )
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
    loadHistory()
  }, [accessToken])

  function toggleQueue(workId: string) {
    setExpandedQueue((current) =>
      current === workId ? null : workId,
    )
  }

  function toggleHistory(workId: string) {
    setExpandedHistory((current) =>
      current === workId ? null : workId,
    )
  }

  async function reviewWork(
    workId: string,
    decision: 'approve' | 'deny',
  ) {
    if (!accessToken) {
      setError('You must be logged in to review submissions.')
      return
    }

    setProcessingId(workId)
    setError(null)

    try {
      const shouldCompleteCommission =
        decision === 'approve' &&
        completeCommission[workId] === true

      const response = await fetch(
        `${API_URL}/moderation/${workId}/${decision}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(shouldCompleteCommission
              ? { 'Content-Type': 'application/json' }
              : {}),
          },
          ...(shouldCompleteCommission
            ? {
                body: JSON.stringify({
                  completeCommission: true,
                }),
              }
            : {}),
        },
      )

      if (!response.ok) {
        throw new Error(
          `Unable to ${decision} this submission (${response.status}).`,
        )
      }

      const reviewedWork: ModerationWork = await response.json()

      setPending((current) =>
        current.filter((work) => work.id !== workId),
      )

      setCompleteCommission((current) => {
        const next = { ...current }
        delete next[workId]
        return next
      })

      setExpandedQueue((current) =>
        current === workId ? null : current,
      )

      // Refresh the history so the reviewed submission appears there.
      await loadHistory()

      // Keep the returned response available if history refresh fails.
      if (reviewedWork.reviewedAt) {
        setHistory((current) => {
          const exists = current.some(
            (work) => work.id === reviewedWork.id,
          )

          if (exists) {
            return current.map((work) =>
              work.id === reviewedWork.id
                ? reviewedWork
                : work,
            )
          }

          return [reviewedWork, ...current]
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
      <PageHeader
        eyebrow="Leadership only"
        title="Moderation"
        description="Review member submissions before they are published publicly."
      />

      {error && (
        <div className="moderation-alert" role="alert">
          {error}
        </div>
      )}

      {/* PENDING QUEUE */}

      <section className="moderation-section">
        <div className="moderation-section-heading">
          <div>
            <p className="moderation-eyebrow">Review submissions</p>

            <h2 className="type-subheading-2">
              Pending queue
            </h2>
          </div>

          <span className="moderation-count">
            {pending.length}
          </span>
        </div>

        {isLoading ? (
          <p className="moderation-message">
            Loading moderation queue...
          </p>
        ) : pending.length === 0 ? (
          <div className="moderation-empty">
            <h3 className="type-subheading-3">
              Queue is clear
            </h3>

            <p className="type-body-2">
              There are currently no pending submissions to review.
            </p>
          </div>
        ) : (
          <div className="moderation-list">
            {pending.map((work) => {
              const isExpanded = expandedQueue === work.id
              const isProcessing = processingId === work.id

              return (
                <article
                  key={work.id}
                  className={`moderation-item ${
                    isExpanded ? 'is-expanded' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="moderation-item-toggle"
                    aria-expanded={isExpanded}
                    onClick={() => toggleQueue(work.id)}
                    disabled={processingId !== null}
                  >
                    <img
                      src={work.thumbnailUrl || work.mediaUrl}
                      alt=""
                      className="moderation-thumbnail"
                    />

                    <span className="moderation-item-summary">
                      <span className="moderation-category">
                        {work.category}
                      </span>

                      <span className="moderation-item-title">
                        {work.title}
                      </span>

                      <span className="moderation-submitted">
                        Submitted by {work.member.name}
                      </span>
                    </span>

                    <span className="moderation-toggle-icon">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="moderation-item-content">
                      <div className="moderation-work-details">
                        <div className="moderation-work-preview">
                          <img
                            src={work.mediaUrl}
                            alt={work.title}
                          />
                        </div>

                        <div className="moderation-work-information">
                          <p className="moderation-eyebrow">
                            Submission details
                          </p>

                          <p className="type-body-2">
                            {work.description ||
                              'No description provided.'}
                          </p>

                          <div className="moderation-meta">
                            <span>
                              <strong>Member:</strong>{' '}
                              {work.member.name}
                            </span>

                            <span>
                              <strong>Email:</strong>{' '}
                              {work.member.email}
                            </span>

                            <span>
                              <strong>Submitted:</strong>{' '}
                              {formatDate(work.createdAt)}
                            </span>
                          </div>

                          {work.commissionRequest && (
                            <div className="moderation-commission">
                              <p className="moderation-eyebrow">
                                Commission
                              </p>

                              <h3 className="type-subheading-4">
                                {work.commissionRequest.title}
                              </h3>

                              <p className="type-body-2">
                                Status:{' '}
                                {formatStatus(
                                  work.commissionRequest.status,
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="moderation-actions">
                        {work.commissionRequest?.status ===
                          'IN_PROGRESS' && (
                          <label className="moderation-completion">
                            <input
                              type="checkbox"
                              checked={
                                completeCommission[work.id] === true
                              }
                              onChange={(event) =>
                                setCompleteCommission((current) => ({
                                  ...current,
                                  [work.id]: event.target.checked,
                                }))
                              }
                              disabled={processingId !== null}
                            />

                            <span>
                              <strong>
                                Complete commission
                              </strong>

                              <span>
                                Mark this commission as completed
                                when approving this work.
                              </span>
                            </span>
                          </label>
                        )}

                        <div className="moderation-action-buttons">
                          <button
                            type="button"
                            className="moderation-button moderation-button-approve"
                            disabled={processingId !== null}
                            onClick={() =>
                              reviewWork(work.id, 'approve')
                            }
                          >
                            {isProcessing
                              ? 'Processing...'
                              : 'Approve submission'}
                          </button>

                          <button
                            type="button"
                            className="moderation-button moderation-button-deny"
                            disabled={processingId !== null}
                            onClick={() =>
                              reviewWork(work.id, 'deny')
                            }
                          >
                            {isProcessing
                              ? 'Processing...'
                              : 'Deny submission'}
                          </button>
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

      {/* MODERATION HISTORY */}

      <section className="moderation-section moderation-history">
        <div className="moderation-section-heading">
          <div>
            <p className="moderation-eyebrow">
              Previously reviewed
            </p>

            <h2 className="type-subheading-2">
              Moderation history
            </h2>
          </div>

          <span className="moderation-count">
            {history.length}
          </span>
        </div>

        <p className="moderation-history-description type-body-2">
          A record of submissions that have already been approved
          or denied.
        </p>

        {historyError && (
          <div className="moderation-alert" role="alert">
            {historyError}
          </div>
        )}

        {isHistoryLoading ? (
          <p className="moderation-message">
            Loading moderation history...
          </p>
        ) : history.length === 0 ? (
          <div className="moderation-empty">
            <h3 className="type-subheading-3">
              No reviewed submissions
            </h3>

            <p className="type-body-2">
              Reviewed submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="moderation-list">
            {history.map((work) => {
              const isExpanded = expandedHistory === work.id
              const approved = work.status === 'APPROVED'

              return (
                <article
                  key={work.id}
                  className={`moderation-item moderation-history-item ${
                    isExpanded ? 'is-expanded' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="moderation-item-toggle"
                    aria-expanded={isExpanded}
                    onClick={() => toggleHistory(work.id)}
                  >
                    <img
                      src={work.thumbnailUrl || work.mediaUrl}
                      alt=""
                      className="moderation-thumbnail"
                    />

                    <span className="moderation-item-summary">
                      <span className="moderation-category">
                        {work.category}
                      </span>

                      <span className="moderation-item-title">
                        {work.title}
                      </span>

                      <span className="moderation-submitted">
                        {work.member.name}
                        {work.reviewedAt
                          ? ` · ${formatDate(work.reviewedAt)}`
                          : ''}
                      </span>
                    </span>

                    <span
                      className={`moderation-status ${
                        approved
                          ? 'moderation-status-approved'
                          : 'moderation-status-denied'
                      }`}
                    >
                      {approved ? 'Approved' : 'Denied'}
                    </span>

                    <span className="moderation-toggle-icon">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="moderation-item-content">
                      <div className="moderation-work-details">
                        <div className="moderation-work-preview">
                          <img
                            src={work.mediaUrl}
                            alt={work.title}
                          />
                        </div>

                        <div className="moderation-work-information">
                          <p className="moderation-eyebrow">
                            Review details
                          </p>

                          <p className="type-body-2">
                            {work.description ||
                              'No description provided.'}
                          </p>

                          <div className="moderation-meta">
                            <span>
                              <strong>Member:</strong>{' '}
                              {work.member.name}
                            </span>

                            <span>
                              <strong>Submitted:</strong>{' '}
                              {formatDate(work.createdAt)}
                            </span>

                            {work.reviewedAt && (
                              <span>
                                <strong>Reviewed:</strong>{' '}
                                {formatDate(work.reviewedAt)}
                              </span>
                            )}
                          </div>

                          {work.commissionRequest && (
                            <div className="moderation-commission">
                              <p className="moderation-eyebrow">
                                Commission
                              </p>

                              <h3 className="type-subheading-4">
                                {work.commissionRequest.title}
                              </h3>

                              <p className="type-body-2">
                                Status:{' '}
                                {formatStatus(
                                  work.commissionRequest.status,
                                )}
                              </p>
                            </div>
                          )}
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
    </main>
  )
}