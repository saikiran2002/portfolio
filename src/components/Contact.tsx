import { useState, type FormEvent } from 'react'
import Reveal from './Reveal'
import { profile } from '../data/content'

type Status = { message: string; color: string } | null

export default function Contact() {
  const [status, setStatus] = useState<Status>(null)
  const [sending, setSending] = useState(false)
  const formAction = `https://formspree.io/f/${profile.contact.formspreeId}`

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget

    if (profile.contact.formspreeId === 'YOUR_FORM_ID') {
      setStatus({
        message: 'Form not configured yet — add your Formspree ID in src/data/content.ts.',
        color: 'var(--accent)',
      })
      return
    }

    setSending(true)
    setStatus({ message: 'Sending…', color: 'var(--muted)' })
    try {
      const res = await fetch(formAction, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error()
      setStatus({ message: 'Thanks! Your message has been sent.', color: 'green' })
      form.reset()
    } catch {
      setStatus({ message: 'Something went wrong. Please email me directly.', color: 'var(--accent)' })
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className="alt-bg">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Contact Me</h2>
        </Reveal>
        <div className="contact-grid">
          <Reveal>
            <form onSubmit={handleSubmit} action={formAction} method="POST">
              <div className="form-row">
                <div>
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required placeholder="you@example.com" />
                </div>
              </div>
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" required placeholder="Your message…" />
              <button className="btn" type="submit" disabled={sending} style={{ marginTop: '1.2rem' }}>
                {sending ? 'Sending…' : 'Send Message'}
              </button>
              {status && (
                <div id="form-status" role="status" style={{ color: status.color }}>
                  {status.message}
                </div>
              )}
            </form>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="contact-info">
              <h3>Contact Info</h3>
              {profile.contact.emails.map((email) => (
                <p key={email}>
                  <i className="fa-solid fa-envelope" /> <a href={`mailto:${email}`}>{email}</a>
                </p>
              ))}
              <p>
                <i className="fa-solid fa-location-dot" /> {profile.contact.location}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
