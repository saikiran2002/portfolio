import Reveal from './Reveal'
import { publications } from '../data/content'

export default function Publications() {
  const years = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a)

  return (
    <section id="publications" className="alt-bg">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Publications</h2>
        </Reveal>
        {years.map((year) => (
          <Reveal key={year}>
            <div className="year-group">
              <div className="year-label">{year}</div>
              <div>
                {publications
                  .filter((p) => p.year === year)
                  .map((p) => (
                    <div className="pub-item" key={p.title}>
                      <div className="title">{p.title}</div>
                      <div
                        className="authors"
                        dangerouslySetInnerHTML={{
                          __html: p.authors.replace(
                            /N\. D\. S\. Battula/g,
                            '<strong>N. D. S. Battula</strong>'
                          ),
                        }}
                      />
                      <div className="venue">
                        {p.venue}, {p.year}
                        {p.note && ` (${p.note})`}
                        {p.doi && (
                          <>
                            {' · '}
                            <a href={p.doi} target="_blank" rel="noreferrer">
                              DOI
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
