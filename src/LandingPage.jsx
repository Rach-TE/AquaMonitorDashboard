import "./LandingPage.css";

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">

      {/* Background image */}
      <div className="landing-background" />

      {/* Dark/blue overlay */}
      <div className="landing-overlay" />

      {/* HEADER */}
      <header className="landing-header">

        <div className="landing-brand">

          <div className="landing-brand-icon">
            ≈
          </div>

          <div>
            <h2>AquaMonitor</h2>
            <span>WATER QUALITY SYSTEM</span>
          </div>

        </div>

        <div className="landing-header-right">
          <span>Water Quality Monitoring</span>

          <button
            className="landing-header-button"
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>

      </header>


      {/* HERO */}
      <main className="landing-main">

        <section className="landing-hero">

          <div className="landing-hero-text">

            <div className="landing-kicker">
              <span className="landing-status-dot" />
              REAL-TIME WATER QUALITY MONITORING
            </div>

            <h1>
              Smarter monitoring.
              <br />
              <span>Better water quality.</span>
            </h1>

            <p>
              AquaMonitor provides real-time monitoring
              of key water quality parameters to support
              effective water treatment operations.
            </p>

            <button
              className="landing-get-started"
              onClick={onGetStarted}
            >
              Get Started
              <span>→</span>
            </button>

          </div>


          {/* PARAMETERS */}
          <div className="landing-parameters">

            <div className="landing-parameter">

              <div className="landing-parameter-icon ph-icon">
                pH
              </div>

              <div>
                <strong>pH Level</strong>
                <small>Water acidity</small>
              </div>

            </div>


            <div className="landing-parameter">

              <div className="landing-parameter-icon temperature-icon">
                °C
              </div>

              <div>
                <strong>Temperature</strong>
                <small>Water temperature</small>
              </div>

            </div>


            <div className="landing-parameter">

              <div className="landing-parameter-icon turbidity-icon">
                ◉
              </div>

              <div>
                <strong>Turbidity</strong>
                <small>Water clarity</small>
              </div>

            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="landing-footer">

        <span>
          AquaMonitor · Water Quality Monitoring System
        </span>

        <span>
          Real-time Monitoring
        </span>

      </footer>

    </div>
  );
}

export default LandingPage;