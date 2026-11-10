import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

import './Header.css'

const nav = [
  ['/', 'Home'],
  ['/discover', 'Work'],
  ['/members', 'Members'],
  ['/commission', 'Request a Commission'],
] as const

export function Header() {
  const { member, logout } = useAuth()
  const location = useLocation()

  const headerRef = useRef<HTMLElement>(null)

  const isLeadership = member?.role === 'LEADERSHIP'

  // Leadership members do not need a separate Home navigation link.
  const visibleNav = isLeadership
    ? nav.filter(([to]) => to !== '/')
    : nav

  // Some accounts may not have a profile image.
  const profileImage =
    member &&
    'profileImage' in member &&
    typeof member.profileImage === 'string' &&
    member.profileImage.length > 0
      ? member.profileImage
      : null

  // Close leadership dropdowns when clicking outside the header menus.
  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) return

      const dropdowns =
        headerRef.current?.querySelectorAll<HTMLDetailsElement>(
          '.header-leadership-menu',
        )

      dropdowns?.forEach((dropdown) => {
        if (!dropdown.contains(target)) {
          dropdown.open = false
        }
      })
    }

    // Allow Escape to close any open leadership dropdown.
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      const dropdowns =
        headerRef.current?.querySelectorAll<HTMLDetailsElement>(
          '.header-leadership-menu',
        )

      dropdowns?.forEach((dropdown) => {
        dropdown.open = false
      })
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const navLinks = (
    <>
      {visibleNav.map(([to, label]) => (
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

      {isLeadership && (
        <details
          className={`header-leadership-menu ${
            location.pathname.startsWith('/leadership')
              ? 'active'
              : ''
          }`}
        >
          <summary className="header-link header-leadership-trigger">
            Leadership
            <span className="header-dropdown-arrow" aria-hidden="true" />
          </summary>

          <div className="header-leadership-dropdown">
            <NavLink
              to="/leadership/moderation"
              className={({ isActive }) =>
                `header-dropdown-link ${isActive ? 'active' : ''}`
              }
            >
              Moderation
            </NavLink>

            <NavLink
              to="/leadership/commissions"
              className={({ isActive }) =>
                `header-dropdown-link ${isActive ? 'active' : ''}`
              }
            >
              Commissions
            </NavLink>
          </div>
        </details>
      )}
    </>
  )

  return (
    <header className="site-header" ref={headerRef}>
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
      <div
        className={`header-account ${
          member ? 'is-authenticated' : 'is-logged-out'
        }`}
      >
        {member ? (
          <div className="header-account-actions">
            <NavLink
              to="/dashboard"
              className={`header-profile-link ${
                profileImage ? '' : 'header-profile-link-placeholder'
              }`}
              aria-label="Go to dashboard"
              title="Dashboard"
            >
              {profileImage && (
                <img
                  src={profileImage}
                  alt=""
                  className="header-profile-image"
                />
              )}
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