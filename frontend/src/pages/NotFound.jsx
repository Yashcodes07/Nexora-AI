import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound">
      <span className="eyebrow">404</span>
      <h1 className="notfound__title">This page drifted off</h1>
      <p className="notfound__body">The page you're looking for doesn't exist or moved.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
