import Reveal from './Reveal'
import { profile } from '../data/content'

export default function Contact() {
  return (
    <section id="contact">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Contact Me</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="contact-info">
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
    </section>
  )
}
