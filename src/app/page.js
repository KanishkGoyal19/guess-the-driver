"use client";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_RENDER_API_URL || "http://localhost:5000";

function getDriverStats(driver) {
  return [
    { key: "nationality", label: "Nationality", value: driver.nationality },
    { key: "champion", label: "Champion", value: driver.champion },
    { key: "active", label: "Active", value: driver.active },
    { key: "decade", label: "Decade", value: driver.decade },
    { key: "years_active", label: "Years Active", value: driver.years_active },
  ];
}

function compareDrivers(guessedDriver, dailyDriver) {
  return {
    nationality:
      guessedDriver.nationality === dailyDriver.nationality
        ? "Correct"
        : "Wrong",
    champion:
      guessedDriver.champion === dailyDriver.champion ? "Correct" : "Wrong",
    active: guessedDriver.active === dailyDriver.active ? "Correct" : "Wrong",
    decade:
      guessedDriver.decade === dailyDriver.decade
        ? "Correct"
        : Math.abs(guessedDriver.decade - dailyDriver.decade) === 20
          ? "Close: "
          : "Wrong",
    years_active:
      guessedDriver.years_active === dailyDriver.years_active
        ? "Correct"
        : Math.abs(guessedDriver.years_active - dailyDriver.years_active) <= 5
          ? "Close: "
          : "Wrong",
  };
}

function getColors(status) {
  switch (status) {
    case "Correct":
      return "bg-green-600 text-white";
    case "Close: ":
      return "bg-yellow-600 text-white";
    default:
      return "bg-zinc-800 text-white";
  }
}

function App() {
  const [driverNames, setDriverNames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [guessesLoaded, setGuessesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [dailyDriver, setDailyDriver] = useState(null);
  const gameWon =
    dailyDriver &&
    guesses.some((guess) => guess.drivername === dailyDriver.drivername);

  // Load the guesses from local storage when the component mounts
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

  // Save the guesses to local storage whenever they change
  useEffect(() => {
    if (guessesLoaded) {
      window.localStorage.setItem("driver-guesses", JSON.stringify(guesses));
    }
  }, [guesses, guessesLoaded]);

  // Load the driver names from the backend when the component mounts
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
  // Load the daily driver from the backend when the component mounts
  useEffect(() => {
    const loadDailyDriver = async () => {
      try {
        const response = await fetch(`${API_URL}/api/drivers/random`);

        if (!response.ok) {
          throw new Error("Unable to load the daily driver from the backend");
        }

        const payload = await response.json();
        setDailyDriver(payload?.data ?? payload);
      } catch (err) {
        setError(err.message);
      }
    };

    loadDailyDriver();
  }, []);

  // Handle the search form submission
  const handleSearch = async (event) => {
    event.preventDefault();

    if (gameWon || !dailyDriver) {
      return;
    }

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
        const alreadyGuessed = guesses.some(
          (guess) => guess.drivername === rows[0].drivername,
        );

        if (alreadyGuessed) {
          setError("You have already guessed this driver!");
          return;
        }

        const comparison = compareDrivers(rows[0], dailyDriver);
        console.log("Comparison:", comparison);

        setGuesses((previousGuesses) => [
          {
            ...rows[0],
            comparison,
          },
          ...previousGuesses,
        ]);

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
            disabled={gameWon}
            placeholder={gameWon ? "You have already guessed the driver!" : "Enter a driver name..."}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-red-500"
          />
          <datalist id="driver-names">
            {filteredDriverNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <button
            type="submit"
            disabled={!searchTerm.trim() || gameWon}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500"
          >
            Guess
          </button>
        </form>

        {gameWon ? (
          <div className="rounded-lg border border-green-700 bg-green-950/50 p-6 text-center text-green-300">
            Congratulations! You guessed the driver correctly!
          </div>
        ) : guesses.length === 0 ? (
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
                      className={`rounded-xl p-4 text-center text-white shadow-sm ${
                        index < 2 ? "col-span-3" : "col-span-2"
                      } ${getColors(guessedDriver.comparison[item.key])}`}
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
