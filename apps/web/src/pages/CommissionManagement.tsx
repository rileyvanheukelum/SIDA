import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import './CommissionManagement.css'
import API_URL from '../config/api'

const COMMISSION_STATUSES = [
  'SUBMITTED',
  'REVIEWING',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
] as const

type CommissionStatus = (typeof COMMISSION_STATUSES)[number]

const ALLOWED_TRANSITIONS: Record<CommissionStatus, CommissionStatus[]> = {
  SUBMITTED: ['REVIEWING', 'DECLINED'],
  REVIEWING: ['MATCHED', 'DECLINED'],
  MATCHED: ['IN_PROGRESS', 'DECLINED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  DECLINED: [],
}

type Member = {
  id: string
  name: string
  email: string
  title: string | null
  profileImage: string | null
}

type CommissionAssignment = {
  id: string
  assignedAt: string
  member: Member
}

type CommissionRequest = {
  id: string
  title: string
  description: string
  requirements: string | null
  contactName: string
  contactEmail: string
  category: string
  timeline: string | null
  dueDate: string | null
  status: CommissionStatus
  createdAt: string
  updatedAt: string
  assignments: CommissionAssignment[]
}

function formatStatus(status: CommissionStatus) {
  return status.replace('_', ' ')
}

function getAvailableStatuses(status: CommissionStatus) {
  return [status, ...ALLOWED_TRANSITIONS[status]]
}

function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString() : 'Not specified'
}

