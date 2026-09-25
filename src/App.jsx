import { useMemo, useState } from "react";
import {
  Search,
  Menu,
  ArrowLeft,
  Bot,
  ShieldCheck,
  ExternalLink,
  UserRound,
  Globe,
  Activity,
  MapPin,
  Clock3,
  ShieldAlert,
  Code2,
  Users,
  X
} from "lucide-react";

import { features, FeatureCard, ResultCard, Loading } from "./components";
import { searchWeb, askCase, digitalFootprint } from "./api";

function App() {
  const [query, setQuery] = useState("");
  const [activeFeature, setActiveFeature] = useState(null);
  const [results, setResults] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [footprintData, setFootprintData] = useState(null);
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

  async function runDigitalFootprint() {
    const clean = query.trim();

    if (!clean) {
      setError("Enter a name or username first.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setFootprintData(null);

    try {
      const data = await digitalFootprint(clean);

      setFootprintData(data);

      const combined = [
        ...(data.groups?.profiles || []),
        ...(data.groups?.social || []),
        ...(data.groups?.code || []),
        ...(data.groups?.websites || [])
      ];

      setResults(removeDuplicates(combined));
    } catch (err) {
      setError(
        err.message || "Digital footprint search failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openFeature(id) {
    setActiveFeature(id);
    setError("");
    setAnswer("");
    setFootprintData(null);

    if (id === "footprint") {
      if (query.trim()) {
        await runDigitalFootprint();
      }

      return;
    }

    if (id === "ask") {
      return;
    }

    const prompts = {
      identity: query
        ? `${query} identity profile`
        : "",
      profile: query
        ? `"${query}" profile`
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
      await runSearch(prompts[id]);
    }
  }

  function saveResult(result) {
    setSaved((current) => {
      const exists = current.some(
        (item) => item.url === result.url
      );

      if (exists) {
        return current;
      }

      return [...current, result];
    });
  }

  function removeSaved(url) {
    setSaved((current) =>
      current.filter((item) => item.url !== url)
    );
  }

  async function submitQuestion() {
    if (!question.trim()) {
      setError("Enter a question.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const evidence =
        saved.length > 0
          ? saved
          : results;

      const data = await askCase(
        question,
        evidence
      );

      setAnswer(data.answer || "");
    } catch (err) {
      setError(
        err.message || "Case analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function goDashboard() {
    setActiveFeature(null);
    setAnswer("");
    setError("");
    setFootprintData(null);
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

        <nav
          className={
            mobileMenu
              ? "nav open"
              : "nav"
          }
        >
          <button
            onClick={() => {
              goDashboard();
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
            onClick={() => {
              setMobileMenu(false);
            }}
          >
            About
          </button>
        </nav>

        <button
          className="menu-button"
          onClick={() =>
            setMobileMenu((value) => !value)
          }
        >
          {mobileMenu ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
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
                Search public information, discover digital
                footprints and organise publicly available
                sources in one workspace.
              </p>

              <div className="main-search">

                <Search size={20} />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      runSearch();
                    }
                  }}
                  placeholder="Enter a name, username, website..."
                />

                <button
                  onClick={() => runSearch()}
                >
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
                    onClick={() =>
                      openFeature(feature.id)
                    }
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

                  {results.map(
                    (result, index) => (
                      <ResultCard
                        key={
                          `${result.url}-${index}`
                        }
                        result={result}
                        onSave={saveResult}
                      />
                    )
                  )}

                </div>

              </section>

            )}


            {loading && (
              <Loading />
            )}

          </section>

        ) : (

          <section className="workspace">

            <button
              className="back-button"
              onClick={goDashboard}
            >
              <ArrowLeft size={18} />
              Back to dashboard
            </button>


            <div className="workspace-header">

              <div className="workspace-icon">
                {active &&
                  (() => {
                    const Icon = active.icon;
                    return <Icon size={25} />;
                  })()}
              </div>

              <div>

                <span>
                  FINDTRACE TOOL
                </span>

                <h1>
                  {active?.title}
                </h1>

                <p>
                  {active?.description}
                </p>

              </div>

            </div>


            {activeFeature === "footprint" ? (

              <DigitalFootprintView
                query={query}
                setQuery={setQuery}
                runSearch={runDigitalFootprint}
                loading={loading}
                error={error}
                footprintData={footprintData}
                results={results}
                onSave={saveResult}
              />

            ) : activeFeature === "ask" ? (

              <div className="case-ai">

                <div className="ai-heading">

                  <Bot size={24} />

                  <div>
                    <h2>
                      Ask the Case AI
                    </h2>

                    <p>
                      Ask a question about the public
                      evidence collected in this case.
                    </p>
                  </div>

                </div>


                <div className="case-source-count">
                  {saved.length || results.length} public
                  sources available
                </div>


                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value
                    )
                  }
                  placeholder="Ask something about the collected evidence..."
                />


                <button
                  className="primary-button"
                  onClick={submitQuestion}
                  disabled={loading}
                >
                  {loading
                    ? "Analysing..."
                    : "Ask Case AI"}
                </button>


                {error && (
                  <div className="error">
                    {error}
                  </div>
                )}


                {answer && (
                  <div className="answer-box">

                    <h3>
                      Case response
                    </h3>

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
                    onChange={(event) =>
                      setQuery(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        runSearch();
                      }
                    }}
                    placeholder="Search public information..."
                  />

                  <button
                    onClick={() => runSearch()}
                  >
                    Search
                  </button>

                </div>


                {loading && (
                  <Loading
                    text="Searching public sources..."
                  />
                )}


                {error && (
                  <div className="error">
                    {error}
                  </div>
                )}


                {results.length > 0 && (

                  <div className="results-list workspace-results">

                    {results.map(
                      (result, index) => (
                        <ResultCard
                          key={
                            `${result.url}-${index}`
                          }
                          result={result}
                          onSave={saveResult}
                        />
                      )
                    )}

                  </div>

                )}


                {!loading &&
                  results.length === 0 && (
                    <div className="empty-state">

                      <Search size={30} />

                      <h2>
                        No evidence collected yet
                      </h2>

                      <p>
                        Search for a public name,
                        username, organisation or
                        website to begin.
                      </p>

                    </div>
                  )}

              </>

            )}


            {saved.length > 0 && (

              <aside className="saved-panel">

                <div>
                  <span>
                    SAVED SOURCES
                  </span>

                  <strong>
                    {saved.length}
                  </strong>
                </div>

                <button
                  onClick={() =>
                    setSaved([])
                  }
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
          <strong>
            FindTrace AI
          </strong>

          <span>
            Public-source research workspace
          </span>
        </div>

        <span>
          Public information can be incomplete or outdated.
          Verify important claims using the original source.
        </span>

      </footer>

    </div>
  );
}


/* =====================================
   DIGITAL FOOTPRINT VIEW
===================================== */

function DigitalFootprintView({
  query,
  setQuery,
  runSearch,
  loading,
  error,
  footprintData,
  results,
  onSave
}) {
  const groups = footprintData?.groups || {};

  return (
    <div className="digital-footprint">

      <div className="tool-search">

        <Search size={19} />

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              runSearch();
            }
          }}
          placeholder="Name or username..."
        />

        <button
          onClick={runSearch}
          disabled={loading}
        >
          {loading
            ? "Searching..."
            : "Trace"}
        </button>

      </div>


      {error && (
        <div className="error">
          {error}
        </div>
      )}


      {loading && (
        <Loading
          text="Scanning free public sources..."
        />
      )}


      {footprintData && !loading && (

        <>

          <div className="footprint-summary">

            <div className="footprint-title">
              <span>
                DIGITAL FOOTPRINT
              </span>

              <h2>
                {footprintData.query}
              </h2>

              <p>
                Public-source results found across
                several free search sources.
              </p>
            </div>


            <div className="footprint-total">
              <strong>
                {footprintData.total}
              </strong>

              <span>
                sources
              </span>
            </div>

          </div>


          <div className="footprint-stats">

            <StatCard
              icon={<Users size={19} />}
              title="Profiles"
              value={
                groups.profiles?.length || 0
              }
            />

            <StatCard
              icon={<Activity size={19} />}
              title="Social"
              value={
                groups.social?.length || 0
              }
            />

            <StatCard
              icon={<Code2 size={19} />}
              title="Code"
              value={
                groups.code?.length || 0
              }
            />

            <StatCard
              icon={<Globe size={19} />}
              title="Web"
              value={
                groups.websites?.length || 0
              }
            />

          </div>


          <FootprintSection
            title="Public Profiles"
            icon={<Users size={18} />}
            results={groups.profiles || []}
            onSave={onSave}
          />


          <FootprintSection
            title="Social Activity"
            icon={<Activity size={18} />}
            results={groups.social || []}
            onSave={onSave}
          />


          <FootprintSection
            title="Code & Developer Accounts"
            icon={<Code2 size={18} />}
            results={groups.code || []}
            onSave={onSave}
          />


          <FootprintSection
            title="Web References"
            icon={<Globe size={18} />}
            results={groups.websites || []}
            onSave={onSave}
          />

        </>

      )}


      {!loading &&
        !footprintData &&
        results.length === 0 && (

          <div className="empty-state">

            <Globe size={34} />

            <h2>
              Digital footprint scanner
            </h2>

            <p>
              Enter a name or username to search
              free public sources.
            </p>

          </div>

        )}

    </div>
  );
}


/* =====================================
   STAT CARD
===================================== */

function StatCard({
  icon,
  title,
  value
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <strong>
          {value}
        </strong>

        <span>
          {title}
        </span>
      </div>

    </div>
  );
}


/* =====================================
   FOOTPRINT SECTION
===================================== */

function FootprintSection({
  title,
  icon,
  results,
  onSave
}) {
  if (!results.length) {
    return null;
  }

  return (
    <section className="footprint-section">

      <div className="footprint-section-title">

        <div>
          {icon}

          <h2>
            {title}
          </h2>
        </div>

        <span>
          {results.length}
        </span>

      </div>


      <div className="results-list">

        {results.map(
          (result, index) => (
            <ResultCard
              key={
                `${result.url}-${index}`
              }
              result={result}
              onSave={onSave}
            />
          )
        )}

      </div>

    </section>
  );
}


/* =====================================
   HELPERS
===================================== */

function removeDuplicates(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) {
      return false;
    }

    seen.add(item.url);
    return true;
  });
}

export default App;
