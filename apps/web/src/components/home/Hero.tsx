import { Link } from 'react-router-dom'
import { ArtworkTrack } from './ArtworkTrack'

import './Hero.css'

export function Hero() {
  return (
    <section className="home-hero">
      <ArtworkTrack />

      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-eyebrow type-italic-label">
          STUDENT INDEPENDENT DESIGNERS & ARTISTS
        </p>

        <h1 className="hero-title type-header">
          Student talent,<br />
          real creative work.
        </h1>

        <p className="hero-description type-body-2">
          SIDA builds a campus community for student artists and connects
          organizations with students looking to gain practical creative
          experience and strengthen their portfolios.
        </p>

        <div className="hero-actions">
          <Link to="/members" className="hero-button type-body-2">
            Meet the Artists
          </Link>

          <Link to="/commission" className="hero-button type-body-2">
            Request a Commission
          </Link>
        </div>
      </div>
    </section>
  )
}