export function CommissionManagement() {
  const { accessToken } = useAuth()

  const [requests, setRequests] = useState<CommissionRequest[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [assignmentProcessingId, setAssignmentProcessingId] = useState<string | null>(null)
  const [expandedAssignmentsId, setExpandedAssignmentsId] = useState<string | null>(null)
  const [assignmentSearch, setAssignmentSearch] = useState('')

  async function loadRequests() {
    if (!accessToken) {
      setError('You must be logged in as leadership to view commission requests.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/commissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error(`Unable to load commission requests (${response.status}).`)
      }

      const data: CommissionRequest[] = await response.json()
      setRequests(
        data.map((request) => ({
          ...request,
          assignments: request.assignments ?? [],
        })),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading commission requests.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function loadMembers() {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_URL}/commissions/assignable-members`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error(`Unable to load assignable members (${response.status}).`)
      }

      const data: Member[] = await response.json()
      setMembers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading members.',
      )
    }
  }

  useEffect(() => {
    loadRequests()
    loadMembers()
    // The fetches should be refreshed when the authenticated session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  async function updateStatus(requestId: string, status: CommissionStatus) {
    if (!accessToken) {
      setError('You must be logged in to update commission requests.')
      return
    }

    setProcessingId(requestId)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/commissions/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Unable to update the request (${response.status}).`)
      }

      const updated: { id: string; status: CommissionStatus } = await response.json()
      setRequests((current) =>
        current.map((request) =>
          request.id === updated.id
            ? { ...request, status: updated.status }
            : request,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while updating the request.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function updateAssignment(
    requestId: string,
    memberId: string,
    isAssigned: boolean,
  ) {
    if (!accessToken) {
      setError('You must be logged in to manage assignments.')
      return
    }

    setAssignmentProcessingId(requestId)
    setError(null)

    try {
      const response = await fetch(
        isAssigned
          ? `${API_URL}/commissions/${requestId}/assignments/${memberId}`
          : `${API_URL}/commissions/${requestId}/assignments`,
        {
          method: isAssigned ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          ...(isAssigned ? {} : { body: JSON.stringify({ memberId }) }),
        },
      )

      if (!response.ok) {
        throw new Error(
          `Unable to ${isAssigned ? 'remove' : 'assign'} this artist (${response.status}).`,
        )
      }

      if (isAssigned) {
        setRequests((current) =>
          current.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  assignments: request.assignments.filter(
                    (assignment) => assignment.member.id !== memberId,
                  ),
                }
              : request,
          ),
        )
      } else {
        const assignment: CommissionAssignment = await response.json()
        setRequests((current) =>
          current.map((request) =>
            request.id === requestId
              ? { ...request, assignments: [...request.assignments, assignment] }
              : request,
          ),
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while updating the assignment.',
      )
    } finally {
      setAssignmentProcessingId(null)
    }
  }

  function toggleAssignmentDropdown(requestId: string) {
    setExpandedAssignmentsId((current) =>
      current === requestId ? null : requestId,
    )
    setAssignmentSearch('')
  }

  const activeRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status !== 'COMPLETED' && request.status !== 'DECLINED',
      ),
    [requests],
  )

  const completedRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === 'COMPLETED' || request.status === 'DECLINED',
      ),
    [requests],
  )

  const filteredMembers = useMemo(() => {
    const search = assignmentSearch.trim().toLowerCase()
    if (!search) return members

    return members.filter((member) =>
      [member.name, member.title ?? '', member.email]
        .join(' ')
        .toLowerCase()
        .includes(search),
    )
  }, [members, assignmentSearch])

  function renderCommission(request: CommissionRequest, index: number) {
    const isAssignmentDropdownOpen = expandedAssignmentsId === request.id
    const isAssignmentBusy = assignmentProcessingId === request.id

    return (
      <details
        className="commission-accordion"
        key={request.id}
        open={index === 0}
      >
        <summary className="commission-accordion-summary">
          <span className="commission-accordion-title type-subheading-4">
            {request.title}
          </span>
          <span className="commission-accordion-meta">
            <span className="commission-status-badge">
              {formatStatus(request.status)}
            </span>
            <span className="commission-accordion-chevron" aria-hidden="true" />
          </span>
        </summary>

        <div className="commission-accordion-content">
          <div className="commission-details-grid">
            <div className="commission-details-primary">
              <div className="commission-detail">
                <h3 className="type-subheading-4">Project Description</h3>
                <p className="type-body-2">{request.description}</p>
              </div>

              <div className="commission-detail">
                <h3 className="type-subheading-4">Requirements</h3>
                <p className="type-body-2">
                  {request.requirements || 'No additional requirements provided.'}
                </p>
              </div>
            </div>

            <div className="commission-details-secondary">
              <div className="commission-detail">
                <h3 className="type-subheading-4">Due Date</h3>
                <p className="type-body-2">{formatDate(request.dueDate)}</p>
              </div>

              <div className="commission-detail">
                <h3 className="type-subheading-4">Submitted</h3>
                <p className="type-body-2">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="commission-detail">
                <h3 className="type-subheading-4">Timeline</h3>
                <p className="type-body-2">
                  {request.timeline || 'No timeline provided.'}
                </p>
              </div>

              <div className="commission-detail">
                <h3 className="type-subheading-4">Contact</h3>
                <p className="type-body-2">{request.contactName}</p>
                <a
                  className="commission-contact-link type-body-2"
                  href={`mailto:${request.contactEmail}`}
                >
                  {request.contactEmail}
                </a>
              </div>
            </div>
          </div>

          <div className="commission-assigned">
            <h3 className="type-subheading-4">Assigned Artists</h3>
            {request.assignments.length === 0 ? (
              <p className="commission-no-assignees type-body-2">
                No artists assigned yet.
              </p>
            ) : (
              <ul className="commission-assignee-list">
                {request.assignments.map((assignment) => (
                  <li className="commission-assignee-chip" key={assignment.id}>
                    <span>{assignment.member.name}</span>
                    {assignment.member.title && (
                      <span className="commission-assignee-title">
                        {assignment.member.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="commission-controls">
            <label className="commission-control-field">
              <span className="type-subheading-4">Commission Status</span>
              <select
                value={request.status}
                disabled={
                  processingId !== null ||
                  ALLOWED_TRANSITIONS[request.status].length === 0
                }
                onChange={(event) => {
                  const nextStatus = event.target.value as CommissionStatus
                  if (
                    window.confirm(
                      `Change this request from ${formatStatus(request.status)} to ${formatStatus(nextStatus)}?`,
                    )
                  ) {
                    updateStatus(request.id, nextStatus)
                  }
                }}
              >
                {getAvailableStatuses(request.status).map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
              {processingId === request.id && (
                <span className="commission-control-hint">Updating status...</span>
              )}
            </label>

            <div className="commission-control-field commission-assignment-control">
              <span className="type-subheading-4">Manage Assignments</span>
              <button
                className="commission-assignment-trigger"
                type="button"
                aria-expanded={isAssignmentDropdownOpen}
                aria-controls={`assignment-list-${request.id}`}
                onClick={() => toggleAssignmentDropdown(request.id)}
              >
                <span>
                  {request.assignments.length
                    ? `${request.assignments.length} artist${request.assignments.length === 1 ? '' : 's'} assigned`
                    : 'Add/Remove Assignments'}
                </span>
                <span
                  className={`commission-select-chevron ${isAssignmentDropdownOpen ? 'is-open' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isAssignmentDropdownOpen && (
                <div
                  className="commission-assignment-menu"
                  id={`assignment-list-${request.id}`}
                >
                  <label className="commission-member-search">
                    <span className="sr-only">Search available members</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="10.8"
                        cy="10.8"
                        r="6.8"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="m16 16 4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="search"
                      value={assignmentSearch}
                      onChange={(event) => setAssignmentSearch(event.target.value)}
                      placeholder="Search members..."
                    />
                  </label>

                  {members.length === 0 ? (
                    <p className="commission-member-empty">
                      No assignable members available.
                    </p>
                  ) : filteredMembers.length === 0 ? (
                    <p className="commission-member-empty">
                      No members match your search.
                    </p>
                  ) : (
                    <div className="commission-member-list">
                      {filteredMembers.map((member) => {
                        const isAssigned = request.assignments.some(
                          (assignment) => assignment.member.id === member.id,
                        )

                        return (
                          <label
                            className="commission-member-option"
                            key={member.id}
                          >
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              disabled={isAssignmentBusy}
                              onChange={() =>
                                updateAssignment(
                                  request.id,
                                  member.id,
                                  isAssigned,
                                )
                              }
                            />
                            <span className="commission-member-copy">
                              <span className="commission-member-name">
                                {member.name}
                              </span>
                              <span className="commission-member-subtitle">
                                {member.title || member.email}
                              </span>
                            </span>
                            {isAssigned && (
                              <span className="commission-assigned-label">
                                Assigned
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {isAssignmentBusy && (
                    <p className="commission-control-hint">
                      Updating assignments...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </details>
    )
  }

  return (
    <main className="commission-management-page">
      <header className="commission-page-header">
        <p className="type-body-2">REVIEW COMMISSION REQUESTS</p>
        <h1 className="type-header">Commissions</h1>
        <p className="type-body-2">
          Review incoming project requests, contact information, requirements,
          assignments, and current progress.
        </p>
      </header>

      {error && (
        <div className="commission-alert" role="alert">
          {error}
        </div>
      )}

      <div className="commission-management-panel">
        <section
          className="commission-section"
          aria-labelledby="active-commissions-heading"
        >
          <div className="commission-section-heading">
            <div>
              <h2 id="active-commissions-heading" className="type-subheading-1">
                Active Commissions
              </h2>
              <p className="type-body-2">
                Commission requests that are currently being reviewed or worked on.
              </p>
            </div>
            <span
              className="commission-count commission-count-active"
              aria-label={`${activeRequests.length} active commissions`}
            >
              {activeRequests.length}
            </span>
          </div>

          {isLoading ? (
            <p className="commission-empty type-body-2">
              Loading commission requests...
            </p>
          ) : activeRequests.length === 0 ? (
            <p className="commission-empty type-body-2">
              There are no active commission requests.
            </p>
          ) : (
            <div className="commission-accordion-list">
              {activeRequests.map((request, index) =>
                renderCommission(request, index),
              )}
            </div>
          )}
        </section>

        <section
          className="commission-section commission-history-section"
          aria-labelledby="completed-commissions-heading"
        >
          <div className="commission-section-heading">
            <div>
              <h2
                id="completed-commissions-heading"
                className="type-subheading-1"
              >
                Completed Commissions
              </h2>
              <p className="type-body-2">
                A record of commissions that have previously been completed or declined.
              </p>
            </div>
            <span
              className="commission-count commission-count-history"
              aria-label={`${completedRequests.length} completed or declined commissions`}
            >
              {completedRequests.length}
            </span>
          </div>

          {isLoading ? null : completedRequests.length === 0 ? (
            <p className="commission-empty type-body-2">
              No completed or declined commissions yet.
            </p>
          ) : (
            <div className="commission-accordion-list">
              {completedRequests.map((request, index) =>
                renderCommission(request, index),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}