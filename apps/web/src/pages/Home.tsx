import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Work } from '../data/mock'
import { WorkCard } from '../components/WorkCard'
import { Hero } from '../components/home/Hero'
import './Home.css'
import API_URL from '../config/api'

type RecentWork = Work & {
  createdAt: string
}

export function Home() {
  const [works, setWorks] = useState<RecentWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchRecentWorks() {
      try {
        setIsLoading(true)
        setError(null)

        // Use the same public works endpoint as the Discover page.
        const response = await fetch(`${API_URL}/works`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load recent student work.')
        }

        const data: RecentWork[] = await response.json()

        // The public /works endpoint supplies the work visible on Discover.
        // Sort newest-first and limit the landing page to three cards.
        const recentWorks = [...data]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          )
          .slice(0, 3)

        setWorks(recentWorks)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading recent student work.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchRecentWorks()

    return () => controller.abort()
  }, [])

  return (
    <div>
      <Hero />

      <section className="home-featured">
        <div className="home-featured-inner">
          <div className="home-featured-header">
            <div>
              <p className="type-italic-label">FEATURED</p>
              <h2 className="type-subheading-1">Recent Work</h2>
            </div>

            <Link
              to="/discover"
              className="home-featured-link type-subheading-4"
            >
              View All Work →
            </Link>
          </div>

          {isLoading ? (
            <p className="home-featured-message type-body-2" role="status">
              Loading recent work...
            </p>
          ) : error ? (
            <p className="home-featured-message home-featured-error type-body-2" role="alert">
              {error}
            </p>
          ) : works.length === 0 ? (
            <p className="home-featured-message type-body-2">
              No student work has been published yet. Check back soon!
            </p>
          ) : (
            <div className="home-featured-grid">
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}