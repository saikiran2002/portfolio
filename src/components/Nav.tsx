import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'

const LINKS = [
  { href: '#about', label: 'About Me' },
  { href: '#publications', label: 'Publications' },
  { href: '#experience', label: 'Experience' },
  { href: '#education', label: 'Education' },
  { href: '#news', label: 'News' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav() {
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <nav>
      <div className="nav-inner">
        <a className="brand" href="#about">
          Naga Datha Saikiran
        </a>
        <ul className={`nav-links${open ? ' open' : ''}`}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <button id="theme-toggle" aria-label="Toggle dark mode" onClick={toggle}>
            <i className={theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'} />
          </button>
          <button id="hamburger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <i className="fa-solid fa-bars" />
          </button>
        </div>
      </div>
    </nav>
  )
}
