import { useMemo, useState } from 'react'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../faqData'
import './Faq.css'

const ALL = 'All'

export default function Faq() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return FAQ_ITEMS.filter((item) => {
      const inCategory = category === ALL || item.category === category
      const inQuery = !needle || item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle)
      return inCategory && inQuery
    })
  }, [query, category])

  const clearFilters = () => {
    setQuery('')
    setCategory(ALL)
  }

  return (
    <>
      <header className="page-head">
        <h1>FAQ</h1>
        <div className="page-kicker">How CukaiPandai Works</div>
      </header>

      <section className="window faq-window" aria-labelledby="faq-title">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title" id="faq-title">
            FAQ
          </span>
          <span className="titlebar-meta">{FAQ_ITEMS.length} answers</span>
        </div>
        <div className="faq-body">
          <p className="faq-intro">
            Straight answers about how CukaiPandai derives your obligation calendar, cites every figure, runs sovereign
            in-country inference, and keeps a human in the loop before any filing is final.
          </p>

          <div className="faq-toolbar">
            <label className="faq-search">
              <span className="faq-search-icon" aria-hidden="true">
                &#9906;
              </span>
              <input
                className="faq-search-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search questions and answers"
                aria-label="Search FAQ"
              />
            </label>
          </div>

          <div className="faq-chips" aria-label="Filter by category">
            <button
              type="button"
              className={`faq-chip${category === ALL ? ' is-active' : ''}`}
              aria-pressed={category === ALL}
              onClick={() => setCategory(ALL)}
            >
              All
            </button>
            {FAQ_CATEGORIES.map((name) => (
              <button
                key={name}
                type="button"
                className={`faq-chip${category === name ? ' is-active' : ''}`}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <p className="faq-count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'question' : 'questions'}
          </p>

          {filtered.length === 0 ? (
            <div className="faq-empty">
              <p>No matching questions.</p>
              <button type="button" className="faq-reset" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="faq-accordion">
              {filtered.map((item, index) => (
                <details className="faq-item" key={item.q}>
                  <summary className="faq-question">
                    <span className="faq-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="faq-question-text">{item.q}</span>
                    <span className="faq-toggle" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="faq-answer">
                    <span className="faq-cat">{item.category}</span>
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
