import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './Dashboard.css'

const API_URL = 'http://localhost:3000/api'

type WorkStatus = 'PENDING' | 'APPROVED' | 'DENIED'

type MemberWork = {
  id: string
  title: string
  description: string | null
  category: string
  mediaUrl: string
  thumbnailUrl: string | null
  status: WorkStatus
  reviewedAt: string | null
  createdAt: string
}

type CommissionStatus =
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'

type AssignedCommission = {
  id: string
  assignedAt: string
  commissionRequest: {
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
  }
}

type WorkForm = {
  title: string
  description: string
  category: string
  mediaUrl: string
  thumbnailUrl: string
}

type ProfileForm = {
  name: string
  title: string
  bio: string
  disciplines: string
  profileImage: string
}

const emptyForm: WorkForm = {
  title: '',
  description: '',
  category: '',
  mediaUrl: '',
  thumbnailUrl: '',
}

export function Dashboard() {
  const { member, accessToken, logout, updateMember } = useAuth()
  const navigate = useNavigate()

  const [works, setWorks] = useState<MemberWork[]>([])
  const [assignedCommissions, setAssignedCommissions] = useState<
    AssignedCommission[]
  >([])
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(true)
  const [commissionError, setCommissionError] = useState<string | null>(null)
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<WorkForm>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: '',
    title: '',
    bio: '',
    disciplines: '',
    profileImage: '',
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'commissions' | 'portfolio' | 'account'>(
    'commissions',
  )

  useEffect(() => {
    async function loadWorks() {
      if (!accessToken) {
        setIsLoading(false)
        setError('You must be logged in to view your work.')
        return
      }

      try {
        const response = await fetch(`${API_URL}/works/mine`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Unable to load your work (${response.status}).`)
        }

        const data: MemberWork[] = await response.json()
        setWorks(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while loading your work.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadWorks()
  }, [accessToken])

  useEffect(() => {
    async function loadAssignedCommissions() {
      if (!accessToken) {
        setIsLoadingCommissions(false)
        setCommissionError('You must be logged in to view your assigned commissions.')
        return
      }

      try {
        const response = await fetch(`${API_URL}/commissions/assigned-to-me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(
            `Unable to load your assigned commissions (${response.status}).`,
          )
        }

        const data: AssignedCommission[] = await response.json()
        setAssignedCommissions(data)
      } catch (err) {
        setCommissionError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while loading your assigned commissions.',
        )
      } finally {
        setIsLoadingCommissions(false)
      }
    }

    loadAssignedCommissions()
  }, [accessToken])

  useEffect(() => {
    if (!member) return

    setProfileForm({
      name: member.name,
      title: member.title || '',
      bio: member.bio || '',
      disciplines: member.disciplines.join(', '),
      profileImage: member.profileImage || '',
    })
  }, [member])

  function updateProfileForm(field: keyof ProfileForm, value: string) {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      setProfileError('You must be logged in to update your profile.')
      return
    }

    setIsSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          title: profileForm.title.trim() || null,
          bio: profileForm.bio.trim() || null,
          disciplines: profileForm.disciplines
            .split(',')
            .map((discipline) => discipline.trim())
            .filter(Boolean),
          profileImage: profileForm.profileImage.trim() || null,
        }),
      })

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null)
        const message = Array.isArray(responseBody?.message)
          ? responseBody.message.join(' ')
          : responseBody?.message

        throw new Error(
          message || `Unable to update your profile (${response.status}).`,
        )
      }

      const updatedMember: typeof member = await response.json()

      if (!updatedMember) {
        throw new Error('The server returned an invalid profile.')
      }

      updateMember(updatedMember)
      setProfileSuccess('Your profile has been updated.')
      setShowProfileForm(false)
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while updating your profile.',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function updateForm(field: keyof WorkForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleStartCommissionWork(commission: AssignedCommission['commissionRequest']) {
    setSelectedCommissionId(commission.id)
    setForm({
      ...emptyForm,
      title: commission.title,
      category: commission.category,
    })
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  function handleCloseWorkForm() {
    setShowForm(false)
    setSelectedCommissionId(null)
    setForm(emptyForm)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      setError('You must be logged in to submit work.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${API_URL}/works`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          mediaUrl: form.mediaUrl,
          thumbnailUrl: form.thumbnailUrl || undefined,
          ...(selectedCommissionId
            ? { commissionRequestId: selectedCommissionId }
            : {}),
        }),
      })

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null)
        const message = Array.isArray(responseBody?.message)
          ? responseBody.message.join(' ')
          : responseBody?.message

        throw new Error(
          message || `Unable to submit your work (${response.status}).`,
        )
      }

      const newWork: MemberWork = await response.json()

      setWorks((current) => [newWork, ...current])
      setForm(emptyForm)
      setSelectedCommissionId(null)
      setShowForm(false)
      setSuccess('Your work has been submitted for leadership review.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while submitting your work.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!member) {
    return null
  }

  const firstName = member.name.split(' ')[0]

  return (
    <section className="dashboard-page">
      {/* PAGE INTRODUCTION */}
      <header className="dashboard-header">
        <div className="dashboard-intro">
          <p className="type-italic-label">MEMBER PORTAL</p>

          <h1 className="type-header">
            Welcome, {firstName}
          </h1>

          <p className="type-body-2">
            Manage your profile, portfolio submissions, and commissions.
          </p>
        </div>

        <div className="dashboard-avatar">
          {member.profileImage ? (
            <img src={member.profileImage} alt={`${member.name}'s profile`} />
          ) : null}
        </div>
      </header>

      {/* DASHBOARD TABS */}
      <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'commissions'}
          className={`dashboard-tab ${activeTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissions')}
        >
          Commissions
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'portfolio'}
          className={`dashboard-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'account'}
          className={`dashboard-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      {/* TAB CONTENT */}
      <main className="dashboard-panel">
        {/* COMMISSIONS TAB */}
        {activeTab === 'commissions' && (
          <div role="tabpanel">
            <section className="dashboard-section">
              <h2 className="type-subheading-1">Assigned Commissions</h2>
              <p className="type-body-2 dashboard-section-description">
                Commission requests that you have accepted.
              </p>

              {commissionError && (
                <div role="alert" className="dashboard-error">
                  {commissionError}
                </div>
              )}

              {isLoadingCommissions ? (
                <p className="type-body-2 dashboard-empty">
                  Loading your assigned commissions...
                </p>
              ) : commissionError ? null : (
                <>
                  {assignedCommissions.filter(
                    ({ commissionRequest }) =>
                      commissionRequest.status !== 'COMPLETED' &&
                      commissionRequest.status !== 'DECLINED',
                  ).length === 0 ? (
                    <p className="type-body-2 dashboard-empty">
                      You don't have any active commissions yet.
                    </p>
                  ) : (
                    <div className="dashboard-accordion-list">
                      {assignedCommissions
                        .filter(
                          ({ commissionRequest }) =>
                            commissionRequest.status !== 'COMPLETED' &&
                            commissionRequest.status !== 'DECLINED',
                        )
                        .map(({ id, assignedAt, commissionRequest }) => (
                          <details className="dashboard-accordion" key={id}>
                            <summary className="dashboard-accordion-summary">
                              <span className="type-subheading-4">
                                {commissionRequest.title}
                              </span>
                              <CommissionStatusBadge status={commissionRequest.status} />
                            </summary>

                            <div className="dashboard-accordion-content">
                              <p className="type-italic-label">
                                {commissionRequest.category}
                              </p>

                              <p className="type-body-2">
                                {commissionRequest.description}
                              </p>

                              {commissionRequest.requirements && (
                                <div className="dashboard-detail">
                                  <h4 className="type-subheading-4">Requirements</h4>
                                  <p className="type-body-2">
                                    {commissionRequest.requirements}
                                  </p>
                                </div>
                              )}

                              <div className="dashboard-detail">
                                <h4 className="type-subheading-4">Due date</h4>
                                <p className="type-body-2">
                                  {commissionRequest.dueDate
                                    ? new Date(
                                        commissionRequest.dueDate,
                                      ).toLocaleDateString()
                                    : 'No due date specified'}
                                </p>
                              </div>

                              {commissionRequest.timeline && (
                                <div className="dashboard-detail">
                                  <h4 className="type-subheading-4">Timeline</h4>
                                  <p className="type-body-2">
                                    {commissionRequest.timeline}
                                  </p>
                                </div>
                              )}

                              <div className="dashboard-detail">
                                <h4 className="type-subheading-4">Contact</h4>
                                <p className="type-body-2">
                                  {commissionRequest.contactName}
                                </p>
                                <a
                                  href={`mailto:${commissionRequest.contactEmail}`}
                                  className="dashboard-text-link type-body-2"
                                >
                                  {commissionRequest.contactEmail}
                                </a>
                              </div>

                              <p className="dashboard-assigned-date type-body-2">
                                Assigned {new Date(assignedAt).toLocaleDateString()}
                              </p>

                              {['MATCHED', 'IN_PROGRESS'].includes(
                                commissionRequest.status,
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartCommissionWork(commissionRequest)
                                  }
                                  className="dashboard-primary-button"
                                >
                                  Submit Work for this Commission
                                </button>
                              )}
                            </div>
                          </details>
                        ))}
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="dashboard-section">
              <h2 className="type-subheading-1">Completed Commissions</h2>
              <p className="type-body-2 dashboard-section-description">
                Commission requests that you have completed.
              </p>

              {assignedCommissions.filter(
                ({ commissionRequest }) =>
                  commissionRequest.status === 'COMPLETED',
              ).length === 0 ? (
                <p className="type-body-2 dashboard-empty">
                  You haven't completed any commissions yet.
                </p>
              ) : (
                <div className="dashboard-accordion-list">
                  {assignedCommissions
                    .filter(
                      ({ commissionRequest }) =>
                        commissionRequest.status === 'COMPLETED',
                    )
                    .map(({ id, commissionRequest }) => (
                      <details className="dashboard-accordion" key={id}>
                        <summary className="dashboard-accordion-summary">
                          <span className="type-subheading-4">
                            {commissionRequest.title}
                          </span>
                          <CommissionStatusBadge status={commissionRequest.status} />
                        </summary>

                        <div className="dashboard-accordion-content">
                          <p className="type-italic-label">
                            {commissionRequest.category}
                          </p>
                          <p className="type-body-2">
                            {commissionRequest.description}
                          </p>
                          {commissionRequest.requirements && (
                            <div className="dashboard-detail">
                              <h4 className="type-subheading-4">Requirements</h4>
                              <p className="type-body-2">
                                {commissionRequest.requirements}
                              </p>
                            </div>
                          )}
                          {commissionRequest.dueDate && (
                            <div className="dashboard-detail">
                              <h4 className="type-subheading-4">Due date</h4>
                              <p className="type-body-2">
                                {new Date(
                                  commissionRequest.dueDate,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div role="tabpanel">
            <div className="dashboard-panel-heading">
              <div>
                <h2 className="type-subheading-1">Your Work</h2>
                <p className="type-body-2 dashboard-section-description">
                  Uploaded work will appear here. Submissions are reviewed
                  before appearing publicly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (showForm) {
                    handleCloseWorkForm()
                  } else {
                    setSelectedCommissionId(null)
                    setForm(emptyForm)
                    setShowForm(true)
                    setError(null)
                    setSuccess(null)
                  }
                }}
                className="dashboard-primary-button"
              >
                {showForm ? 'Cancel' : '+ New Work'}
              </button>
            </div>

            {success && (
              <div role="status" className="dashboard-success">
                {success}
              </div>
            )}

            {error && !showForm && (
              <div role="alert" className="dashboard-error">
                {error}
              </div>
            )}

            {isLoading ? (
              <p className="type-body-2 dashboard-empty">
                Loading your work...
              </p>
            ) : works.length === 0 ? (
              <p className="type-body-2 dashboard-empty">
                You haven't submitted any work yet.
              </p>
            ) : (
              <div className="dashboard-accordion-list">
                {works.map((work) => (
                  <details className="dashboard-accordion" key={work.id}>
                    <summary className="dashboard-accordion-summary">
                      <span className="type-subheading-4">{work.title}</span>
                      <StatusBadge status={work.status} />
                    </summary>

                    <div className="dashboard-work-content">
                      <div className="dashboard-work-details">
                        <p className="type-italic-label">{work.category}</p>

                        {work.description && (
                          <p className="type-body-2">{work.description}</p>
                        )}

                        {work.status === 'DENIED' && (
                          <p className="type-body-2">
                            This submission was not approved for publication.
                          </p>
                        )}
                      </div>

                      <div className="dashboard-work-preview">
                        <img
                          src={work.thumbnailUrl || work.mediaUrl}
                          alt={`Preview of ${work.title}`}
                        />
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div role="tabpanel">
            <h2 className="type-subheading-1">Edit Your Profile</h2>
            <p className="type-body-2 dashboard-section-description">
              These details appear on your public SIDA member profile.
            </p>

            {profileError && (
              <div role="alert" className="dashboard-error">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div role="status" className="dashboard-success">
                {profileSuccess}
              </div>
            )}

            <form
              onSubmit={handleProfileSubmit}
              className="dashboard-profile-form"
            >
              <DashboardField
                label="Name"
                id="profile-name"
              >
                <input
                  id="profile-name"
                  required
                  maxLength={120}
                  value={profileForm.name}
                  onChange={(event) =>
                    updateProfileForm('name', event.target.value)
                  }
                />
              </DashboardField>

              <DashboardField label="Title" id="profile-title">
                <input
                  id="profile-title"
                  maxLength={120}
                  value={profileForm.title}
                  onChange={(event) =>
                    updateProfileForm('title', event.target.value)
                  }
                />
              </DashboardField>

              <DashboardField label="Biography" id="profile-bio">
                <textarea
                  id="profile-bio"
                  rows={5}
                  maxLength={2000}
                  value={profileForm.bio}
                  onChange={(event) =>
                    updateProfileForm('bio', event.target.value)
                  }
                />
              </DashboardField>

              <DashboardField label="Disciplines" id="profile-disciplines">
                <input
                  id="profile-disciplines"
                  value={profileForm.disciplines}
                  onChange={(event) =>
                    updateProfileForm('disciplines', event.target.value)
                  }
                />
              </DashboardField>

              <DashboardField label="Profile image URL" id="profile-image">
                <input
                  id="profile-image"
                  type="url"
                  placeholder="https://..."
                  value={profileForm.profileImage}
                  onChange={(event) =>
                    updateProfileForm('profileImage', event.target.value)
                  }
                />
              </DashboardField>

              <div className="dashboard-form-actions">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="dashboard-primary-button"
                >
                  {isSavingProfile ? 'Saving...' : 'Save profile'}
                </button>

                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => {
                    setProfileForm({
                      name: member.name,
                      title: member.title || '',
                      bio: member.bio || '',
                      disciplines: member.disciplines.join(', '),
                      profileImage: member.profileImage || '',
                    })
                    setProfileError(null)
                    setProfileSuccess(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* NEW WORK MODAL */}
      {showForm && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => {
            if (!isSubmitting) handleCloseWorkForm()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-form-title"
            className="dashboard-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <h2 id="work-form-title" className="type-subheading-2">
                  {selectedCommissionId
                    ? 'Submit Commission Work'
                    : 'Submit New Work'}
                </h2>

                {selectedCommissionId && (
                  <p className="type-body-2">
                    This submission will be linked to your assigned commission.
                    It will still be sent to club leadership for review.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCloseWorkForm}
                aria-label="Close submission form"
                disabled={isSubmitting}
                className="dashboard-modal-close"
              >
                ×
              </button>
            </div>

            {error && (
              <div role="alert" className="dashboard-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="dashboard-profile-form">
              <DashboardField label="Title" id="work-title">
                <input
                  id="work-title"
                  required
                  maxLength={120}
                  placeholder="e.g. Spring musical poster"
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                />
              </DashboardField>

              <DashboardField label="Category" id="work-category">
                <select
                  id="work-category"
                  required
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                >
                  <option value="">Select a category</option>
                  <option>Graphic Design</option>
                  <option>Illustration / Painting</option>
                  <option>Motion Design</option>
                  <option>Video Editing</option>
                  <option>Filming</option>
                  <option>Photography</option>
                  <option>Web Design</option>
                  <option>Other</option>
                </select>
              </DashboardField>

              <DashboardField label="Description" id="work-description">
                <textarea
                  id="work-description"
                  rows={4}
                  maxLength={2000}
                  placeholder="Dimensions, deliverables, brand guidelines, files, etc."
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                />
              </DashboardField>

              <DashboardField label="Media URL" id="work-media-url">
                <input
                  id="work-media-url"
                  type="url"
                  required
                  placeholder="https://..."
                  value={form.mediaUrl}
                  onChange={(event) => updateForm('mediaUrl', event.target.value)}
                />
              </DashboardField>

              <DashboardField label="Thumbnail URL" id="work-thumbnail-url">
                <input
                  id="work-thumbnail-url"
                  type="url"
                  placeholder="https://..."
                  value={form.thumbnailUrl}
                  onChange={(event) =>
                    updateForm('thumbnailUrl', event.target.value)
                  }
                />
              </DashboardField>

              <button
                type="submit"
                disabled={isSubmitting}
                className="dashboard-primary-button dashboard-modal-submit"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
    </div>
  )
}

function DashboardField({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <label className="dashboard-field" htmlFor={id}>
      <span className="type-subheading-4">{label}</span>
      {children}
    </label>
  )
}

function StatusBadge({ status }: { status: WorkStatus }) {
  const labels: Record<WorkStatus, string> = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    DENIED: 'Denied',
  }

  return (
    <span className="dashboard-status-badge">
      {labels[status]}
    </span>
  )
}

function CommissionStatusBadge({
  status,
}: {
  status: CommissionStatus
}) {
  const labels: Record<CommissionStatus, string> = {
    SUBMITTED: 'Submitted',
    REVIEWING: 'Under Review',
    MATCHED: 'Matched',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    DECLINED: 'Declined',
  }

  return (
    <span className="dashboard-status-badge">
      {labels[status]}
    </span>
  )
}