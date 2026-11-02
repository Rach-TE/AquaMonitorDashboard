import "./SettingsPage.css";

function SettingsPage({ theme, setTheme }) {
  const monitoringLimits = [
    {
      name: "pH",
      range: "6.5 – 7.5",
      unit: "pH",
      description: "Acceptable operating range",
      icon: "≈",
      color: "blue",
    },
    {
      name: "Temperature",
      range: "20 – 40",
      unit: "°C",
      description: "Acceptable operating range",
      icon: "°",
      color: "orange",
    },
    {
      name: "Turbidity",
      range: "0 – 2",
      unit: "NTU",
      description: "Normal operating level",
      icon: "≈",
      color: "green",
    },
  ];

  return (
    <div className="settings-page">
      {/* PAGE INTRODUCTION */}
      <section className="settings-intro">
        <div>
          <p className="settings-kicker">SYSTEM CONFIGURATION</p>

          <h1>Settings</h1>

          <p>
            Review monitoring limits and configure the appearance of the
            AquaMonitor interface.
          </p>
        </div>
      </section>

      {/* MONITORING LIMITS */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon blue">≈</div>

          <div>
            <h3>Monitoring Limits</h3>

            <p>
              Reference limits used to assess the condition of each water
              quality parameter.
            </p>
          </div>
        </div>

        <div className="settings-form-grid">
          {monitoringLimits.map((limit) => (
            <div className="settings-field" key={limit.name}>
              <label>{limit.name.toUpperCase()}</label>

              <div className="settings-input-group">
                <input
                  type="text"
                  value={limit.range}
                  readOnly
                  aria-label={`${limit.name} monitoring limit`}
                />

                <span>{limit.unit}</span>
              </div>

              <small>{limit.description}</small>
            </div>
          ))}
        </div>

        <div className="settings-reference-note">
          <strong>Monitoring reference</strong>
          <span>
            pH values below 5.0 or above 9.0 are critical, and values
            outside 6.5–7.5 but within 5.0–9.0 are warning. Temperature
            below 10 or above 50 °C is critical, and outside 20–40 °C but
            within 10–50 °C is warning. Turbidity above 2 NTU requires
            attention, while values above 5.00 NTU are critical.
          </span>
        </div>
      </section>

      {/* ALERT BEHAVIOUR */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon orange">!</div>

          <div>
            <h3>Alert Behaviour</h3>

            <p>
              Conditions used by AquaMonitor when assessing water quality
              readings.
            </p>
          </div>
        </div>

        <div className="settings-options">
          <div className="settings-option-row">
            <div className="settings-option-text">
              <strong>Water-quality alerts</strong>

              <span>
                Readings outside the defined monitoring limits are identified
                as warning or critical conditions.
              </span>
            </div>

            <span className="settings-status-label enabled">
              Enabled
            </span>
          </div>

          <div className="settings-option-row">
            <div className="settings-option-text">
              <strong>Critical conditions</strong>

              <span>
                Critical status is assigned when pH is below 5.0 or above
                9.0, temperature is below 10 or above 50 °C, or turbidity
                is above 5.00 NTU.
              </span>
            </div>

            <span className="settings-status-label enabled">
              Enabled
            </span>
          </div>

          <div className="settings-option-row">
            <div className="settings-option-text">
              <strong>Warning conditions</strong>

              <span>
                Warning status is assigned when pH is outside 6.5–7.5 but
                within 5.0–9.0, temperature is outside 20–40 °C but within
                10–50 °C, or turbidity is above 2 NTU but not above 5.00 NTU.
              </span>
            </div>

            <span className="settings-status-label enabled">
              Enabled
            </span>
          </div>
        </div>
      </section>

      {/* APPEARANCE */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon purple">◐</div>

          <div>
            <h3>Appearance</h3>

            <p>
              Choose how the AquaMonitor interface is displayed.
            </p>
          </div>
        </div>

        <div className="appearance-options">
          <button
            type="button"
            className={`appearance-option ${
              theme === "light" ? "selected" : ""
            }`}
            onClick={() => setTheme("light")}
            aria-label="Use light interface"
          >
            <div className="appearance-preview light-preview">
              <div className="preview-top" />

              <div className="preview-content">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="appearance-label">
              <strong>Light</strong>
              <span>Light interface</span>
            </div>

            {theme === "light" && (
              <span className="appearance-check">✓</span>
            )}
          </button>

          <button
            type="button"
            className={`appearance-option ${
              theme === "dark" ? "selected" : ""
            }`}
            onClick={() => setTheme("dark")}
            aria-label="Use dark interface"
          >
            <div className="appearance-preview dark-preview">
              <div className="preview-top" />

              <div className="preview-content">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="appearance-label">
              <strong>Dark</strong>
              <span>Dark interface</span>
            </div>

            {theme === "dark" && (
              <span className="appearance-check">✓</span>
            )}
          </button>
        </div>
      </section>

      {/* SYSTEM INFORMATION */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon green">i</div>

          <div>
            <h3>System Information</h3>

            <p>
              Information about the AquaMonitor monitoring system.
            </p>
          </div>
        </div>

        <div className="system-information">
          <div className="system-info-row">
            <span>System name</span>
            <strong>AquaMonitor</strong>
          </div>

          <div className="system-info-row">
            <span>Monitoring parameters</span>
            <strong>3</strong>
          </div>

          <div className="system-info-row">
            <span>Parameters monitored</span>
            <strong>pH, Temperature, Turbidity</strong>
          </div>

          <div className="system-info-row">
            <span>Data source</span>
            <strong>Firebase Realtime Database</strong>
          </div>

          <div className="system-info-row">
            <span>Monitoring status</span>
            <strong className="system-info-status">
              <i />
              Available
            </strong>
          </div>
        </div>
      </section>

      {/* CONFIGURATION NOTE */}
      <section className="settings-info-panel">
        <div className="settings-info-icon">i</div>

        <div>
          <h3>Configuration</h3>

          <p>
            The monitoring limits shown here are the reference values used
            across AquaMonitor for classifying water-quality conditions.
            Appearance settings are applied directly to the dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;