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

export default function LossPage() {
  const [guessCount, setGuessCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedGuesses = window.localStorage.getItem("driver-guesses");
      const parsedGuesses = savedGuesses ? JSON.parse(savedGuesses) : null;

      if (
        parsedGuesses?.date === getTodayKey() &&
        Array.isArray(parsedGuesses.guesses)
      ) {
        setGuessCount(parsedGuesses.guesses.length);
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
        <section className="rounded-lg border border-red-700 bg-red-950/50 p-10 text-center text-red-300">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
            Game over
          </p>
          <h1 className="text-4xl font-bold text-white">
            Better luck next time!
          </h1>
          <p className="mt-4 text-lg text-red-200">
            You used all {guessCount || 10} guesses without finding today&apos;s driver.
          </p>
          <p className="mt-6 text-sm text-red-400">
            Come back tomorrow for a new driver.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg border border-red-600 px-5 py-3 font-semibold text-red-200 transition hover:bg-red-900"
          >
            View guess history
          </Link>
        </section>
      </div>
    </main>
  );
}