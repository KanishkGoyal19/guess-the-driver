"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function VictoryPage() {
  const [result, setResult] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedGuesses = window.localStorage.getItem("driver-guesses");
      const parsedGuesses = savedGuesses ? JSON.parse(savedGuesses) : null;

      if (
        parsedGuesses?.date === getTodayKey() &&
        Array.isArray(parsedGuesses.guesses)
      ) {
        setResult({
          driver: parsedGuesses.guesses[0],
          guessCount: parsedGuesses.guesses.length,
        });
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-900 px-8 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <section className="rounded-lg border border-green-700 bg-green-950/50 p-10 text-center text-green-300">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-400">
            Victory
          </p>
          <h1 className="text-4xl font-bold text-white">
            You guessed correctly!
          </h1>
          {result?.driver ? (
            <>
              <p className="mt-4 text-lg text-green-200">
                {result.driver.drivername} was the driver of the day.
              </p>
              <p className="mt-6 text-sm text-green-400">
                Solved in {result.guessCount} {result.guessCount === 1 ? "guess" : "guesses"}.
              </p>
            </>
          ) : (
            <p className="mt-4 text-green-200">
              Your victory details are not available for today.
            </p>
          )}
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg border border-green-600 px-5 py-3 font-semibold text-green-200 transition hover:bg-green-900"
          >
            View guess history
          </Link>
        </section>
      </div>
    </main>
  );
}