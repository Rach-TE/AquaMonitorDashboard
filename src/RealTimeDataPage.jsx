import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import { database } from "./firebase";
import "./RealTimeDataPage.css";

function RealTimeDataPage({ readings }) {
  const [lastUpdate, setLastUpdate] = useState(null);

  // =========================================
  // TRACK LATEST DATABASE UPDATE
  // =========================================

  useEffect(() => {
    const readingsRef = ref(database, "waterQuality/current");

    const unsubscribe = onValue(
      readingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLastUpdate(new Date());
        }
      },
      (error) => {
        console.error("Error monitoring real-time readings:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================
  // CHECK READING STATUS
  // =========================================

  const getStatus = (parameter, value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue === 0) {
      return "Waiting";
    }

    if (parameter === "ph") {
      if (numericValue < 6.5 || numericValue > 8.5) {
        return "Critical";
      }

      return "Normal";
    }

    if (parameter === "temperature") {
      if (numericValue < 20 || numericValue > 28) {
        return "Warning";
      }

      return "Normal";
    }

    if (parameter === "turbidity") {
      if (numericValue >= 5) {
        return "Critical";
      }

      if (numericValue > 1.5) {
        return "Warning";
      }

      return "Normal";
    }

    return "Waiting";
  };

  // =========================================
  // FORMAT UPDATE TIME
  // =========================================

  const formatUpdateTime = () => {
    if (!lastUpdate) {
      return "Waiting for data";
    }

    return lastUpdate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // =========================================
  // PARAMETER DATA
  // =========================================

  const parameters = [
    {
      key: "ph",
      name: "pH Level",
      description: "Acidity / alkalinity of water",
      value: Number(readings?.ph ?? 0),
      unit: "pH",
      icon: "pH",
      reference: "6.5 – 8.5",
      accent: "blue",
    },
    {
      key: "temperature",
      name: "Temperature",
      description: "Current water temperature",
      value: Number(readings?.temperature ?? 0),
      unit: "°C",
      icon: "°C",
      reference: "20 – 28 °C",
      accent: "orange",
    },
    {
      key: "turbidity",
      name: "Turbidity",
      description: "Water clarity measurement",
      value: Number(readings?.turbidity ?? 0),
      unit: "NTU",
      icon: "◉",
      reference: "≤ 1.50 NTU",
      accent: "green",
    },
  ];

  // =========================================
  // OVERALL STATUS
  // =========================================

  const criticalParameters = parameters.filter(
    (parameter) =>
      getStatus(parameter.key, parameter.value) === "Critical"
  );

  const warningParameters = parameters.filter(
    (parameter) =>
      getStatus(parameter.key, parameter.value) === "Warning"
  );

  const waitingParameters = parameters.filter(
    (parameter) =>
      getStatus(parameter.key, parameter.value) === "Waiting"
  );

  const overallStatus =
    waitingParameters.length === parameters.length
      ? "Waiting for Data"
      : criticalParameters.length > 0
      ? "Attention Required"
      : warningParameters.length > 0
      ? "Monitoring Required"
      : "All Parameters Normal";

  const overallStatusDescription =
    waitingParameters.length === parameters.length
      ? "No current water-quality readings are available."
      : criticalParameters.length > 0
      ? `${criticalParameters.length} parameter${
          criticalParameters.length === 1 ? "" : "s"
        } outside the critical range.`
      : warningParameters.length > 0
      ? `${warningParameters.length} parameter${
          warningParameters.length === 1 ? "" : "s"
        } outside the normal operating range.`
      : "All current water-quality parameters are within the normal operating range.";

  // =========================================
  // FORMAT READING
  // =========================================

  const formatReading = (value) => {
    if (!Number.isFinite(Number(value)) || Number(value) === 0) {
      return "—";
    }

    return Number(value).toFixed(1);
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="realtime-page">

      {/* =====================================
          PAGE INTRO
          ===================================== */}

      <section className="realtime-intro">
        <div>
          <p className="realtime-kicker">
            REAL-TIME DATA
          </p>

          <p>
            View the latest water-quality measurements
            received by the monitoring system.
          </p>
        </div>

        <div className="realtime-live-status">
          <span className="realtime-live-dot" />

          <div>
            <strong>
              Current Readings
            </strong>

            <small>
              Current water-quality data
            </small>
          </div>
        </div>
      </section>

      {/* =====================================
          CURRENT STATUS
          ===================================== */}

      <section className="realtime-status-panel">
        <div className="realtime-status-icon">
          {overallStatus === "Attention Required" ? "!" : "✓"}
        </div>

        <div className="realtime-status-content">
          <span>
            CURRENT WATER QUALITY STATUS
          </span>

          <strong>
            {overallStatus}
          </strong>

          <p>
            {overallStatusDescription}
          </p>
        </div>

        <div className="realtime-update">
          <span>
            LAST UPDATE
          </span>

          <strong>
            {formatUpdateTime()}
          </strong>
        </div>
      </section>

      {/* =====================================
          CURRENT MEASUREMENTS
          ===================================== */}

      <section className="realtime-section">
        <div className="realtime-section-heading">
          <div>
            <h3>
              Current Measurements
            </h3>

            <p>
              Latest values received from the monitoring system.
            </p>
          </div>

          <span className="realtime-reading-count">
            3 Parameters
          </span>
        </div>

        <div className="realtime-parameter-grid">
          {parameters.map((parameter) => {
            const status = getStatus(
              parameter.key,
              parameter.value
            );

            return (
              <article
                className={`realtime-parameter-card ${parameter.accent}`}
                key={parameter.key}
              >
                <div className="realtime-card-top">
                  <div className="realtime-parameter-icon">
                    {parameter.icon}
                  </div>

                  <span
                    className={`realtime-status-badge ${status.toLowerCase()}`}
                  >
                    <i />
                    {status}
                  </span>
                </div>

                <h4>
                  {parameter.name}
                </h4>

                <p className="realtime-parameter-description">
                  {parameter.description}
                </p>

                <div className="realtime-main-reading">
                  <strong>
                    {formatReading(parameter.value)}
                  </strong>

                  <span>
                    {parameter.unit}
                  </span>
                </div>

                <div className="realtime-reference">
                  <span>
                    Reference
                  </span>

                  <strong>
                    {parameter.reference}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================
          DATA SOURCE
          ===================================== */}

      <section className="realtime-section">
        <div className="realtime-section-heading">
          <div>
            <h3>
              Monitoring Data
            </h3>

            <p>
              Current water-quality data available in the monitoring system.
            </p>
          </div>
        </div>

        <div className="realtime-system-grid">

          <div className="realtime-system-card">
            <div className="realtime-system-icon">
              ≈
            </div>

            <div>
              <span>
                PARAMETERS
              </span>

              <strong>
                3 Measurements
              </strong>

              <small>
                pH · Temperature · Turbidity
              </small>
            </div>

            <span className="realtime-online">
              <i />
              Available
            </span>
          </div>

          <div className="realtime-system-card">
            <div className="realtime-system-icon">
              ↻
            </div>

            <div>
              <span>
                DATA SOURCE
              </span>

              <strong>
                Firebase
              </strong>

              <small>
                Real-time database
              </small>
            </div>

            <span className="realtime-online">
              <i />
              Available
            </span>
          </div>

          <div className="realtime-system-card">
            <div className="realtime-system-icon">
              ✓
            </div>

            <div>
              <span>
                CURRENT DATA
              </span>

              <strong>
                {waitingParameters.length === parameters.length
                  ? "No Readings"
                  : "Readings Available"}
              </strong>

              <small>
                Current water-quality values
              </small>
            </div>

            <span className="realtime-online">
              <i />
              {waitingParameters.length === parameters.length
                ? "Waiting"
                : "Available"}
            </span>
          </div>

        </div>
      </section>

      {/* =====================================
          DATA INFORMATION
          ===================================== */}

      <section className="realtime-info-panel">
        <div className="realtime-info-icon">
          i
        </div>

        <div>
          <h3>
            About Real-time Data
          </h3>

          <p>
            The measurements shown on this page are read from
            the current water-quality data stored in Firebase.
            The values update automatically when new readings
            are received.
          </p>
        </div>
      </section>

    </div>
  );
}

export default RealTimeDataPage;