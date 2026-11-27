import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Members.css'
import API_URL from '../config/api'

type Member = {
  id: string
  name: string
  title: string | null
  bio: string | null
  disciplines: string[]
  profileImage: string | null
  role: 'MEMBER' | 'LEADERSHIP'
}

export function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const leadershipTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMembers() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${API_URL}/members`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            `Unable to load members. Request failed with status ${response.status}.`,
          )
        }

        const data: Member[] = await response.json()
        setMembers(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchMembers()

    return () => controller.abort()
  }, [])

  const leadershipMembers = members.filter(
    (member) => member.role === 'LEADERSHIP',
  )

  const regularMembers = members.filter(
    (member) => member.role !== 'LEADERSHIP',
  )

  function scrollLeadership(direction: 'left' | 'right') {
    const track = leadershipTrackRef.current

    if (!track) return

    const scrollAmount = track.clientWidth * 0.8

    track.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <main className="members-page">
      <div className="members-page-inner">
        {/* ==============================
            PAGE HEADER
        ============================== */}

        <header className="members-page-header">
          <p className="type-italic-label members-eyebrow">
            COMMUNITY
          </p>

          <h1 className="type-header members-page-title">
            Meet the artists
          </h1>

          <p className="type-body-2 members-page-description">
            Browse SIDA members by discipline and explore their
            individual portfolios.
          </p>
        </header>

        {/* ==============================
            LOADING
        ============================== */}

        {isLoading && (
          <p className="members-message type-body-2">
            Loading members...
          </p>
        )}

        {/* ==============================
            ERROR
        ============================== */}

        {error && (
          <div className="members-error">
            <h2 className="type-subheading-3">
              Unable to load members
            </h2>

            <p className="type-body-2">{error}</p>

            <p className="type-body-2">
              Make sure the SIDA API is running at localhost:3000.
            </p>
          </div>
        )}

        {/* ==============================
            EMPTY STATE
        ============================== */}

        {!isLoading && !error && members.length === 0 && (
          <p className="members-message type-body-2">
            No members have been added yet.
          </p>
        )}

        {/* ==============================
            MEMBER SECTIONS
        ============================== */}

        {!isLoading && !error && members.length > 0 && (
          <>
            {/* ==============================
                LEADERSHIP
            ============================== */}

            {leadershipMembers.length > 0 && (
              <section className="members-section members-leadership">
                <div className="members-section-heading">
                  <h2 className="type-subheading-1">
                    Leadership
                  </h2>

                  {leadershipMembers.length > 1 && (
                    <div className="leadership-controls">
                      <button
                        type="button"
                        className="leadership-arrow"
                        aria-label="Scroll leadership members left"
                        onClick={() => scrollLeadership('left')}
                      >
                        &lt;
                      </button>

                      <button
                        type="button"
                        className="leadership-arrow"
                        aria-label="Scroll leadership members right"
                        onClick={() => scrollLeadership('right')}
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="leadership-track"
                  ref={leadershipTrackRef}
                >
                  {leadershipMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      variant="leadership"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ==============================
                GENERAL MEMBERS
            ============================== */}

            <section className="members-section members-directory">
              <div className="members-section-heading">
                <h2 className="type-subheading-1">
                  Members
                </h2>
              </div>

              {regularMembers.length > 0 ? (
                <div className="members-grid">
                  {regularMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      variant="regular"
                    />
                  ))}
                </div>
              ) : (
                <p className="members-message type-body-2">
                  No additional members have been added yet.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

/* ==============================
   MEMBER CARD
============================== */

function MemberCard({
  member,
  variant,
}: {
  member: Member
  variant: 'leadership' | 'regular'
}) {
  return (
    <Link
      to={`/members/${member.id}`}
      className={`member-card member-card-${variant}`}
    >
      <div className="member-card-image">
        <img
          src={
            member.profileImage ||
            'https://placehold.co/500x500?text=SIDA+Member'
          }
          alt={`${member.name}'s profile`}
          loading="lazy"
        />
      </div>

      <div className="member-card-content">
        <p className="member-card-title">
          {member.title || member.role}
        </p>

        <h3 className="member-card-name">
          {member.name}
        </h3>

        {member.disciplines.length > 0 && (
          <div className="member-card-disciplines">
            {member.disciplines.map((discipline) => (
              <span
                key={discipline}
                className="member-discipline"
              >
                {discipline}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}