import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <span className="navbar__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="url(#brandGrad)" strokeWidth="1.5" />
              <path
                d="M10 21V11l12 10V11"
                stroke="url(#brandGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e2a06a" />
                  <stop offset="1" stopColor="#c97d4a" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="navbar__name">
            Nexora <span className="navbar__name-accent">AI</span>
          </span>
        </Link>

        <nav className={`navbar__links ${open ? "is-open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `navbar__link ${isActive ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="navbar__actions navbar__actions--mobile">
            <Link to="/login" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link to="/signup" className="btn btn-primary" onClick={() => setOpen(false)}>
              Sign up
            </Link>
          </div>
        </nav>

        <div className="navbar__actions navbar__actions--desktop">
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign up
          </Link>
        </div>

        <button
          className={`navbar__toggle ${open ? "is-open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}