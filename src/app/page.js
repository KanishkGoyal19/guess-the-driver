"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import F1Assistant from "./F1Assistant";

const API_URL =
  process.env.NEXT_PUBLIC_RENDER_API_URL || "http://localhost:5000";

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
  const router = useRouter();
  const gameWon =
    dailyDriver &&
    guesses.some((guess) => guess.drivername === dailyDriver.drivername);
  const gameLost = !gameWon && guesses.length >= 10;

  // Load the guesses from local storage when the component mounts
  useEffect(() => {
    try {
      const savedGuesses = window.localStorage.getItem("driver-guesses");
      if (savedGuesses) {
        const parsedGuesses = JSON.parse(savedGuesses);
        if (parsedGuesses?.date === getTodayKey() && Array.isArray(parsedGuesses.guesses)) {
          setGuesses(parsedGuesses.guesses);
        } else if (Array.isArray(parsedGuesses)) {
          setGuesses(parsedGuesses);
        } else {
          window.localStorage.removeItem("driver-guesses");
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
      window.localStorage.setItem(
        "driver-guesses",
        JSON.stringify({ date: getTodayKey(), guesses }),
      );
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

    if (gameWon || gameLost || !dailyDriver) {
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

        const guessedDriver = {
          ...rows[0],
          comparison,
        };
        const nextGuesses = [guessedDriver, ...guesses];

        setGuesses(nextGuesses);

        if (rows[0].drivername === dailyDriver.drivername) {
          window.localStorage.setItem(
            "driver-guesses",
            JSON.stringify({ date: getTodayKey(), guesses: nextGuesses }),
          );
          router.push("/victory");
        } else if (nextGuesses.length >= 10) {
          window.localStorage.setItem(
            "driver-guesses",
            JSON.stringify({ date: getTodayKey(), guesses: nextGuesses }),
          );
          router.push("/loss");
        }

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
        {gameWon && (
          <div className="mb-6 text-center">
            <Link
              href="/victory"
              className="inline-block rounded-lg border border-green-600 px-5 py-3 font-semibold text-green-300 transition hover:bg-green-900"
            >
              View victory screen
            </Link>
          </div>
        )}
        {gameLost && (
          <div className="mb-6 text-center">
            <Link
              href="/loss"
              className="inline-block rounded-lg border border-red-600 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-900"
            >
              View loss screen
            </Link>
          </div>
        )}
        <form
          onSubmit={handleSearch}
          className="mb-8 flex flex-col gap-3 md:flex-row"
        >
          <input
            list="driver-names"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={gameWon || gameLost}
            placeholder={
              gameWon || gameLost
                ? "You have used all of today's guesses!"
                : "Enter a driver name..."
            }
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none focus:border-red-500"
          />
          <datalist id="driver-names">
            {filteredDriverNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <button
            type="submit"
            disabled={!searchTerm.trim() || gameWon || gameLost}
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
              <div key={`${guessedDriver.drivername}-${index}`}>
                <div className="mx-auto max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">
                  <div className="mb-6 text-center">
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

                {index === guesses.length - 1 && (
                  <div className="mx-auto mt-6 max-w-xl text-center">
                    <div className="flex justify-center gap-2 sm:gap-3">
                      <div className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100">
                        No Match
                      </div>
                      <div className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-zinc-950">
                        Close
                      </div>
                      <div className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white">
                        Match
                      </div>
                    </div>
                    <p className="mt-6 text-sm font-semibold leading-5 text-zinc-300">
                      Use the matching attributes to make more guesses. Good luck!
                    </p>
                  </div>
                )}
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
      <F1Assistant />
    </div>
  );
}

export default App;
