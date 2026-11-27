import { useEffect, useState } from 'react'
import { WorkCard } from '../components/WorkCard'
import type { Work } from '../data/mock'
import './Discover.css'
import API_URL from '../config/api'

export function Discover() {
  const [works, setWorks] = useState<Work[]>([])
  const [filter, setFilter] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchWorks() {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(`${API_URL}/works`)

        if (!response.ok) {
          throw new Error('Unable to load student work.')
        }

        const data: Work[] = await response.json()
        setWorks(data)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading student work.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorks()
  }, [])

  const categories = [
    'All',
    ...new Set(works.map((work) => work.category)),
  ]

  const visibleWorks = works.filter(
    (work) => filter === 'All' || work.category === filter,
  )

  return (
    <section className="discover-page">
      {/* PAGE INTRODUCTION */}
      <header className="discover-header">
        <p className="discover-eyebrow type-italic-label">
          DISCOVER
        </p>

        <h1 className="discover-title type-header">
          Student work
        </h1>

        <p className="discover-description type-body-2">
          Explore creative work from SIDA members.
        </p>
      </header>

      {/* LOADING STATE */}
      {isLoading ? (
        <p className="discover-message type-body-2">
          Loading student work...
        </p>
      ) : error ? (
        /* ERROR STATE */
        <p role="alert" className="discover-message discover-error type-body-2">
          {error}
        </p>
      ) : works.length === 0 ? (
        /* EMPTY STATE */
        <p className="discover-message type-body-2">
          No approved work has been published yet. Check back soon!
        </p>
      ) : (
        <>
          {/* CATEGORY FILTERS */}
          <div className="discover-filters">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                aria-pressed={filter === category}
                className={`discover-filter ${
                  filter === category ? 'is-active' : ''
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* WORK GRID */}
          {visibleWorks.length > 0 ? (
            <div className="discover-grid">
              {visibleWorks.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          ) : (
            <p className="discover-message type-body-2">
              No work found in this category.
            </p>
          )}
        </>
      )}
    </section>
  )
}