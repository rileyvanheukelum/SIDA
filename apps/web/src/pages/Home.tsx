import { Link } from 'react-router-dom'
import { works } from '../data/mock'

import { WorkCard } from '../components/WorkCard'
import { Hero } from '../components/home/Hero'

import './Home.css'

export function Home() {
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

            <Link to="/discover" className="home-featured-link">
              View All Work →
            </Link>
          </div>

          <div className="home-featured-grid">
            {works
              .filter(w => w.status === 'approved')
              .map(w => (
                <WorkCard key={w.id} work={w} />
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}