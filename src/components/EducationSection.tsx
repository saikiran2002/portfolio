import Reveal from './Reveal'
import { education } from '../data/content'

export default function EducationSection() {
  return (
    <section id="education" className="alt-bg">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Education</h2>
        </Reveal>
        <div className="edu-grid">
          {education.map((ed, i) => (
            <Reveal key={ed.degree} delay={i * 0.08}>
              <div className="edu-card">
                <div className="edu-main">
                  <h3>{ed.degree}</h3>
                  <div className="school">{ed.school}</div>
                  <p>
                    {ed.detail}
                    {ed.detailLink && (
                      <>
                        {' '}
                        <a href={ed.detailLink.url} target="_blank" rel="noreferrer">
                          {ed.detailLink.label}
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
                <div className="edu-side">
                  <div className="gpa">
                    {ed.gpaLabel} <span className="gpa-val">{ed.gpaValue}</span>
                  </div>
                  <div className="yrs">{ed.years}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
