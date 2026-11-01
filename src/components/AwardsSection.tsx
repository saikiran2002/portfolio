import Reveal from './Reveal'
import { awards } from '../data/content'

export default function AwardsSection() {
  return (
    <section id="awards">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Awards</h2>
        </Reveal>
        {awards.map((a, i) => (
          <Reveal key={a.title} delay={i * 0.05}>
            <div className="award-item">
              <div className="award-date">{a.date}</div>
              <div>
                <span className="award-badge">
                  <i className="fa-solid fa-trophy" /> {a.category}
                </span>
                <h3>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.title}{' '}
                      <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    </a>
                  ) : (
                    a.title
                  )}
                </h3>
                <p>{a.description}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
