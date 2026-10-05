import { useEffect, useMemo, useState } from "react";

import { onValue, ref, push, set } from "firebase/database";

import { database } from "./firebase";

import "./App.css";

import LandingPage from "./LandingPage";
import "./LandingPage.css";

import AlertsPage from "./AlertsPage";
import DataRecordsPage from "./DataRecordsPage";
import SettingsPage from "./SettingsPage";
import RealTimeDataPage from "./RealTimeDataPage";
import TrendsAnalysisPage from "./TrendsAnalysisPage";


function App() {

  // =========================================
  // LANDING PAGE
  // =========================================

  const [showLanding, setShowLanding] = useState(true);


  // =========================================
  // DASHBOARD NAVIGATION
  // =========================================

  const [activePage, setActivePage] = useState("Dashboard");


  // =========================================
  // CURRENT SENSOR READINGS
  // =========================================

  const [readings, setReadings] = useState({
    ph: 0,
    temperature: 0,
    turbidity: 0,
  });


  // =========================================
  // HISTORICAL READINGS
  // =========================================

  const [history, setHistory] = useState([]);


  // =========================================
  // CURRENT DATE AND TIME
  // =========================================

  const [currentTime, setCurrentTime] = useState(
    new Date()
  );


  // =========================================
  // APPLICATION THEME
  // =========================================

  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem("aquaMonitorTheme") ||
      "light"
    );
  });


  // =========================================
  // APPLY THEME
  // =========================================

  useEffect(() => {

    localStorage.setItem(
      "aquaMonitorTheme",
      theme
    );

    document.body.setAttribute(
      "data-theme",
      theme
    );

  }, [theme]);


  // =========================================
  // READ CURRENT VALUES FROM FIREBASE
  // =========================================

  useEffect(() => {

    const readingsRef = ref(
      database,
      "waterQuality/current"
    );


    const unsubscribe = onValue(
      readingsRef,
      (snapshot) => {

        const data = snapshot.val();


        if (data) {

          setReadings({
            ph: Number(data.ph ?? 0),
            temperature: Number(
              data.temperature ?? 0
            ),
            turbidity: Number(
              data.turbidity ?? 0
            ),
          });

        }

      },
      (error) => {

        console.error(
          "Error reading current water-quality data:",
          error
        );

      }
    );


    return () => unsubscribe();

  }, []);


  // =========================================
  // READ HISTORICAL VALUES FROM FIREBASE
  // =========================================

  useEffect(() => {

    const historyRef = ref(
      database,
      "waterQuality/history"
    );


    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {

        const data = snapshot.val();


        if (!data) {

          setHistory([]);

          return;

        }


        const records = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ph: Number(value?.ph ?? 0),
            temperature: Number(
              value?.temperature ?? 0
            ),
            turbidity: Number(
              value?.turbidity ?? 0
            ),
            timestamp: Number(
              value?.timestamp ?? 0
            ),
          }))
          .filter(
            (record) =>
              record.timestamp > 0
          )
          .sort(
            (a, b) =>
              a.timestamp - b.timestamp
          );


        setHistory(records);

      },
      (error) => {

        console.error(
          "Error reading water-quality history:",
          error
        );

      }
    );


    return () => unsubscribe();

  }, []);


  // =========================================
  // LIVE DASHBOARD CLOCK
  // =========================================

  useEffect(() => {

    const clock = setInterval(() => {

      setCurrentTime(new Date());

    }, 1000);


    return () => clearInterval(clock);

  }, []);


  // =========================================
  // SAVE READING TO FIREBASE HISTORY
  // =========================================

  const saveReading = async () => {

    try {

      const historyRef = ref(
        database,
        "waterQuality/history"
      );


      const newReadingRef = push(
        historyRef
      );


      await set(
        newReadingRef,
        {
          ph: readings.ph,
          temperature: readings.temperature,
          turbidity: readings.turbidity,
          timestamp: Date.now(),
        }
      );


      console.log(
        "Reading saved to history."
      );

    } catch (error) {

      console.error(
        "Error saving reading:",
        error
      );

    }

  };


  // =========================================
  // WATER QUALITY STATUS LOGIC
  // =========================================

  // pH:
  // 6.5 – 8.5 = Normal
  // Outside that range = Critical

  const getPhStatus = (value) => {

    if (value === 0) {
      return "Waiting";
    }


    if (
      value < 6.5 ||
      value > 8.5
    ) {
      return "Critical";
    }


    return "Normal";

  };


  // Temperature:
  // 20 – 28 °C = Normal
  // Outside that range = Warning

  const getTemperatureStatus = (
    value
  ) => {

    if (value === 0) {
      return "Waiting";
    }


    if (
      value < 20 ||
      value > 28
    ) {
      return "Warning";
    }


    return "Normal";

  };


  // Turbidity:
  // 0 – 1.50 NTU = Normal
  // >1.50 and <5.00 NTU = Warning
  // >=5.00 NTU = Critical

  const getTurbidityStatus = (
    value
  ) => {

    if (value === 0) {
      return "Waiting";
    }


    if (value >= 5.0) {
      return "Critical";
    }


    if (value > 1.5) {
      return "Warning";
    }


    return "Normal";

  };


  // =========================================
  // CURRENT PARAMETER STATUS
  // =========================================

  const phStatus = getPhStatus(
    readings.ph
  );

  const temperatureStatus =
    getTemperatureStatus(
      readings.temperature
    );

  const turbidityStatus =
    getTurbidityStatus(
      readings.turbidity
    );


  const hasReading =
    readings.ph !== 0 ||
    readings.temperature !== 0 ||
    readings.turbidity !== 0;


  const hasCritical =
    phStatus === "Critical" ||
    turbidityStatus === "Critical";


  const hasWarning =
    temperatureStatus === "Warning" ||
    turbidityStatus === "Warning";


  const overallStatus = !hasReading
    ? "Waiting"
    : hasCritical
    ? "Critical"
    : hasWarning
    ? "Warning"
    : "Normal";


  // =========================================
  // SYSTEM STATUS
  // =========================================

  const systemStatus =
    overallStatus === "Critical"
      ? {
          label: "Attention Required",
          description:
            "Critical water quality condition detected",
          className: "critical",
        }
      : overallStatus === "Warning"
      ? {
          label: "Monitoring",
          description:
            "Water quality requires attention",
          className: "warning",
        }
      : hasReading
      ? {
          label: "System Monitoring",
          description:
            "Current water quality data is available",
          className: "normal",
        }
      : {
          label: "Waiting for Data",
          description:
            "Awaiting current sensor readings",
          className: "waiting",
        };


  // =========================================
  // SENSOR STATUS
  // =========================================

  const getSensorStatus = (status) => {

    if (status === "Critical") {
      return {
        label: "Attention",
        className: "critical",
      };
    }


    if (status === "Warning") {
      return {
        label: "Warning",
        className: "warning",
      };
    }


    if (status === "Normal") {
      return {
        label: "Monitoring",
        className: "online",
      };
    }


    return {
      label: "Waiting",
      className: "standby",
    };

  };


  // =========================================
  // DASHBOARD CHART DATA
  // =========================================

  const chartRecords = useMemo(() => {

    return history.slice(-12);

  }, [history]);


  // =========================================
  // NORMALISE CHART VALUES
  // =========================================

  const normaliseValue = (
    value,
    min,
    max
  ) => {

    if (
      !Number.isFinite(value) ||
      max === min
    ) {
      return 0;
    }


    const result =
      ((value - min) /
        (max - min)) *
      10;


    return Math.max(
      0,
      Math.min(10, result)
    );

  };


  // =========================================
  // BUILD CHART POINTS
  // =========================================

  const buildChartPoints = (
    values,
    min,
    max
  ) => {

    if (values.length === 0) {
      return "";
    }


    const width = 600;
    const height = 200;


    return values
      .map((value, index) => {

        const x =
          values.length === 1
            ? width / 2
            : (index /
                (values.length - 1)) *
              width;


        const normalised =
          normaliseValue(
            value,
            min,
            max
          );


        const y =
          height -
          (normalised / 10) *
            height;


        return `${x},${y}`;

      })
      .join(" ");

  };


  const phChartPoints =
    buildChartPoints(
      chartRecords.map(
        (record) => record.ph
      ),
      4,
      10
    );


  const temperatureChartPoints =
    buildChartPoints(
      chartRecords.map(
        (record) =>
          record.temperature
      ),
      0,
      40
    );


  const turbidityChartPoints =
    buildChartPoints(
      chartRecords.map(
        (record) =>
          record.turbidity
      ),
      0,
      10
    );


  // =========================================
  // CHART TIME LABELS
  // =========================================

  const chartLabels = chartRecords.map(
    (record) =>
      new Date(
        record.timestamp
      ).toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )
  );


  // =========================================
  // SIDEBAR MENU
  // =========================================

  const menu = [
    ["⌂", "Dashboard"],
    ["◉", "Real-time Data"],
    ["▥", "Trends & Analysis"],
    ["♧", "Alerts"],
    ["▤", "Data Records"],
    ["⚙", "Settings"],
  ];


  // =========================================
  // WATER-QUALITY PARAMETERS
  // =========================================

  const parameters = [

    {
      name: "pH Level",
      value: readings.ph.toFixed(1),
      unit: "pH",
      icon: "pH",
      status: phStatus,
      range: "Reference: 6.5 – 8.5",
      color: "#2787e8",
      progress:
        readings.ph === 0
          ? "0%"
          : `${Math.min(
              100,
              Math.max(
                0,
                ((readings.ph - 4) /
                  6) *
                  100
              )
            )}%`,
    },


    {
      name: "Temperature",
      value:
        readings.temperature.toFixed(1),
      unit: "°C",
      icon: "°C",
      status:
        temperatureStatus,
      range:
        "Operating range: 20 – 28 °C",
      color: "#e8a23b",
      progress:
        readings.temperature === 0
          ? "0%"
          : `${Math.min(
              100,
              Math.max(
                0,
                (readings.temperature /
                  40) *
                  100
              )
            )}%`,
    },


    {
      name: "Turbidity",
      value:
        readings.turbidity.toFixed(1),
      unit: "NTU",
      icon: "◉",
      status:
        turbidityStatus,
      range:
        "Normal: ≤ 1.50 NTU",
      color: "#17b89b",
      progress:
        readings.turbidity === 0
          ? "0%"
          : `${Math.min(
              100,
              Math.max(
                0,
                (readings.turbidity /
                  10) *
                  100
              )
            )}%`,
    },

  ];


  // =========================================
  // FORMAT DATE
  // =========================================

  const formattedDate =
    currentTime.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );


  // =========================================
  // FORMAT TIME
  // =========================================

  const formattedTime =
    currentTime.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );


  // =========================================
  // LANDING PAGE
  // =========================================

  if (showLanding) {

    return (
      <LandingPage
        onGetStarted={() =>
          setShowLanding(false)
        }
      />
    );

  }


  // =========================================
  // MAIN APPLICATION
  // =========================================

  return (

    <div
      className={`app ${theme}-theme`}
    >

      {/* =====================================
          SIDEBAR
          ===================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ≈
          </div>

          <div>

            <h2>
              AquaMonitor
            </h2>

            <span>
              WATER QUALITY SYSTEM
            </span>

          </div>

        </div>


        <p className="menu-label">
          MONITORING SYSTEM
        </p>


        <nav>

          {menu.map(
            ([icon, name]) => (

              <button
                key={name}
                className={`nav-item ${
                  activePage === name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActivePage(name)
                }
              >

                <span>
                  {icon}
                </span>

                {name}

              </button>

            )
          )}

        </nav>


        <div className="sidebar-status">

          <span
            className={`online-dot ${
              overallStatus ===
              "Critical"
                ? "critical"
                : overallStatus ===
                  "Warning"
                ? "warning"
                : ""
            }`}
          />


          <div>

            <strong>
              {systemStatus.label}
            </strong>

            <small>
              {systemStatus.description}
            </small>

          </div>

        </div>

      </aside>


      {/* =====================================
          MAIN APPLICATION
          ===================================== */}

      <main className="main">


        {/* ===================================
            HEADER
            =================================== */}

        <header className="topbar">

          <div className="topbar-title">

            <p className="breadcrumb">
              AquaMonitor /{" "}
              {activePage}
            </p>

            <h1>
              {activePage}
            </h1>

          </div>


          <div className="topbar-right">


            {/* OPERATOR */}

            <div className="operator-block">

              <div className="avatar">
                OP
              </div>


              <div className="operator">

                <strong>
                  Operator
                </strong>

                <small>
                  Plant Operator
                </small>

              </div>

            </div>


            <div className="header-divider" />


            {/* DATE AND TIME */}

            <div className="datetime-block">

              <span className="datetime-date">
                {formattedDate}
              </span>

              <span className="datetime-time">
                {formattedTime}
              </span>

            </div>

          </div>

        </header>


        {/* ===================================
            PAGE CONTENT
            =================================== */}

        {activePage ===
        "Dashboard" ? (

          <>

            {/* =================================
                HERO / OVERVIEW
                ================================= */}

            <section className="welcome">

              <div className="welcome-content">

                <p className="section-kicker">
                  WATER TREATMENT MONITORING
                </p>

                <p className="welcome-description">
                  Monitor current water
                  quality conditions and
                  sensor status in real time.
                </p>

              </div>


              {/* SYSTEM STATUS */}

              <div className="system-online">

                <div className="system-online-icon">

                  <span
                    className={`online-pulse ${
                      systemStatus.className
                    }`}
                  />

                </div>


                <div>

                  <strong>
                    {systemStatus.label}
                  </strong>

                  <small>
                    {systemStatus.description}
                  </small>

                </div>

              </div>

            </section>


            {/* =================================
                PARAMETER CARDS
                ================================= */}

            <section className="parameter-grid">

              {parameters.map(
                (item) => (

                  <article
                    className="parameter-card"
                    key={item.name}
                  >

                    <div className="card-top">

                      <div
                        className="parameter-icon"
                        style={{
                          color:
                            item.color,
                        }}
                      >
                        {item.icon}
                      </div>


                      <span className="status-badge">
                        {item.status}
                      </span>

                    </div>


                    <p className="parameter-name">
                      {item.name}
                    </p>


                    <div className="reading">

                      {item.value}

                      <span>
                        {item.unit}
                      </span>

                    </div>


                    <div className="progress-track">

                      <div
                        className="progress-fill"
                        style={{
                          width:
                            item.progress,
                          background:
                            item.color,
                        }}
                      />

                    </div>


                    <p className="parameter-range">
                      {item.range}
                    </p>

                  </article>

                )
              )}

            </section>


            {/* =================================
                MAIN CONTENT
                ================================= */}

            <section className="content-grid">


              {/* WATER QUALITY RECORDS */}

              <article className="panel trend-panel">

                <div className="panel-heading">

                  <div>

                    <h3>
                      Recorded Water Quality
                    </h3>

                    <p>
                      Recent measurements stored
                      by the monitoring system
                    </p>

                  </div>


                  <span className="period-label">

                    {chartRecords.length > 0
                      ? `${chartRecords.length} Records`
                      : "No Records"}

                  </span>

                </div>


                <div className="legend">

                  <span>
                    <i className="blue" />
                    pH Level
                  </span>

                  <span>
                    <i className="green" />
                    Temperature
                  </span>

                  <span>
                    <i className="orange" />
                    Turbidity
                  </span>

                </div>


                {chartRecords.length > 0 ? (

                  <div className="chart">

                    <div className="y-labels">

                      <span>10</span>
                      <span>8</span>
                      <span>6</span>
                      <span>4</span>
                      <span>2</span>
                      <span>0</span>

                    </div>


                    <div className="plot">

                      {[0, 1, 2, 3, 4, 5].map(
                        (line) => (

                          <div
                            className="grid-line"
                            key={line}
                          />

                        )
                      )}


                      <svg
                        viewBox="0 0 600 200"
                        preserveAspectRatio="none"
                        className="trend-lines"
                        role="img"
                        aria-label="Recent recorded water quality measurements"
                      >

                        {phChartPoints && (

                          <polyline
                            points={
                              phChartPoints
                            }
                            fill="none"
                            stroke="#2787e8"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                          />

                        )}


                        {temperatureChartPoints && (

                          <polyline
                            points={
                              temperatureChartPoints
                            }
                            fill="none"
                            stroke="#17b89b"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                          />

                        )}


                        {turbidityChartPoints && (

                          <polyline
                            points={
                              turbidityChartPoints
                            }
                            fill="none"
                            stroke="#e8a23b"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                          />

                        )}

                      </svg>


                      <div className="x-labels">

                        {chartLabels.length <= 7
                          ? chartLabels.map(
                              (label, index) => (
                                <span
                                  key={`${label}-${index}`}
                                >
                                  {label}
                                </span>
                              )
                            )
                          : chartLabels
                              .filter(
                                (_, index) =>
                                  index === 0 ||
                                  index ===
                                    Math.floor(
                                      chartLabels.length /
                                        2
                                    ) ||
                                  index ===
                                    chartLabels.length -
                                      1
                              )
                              .map(
                                (
                                  label,
                                  index
                                ) => (
                                  <span
                                    key={`${label}-${index}`}
                                  >
                                    {label}
                                  </span>
                                )
                              )}

                      </div>

                    </div>

                  </div>

                ) : (

                  <div className="chart">

                    <div
                      className="plot"
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >

                      <p
                        className="chart-note"
                        style={{
                          margin: 0,
                        }}
                      >
                        No recorded measurements
                        are available yet.
                      </p>

                    </div>

                  </div>

                )}


                <p className="chart-note">
                  The chart uses the latest
                  recorded measurements from
                  the connected monitoring
                  system. Detailed analysis is
                  available under Trends &amp;
                  Analysis.
                </p>

              </article>


              {/* SENSOR STATUS */}

              <article className="panel sensor-panel">

                <div className="panel-heading">

                  <div>

                    <h3>
                      Sensor Status
                    </h3>

                    <p>
                      Current status of connected
                      monitoring sensors
                    </p>

                  </div>


                  <span className="status-badge">
                    3 Sensors
                  </span>

                </div>


                {[
                  [
                    "pH Sensor",
                    "Acidity monitoring",
                    "PH-01",
                    phStatus,
                  ],
                  [
                    "Temperature Sensor",
                    "Temperature monitoring",
                    "TMP-01",
                    temperatureStatus,
                  ],
                  [
                    "Turbidity Sensor",
                    "Water clarity monitoring",
                    "TUR-01",
                    turbidityStatus,
                  ],
                ].map(
                  ([
                    name,
                    description,
                    id,
                    status,
                  ]) => {

                    const currentSensorStatus =
                      getSensorStatus(
                        status
                      );


                    return (

                      <div
                        className="sensor-row"
                        key={id}
                      >

                        <div className="sensor-icon">
                          ⌁
                        </div>


                        <div className="sensor-details">

                          <strong>
                            {name}
                          </strong>

                          <p>
                            {description}
                          </p>

                          <small>
                            {id}
                          </small>

                        </div>


                        <span
                          className={`sensor-status ${currentSensorStatus.className}`}
                        >

                          <i />

                          {
                            currentSensorStatus.label
                          }

                        </span>

                      </div>

                    );

                  }
                )}


                <p className="chart-note">
                  Sensor status is based on
                  the latest available
                  readings.
                </p>

              </article>

            </section>


            {/* =================================
                SUMMARY
                ================================= */}

            <section className="bottom-grid">


              <article className="panel summary-card">

                <div className="summary-icon">

                  {overallStatus ===
                  "Normal"
                    ? "✓"
                    : overallStatus ===
                      "Critical"
                    ? "!"
                    : overallStatus ===
                      "Warning"
                    ? "!"
                    : "•"}

                </div>


                <div>

                  <p>
                    Water Quality Status
                  </p>


                  <h3>

                    {overallStatus ===
                    "Normal"
                      ? "Within Reference Range"
                      : overallStatus ===
                        "Critical"
                      ? "Critical Condition"
                      : overallStatus ===
                        "Warning"
                      ? "Attention Required"
                      : "Awaiting Readings"}

                  </h3>


                  <small>

                    {overallStatus ===
                    "Normal"
                      ? "All available parameters are within their reference ranges"
                      : overallStatus ===
                        "Critical"
                      ? "One or more parameters require immediate attention"
                      : overallStatus ===
                        "Warning"
                      ? "One or more parameters are outside the normal operating range"
                      : "Current sensor readings have not been received"}

                  </small>

                </div>


                <span className="status-badge">
                  {overallStatus}
                </span>

              </article>


              <article className="panel summary-card">

                <div className="summary-icon blue-bg">
                  ↻
                </div>


                <div>

                  <p>
                    Current Time
                  </p>


                  <h3>
                    {formattedTime}
                  </h3>


                  <small>
                    Local plant monitoring time
                  </small>

                </div>

              </article>

            </section>

          </>

        ) : activePage ===
          "Real-time Data" ? (

          <RealTimeDataPage
            readings={readings}
          />

        ) : activePage ===
          "Trends & Analysis" ? (

          <TrendsAnalysisPage />

        ) : activePage ===
          "Alerts" ? (

          <AlertsPage
            readings={readings}
          />

        ) : activePage ===
          "Data Records" ? (

          <DataRecordsPage />

        ) : activePage ===
          "Settings" ? (

          <SettingsPage
            theme={theme}
            setTheme={setTheme}
          />

        ) : (

          <section className="panel placeholder">

            <div className="placeholder-icon">
              ≈
            </div>


            <h2>
              {activePage}
            </h2>


            <p>
              This page is currently
              unavailable.
            </p>


            <button
              onClick={() =>
                setActivePage(
                  "Dashboard"
                )
              }
            >
              Back to Dashboard
            </button>

          </section>

        )}


        {/* ===================================
            FOOTER
            =================================== */}

        <footer className="footer">

          <span>
            AquaMonitor · Water Quality
            Monitoring System
          </span>


          <span>
            Continuous Water Quality
            Monitoring
          </span>

        </footer>

      </main>

    </div>

  );

}


export default App;