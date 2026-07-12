import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import { news, type NewsMedia } from '../data/content'

export default function NewsSection() {
  const years = [...new Set(news.map((n) => n.year))].sort((a, b) => b - a)
  const [active, setActive] = useState<NewsMedia | null>(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active])

  return (
    <section id="news">
      <div className="container">
        <Reveal>
          <h2 className="section-title">News</h2>
        </Reveal>
        {years.map((year) => (
          <Reveal key={year}>
            <div className="year-group">
              <div className="year-label">{year}</div>
              <div>
                {news
                  .filter((n) => n.year === year)
                  .map((n, i) => (
                    <div className="news-item" key={i}>
                      <span className="date">{n.date}</span>
                      {n.text}
                      {n.media && (
                        <div className="news-media">
                          {n.media.map((m) => (
                            <button
                              key={m.url}
                              className="media-link"
                              onClick={() => setActive(m)}
                              aria-label={`Open ${m.type}: ${m.label}`}
                            >
                              <i
                                className={
                                  m.type === 'video' ? 'fa-solid fa-video' : 'fa-solid fa-camera'
                                }
                              />
                              {m.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {active && (
        <div className="lightbox" onClick={() => setActive(null)} role="dialog" aria-modal="true">
          <button className="lightbox-close" aria-label="Close" onClick={() => setActive(null)}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {active.type === 'video' ? (
              <video src={active.url} controls autoPlay playsInline />
            ) : (
              <img src={active.url} alt={active.label} />
            )}
          </div>
        </div>
      )}
    </section>
  )
}
