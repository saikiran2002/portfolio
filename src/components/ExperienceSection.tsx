import Reveal from './Reveal'
import { experiences } from '../data/content'

export default function ExperienceSection() {
  return (
    <section id="experience">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Experience</h2>
        </Reveal>
        <div className="timeline">
          {experiences.map((exp, i) => (
            <div className={`tl-item${exp.current ? ' current' : ''}`} key={exp.role + exp.dates}>
              <span className="tl-dot" />
              <Reveal delay={i * 0.05}>
                <div className="tl-card">
                  <h3>{exp.role}</h3>
                  <div className="org">{exp.org}</div>
                  <div className="dates">
                    {exp.dates}
                    {exp.location && ` · ${exp.location}`}
                  </div>
                  <ul>
                    {exp.bullets.map((b, j) => (
                      <li key={j}>
                        {b.text}
                        {b.link && (
                          <>
                            {' '}
                            <a href={b.link.url} target="_blank" rel="noreferrer">
                              {b.link.label}
                            </a>
                            .
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
