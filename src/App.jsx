import { useState } from "react";
import { Gauge, ThreatRadar, History } from "./charts.jsx";

const post = (url, body) => fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}).then(async response => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Request failed. Please try again.");
  }
  return response.json();
});

const pages = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "scan", label: "New scan", icon: "⌕" },
  { id: "exposure", label: "Exposure report", icon: "◉" },
  { id: "protection", label: "Protection plan", icon: "♡" },
];

function BreachLogo({ breach }) {
  const domain = typeof breach.domain === "string" ? breach.domain.trim() : "";
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : "";
  const suppliedLogo = typeof breach.logo === "string" && /^https:\/\//i.test(breach.logo) ? breach.logo : "";
  const [image, setImage] = useState(suppliedLogo || favicon);
  const initials = (breach.name || "?").split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();

  return (
    <span className="breach-logo" aria-hidden="true">
      {image && <img src={image} alt="" referrerPolicy="no-referrer" onError={() => {
        if (image !== favicon && favicon) setImage(favicon);
        else setImage("");
      }} />}
      {!image && <span>{initials}</span>}
    </span>
  );
}

function ScoreLabel({ score }) {
  if (score >= 70) return "Needs attention";
  if (score >= 40) return "Some exposure";
  return "Looking good";
}

function SecurityModel() {
  return (
    <div className="model-stage" role="img" aria-label="Three-dimensional illustration of a shield protecting your digital footprint">
      <div className="orbit orbit-back" />
      <div className="orbit orbit-front" />
      <div className="model-glow" />
      <div className="model-shield"><span>✓</span></div>
      <span className="model-dot dot-one" />
      <span className="model-dot dot-two" />
      <div className="model-label"><span className="pulse-dot" /> Your footprint, protected</div>
    </div>
  );
}

