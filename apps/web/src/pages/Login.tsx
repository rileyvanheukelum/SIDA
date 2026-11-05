import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

import './Login.css'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export function Login() {
  const { member, login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const state = location.state as LoginLocationState | null
  const destination = state?.from?.pathname ?? '/dashboard'

  if (member) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await login(email, password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to log in. Please try again.',
      )
    }
  }

  return (
    <section className="login-page">

      {/* PAGE INTRODUCTION */}
      <header className="login-header">
        <p className="login-eyebrow type-body-2">
          MEMBER ACCESS
        </p>

        <h1 className="login-title type-header">
          Member Login
        </h1>

        <p className="login-description type-body-2">
          Sign in to manage your SIDA profile, submitted work, and assigned
          commissions.
        </p>
      </header>

      {/* LOGIN FORM */}
      <form className="login-form" onSubmit={handleSubmit}>

        <label className="login-field" htmlFor="email">
          <span className="login-label type-subheading-4">
            Email
          </span>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@houghton.edu"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="login-input type-body-2"
          />
        </label>

        <label className="login-field" htmlFor="password">
          <span className="login-label type-subheading-4">
            Password
          </span>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your Password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="login-input type-body-2"
          />
        </label>

        {error && (
          <p role="alert" className="login-error type-body-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="login-submit type-body-1"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

      </form>
    </section>
  )
}