import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";

import { database } from "./firebase";
import "./TrendsAnalysisPage.css";

function TrendsAnalysisPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("24h");

  // =========================================
  // LOAD HISTORICAL DATA
  // =========================================

  useEffect(() => {
    const historyRef = ref(database, "WaterQuality/History");

    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setRecords([]);
          setLoading(false);
          return;
        }

       
const loadedRecords = Object.entries(data)
  .map(([id, value]) => ({
    id,
    ph: value?.pH == null ? NaN : Number(value.pH),
    temperature: value?.temp == null ? NaN : Number(value.temp),
    turbidity:
      value?.turbidity == null ? NaN : Number(value.turbidity),
    timestamp: Number(value?.timestamp),
  }))
  .filter(
    (record) =>
      record.timestamp > 0 &&
      Number.isFinite(record.ph) &&
      Number.isFinite(record.temperature) &&
      Number.isFinite(record.turbidity)
  )
  .sort((a, b) => a.timestamp - b.timestamp);

        setRecords(loadedRecords);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading trend data:", error);
        setRecords([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================
  // FILTER DATA BY SELECTED PERIOD
  // =========================================

  const filteredRecords = useMemo(() => {
    if (period === "all") {
      return records;
    }

    const now = Date.now();

    const periodMilliseconds = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const startTime = now - periodMilliseconds[period];

    return records.filter(
      (record) => record.timestamp >= startTime
    );
  }, [records, period]);

  // =========================================
  // CALCULATE STATISTICS
  // =========================================

  const calculateStats = (parameter) => {
    if (filteredRecords.length === 0) {
      return {
        average: null,
        minimum: null,
        maximum: null,
      };
    }

    const values = filteredRecords
      .map((record) => Number(record[parameter]))
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) {
      return {
        average: null,
        minimum: null,
        maximum: null,
      };
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      average: total / values.length,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    };
  };

  const phStats = calculateStats("ph");
  const temperatureStats = calculateStats("temperature");
  const turbidityStats = calculateStats("turbidity");

  // =========================================
  // HISTORICAL STATUS
  // =========================================

  const getStatus = (parameter, value) => {
    if (!Number.isFinite(Number(value)) || Number(value) === 0) {
      return "Waiting";
    }

    const numericValue = Number(value);

    if (parameter === "ph") {
      return numericValue >= 6.5 && numericValue <= 8.5
        ? "Normal"
        : "Critical";
    }

    if (parameter === "temperature") {
      return numericValue >= 20 && numericValue <= 28
        ? "Normal"
        : "Warning";
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

  const analysis = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let critical = 0;

    filteredRecords.forEach((record) => {
      ["ph", "temperature", "turbidity"].forEach((parameter) => {
        const status = getStatus(
          parameter,
          Number(record[parameter])
        );

        if (status === "Normal") normal += 1;
        if (status === "Warning") warning += 1;
        if (status === "Critical") critical += 1;
      });
    });

    return {
      normal,
      warning,
      critical,
    };
  }, [filteredRecords]);

  // =========================================
  // FORMAT TIME
  // =========================================

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  // =========================================
  // CREATE CHART POINTS
  // =========================================

  const createPoints = (
    parameter,
    minimum,
    maximum
  ) => {
    if (filteredRecords.length === 0) {
      return "";
    }

    const width = 700;
    const height = 220;
    const padding = 8;

    const range =
      maximum - minimum === 0
        ? 1
        : maximum - minimum;

    return filteredRecords
      .map((record, index) => {
        const value = Number(record[parameter]);

        const x =
          filteredRecords.length === 1
            ? width / 2
            : (index /
                (filteredRecords.length - 1)) *
              width;

        const normalized =
          (value - minimum) / range;

        const y =
          height -
          padding -
          normalized *
            (height - padding * 2);

        return `${x},${y}`;
      })
      .join(" ");
  };

  // =========================================
  // CHART RANGES
  // =========================================

  const phChartMin = 5;
  const phChartMax = 10;

  const temperatureValues = filteredRecords.map(
    (record) => record.temperature
  );

  const turbidityValues = filteredRecords.map(
    (record) => record.turbidity
  );

  const temperatureMin =
    temperatureValues.length > 0
      ? Math.floor(
          Math.min(...temperatureValues, 20) - 1
        )
      : 0;

  const temperatureMax =
    temperatureValues.length > 0
      ? Math.ceil(
          Math.max(...temperatureValues, 28) + 1
        )
      : 30;

  const turbidityMax =
    turbidityValues.length > 0
      ? Math.max(
          5,
          Math.ceil(
            Math.max(...turbidityValues) + 1
          )
        )
      : 5;

  // =========================================
  // CHART LABELS
  // =========================================

  const getChartLabels = () => {
    if (filteredRecords.length === 0) {
      return [];
    }

    if (filteredRecords.length <= 6) {
      return filteredRecords;
    }

    const indexes = [
      0,
      Math.floor(filteredRecords.length * 0.25),
      Math.floor(filteredRecords.length * 0.5),
      Math.floor(filteredRecords.length * 0.75),
      filteredRecords.length - 1,
    ];

    return indexes
      .map((index) => filteredRecords[index])
      .filter(
        (record, index, array) =>
          array.findIndex(
            (item) => item.id === record.id
          ) === index
      );
  };

  const chartLabels = getChartLabels();

  // =========================================
  // PERIOD LABEL
  // =========================================

  const periodLabel = {
    "24h": "Last 24 hours",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    all: "All available data",
  }[period];

  // =========================================
  // STATISTIC FORMAT
  // =========================================

  const formatStat = (value, unit = "") => {
    if (value === null || !Number.isFinite(value)) {
      return "—";
    }

    return `${value.toFixed(1)}${unit}`;
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="trends-page">

      {/* =====================================
          PAGE INTRO
          ===================================== */}

      <section className="trends-intro">
        <div>
          <p className="trends-kicker">
            TRENDS & ANALYSIS
          </p>

          <p>
            Analyse recorded water-quality measurements
            across different time periods.
          </p>
        </div>

        <div className="trends-data-status">
          <span className="trends-status-dot" />

          <div>
            <strong>
              Historical Measurements
            </strong>

            <small>
              {records.length.toLocaleString()} recorded
              measurements
            </small>
          </div>
        </div>
      </section>

      {/* =====================================
          PERIOD FILTER
          ===================================== */}

      <section className="trends-filter-panel">
        <div>
          <h3>
            Analysis Period
          </h3>

          <p>
            Select the period of recorded measurements
            to analyse.
          </p>
        </div>

        <div className="trends-period-buttons">
          <button
            type="button"
            className={period === "24h" ? "active" : ""}
            onClick={() => setPeriod("24h")}
          >
            24 Hours
          </button>

          <button
            type="button"
            className={period === "7d" ? "active" : ""}
            onClick={() => setPeriod("7d")}
          >
            7 Days
          </button>

          <button
            type="button"
            className={period === "30d" ? "active" : ""}
            onClick={() => setPeriod("30d")}
          >
            30 Days
          </button>

          <button
            type="button"
            className={period === "all" ? "active" : ""}
            onClick={() => setPeriod("all")}
          >
            All Data
          </button>
        </div>
      </section>

      {/* =====================================
          SUMMARY
          ===================================== */}

      <section className="trends-summary-grid">

        <article className="trends-summary-card">
          <div className="trends-summary-icon blue">
            #
          </div>

          <div>
            <span>
              RECORDS ANALYSED
            </span>

            <strong>
              {filteredRecords.length.toLocaleString()}
            </strong>

            <small>
              {periodLabel}
            </small>
          </div>
        </article>

        <article className="trends-summary-card">
          <div className="trends-summary-icon blue">
            pH
          </div>

          <div>
            <span>
              AVERAGE pH
            </span>

            <strong>
              {formatStat(phStats.average)}
            </strong>

            <small>
              Normal range: 6.5 – 8.5
            </small>
          </div>
        </article>

        <article className="trends-summary-card">
          <div className="trends-summary-icon orange">
            °C
          </div>

          <div>
            <span>
              AVERAGE TEMPERATURE
            </span>

            <strong>
              {formatStat(
                temperatureStats.average,
                " °C"
              )}
            </strong>

            <small>
              Operating range: 20 – 28 °C
            </small>
          </div>
        </article>

        <article className="trends-summary-card">
          <div className="trends-summary-icon green">
            ◉
          </div>

          <div>
            <span>
              AVERAGE TURBIDITY
            </span>

            <strong>
              {formatStat(
                turbidityStats.average,
                " NTU"
              )}
            </strong>

            <small>
              Normal: ≤ 1.50 NTU
            </small>
          </div>
        </article>

      </section>

      {/* =====================================
          HISTORICAL STATUS SUMMARY
          ===================================== */}

      {!loading && filteredRecords.length > 0 && (
        <section className="trends-analysis-panel">
          <div className="trends-analysis-icon">
            i
          </div>

          <div>
            <h3>
              Recorded Conditions
            </h3>

            <p>
              Across the selected period,{" "}
              <strong>
                {analysis.normal.toLocaleString()}
              </strong>{" "}
              measurements were within the normal
              monitoring ranges,{" "}
              <strong>
                {analysis.warning.toLocaleString()}
              </strong>{" "}
              were in warning conditions, and{" "}
              <strong>
                {analysis.critical.toLocaleString()}
              </strong>{" "}
              were in critical conditions.
            </p>
          </div>
        </section>
      )}

      {/* =====================================
          LOADING / EMPTY STATE
          ===================================== */}

      {loading ? (
        <section className="trends-empty-panel">
          <div className="trends-empty-icon">
            ↻
          </div>

          <h3>
            Loading historical data
          </h3>

          <p>
            Retrieving recorded measurements from
            the monitoring database.
          </p>
        </section>
      ) : filteredRecords.length === 0 ? (
        <section className="trends-empty-panel">
          <div className="trends-empty-icon">
            —
          </div>

          <h3>
            No historical data available
          </h3>

          <p>
            There are no recorded measurements for
            the selected period.
          </p>
        </section>
      ) : (
        <>
          {/* =================================
              pH TREND
              ================================= */}

          <section className="trend-chart-panel">
            <div className="trend-chart-header">
              <div>
                <div className="trend-chart-title">
                  <span className="trend-chart-icon blue">
                    pH
                  </span>

                  <div>
                    <h3>
                      pH Trend
                    </h3>

                    <p>
                      Recorded pH measurements over{" "}
                      {periodLabel.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="trend-stat-group">
                <div>
                  <span>MIN</span>
                  <strong>
                    {formatStat(phStats.minimum)}
                  </strong>
                </div>

                <div>
                  <span>MAX</span>
                  <strong>
                    {formatStat(phStats.maximum)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="trend-chart">
              <div className="trend-y-labels">
                <span>10</span>
                <span>9</span>
                <span>8</span>
                <span>7</span>
                <span>6</span>
                <span>5</span>
              </div>

              <div className="trend-plot">
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />

                <svg
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                  className="trend-svg"
                >
                  <polyline
                    points={createPoints(
                      "ph",
                      phChartMin,
                      phChartMax
                    )}
                    fill="none"
                    stroke="#2787e8"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className="trend-x-labels">
                  {chartLabels.map(
                    (record, index) => (
                      <span
                        key={`${record.id}-${index}`}
                      >
                        {period === "24h"
                          ? formatTime(record.timestamp)
                          : formatDate(record.timestamp)}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =================================
              TEMPERATURE TREND
              ================================= */}

          <section className="trend-chart-panel">
            <div className="trend-chart-header">
              <div>
                <div className="trend-chart-title">
                  <span className="trend-chart-icon orange">
                    °C
                  </span>

                  <div>
                    <h3>
                      Temperature Trend
                    </h3>

                    <p>
                      Recorded water temperature over{" "}
                      {periodLabel.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="trend-stat-group">
                <div>
                  <span>MIN</span>
                  <strong>
                    {formatStat(
                      temperatureStats.minimum,
                      "°"
                    )}
                  </strong>
                </div>

                <div>
                  <span>MAX</span>
                  <strong>
                    {formatStat(
                      temperatureStats.maximum,
                      "°"
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="trend-chart">
              <div className="trend-y-labels">
               
<span>{temperatureMax}</span>

<span>
  {Math.round(
    temperatureMax - (temperatureMax - temperatureMin) * 0.2
  )}
</span>

<span>
  {Math.round(
    temperatureMax - (temperatureMax - temperatureMin) * 0.4
  )}
</span>

<span>
  {Math.round(
    temperatureMax - (temperatureMax - temperatureMin) * 0.6
  )}
</span>

<span>
  {Math.round(
    temperatureMax - (temperatureMax - temperatureMin) * 0.8
  )}
</span>

<span>{temperatureMin}</span>

              </div>

              <div className="trend-plot">
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />

                <svg
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                  className="trend-svg"
                >
                  <polyline
                    points={createPoints(
                      "temperature",
                      temperatureMin,
                      temperatureMax
                    )}
                    fill="none"
                    stroke="#e8a23b"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className="trend-x-labels">
                  {chartLabels.map(
                    (record, index) => (
                      <span
                        key={`${record.id}-${index}`}
                      >
                        {period === "24h"
                          ? formatTime(record.timestamp)
                          : formatDate(record.timestamp)}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =================================
              TURBIDITY TREND
              ================================= */}

          <section className="trend-chart-panel">
            <div className="trend-chart-header">
              <div>
                <div className="trend-chart-title">
                  <span className="trend-chart-icon green">
                    ◉
                  </span>

                  <div>
                    <h3>
                      Turbidity Trend
                    </h3>

                    <p>
                      Recorded turbidity measurements over{" "}
                      {periodLabel.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="trend-stat-group">
                <div>
                  <span>MIN</span>
                  <strong>
                    {formatStat(turbidityStats.minimum)}
                  </strong>
                </div>

                <div>
                  <span>MAX</span>
                  <strong>
                    {formatStat(turbidityStats.maximum)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="trend-chart">
              <div className="trend-y-labels">
                <span>{turbidityMax}</span>

                <span>
                  {(turbidityMax * 0.8).toFixed(0)}
                </span>

                <span>
                  {(turbidityMax * 0.6).toFixed(0)}
                </span>

                <span>
                  {(turbidityMax * 0.4).toFixed(0)}
                </span>

                <span>
                  {(turbidityMax * 0.2).toFixed(0)}
                </span>

                <span>0</span>
              </div>

              <div className="trend-plot">
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />
                <div className="trend-reference-line" />

                <svg
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                  className="trend-svg"
                >
                  <polyline
                    points={createPoints(
                      "turbidity",
                      0,
                      turbidityMax
                    )}
                    fill="none"
                    stroke="#17b89b"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className="trend-x-labels">
                  {chartLabels.map(
                    (record, index) => (
                      <span
                        key={`${record.id}-${index}`}
                      >
                        {period === "24h"
                          ? formatTime(record.timestamp)
                          : formatDate(record.timestamp)}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =================================
              ANALYSIS SUMMARY
              ================================= */}

          <section className="trends-analysis-panel">
            <div className="trends-analysis-icon">
              i
            </div>

            <div>
              <h3>
                Analysis Summary
              </h3>

              <p>
                The selected period contains{" "}
                <strong>
                  {filteredRecords.length.toLocaleString()}
                </strong>{" "}
                recorded measurement
                {filteredRecords.length === 1 ? "" : "s"}.
                The average pH was{" "}
                <strong>
                  {formatStat(phStats.average)}
                </strong>
                , average temperature was{" "}
                <strong>
                  {formatStat(temperatureStats.average, " °C")}
                </strong>
                , and average turbidity was{" "}
                <strong>
                  {formatStat(turbidityStats.average, " NTU")}
                </strong>
                .
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default TrendsAnalysisPage;