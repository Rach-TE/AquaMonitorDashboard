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
            ph: Number(value?.ph ?? value?.pH ?? 0),
            temperature: Number(
              value?.temperature ?? value?.temp ?? 0
            ),
            turbidity: Number(value?.turbidity ?? 0),
            timestamp: Number(value?.timestamp ?? 0),
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
  // VALIDITY FILTER - impossible / sentinel
  // readings are dropped BEFORE any stats,
  // counts or chart points are computed, per
  // parameter, so one bad sensor value does
  // not delete the good values in the same
  // record. The monitoring BANDS are not the
  // filter: a genuine Critical reading (for
  // example temperature 56.8 C) still shows.
  // Dropped: pH outside 0-14, temperature
  // -999 (the board's missing-sensor value),
  // temperature at/below 0, negative
  // turbidity, and 0 where the app already
  // treats 0 as "no reading" (pH, temperature).
  // =========================================

  const isValidReading = (parameter, value) => {
    if (!Number.isFinite(value)) {
      return false;
    }

    if (parameter === "ph") {
      return value > 0 && value <= 14;
    }

    if (parameter === "temperature") {
      return value > 0 && value < 125 && value !== -999;
    }

    if (parameter === "turbidity") {
      return value >= 0 && value <= 1000;
    }

    return false;
  };

  const excludedReadings = useMemo(() => {
    let excluded = 0;

    filteredRecords.forEach((record) => {
      ["ph", "temperature", "turbidity"].forEach(
        (parameter) => {
          if (
            !isValidReading(
              parameter,
              Number(record[parameter])
            )
          ) {
            excluded += 1;
          }
        }
      );
    });

    return excluded;
  }, [filteredRecords]);

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
      .filter((value) => isValidReading(parameter, value));

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

    // Board 3-level bands (same as App / Real-time / Alerts)
    if (parameter === "ph") {
      if (numericValue < 5.0 || numericValue > 9.0) {
        return "Critical";
      }

      if (numericValue < 6.5 || numericValue > 7.5) {
        return "Warning";
      }

      return "Normal";
    }

    if (parameter === "temperature") {
      if (numericValue < 10 || numericValue > 50) {
        return "Critical";
      }

      if (numericValue < 20 || numericValue > 40) {
        return "Warning";
      }

      return "Normal";
    }

    if (parameter === "turbidity") {
      if (numericValue > 5) {
        return "Critical";
      }

      if (numericValue > 2) {
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
        if (
          !isValidReading(
            parameter,
            Number(record[parameter])
          )
        ) {
          return;
        }

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
    const validRecords = filteredRecords.filter((record) =>
      isValidReading(parameter, Number(record[parameter]))
    );

    if (validRecords.length === 0) {
      return "";
    }

    const width = 700;
    const height = 220;
    const padding = 8;

    const range =
      maximum - minimum === 0
        ? 1
        : maximum - minimum;

    return validRecords
      .map((record, index) => {
        const value = Number(record[parameter]);

        const x =
          validRecords.length === 1
            ? width / 2
            : (index /
                (validRecords.length - 1)) *
              width;

        // Clamp as a safety net: no point may ever
        // leave the chart area, whatever slips in.
        const normalized = Math.min(
          1,
          Math.max(0, (value - minimum) / range)
        );

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

  const phChartMin = 0;
  const phChartMax = 14;

  const temperatureValues = filteredRecords
    .map((record) => record.temperature)
    .filter((value) => isValidReading("temperature", value));

  const turbidityValues = filteredRecords
    .map((record) => record.turbidity)
    .filter((value) => isValidReading("turbidity", value));

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
              {excludedReadings > 0
                ? ` - ${excludedReadings.toLocaleString()} invalid readings excluded`
                : ""}
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
              Normal range: 6.5 – 7.5
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
              Operating range: 20 – 40 °C
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
              Normal: 0 – 2 NTU
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
                <span>14</span>
                <span>12</span>
                <span>10</span>
                <span>8</span>
                <span>6</span>
                <span>4</span>
                <span>2</span>
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
                    temperatureMax -
                      (temperatureMax - temperatureMin) * 0.2
                  )}
                </span>

                <span>
                  {Math.round(
                    temperatureMax -
                      (temperatureMax - temperatureMin) * 0.4
                  )}
                </span>

                <span>
                  {Math.round(
                    temperatureMax -
                      (temperatureMax - temperatureMin) * 0.6
                  )}
                </span>

                <span>
                  {Math.round(
                    temperatureMax -
                      (temperatureMax - temperatureMin) * 0.8
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