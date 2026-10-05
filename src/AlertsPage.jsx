import "./AlertsPage.css";


function AlertsPage({ readings }) {

  // =========================================
  // CURRENT WATER-QUALITY LIMITS
  // =========================================

  const PH_MIN = 6.5;
  const PH_MAX = 8.5;

  const TEMPERATURE_MIN = 20;
  const TEMPERATURE_MAX = 28;

  const TURBIDITY_WARNING = 1.5;
  const TURBIDITY_CRITICAL = 5.0;


  // =========================================
  // CURRENT READING STATUS
  // =========================================

  const hasReading =
    readings &&
    (
      readings.ph !== 0 ||
      readings.temperature !== 0 ||
      readings.turbidity !== 0
    );


  // =========================================
  // WATER-QUALITY CONDITIONS
  // =========================================

  const phCritical =
    hasReading &&
    (
      readings.ph < PH_MIN ||
      readings.ph > PH_MAX
    );


  const temperatureWarning =
    hasReading &&
    (
      readings.temperature <
        TEMPERATURE_MIN ||
      readings.temperature >
        TEMPERATURE_MAX
    );


  const turbidityCritical =
    hasReading &&
    readings.turbidity >=
      TURBIDITY_CRITICAL;


  const turbidityWarning =
    hasReading &&
    readings.turbidity >
      TURBIDITY_WARNING &&
    readings.turbidity <
      TURBIDITY_CRITICAL;


  // =========================================
  // ACTIVE ALERTS
  // =========================================

  const activeAlerts = [];


  // pH alert

  if (phCritical) {

    activeAlerts.push({
      id: "ph-alert",
      severity: "critical",
      title:
        readings.ph < PH_MIN
          ? "Low pH Level"
          : "High pH Level",
      parameter: "pH",
      value: readings.ph.toFixed(1),
      limit: `${PH_MIN} – ${PH_MAX}`,
      description:
        readings.ph < PH_MIN
          ? "The current pH level is below the acceptable reference range."
          : "The current pH level is above the acceptable reference range.",
      response:
        "Check the treatment process and investigate the cause of the pH deviation.",
    });

  }


  // Temperature alert

  if (temperatureWarning) {

    activeAlerts.push({
      id: "temperature-alert",
      severity: "warning",
      title:
        readings.temperature <
        TEMPERATURE_MIN
          ? "Low Water Temperature"
          : "High Water Temperature",
      parameter: "Temperature",
      value:
        readings.temperature.toFixed(1),
      limit: `${TEMPERATURE_MIN} – ${TEMPERATURE_MAX} °C`,
      description:
        readings.temperature <
        TEMPERATURE_MIN
          ? "The current water temperature is below the normal operating range."
          : "The current water temperature is above the normal operating range.",
      response:
        "Monitor the water temperature and check the treatment process if the condition persists.",
    });

  }


  // Turbidity critical alert

  if (turbidityCritical) {

    activeAlerts.push({
      id: "turbidity-critical-alert",
      severity: "critical",
      title: "High Turbidity",
      parameter: "Turbidity",
      value:
        readings.turbidity.toFixed(1),
      limit:
        `${TURBIDITY_CRITICAL.toFixed(1)} NTU`,
      description:
        "The current turbidity level has reached or exceeded the critical alert limit.",
      response:
        "Check water clarity, treatment conditions and the turbidity sensor.",
    });

  }

  // Turbidity warning

  else if (turbidityWarning) {

    activeAlerts.push({
      id: "turbidity-warning-alert",
      severity: "warning",
      title: "Elevated Turbidity",
      parameter: "Turbidity",
      value:
        readings.turbidity.toFixed(1),
      limit:
        `≤ ${TURBIDITY_WARNING.toFixed(1)} NTU`,
      description:
        "The current turbidity level is above the normal range and requires monitoring.",
      response:
        "Monitor the turbidity level and check the treatment process if it continues to increase.",
    });

  }


  // =========================================
  // ALERT COUNTS
  // =========================================

  const criticalAlerts =
    activeAlerts.filter(
      (alert) =>
        alert.severity === "critical"
    ).length;


  const warningAlerts =
    activeAlerts.filter(
      (alert) =>
        alert.severity === "warning"
    ).length;


  // =========================================
  // OVERALL ALERT STATUS
  // =========================================

  const overallStatus =
    !hasReading
      ? {
          label: "Waiting for Data",
          description:
            "Awaiting current water-quality readings.",
          type: "normal",
        }
      : criticalAlerts > 0
      ? {
          label: "Attention Required",
          description:
            "A critical water-quality condition is currently detected.",
          type: "critical",
        }
      : warningAlerts > 0
      ? {
          label: "Monitoring Required",
          description:
            "One or more water-quality parameters require attention.",
          type: "warning",
        }
      : {
          label: "System Normal",
          description:
            "Current water-quality parameters are within their configured ranges.",
          type: "normal",
        };


  // =========================================
  // CURRENT MONITORING STATUS
  // =========================================

  const getParameterStatus = (
    parameter
  ) => {

    if (!hasReading) {
      return {
        status: "Waiting",
        type: "standby",
      };
    }


    if (parameter === "pH") {

      return phCritical
        ? {
            status: "Attention",
            type: "critical",
          }
        : {
            status: "Within Range",
            type: "online",
          };

    }


    if (
      parameter ===
      "Temperature"
    ) {

      return temperatureWarning
        ? {
            status: "Attention",
            type: "warning",
          }
        : {
            status: "Within Range",
            type: "online",
          };

    }


    if (
      parameter ===
      "Turbidity"
    ) {

      if (turbidityCritical) {

        return {
          status: "Critical",
          type: "critical",
        };

      }


      if (turbidityWarning) {

        return {
          status: "Attention",
          type: "warning",
        };

      }


      return {
        status: "Within Range",
        type: "online",
      };

    }


    return {
      status: "Waiting",
      type: "standby",
    };

  };


  const phMonitoring =
    getParameterStatus("pH");

  const temperatureMonitoring =
    getParameterStatus(
      "Temperature"
    );

  const turbidityMonitoring =
    getParameterStatus(
      "Turbidity"
    );


  // =========================================
  // SYSTEM STATUS
  // =========================================

  const systemStatus = [

    {
      name: "pH Monitoring",
      description:
        "Current acidity measurement",
      status:
        phMonitoring.status,
      type:
        phMonitoring.type,
    },

    {
      name: "Temperature Monitoring",
      description:
        "Current water temperature",
      status:
        temperatureMonitoring.status,
      type:
        temperatureMonitoring.type,
    },

    {
      name: "Turbidity Monitoring",
      description:
        "Current water clarity measurement",
      status:
        turbidityMonitoring.status,
      type:
        turbidityMonitoring.type,
    },

    {
      name: "Current Data",
      description:
        hasReading
          ? "Current readings are available"
          : "No current readings received",
      status:
        hasReading
          ? "Available"
          : "Waiting",
      type:
        hasReading
          ? "online"
          : "standby",
    },

    {
      name: "Alert Monitoring",
      description:
        activeAlerts.length > 0
          ? "Active conditions are being monitored"
          : "No current alert conditions",
      status:
        activeAlerts.length > 0
          ? "Active"
          : "Clear",
      type:
        criticalAlerts > 0
          ? "critical"
          : warningAlerts > 0
          ? "warning"
          : "online",
    },

    {
      name: "Alarm Condition",
      description:
        criticalAlerts > 0
          ? "Critical condition detected"
          : "No critical alarm condition detected",
      status:
        criticalAlerts > 0
          ? "Critical"
          : "Standby",
      type:
        criticalAlerts > 0
          ? "critical"
          : "standby",
    },

  ];


  // =========================================
  // PAGE
  // =========================================

  return (

    <div className="alerts-page">


      {/* =====================================
          PAGE INTRO
          ===================================== */}

      <section className="alerts-intro">

        <div>

          <p className="alerts-kicker">
            ALERT MANAGEMENT
          </p>

          <p>
            Monitor water-quality conditions
            that require attention and review
            the current monitoring status.
          </p>

        </div>


        <div
          className={`alerts-overall-status ${overallStatus.type}`}
        >

          <span className="alerts-status-dot" />

          <div>

            <strong>
              {overallStatus.label}
            </strong>

            <small>
              {overallStatus.description}
            </small>

          </div>

        </div>

      </section>


      {/* =====================================
          ALERT SUMMARY
          ===================================== */}

      <section className="alert-summary-grid">


        <article className="alert-summary-card">

          <div className="alert-summary-icon blue">
            !
          </div>

          <div>

            <span>
              ACTIVE ALERTS
            </span>

            <strong>
              {activeAlerts.length}
            </strong>

          </div>

        </article>


        <article className="alert-summary-card">

          <div className="alert-summary-icon red">
            !
          </div>

          <div>

            <span>
              CRITICAL
            </span>

            <strong>
              {criticalAlerts}
            </strong>

          </div>

        </article>


        <article className="alert-summary-card">

          <div className="alert-summary-icon green">
            ✓
          </div>

          <div>

            <span>
              WITHIN RANGE
            </span>

            <strong>
              {
                hasReading
                  ? [
                      phCritical,
                      temperatureWarning,
                      turbidityCritical ||
                        turbidityWarning,
                    ].filter(
                      (status) =>
                        !status
                    ).length
                  : 0
              }
            </strong>

          </div>

        </article>


      </section>


      {/* =====================================
          CURRENT MONITORING STATUS
          ===================================== */}

      <section className="alerts-panel">

        <div className="alerts-panel-header">

          <div>

            <h3>
              Current Monitoring Status
            </h3>

            <p>
              Status of the water-quality
              parameters based on their
              latest available readings.
            </p>

          </div>


          <span
            className={`alerts-header-status ${
              overallStatus.type
            }`}
          >

            <i />

            {overallStatus.label}

          </span>

        </div>


        <div className="system-status-grid">

          {systemStatus.map(
            (item) => (

              <div
                className="system-status-item"
                key={item.name}
              >

                <div className="system-status-icon">

                  {item.type ===
                  "critical"
                    ? "!"
                    : item.type ===
                      "warning"
                    ? "!"
                    : item.type ===
                      "standby"
                    ? "○"
                    : "●"}

                </div>


                <div className="system-status-info">

                  <strong>
                    {item.name}
                  </strong>

                  <small>
                    {item.description}
                  </small>

                </div>


                <span
                  className={`system-status-badge ${item.type}`}
                >

                  <i />

                  {item.status}

                </span>

              </div>

            )
          )}

        </div>

      </section>


      {/* =====================================
          ACTIVE ALERTS
          ===================================== */}

      <section className="alerts-panel">

        <div className="alerts-panel-header">

          <div>

            <h3>
              Active Alerts
            </h3>

            <p>
              Current water-quality conditions
              outside the configured operating
              ranges.
            </p>

          </div>


          <span className="active-count">
            {activeAlerts.length} active
          </span>

        </div>


        {activeAlerts.length === 0 ? (

          <div className="no-alerts">

            <div className="no-alerts-icon">
              ✓
            </div>


            <h4>
              No active alerts
            </h4>


            <p>
              All currently monitored
              water-quality parameters are
              within their configured ranges.
            </p>

          </div>

        ) : (

          <div className="active-alert-list">

            {activeAlerts.map(
              (alert) => (

                <article
                  className={`active-alert ${alert.severity}`}
                  key={alert.id}
                >

                  <div className="active-alert-icon">
                    !
                  </div>


                  <div className="active-alert-content">

                    <div className="active-alert-title-row">

                      <div>

                        <span className="alert-severity-label">
                          {alert.severity ===
                          "critical"
                            ? "CRITICAL"
                            : "WARNING"}
                        </span>


                        <h4>
                          {alert.title}
                        </h4>

                      </div>


                      <span className="alert-status-label">
                        Active
                      </span>

                    </div>


                    <p>
                      {alert.description}
                    </p>


                    <div className="alert-reading-details">


                      <div>

                        <span>
                          CURRENT READING
                        </span>

                        <strong>

                          {alert.value}

                          {alert.parameter ===
                          "Turbidity"
                            ? " NTU"
                            : alert.parameter ===
                              "Temperature"
                            ? " °C"
                            : ""}

                        </strong>

                      </div>


                      <div>

                        <span>
                          ACCEPTABLE RANGE
                        </span>

                        <strong>
                          {alert.limit}
                        </strong>

                      </div>


                      <div>

                        <span>
                          RECOMMENDED RESPONSE
                        </span>

                        <strong>
                          {alert.response}
                        </strong>

                      </div>


                    </div>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>


      {/* =====================================
          ALERT RECORDS
          ===================================== */}

      <section className="alerts-panel">

        <div className="alerts-panel-header">

          <div>

            <h3>
              Alert Records
            </h3>

            <p>
              Recorded alert events from the
              monitoring system.
            </p>

          </div>

        </div>


        <div className="alert-history-table">

          <div className="alert-history-head">

            <span>
              DATE &amp; TIME
            </span>

            <span>
              TYPE
            </span>

            <span>
              CONDITION
            </span>

            <span>
              VALUE
            </span>

            <span>
              STATUS
            </span>

          </div>


          <div className="alert-history-empty">

            <div className="history-empty-icon">
              —
            </div>


            <strong>
              No recorded alert events
            </strong>


            <p>
              Alert records will appear here
              once alert-event storage is
              connected to the monitoring
              system.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================
          RESPONSE GUIDANCE
          ===================================== */}

      <section className="troubleshooting-panel">

        <div className="troubleshooting-icon">
          !
        </div>


        <div>

          <h3>
            Response Guidance
          </h3>


          <p>
            When an alert occurs, check the
            current parameter reading against
            its configured range, inspect the
            relevant sensor and review the
            treatment process before taking
            corrective action.
          </p>

        </div>

      </section>


    </div>

  );

}


export default AlertsPage;