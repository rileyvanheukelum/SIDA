import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Work } from '../data/mock'
import { WorkCard } from '../components/WorkCard'
import './MemberProfile.css'

type Member = {
  id: string
  name: string
  title: string | null
  bio: string | null
  disciplines: string[]
  profileImage: string | null
  role: 'MEMBER' | 'LEADERSHIP'
}

export function MemberProfile() {
  const { memberId } = useParams()

  const [member, setMember] = useState<Member | null>(null)
  const [portfolio, setPortfolio] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMember() {
      if (!memberId) {
        setNotFound(true)
        setIsLoading(false)
        setIsPortfolioLoading(false)
        return
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/members/${encodeURIComponent(memberId)}`,
          { signal: controller.signal },
        )

        if (response.status === 404) {
          setNotFound(true)
          return
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: Member = await response.json()
        setMember(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred.',
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    async function fetchPortfolio() {
      if (!memberId) return

      try {
        const response = await fetch(
          `http://localhost:3000/api/members/${encodeURIComponent(memberId)}/works`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: Work[] = await response.json()
        setPortfolio(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setPortfolioError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred.',
        )
      } finally {
        if (!controller.signal.aborted) setIsPortfolioLoading(false)
      }
    }

    fetchMember()
    fetchPortfolio()

    return () => controller.abort()
  }, [memberId])

  if (isLoading) {
    return (
      <main className="member-profile-state">
        <p className="type-body-2">Loading member...</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="member-profile-state">
        <p className="type-subheading-2">Member not found.</p>
        <Link to="/members" className="member-profile-back">
          ← All Members
        </Link>
      </main>
    )
  }

  if (error || !member) {
    return (
      <main className="member-profile-state">
        <p className="type-subheading-2 member-profile-error">
          Unable to load member
        </p>
        <p className="type-body-2">{error || 'An unexpected error occurred.'}</p>
        <Link to="/members" className="member-profile-back">
          ← All Members
        </Link>
      </main>
    )
  }

  return (
    <main className="member-profile-page">
      <Link to="/members" className="member-profile-back">
        ← All Members
      </Link>

      <section className="member-profile-intro" aria-label="Member information">
        <div className="member-profile-copy">
          <p className="member-profile-eyebrow">
            {member.title || member.role}
          </p>

          <h1 className="member-profile-name">{member.name}</h1>

          {member.disciplines.length > 0 && (
            <ul className="member-profile-disciplines" aria-label="Disciplines">
              {member.disciplines.map((discipline) => (
                <li className="member-profile-discipline" key={discipline}>
                  {discipline}
                </li>
              ))}
            </ul>
          )}

          {member.bio && <p className="member-profile-bio">{member.bio}</p>}
        </div>

        <div className="member-profile-avatar">
          <img
            src={
              member.profileImage ||
              'https://placehold.co/500x500?text=SIDA+Member'
            }
            alt={`${member.name}'s profile`}
          />
        </div>
      </section>

      <section className="member-profile-portfolio" aria-labelledby="portfolio-heading">
        <h2 id="portfolio-heading" className="member-profile-section-title">
          Portfolio Work
        </h2>

        {isPortfolioLoading && (
          <p className="member-profile-message">Loading portfolio...</p>
        )}

        {portfolioError && (
          <p className="member-profile-message member-profile-error">
            Unable to load portfolio: {portfolioError}
          </p>
        )}

        {!isPortfolioLoading && !portfolioError && portfolio.length === 0 && (
          <p className="member-profile-message">
            This member has not published any work yet.
          </p>
        )}

        {!isPortfolioLoading && !portfolioError && portfolio.length > 0 && (
          <div className="member-profile-work-grid">
            {portfolio.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}