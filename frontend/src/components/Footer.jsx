import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <img className="footer__logo" src="/nexora-logo.png" alt="Nexora AI" />
          <p className="footer__tag">A thoughtful space to learn, plan and grow.</p>
        </div>

        <nav className="footer__links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Log in</Link>
        </nav>

        <p className="footer__copy">© {new Date().getFullYear()} Nexora AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