function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">✳</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export default function App() {
  const [f, setF] = useState({ email: "", username: "", password: "", posts: "", consent: false });
  const [res, setRes] = useState(null);
  const [hist, setHist] = useState([]);
  const [page, setPage] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = key => event => setF(previous => ({
    ...previous,
    [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
  }));

  async function run(event) {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const result = await post("/api/analyze", {
        email: f.email,
        username: f.username,
        password: f.password || null,
        posts: f.posts.split("\n").filter(Boolean),
        consent: f.consent,
      });
      setRes(result);
      setPage("exposure");
      try {
        const historyResponse = await fetch(`/api/history?email=${encodeURIComponent(f.email)}`);
        if (!historyResponse.ok) throw new Error("Unable to load scan history.");
        setHist(await historyResponse.json());
      } catch {
        setHist([]);
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  const sample = res && Object.entries(res.sample_data).filter(([, value]) => value).map(([key]) => key);
  const currentPage = pages.find(item => item.id === page);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage("overview")} aria-label="PRIVORA home">
          <span className="brand-mark">P</span><span>PRIVORA<small>PRIVACY, IN PERSPECTIVE</small></span>
        </button>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {pages.map(item => (
            <button key={item.id} className={page === item.id ? "nav-link active" : "nav-link"}
              aria-label={item.label}
              onClick={() => setPage(item.id)}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "exposure" && res && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">✦</span>
          <strong>Your data stays yours.</strong>
          <p>Passwords are never stored. Scans are made for your own details.</p>
        </div>
        <div className="sidebar-footer"><span className="pulse-dot" /> PRIVORA security workspace</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{currentPage.label}</strong></div>
          <div className="topbar-status"><span className="pulse-dot" /> Private by design</div>
        </header>

        {page === "overview" && (
          <section className="page-content">
            <div className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow"><span className="pulse-dot" /> YOUR DIGITAL PRIVACY CHECKUP</span>
                <h1>A clearer view of your <em>digital footprint.</em></h1>
                <p>See what your public data reveals, understand your exposure, and get practical steps to take back control.</p>
                <button className="primary-button" onClick={() => setPage("scan")}>Start a privacy scan <span aria-hidden="true">→</span></button>
                <span className="hero-footnote">Private, personal, and always in your hands.</span>
              </div>
              <SecurityModel />
              <div className="hero-grain" />
            </div>

            <div className="section-heading">
              <div><span className="eyebrow muted-eyebrow">YOUR WORKSPACE</span><h2>A little more peace of mind.</h2></div>
              {res && <button className="text-button" onClick={() => setPage("exposure")}>View latest report <span aria-hidden="true">→</span></button>}
            </div>
            <div className="overview-cards">
              <article className="summary-card score-summary">
                <span className="summary-icon">◉</span>
                <p className="summary-label">PRIVACY SCORE</p>
                {res ? <><strong>{res.score}<small>/100</small></strong><span className="summary-detail">{ScoreLabel({ score: res.score })}</span></>
                  : <><strong>—</strong><span className="summary-detail">Run your first scan to get a score</span></>}
              </article>
              <article className="summary-card">
                <span className="summary-icon">⌁</span>
                <p className="summary-label">KNOWN BREACHES</p>
                <strong>{res ? res.breaches.length : "—"}</strong>
                <span className="summary-detail">{res ? "Associated with your email" : "We’ll check known breach records"}</span>
              </article>
              <article className="summary-card">
                <span className="summary-icon">◎</span>
                <p className="summary-label">PUBLIC PROFILES</p>
                <strong>{res ? res.accounts.length : "—"}</strong>
                <span className="summary-detail">{res ? "Username matches found" : "Discover where your username appears"}</span>
              </article>
            </div>

            <div className="overview-bottom">
              <article className="content-card getting-started">
                <div className="card-title-row"><div><span className="eyebrow muted-eyebrow">GETTING STARTED</span><h2>Your privacy, one step at a time</h2></div><span className="sparkle">✳</span></div>
                <div className="steps-row">
                  <div className="mini-step"><span>01</span><div><strong>Share your details</strong><p>Tell PRIVORA what to check.</p></div></div>
                  <div className="mini-step"><span>02</span><div><strong>See your exposure</strong><p>Get a clear, personal report.</p></div></div>
                  <div className="mini-step"><span>03</span><div><strong>Take back control</strong><p>Follow steps made for you.</p></div></div>
                </div>
              </article>
              {hist.length > 1 && <article className="content-card history-card"><span className="eyebrow muted-eyebrow">OVER TIME</span><h2>Your score history</h2><History rows={hist} /></article>}
            </div>
          </section>
        )}

        {page === "scan" && (
          <section className="page-content narrow-page">
            <div className="page-intro"><span className="eyebrow muted-eyebrow">A PRIVATE CHECKUP</span><h1>Let’s look out for you.</h1><p>Use your own details only. We’ll check public data and help you understand what to do next.</p></div>
            <form className="content-card scan-form" onSubmit={run}>
              <div className="form-section-title"><span className="form-icon">01</span><div><h2>Your online identity</h2><p>We use these details to look for public matches.</p></div></div>
              <div className="form-fields">
                <label>Email address<input type="email" placeholder="you@example.com" autoComplete="email" required value={f.email} onChange={set("email")} /></label>
                <label>Username<input placeholder="Your public username" autoComplete="username" required value={f.username} onChange={set("username")} /></label>
              </div>
              <div className="form-divider" />
              <div className="form-section-title"><span className="form-icon">02</span><div><h2>Optional checks</h2><p>These are only used during this scan and are never saved.</p></div></div>
              <label>Password you use <span className="optional-label">OPTIONAL</span><input type="password" autoComplete="new-password" placeholder="Leave blank to skip" value={f.password} onChange={set("password")} /><small className="field-note">Your password is not stored. Only a 5-character hash prefix is sent to Pwned Passwords.</small></label>
              <label>Public posts <span className="optional-label">OPTIONAL</span><textarea rows="4" placeholder={"Paste your own public posts, one per line. Any Indian language."} value={f.posts} onChange={set("posts")} /><small className="field-note">We only analyze the text you choose to share. No social media scraping.</small></label>
              <label className="consent"><input type="checkbox" checked={f.consent} onChange={set("consent")} /><span><strong>I confirm these are my own details</strong><small>PRIVORA only checks information you have permission to review.</small></span></label>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="primary-button submit-button" disabled={!f.consent || busy}>{busy ? <><span className="button-spinner" /> Checking your footprint…</> : <>Run my privacy scan <span aria-hidden="true">→</span></>}</button>
            </form>
          </section>
        )}

        {page === "exposure" && (
          <section className="page-content">
            <div className="page-heading-row"><div className="page-intro"><span className="eyebrow muted-eyebrow">YOUR PERSONAL REPORT</span><h1>Your exposure, at a glance.</h1><p>A clear snapshot of the public signals linked to your details.</p></div>{res && <span className="report-status"><span className="pulse-dot" /> Scan complete</span>}</div>
            {!res ? <EmptyState title="Your report is waiting" action={<button className="primary-button" onClick={() => setPage("scan")}>Start your first scan <span aria-hidden="true">→</span></button>}>Run a scan to see your privacy score, known breaches, and public profile matches here.</EmptyState> : <>
              <div className="report-score-card">
                <div className="score-copy"><span className="eyebrow">YOUR PRIVORA SCORE</span><h2>{ScoreLabel({ score: res.score })}</h2><p>Higher scores mean more public signals were found. Use your personalized plan to lower your exposure.</p></div>
                <div className="score-gauge"><Gauge score={res.score} /></div>
                <div className="radar-frame"><span className="eyebrow">EXPOSURE BY PROFILE</span><ThreatRadar profiles={res.profiles} /></div>
              </div>

              <div className="report-grid">
                <article className="content-card breach-card">
                  <div className="card-title-row"><div><span className="eyebrow muted-eyebrow">KNOWN DATA EXPOSURE</span><h2>Breached websites</h2></div><span className="count-badge">{res.breaches.length}</span></div>
                  <p className="card-subtitle">Known breach records associated with your email—not a list of every site where you have an account.</p>
                  {res.breaches.length ? <div className="breach-list">{res.breaches.map((breach, index) => (
                    <article className="breach-item" key={`${breach.name}-${index}`}>
                      <BreachLogo breach={breach} />
                      <div className="breach-info"><strong>{breach.name}</strong><span>{breach.domain || "Breach record"}{breach.year ? ` · ${breach.year}` : ""}</span>
                        {breach.data?.length > 0 && <div className="data-tags">{breach.data.map(item => <span key={item}>{item}</span>)}</div>}
                      </div>
                      <span className="breach-arrow" aria-hidden="true">↗</span>
                    </article>
                  ))}</div> : <div className="inline-empty"><span>✓</span><p>No known breaches were found for this email.</p></div>}
                  {sample?.includes("breaches") && <p className="source-note">Sample breach records are being shown; live lookup is not configured.</p>}
                </article>
                <article className="content-card signals-card">
                  <span className="eyebrow muted-eyebrow">PUBLIC PRESENCE</span><h2>Username matches</h2>
                  {res.accounts.length ? <div className="account-list">{res.accounts.map((account, index) => <span className="account-chip" key={`${account}-${index}`}><span>◎</span>{account}</span>)}</div>
                    : <div className="inline-empty"><span>✓</span><p>No public username matches found.</p></div>}
                  {sample?.includes("accounts") && <p className="source-note">Sample results are being shown for username checks.</p>}
                  {res.password_checked && <div className="password-result"><span className={res.password_leaks ? "password-icon warning" : "password-icon"}>{res.password_leaks ? "!" : "✓"}</span><div><strong>{res.password_leaks ? "Password found in known leaks" : "No known password leaks"}</strong><p>{res.password_leaks ? `${res.password_leaks.toLocaleString()} matching records found` : "It was not found in the records checked."}</p></div></div>}
                  {res.content.flagged.length > 0 && <div className="flagged-posts"><h3>Posts to review</h3>{res.content.flagged.map((item, index) => <div className="flagged-post" key={index}><span>“{item.text}”</span><small>{item.reasons.join(", ") || "Privacy signal"}</small></div>)}</div>}
                </article>
              </div>
              {sample?.length > 0 && <p className="data-disclaimer">Some results use sample data: {sample.join(", ")}.</p>}
            </>}
          </section>
        )}

        {page === "protection" && (
          <section className="page-content">
            <div className="page-intro"><span className="eyebrow muted-eyebrow">SMALL STEPS, MORE CONTROL</span><h1>Your personal protection plan.</h1><p>Practical next steps based on what your scan found.</p></div>
            {!res ? <EmptyState title="Your plan starts with a scan" action={<button className="primary-button" onClick={() => setPage("scan")}>Run a privacy scan <span aria-hidden="true">→</span></button>}>Your recommendations will be tailored to the exposure signals in your report.</EmptyState> : <>
              <div className="plan-banner"><div className="plan-banner-icon">✦</div><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Progress, not perfection.</h2><p>Work through these steps at your own pace. Every small privacy improvement counts.</p></div></div>
              <div className="plan-layout">
                <article className="content-card plan-card">
                  <div className="card-title-row"><div><span className="eyebrow muted-eyebrow">MADE FOR YOUR RESULTS</span><h2>Your next steps</h2></div><span className="count-badge">{res.steps.length}</span></div>
                  <div className="plan-steps">{res.steps.map((step, index) => <div className="plan-step" key={`${step}-${index}`}><span className="plan-step-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{step}</strong><p>Mark this as a reminder to review when you have a moment.</p></div><span className="step-check" aria-hidden="true">○</span></div>)}</div>
                </article>
                <aside className="privacy-tip"><span className="tip-icon">✳</span><span className="eyebrow">A QUICK REMINDER</span><h2>Keep your accounts yours.</h2><p>Use a unique password for every account and enable two-factor authentication wherever you can.</p><button className="text-button" onClick={() => setPage("exposure")}>Review your report <span aria-hidden="true">→</span></button></aside>
              </div>
              {hist.length > 1 && <article className="content-card protection-history"><span className="eyebrow muted-eyebrow">YOUR PROGRESS</span><h2>Privacy score over time</h2><History rows={hist} /></article>}
              <p className="plan-disclaimer">PRIVORA offers privacy guidance, not a guarantee of security. Take action directly with each service.</p>
            </>}
          </section>
        )}
      </main>
    </div>
  );
}
