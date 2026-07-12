import Reveal from './Reveal'
import { profile } from '../data/content'

export default function Hero() {
  return (
    <section id="about">
      <div className="container hero">
        <Reveal className="profile-card">
          <img className="avatar" src={profile.photo} alt={profile.name} />
          <h1>{profile.name}</h1>
          <div className="pronouns">{profile.pronouns}</div>
          <div className="role">{profile.role}</div>
          <div className="advisor">
            Advised by{' '}
            <a href={profile.advisor.url} target="_blank" rel="noreferrer">
              {profile.advisor.name}
            </a>
          </div>
          <div className="socials">
            {profile.socials.map((s) => (
              <a key={s.label} href={s.url} aria-label={s.label} target="_blank" rel="noreferrer">
                <i className={s.icon} />
              </a>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="section-title">About Me</h2>
          <div className="about-text">
            {profile.about.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <a className="btn" href={profile.cv} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-download" style={{ marginRight: '.5rem' }} />
            Download CV
          </a>
          <div className="interests">
            <h3>Interests</h3>
            <div className="chips">
              {profile.interests.map((int) => (
                <span className="chip" key={int}>
                  {int}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
