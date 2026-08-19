import { useState } from "react";
import "./Auth.css";
import "./Contact.css";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="contact">
      <div className="container contact__inner">
        <div className="contact__intro">
          <span className="eyebrow">Contact</span>
          <h1 className="about__title">Talk to us</h1>
          <p className="about__lede">
            Questions about Nexora AI, pricing, or a feature you'd like to see? Send a note and
            we'll get back to you.
          </p>
        </div>

        <div className="auth__card contact__card">
          {sent ? (
            <div className="auth__success">
              This is a UI preview, your message wasn't sent anywhere. Connect this form to your
              backend or an email service when you're ready.
            </div>
          ) : (
            <form className="auth__form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Name</span>
                <input type="text" required placeholder="Your name" />
              </label>
              <label className="field">
                <span>Email</span>
                <input type="email" required placeholder="you@example.com" />
              </label>
              <label className="field">
                <span>Message</span>
                <textarea rows={4} required placeholder="How can we help?" />
              </label>
              <button type="submit" className="btn btn-primary btn-block">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
