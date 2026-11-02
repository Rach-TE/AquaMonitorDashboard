import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";

import { database } from "./firebase";
import "./DataRecordsPage.css";

function DataRecordsPage() {
  // =========================================
  // STATE
  // =========================================

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // =========================================
  // LOAD HISTORY FROM FIREBASE
  // =========================================

  useEffect(() => {
    const historyRef = ref(
      database,
      "WaterQuality/History"
    );

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
            ph: Number(
              value?.ph ?? value?.pH ?? 0
            ),
            temperature: Number(
              value?.temperature ??
                value?.temp ??
                0
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
              record.timestamp > 0 &&
              Number.isFinite(record.ph) &&
              Number.isFinite(record.temperature) &&
              Number.isFinite(record.turbidity)
          )
          .sort(
            (a, b) =>
              b.timestamp - a.timestamp
          );

        setRecords(loadedRecords);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Error loading records:",
          error
        );

        setRecords([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================
  // DETERMINE RECORD STATUS
  // =========================================

  const getRecordStatus = (record) => {
    const ph = Number(record.ph);
    const temperature = Number(record.temperature);
    const turbidity = Number(record.turbidity);

    const hasNoData =
      !Number.isFinite(ph) ||
      !Number.isFinite(temperature) ||
      !Number.isFinite(turbidity) ||
      ph === 0 ||
      temperature === 0 ||
      turbidity === 0;

    if (hasNoData) {
      return "Waiting";
    }

    // Board 3-level bands, worst first.
    // pH
    if (ph < 5.0 || ph > 9.0) {
      return "Critical";
    }

    // Temperature
    if (temperature < 10 || temperature > 50) {
      return "Critical";
    }

    // Turbidity
    if (turbidity > 5) {
      return "Critical";
    }

    // pH warning range
    if (ph < 6.5 || ph > 7.5) {
      return "Warning";
    }

    // Temperature warning range
    if (
      temperature < 20 ||
      temperature > 40
    ) {
      return "Warning";
    }

    // Turbidity warning range
    if (turbidity > 2) {
      return "Warning";
    }

    return "Normal";
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "—";
    }

    return new Date(timestamp).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // FORMAT TIME
  // =========================================

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "—";
    }

    return new Date(timestamp).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  };

  // =========================================
  // FILTER RECORDS
  // =========================================

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const status = getRecordStatus(record);

      // Status filter
      if (
        statusFilter !== "All Statuses" &&
        status !== statusFilter
      ) {
        return false;
      }

      // Date range filter: start date to end date (inclusive)
      const recordDate = new Date(
        record.timestamp
      )
        .toISOString()
        .split("T")[0];

      if (startDate && recordDate < startDate) {
        return false;
      }

      if (endDate && recordDate > endDate) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const search = searchTerm
          .trim()
          .toLowerCase();

        const searchableText = [
          record.ph.toFixed(1),
          record.temperature.toFixed(1),
          record.turbidity.toFixed(1),
          status,
          formatDate(record.timestamp),
          formatTime(record.timestamp),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [
    records,
    statusFilter,
    startDate,
    endDate,
    searchTerm,
  ]);

  // =========================================
  // SUMMARY VALUES
  // =========================================

  const today = new Date();

  const todayString =
    today.toISOString().split("T")[0];

  const todayRecords = records.filter((record) => {
    const recordDate = new Date(record.timestamp)
      .toISOString()
      .split("T")[0];

    return recordDate === todayString;
  });

  const criticalRecords = records.filter(
    (record) =>
      getRecordStatus(record) === "Critical"
  );

  const warningRecords = records.filter(
    (record) =>
      getRecordStatus(record) === "Warning"
  );

  const latestRecord =
    records.length > 0
      ? records[0]
      : null;

  // =========================================
  // CLEAR FILTERS
  // =========================================

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("All Statuses");
  };

  // =========================================
  // EXPORT FILTERED RECORDS AS CSV
  // Exports exactly what the table shows:
  // the current date-range, status and
  // search filters, most recent first.
  // No data is changed, nothing is uploaded.
  // =========================================

  const exportCsv = () => {
    if (filteredRecords.length === 0) {
      return;
    }

    const header = [
      "Date",
      "Time",
      "pH",
      "Temperature (C)",
      "Turbidity (NTU)",
      "Status",
    ];

    const rows = filteredRecords.map((record) => [
      formatDate(record.timestamp),
      formatTime(record.timestamp),
      record.ph.toFixed(1),
      record.temperature.toFixed(1),
      record.turbidity.toFixed(1),
      getRecordStatus(record),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // BOM so spreadsheet apps open special
    // characters correctly.
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const range =
      startDate || endDate
        ? `${startDate || "start"}-to-${endDate || "end"}`
        : "all";

    link.href = url;
    link.download = `aquamonitor-records-${range}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="records-page">

      {/* =====================================
          PAGE INTRO
          ===================================== */}

      <section className="records-intro">
        <div>
          <p className="records-kicker">
            DATA RECORDS
          </p>

          <p>
            Review recorded water-quality measurements
            stored in the monitoring database.
          </p>
        </div>
      </section>

      {/* =====================================
          SUMMARY
          ===================================== */}

      <section className="records-summary-grid">

        <article className="records-summary-card">
          <div className="records-summary-icon blue">
            #
          </div>

          <div>
            <span>
              TOTAL RECORDS
            </span>

            <strong>
              {records.length.toLocaleString()}
            </strong>
          </div>
        </article>

        <article className="records-summary-card">
          <div className="records-summary-icon green">
            ◷
          </div>

          <div>
            <span>
              TODAY
            </span>

            <strong>
              {todayRecords.length.toLocaleString()}
            </strong>
          </div>
        </article>

        <article className="records-summary-card">
          <div className="records-summary-icon orange">
            !
          </div>

          <div>
            <span>
              WARNING RECORDS
            </span>

            <strong>
              {warningRecords.length.toLocaleString()}
            </strong>
          </div>
        </article>

        <article className="records-summary-card">
          <div className="records-summary-icon red">
            !
          </div>

          <div>
            <span>
              CRITICAL RECORDS
            </span>

            <strong>
              {criticalRecords.length.toLocaleString()}
            </strong>
          </div>
        </article>

      </section>

      {/* =====================================
          RECORD FILTERS
          ===================================== */}

      <section className="records-panel">

        <div className="records-panel-header">
          <div>
            <h3>
              Filter Records
            </h3>

            <p>
              Narrow the records by date range, status,
              or search term.
            </p>
          </div>

          <button
            type="button"
            className="clear-filters"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="records-filters">

          <div className="record-filter-field">
            <label>
              START DATE
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
            />
          </div>

          <div className="record-filter-field">
            <label>
              END DATE
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
            />
          </div>

          <div className="record-filter-field">
            <label>
              STATUS
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option>
                All Statuses
              </option>

              <option>
                Normal
              </option>

              <option>
                Warning
              </option>

              <option>
                Critical
              </option>

              <option>
                Waiting
              </option>
            </select>
          </div>

          <div className="record-filter-field search-field">
            <label>
              SEARCH
            </label>

            <div className="search-input-wrapper">
              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

        </div>
      </section>

      {/* =====================================
          RECORD TABLE
          ===================================== */}

      <section className="records-panel">

        <div className="records-panel-header">
          <div>
            <h3>
              Recorded Measurements
            </h3>

            <p>
              {filteredRecords.length.toLocaleString()}{" "}
              record
              {filteredRecords.length === 1
                ? ""
                : "s"}{" "}
              displayed
            </p>
          </div>

          <button
            type="button"
            className="export-csv"
            onClick={exportCsv}
            disabled={
              loading || filteredRecords.length === 0
            }
          >
            Export CSV
          </button>
        </div>

        <div className="records-table-wrapper">

          <table className="records-table">

            <thead>
              <tr>
                <th>
                  DATE & TIME
                </th>

                <th>
                  pH
                </th>

                <th>
                  TEMPERATURE
                </th>

                <th>
                  TURBIDITY
                </th>

                <th>
                  STATUS
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="table-message"
                  >
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="table-message"
                  >
                    <div className="records-empty">
                      <div className="records-empty-icon">
                        —
                      </div>

                      <strong>
                        No records found
                      </strong>

                      <p>
                        There are no records matching
                        the current filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const status =
                    getRecordStatus(record);

                  return (
                    <tr key={record.id}>

                      <td>
                        <div className="record-date">
                          <strong>
                            {formatDate(
                              record.timestamp
                            )}
                          </strong>

                          <small>
                            {formatTime(
                              record.timestamp
                            )}
                          </small>
                        </div>
                      </td>

                      <td>
                        <strong className="reading-value">
                          {record.ph.toFixed(1)}
                        </strong>

                        <span className="reading-unit">
                          pH
                        </span>
                      </td>

                      <td>
                        <strong className="reading-value">
                          {record.temperature.toFixed(1)}
                        </strong>

                        <span className="reading-unit">
                          °C
                        </span>
                      </td>

                      <td>
                        <strong className="reading-value">
                          {record.turbidity.toFixed(1)}
                        </strong>

                        <span className="reading-unit">
                          NTU
                        </span>
                      </td>

                      <td>
                        <span
                          className={`record-status ${status.toLowerCase()}`}
                        >
                          <i />
                          {status}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>
      </section>

      {/* =====================================
          DATA INFORMATION
          ===================================== */}

      <section className="records-info-panel">

        <div className="records-info-icon">
          i
        </div>

        <div>
          <h3>
            About Data Records
          </h3>

          <p>
            Records are retrieved from the
            AquaMonitor Firebase history and are
            ordered from the most recent measurement
            to the oldest.
          </p>
        </div>

      </section>

    </div>
  );
}

export default DataRecordsPage;