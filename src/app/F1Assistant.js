"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_RENDER_API_URL || "http://localhost:5000";

const ACTIONS = [
  { action: "last_race_winner", icon: "🏁", label: "Who won this race?" },
  {
    action: "current_champion",
    icon: "🏆",
    label: "Who was the champion this year?",
  },
  {
    action: "current_standings",
    icon: "📊",
    label: "Show me the current standings",
  },
];

function Answer({ answer }) {
  if (answer.type === "race_winner") {
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
          Latest race
        </p>
        <div>
          <h3 className="text-2xl font-bold text-white">{answer.raceName}</h3>
          <p className="mt-4 text-sm text-zinc-400">Winner</p>
          <p className="text-xl font-semibold text-white">🥇 {answer.winner}</p>
        </div>
        {answer.podium.length > 0 && (
          <p className="text-sm leading-6 text-zinc-300">
            Finished ahead of {answer.podium.join(" and ")}.
          </p>
        )}
      </div>
    );
  }

  if (answer.type === "current_champion") {
    const title = answer.status === "champion" ? "World champion" : "Championship leader";

    return (
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
          🏆 {answer.season} {title}
        </p>
        <h3 className="text-2xl font-bold text-white">{answer.driver}</h3>
        <p className="text-lg text-zinc-300">
          {answer.points} <span className="text-sm text-zinc-500">points</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
        📊 {answer.season} driver standings
      </p>
      <ol className="divide-y divide-zinc-800">
        {answer.standings.map((standing) => (
          <li
            key={standing.position}
            className="flex items-center gap-3 py-3 text-sm"
          >
            <span className="w-5 text-zinc-500">{standing.position}</span>
            <span className="flex-1 font-medium text-white">{standing.driver}</span>
            <span className="text-zinc-400">{standing.points} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SelectionControls({ action, options, selection, onChange, onSubmit }) {
  const isRace = action === "last_race_winner";

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-zinc-300">
        {isRace ? "Choose a completed race." : "Choose a championship season."}
      </p>
      <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {isRace ? "Race" : "Season"}
        <select
          value={isRace ? selection.round : selection.season}
          onChange={(event) =>
            onChange(
              isRace
                ? { ...selection, round: event.target.value }
                : { ...selection, season: event.target.value },
            )
          }
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-red-500"
        >
          {isRace ? (
            <>
              <option value="latest">Latest completed race</option>
              {options.races.map((race) => (
                <option key={race.round} value={race.round}>
                  {race.raceName}
                </option>
              ))}
            </>
          ) : (
            options.seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))
          )}
        </select>
      </label>
      <button
        type="button"
        onClick={onSubmit}
        className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500"
      >
        Show answer
      </button>
    </div>
  );
}

export default function F1Assistant() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [options, setOptions] = useState({ seasons: [], races: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selection, setSelection] = useState({
    season: "current",
    round: "latest",
  });

  const reset = () => {
    setAnswer(null);
    setError(false);
    setPendingAction(null);
  };

  const loadOptions = async () => {
    setOptionsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/f1/options`);
      if (!response.ok) {
        throw new Error("F1 options request failed");
      }

      const payload = await response.json();
      setOptions(payload.data ?? { seasons: [], races: [] });
    } catch {
      setError(true);
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(loadOptions);
  }, []);

  const requestAnswer = async (action, params = {}) => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch(`${API_URL}/api/f1/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        throw new Error("F1 data request failed");
      }

      const payload = await response.json();
      setAnswer(payload.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const selectAction = (action) => {
    if (action === "current_standings") {
      requestAnswer(action);
      return;
    }

    setPendingAction(action);
    setSelection({
      season: action === "current_champion" ? options.seasons[0] ?? "current" : "current",
      round: "latest",
    });
  };

  const submitSelection = () => {
    requestAnswer(pendingAction, selection);
  };

  return (
    <div className="fixed bottom-5 right-5 z-20 sm:bottom-8 sm:right-8">
      <section
        aria-label="F1 Assistant"
        className="f1-assistant-panel w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/40"
      >
          <header className="flex items-center justify-between border-b border-red-700 bg-red-600 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-white">🏎️ F1 Assistant</p>
              <p className="mt-1 text-xs text-white-500">Powered by live race data</p>
            </div>
          </header>

          <div className="p-5">
            {loading ? (
              <div className="flex min-h-56 items-center justify-center text-sm text-zinc-400">
                <span className="f1-spinner mr-3 h-4 w-4 rounded-full border-2 border-zinc-700 border-t-red-500" />
                Checking the latest F1 data...
              </div>
            ) : error ? (
              <div className="space-y-5 py-5">
                <p className="text-sm leading-6 text-zinc-300">
                  🏎️ Looks like we&apos;re having trouble getting the latest F1 data. Try again in a moment.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-950/30"
                >
                  Ask another
                </button>
              </div>
            ) : answer ? (
              <>
                <Answer answer={answer} />
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-950/30"
                >
                  ← Ask another
                </button>
              </>
            ) : pendingAction ? (
              optionsLoading ? (
                <div className="flex min-h-40 items-center justify-center text-sm text-zinc-400">
                  Loading races and seasons...
                </div>
              ) : (
                <SelectionControls
                  action={pendingAction}
                  options={options}
                  selection={selection}
                  onChange={setSelection}
                  onSubmit={submitSelection}
                />
              )
            ) : (
              <div className="space-y-4">
                <p className="pb-1 text-lg font-semibold text-white">
                  What would you like to know?
                </p>
                {ACTIONS.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => selectAction(item.action)}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left text-sm font-medium text-zinc-200 transition hover:border-red-500/70 hover:bg-red-950/30 hover:text-white"
                  >
                    <span aria-hidden="true" className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
      </section>
    </div>
  );
}