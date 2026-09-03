"use client";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_RENDER_API_URL || "http://localhost:5000";

function getDriverStats(driver) {
  return [
    { label: "Nationality", value: driver.nationality },
    { label: "Champion", value: driver.champion },
    { label: "Active", value: driver.active },
    { label: "Decade", value: driver.decade },
    { label: "Years Active", value: driver.years_active },
  ];
}

function App() {
  const [driverNames, setDriverNames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [guessesLoaded, setGuessesLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedGuesses = window.localStorage.getItem("driver-guesses");
      if (savedGuesses) {
        const parsedGuesses = JSON.parse(savedGuesses);
        if (Array.isArray(parsedGuesses)) {
          setGuesses(parsedGuesses);
        }
      }
    } catch {
      setError("Unable to restore your previous guesses");
    } finally {
      setGuessesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (guessesLoaded) {
      window.localStorage.setItem("driver-guesses", JSON.stringify(guesses));
    }
  }, [guesses, guessesLoaded]);

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
          names.map((name) =>
            typeof name === "string" ? name : (name.drivername ?? ""),
          ),
        );
      } catch (err) {
        setError(err.message);
      }
    };

    loadDriverNames();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/drivers?name=${encodeURIComponent(trimmedTerm)}`,
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

      if (rows[0]) {
        setGuesses((previousGuesses) => [rows[0], ...previousGuesses]);
        setSearchTerm("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredDriverNames = driverNames
    .filter((name) =>
      name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    )
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex justify-center">
      <div className="w-full max-w-6xl p-8">
        <h1 className="text-5xl font-bold text-center text-red-500 mb-2">
          F1 Driver Guesser
        </h1>
        <p className="mb-6 text-center text-zinc-400">
          Guesses: {guesses.length}
        </p>
        <form
          onSubmit={handleSearch}
          className="mb-8 flex flex-col gap-3 md:flex-row"
        >
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
            disabled={!searchTerm.trim()}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500"
          >
            Guess
          </button>
        </form>

        {guesses.length === 0 ? (
          error ? (
            <div className="rounded-lg border border-red-700 bg-red-950/50 p-6 text-center text-red-300">
              {error}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-700 p-6 text-center text-zinc-400">
              Make a guess for todays driver!
            </div>
          )
        ) : (
          <div className="space-y-4">
            {guesses.map((guessedDriver, index) => (
              <div
                key={`${guessedDriver.drivername}-${index}`}
                className="mx-auto max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg"
              >
                <div className="mb-6 text-center">
                  {" "}
                  <h2 className="text-2xl font-bold text-white">
                    {guessedDriver.drivername}
                  </h2>
                </div>

                <div className="grid grid-cols-6 gap-3">
                  {getDriverStats(guessedDriver).map((item, index) => (
                    <div
                      key={item.label}
                      className={`rounded-xl bg-zinc-800 p-4 text-center text-white shadow-sm ${
                        index < 2 ? "col-span-3" : "col-span-2"
                      }`}
                    >
                      <div className="text-sm text-zinc-300">{item.label}</div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {error && (
              <div className="rounded-lg border border-red-700 bg-red-950/50 p-4 text-center text-red-300">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
