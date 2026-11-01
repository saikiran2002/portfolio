import Reveal from './Reveal'
import { SCENE_META, type Scene } from './CosmicBackground'
import { profile } from '../data/content'

// Interests that switch the page into an animated space background
const INTEREST_SCENES: Record<string, Scene> = {
  'Black Hole Theory': 'blackhole',
  'Space Exploration': 'space',
}

interface HeroProps {
  scene: Scene | null
  onSceneChange: (scene: Scene | null) => void
}

export default function Hero({ scene, onSceneChange }: HeroProps) {
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
              {profile.interests.map((int) => {
                const target = INTEREST_SCENES[int]
                if (!target) {
                  return (
                    <span className="chip" key={int}>
                      {int}
                    </span>
                  )
                }
                const active = scene === target
                return (
                  <button
                    key={int}
                    className={`chip chip-scene${active ? ' active' : ''}`}
                    aria-pressed={active}
                    title={active ? 'Click to exit' : `Click for ${SCENE_META[target].label.toLowerCase()}`}
                    onClick={() => onSceneChange(active ? null : target)}
                  >
                    <i className={SCENE_META[target].icon} />
                    {int}
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
