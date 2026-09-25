import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  X,
  Menu,
  ArrowLeft,
  Bot,
  ShieldCheck
} from "lucide-react";

import { features, FeatureCard, ResultCard, Loading } from "./components";
import { searchWeb, askCase } from "./api";

function App() {
  const [query, setQuery] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);
  const [results, setResults] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const active = useMemo(
    () => features.find((item) => item.id === activeFeature),
    [activeFeature]
  );

  async function runSearch(customQuery = query) {
    const clean = customQuery.trim();

    if (!clean) {
      setError("Enter a name, username, website or search term.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const data = await searchWeb(clean);
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function openFeature(id) {
    setActiveFeature(id);
    setError("");
    setAnswer("");

    const prompts = {
      identity: query
        ? `${query} identity profile`
        : "",
      profile: query
        ? `"${query}" profile`
        : "",
      footprint: query
        ? `"${query}" online`
        : "",
      activity: query
        ? `"${query}" activity`
        : "",
      safety: query
        ? `"${query}" incident OR warning`
        : "",
      location: query
        ? `"${query}" location`
        : "",
      timeline: query
        ? `"${query}" news OR profile OR activity`
        : ""
    };

    if (prompts[id]) {
      runSearch(prompts[id]);
    }
  }

  function saveResult(result) {
    setSaved((current) => {
      const exists = current.some(
        (item) => item.url === result.url
      );

      if (exists) return current;

      return [...current, result];
    });
  }

  async function submitQuestion() {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const data = await askCase(question, saved.length ? saved : results);
      setAnswer(data.answer || "");
    } catch (err) {
      setError(err.message || "AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            FT
          </div>

          <div>
            <strong>FindTrace</strong>
            <span>AI</span>
          </div>
        </div>

        <nav className={mobileMenu ? "nav open" : "nav"}>
          <button
            onClick={() => {
              setActiveFeature(null);
              setMobileMenu(false);
            }}
          >
            Dashboard
          </button>

          <button
            onClick={() => {
              setActiveFeature("ask");
              setMobileMenu(false);
            }}
          >
            Case AI
          </button>

          <button
            onClick={() => setMobileMenu(false)}
          >
            About
          </button>
        </nav>

        <button
          className="menu-button"
          onClick={() => setMobileMenu((v) => !v)}
        >
          <Menu size={21} />
        </button>
      </header>

      <main>
        {!activeFeature ? (
          <section className="dashboard">
            <div className="hero">
              <div className="hero-badge">
                <ShieldCheck size={15} />
                PUBLIC-SOURCE RESEARCH
              </div>

              <h1>
                Find the public
                <br />
                <span>trace.</span>
              </h1>

              <p>
                Search public information, organise sources and
                investigate digital footprints from one workspace.
              </p>

              <div className="main-search">
                <Search size={20} />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      runSearch();
                    }
                  }}
                  placeholder="Enter a name, username, website..."
                />

                <button onClick={() => runSearch()}>
                  Search
                </button>
              </div>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}
            </div>

            <section className="feature-section">
              <div className="section-heading">
                <div>
                  <span>WORKSPACE</span>
                  <h2>Investigation tools</h2>
                </div>

                <span className="feature-count">
                  {features.length} tools
                </span>
              </div>

              <div className="feature-grid">
                {features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onClick={() => openFeature(feature.id)}
                  />
                ))}
              </div>
            </section>

            {results.length > 0 && (
              <section className="results-section">
                <div className="section-heading">
                  <div>
                    <span>SEARCH RESULTS</span>
                    <h2>Public sources</h2>
                  </div>

                  <span className="feature-count">
                    {results.length} results
                  </span>
                </div>

                <div className="results-list">
                  {results.map((result, index) => (
                    <ResultCard
                      key={`${result.url}-${index}`}
                      result={result}
                      onSave={saveResult}
                    />
                  ))}
                </div>
              </section>
            )}

            {loading && <Loading />}
          </section>
        ) : (
          <section className="workspace">
            <button
              className="back-button"
              onClick={() => {
                setActiveFeature(null);
                setAnswer("");
              }}
            >
              <ArrowLeft size={18} />
              Back to dashboard
            </button>

            <div className="workspace-header">
              <div className="workspace-icon">
                {active && <active.icon size={25} />}
              </div>

              <div>
                <span>FINDTRACE TOOL</span>
                <h1>{active?.title}</h1>
                <p>{active?.description}</p>
              </div>
            </div>

            {activeFeature === "ask" ? (
              <div className="case-ai">
                <div className="ai-heading">
                  <Bot size={24} />

                  <div>
                    <h2>Ask the Case AI</h2>
                    <p>
                      Ask a question using the public evidence
                      collected in this case.
                    </p>
                  </div>
                </div>

                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask something about the collected evidence..."
                />

                <button
                  className="primary-button"
                  onClick={submitQuestion}
                  disabled={loading}
                >
                  {loading ? "Analysing..." : "Ask AI"}
                </button>

                {answer && (
                  <div className="answer-box">
                    <h3>Case response</h3>

                    <p>
                      {answer}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="tool-search">
                  <Search size={19} />

                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        runSearch();
                      }
                    }}
                    placeholder="Search public information..."
                  />

                  <button onClick={() => runSearch()}>
                    Search
                  </button>
                </div>

                {loading && (
                  <Loading text="Searching public sources..." />
                )}

                {error && (
                  <div className="error">
                    {error}
                  </div>
                )}

                {results.length > 0 && (
                  <div className="results-list workspace-results">
                    {results.map((result, index) => (
                      <ResultCard
                        key={`${result.url}-${index}`}
                        result={result}
                        onSave={saveResult}
                      />
                    ))}
                  </div>
                )}

                {!loading && results.length === 0 && (
                  <div className="empty-state">
                    <Search size={30} />

                    <h2>
                      No evidence collected yet
                    </h2>

                    <p>
                      Search for a public name, username,
                      organisation or website to begin.
                    </p>
                  </div>
                )}
              </>
            )}

            {saved.length > 0 && (
              <aside className="saved-panel">
                <div>
                  <span>SAVED SOURCES</span>
                  <strong>{saved.length}</strong>
                </div>

                <button
                  onClick={() => setSaved([])}
                >
                  Clear
                </button>
              </aside>
            )}
          </section>
        )}
      </main>

      <footer>
        <div>
          <strong>FindTrace AI</strong>
          <span>Public-source research workspace</span>
        </div>

        <span>
          Information may be incomplete or outdated. Verify
          important claims using the original source.
        </span>
      </footer>
    </div>
  );
}

export default App;
