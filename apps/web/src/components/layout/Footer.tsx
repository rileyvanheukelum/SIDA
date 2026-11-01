import { NavLink } from 'react-router-dom'

import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">

      <div className="footer-description">
        Student Independent Designers and Artists - Built and maintained by
        SIDA students
      </div>

      <div className="footer-brand">
        <NavLink to="/" aria-label="SIDA Home">
          SIDA
        </NavLink>
      </div>

    </footer>
  )
}