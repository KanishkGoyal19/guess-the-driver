"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_RENDER_API_URL || "http://localhost:5000";

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

function getDriverStats(driver) {
  return [
    { label: "Nationality", value: driver.nationality},
    { label: "Champion", value: formatValue(driver.champion) },
    { label: "Years Active", value: formatValue(driver.years_active) },
    { label: "Active", value: formatValue(driver.active) },
  ];
}

function App() {
  const [driverNames, setDriverNames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDriverNames = async () => {
      try {
        const response = await fetch(`${API_URL}/api/drivers/names`);

        if (!response.ok) {
          throw new Error("Unable to load driver names from the backend");
        }

        const payload = await response.json();
        const names = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        setDriverNames(
          names.map((name) => (typeof name === "string" ? name : name.drivername ?? ""))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDriverNames();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      setDriver(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/drivers?name=${encodeURIComponent(trimmedTerm)}`
      );

      if (!response.ok) {
        throw new Error("Unable to load the driver from the backend");
      }

      const payload = await response.json();
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(payload)
            ? payload
            : [];

      setDriver(rows[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = driver ? Object.keys(driver) : [];
  const filteredDriverNames = driverNames
    .filter((name) => name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex justify-center">
      <div className="w-full max-w-6xl p-8">
        <h1 className="text-5xl font-bold text-center text-red-500 mb-2">
          F1 Driver Guesser
        </h1>
        <form onSubmit={handleSearch} className="mb-8 flex flex-col gap-3 md:flex-row">
          <input
            list="driver-names"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Type a driver name"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-red-500"
          />
          <datalist id="driver-names">
            {filteredDriverNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="rounded-lg border border-zinc-700 p-6 text-center text-zinc-400">
            Loading driver suggestions...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-700 bg-red-950/50 p-6 text-center text-red-300">
            {error}
          </div>
        ) : !driver ? (
          <div className="rounded-lg border border-zinc-700 p-6 text-center text-zinc-400">
            Make a guess for todays driver! 
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="text-4xl font-bold text-white">{driver.drivername}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {getDriverStats(driver).map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-zinc-800 p-4 text-center text-white shadow-sm"
                >
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;