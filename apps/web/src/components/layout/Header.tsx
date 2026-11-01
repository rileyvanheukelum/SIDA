
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

import './Header.css'

const nav = [
  ['/', 'Home'],
  ['/members', 'Members'],
  ['/discover', 'Work'],
  ['/commission', 'Request a Commission'],
]

export function Header() {
  const { member, logout } = useAuth()

  const navLinks = (
    <>
      {nav.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `header-link ${isActive ? 'active' : ''}`
          }
        >
          {label}
        </NavLink>
      ))}

      {member?.role === 'LEADERSHIP' && (
        <>
          <NavLink
            to="/leadership/moderation"
            className={({ isActive }) =>
              `header-link ${isActive ? 'active' : ''}`
            }
          >
            Moderation
          </NavLink>

          <NavLink
            to="/leadership/commissions"
            className={({ isActive }) =>
              `header-link ${isActive ? 'active' : ''}`
            }
          >
            Commissions
          </NavLink>
        </>
      )}
    </>
  )

  return (
    <header className="site-header">

      {/* LEFT DECORATIVE SHAPES */}
      <div className="header-brand">
        <div className="header-shape header-shape-yellow" />
        <div className="header-shape header-shape-orange" />
        <div className="header-shape header-shape-red" />

        <NavLink to="/" className="header-logo" aria-label="SIDA Home">
          SIDA
        </NavLink>
      </div>

      {/* DESKTOP NAVIGATION */}
      <nav className="header-nav" aria-label="Main navigation">
        {navLinks}
      </nav>

      {/* MOBILE NAVIGATION */}
      <details className="header-mobile-nav">
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">
          {navLinks}
        </nav>
      </details>

      {/* RIGHT ACCOUNT SECTION */}
      <div className="header-account">
        {member ? (
          <div className="header-account-actions">
            <NavLink to="/dashboard" className="header-button">
              Dashboard
            </NavLink>

            <button
              type="button"
              onClick={logout}
              className="header-button"
            >
              Log Out
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="header-button">
            Login
          </NavLink>
        )}
      </div>

    </header>
  )
}
