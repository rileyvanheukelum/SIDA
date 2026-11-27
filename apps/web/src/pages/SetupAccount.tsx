import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import API_URL from '../config/api'
import './SetupAccount.css'

export function SetupAccount() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/accept-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null)
        const message = Array.isArray(responseBody?.message)
          ? responseBody.message.join(' ')
          : responseBody?.message

        throw new Error(
          message || `Unable to set up your account (${response.status}).`,
        )
      }

      setIsComplete(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while setting up your account.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="setup-account-page">
      <header className="setup-account-header">
        <p className="setup-account-eyebrow type-body-2">
          MEMBER ACCESS
        </p>

        <h1 className="setup-account-title type-header">
          Set Up Your Account
        </h1>

        <p className="setup-account-description type-body-2">
          Choose a password to finish joining SIDA. Passwords must be at least
          12 characters.
        </p>
      </header>

      {isComplete ? (
        <div className="setup-account-form">
          <p role="status" className="type-body-2">
            Your account is ready. Sign in to continue.
          </p>

          <Link to="/login" className="setup-account-submit type-body-1">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form className="setup-account-form" onSubmit={handleSubmit}>
          <label className="setup-account-field" htmlFor="setup-password">
            <span className="setup-account-label type-subheading-4">
              Password
            </span>

            <input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="setup-account-input type-body-2"
            />
          </label>

          <label
            className="setup-account-field"
            htmlFor="setup-confirm-password"
          >
            <span className="setup-account-label type-subheading-4">
              Confirm password
            </span>

            <input
              id="setup-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="setup-account-input type-body-2"
            />
          </label>

          {error && (
            <p role="alert" className="setup-account-error type-body-2">
              {error}
            </p>
          )}

          {!token && (
            <p role="alert" className="setup-account-error type-body-2">
              This invitation link is missing its setup token.
            </p>
          )}

          <button
            type="submit"
            disabled={!token || isSubmitting}
            className="setup-account-submit type-body-1"
          >
            {isSubmitting ? 'Setting up account...' : 'Set password'}
          </button>
        </form>
      )}
    </section>
  )
}