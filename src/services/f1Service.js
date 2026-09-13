const JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1";

async function fetchJolpica(path) {
  const response = await fetch(`${JOLPICA_BASE_URL}/${path}`);

  if (!response.ok) {
    throw new Error(`Jolpica request failed with status ${response.status}`);
  }

  return response.json();
}

function getRaceList(payload) {
  return payload?.MRData?.RaceTable?.Races ?? [];
}

function getDriverName(driver) {
  return `${driver?.givenName ?? ""} ${driver?.familyName ?? ""}`.trim();
}

function getCompletedRaces(schedule) {
  return getRaceList(schedule)
    .filter(
      (race) =>
        new Date(`${race.date}T${race.time ?? "23:59:59Z"}`) <= new Date(),
    )
    .sort((first, second) => second.round - first.round);
}

function getSeasonPath(season) {
  return /^\d{4}$/.test(String(season)) ? String(season) : "current";
}

export async function getF1Options() {
  const [seasonsPayload, schedulePayload] = await Promise.all([
    fetchJolpica("seasons.json?limit=100"),
    fetchJolpica("current.json"),
  ]);
  const seasons = seasonsPayload?.MRData?.SeasonTable?.Seasons ?? [];

  return {
    seasons: seasons
      .map((season) => season.season)
      .sort((first, second) => Number(second) - Number(first)),
    races: getCompletedRaces(schedulePayload).map((race) => ({
      round: race.round,
      raceName: race.raceName,
      date: race.date,
    })),
  };
}

export async function getLatestRaceWinner(season = "current", round = "latest") {
  const seasonPath = getSeasonPath(season);
  const schedule = await fetchJolpica(`${seasonPath}.json`);
  const completedRaces = getRaceList(schedule)
    .filter(
      (race) =>
        new Date(`${race.date}T${race.time ?? "23:59:59Z"}`) <= new Date(),
    )
    .sort((first, second) => second.round - first.round);

  const latestRace =
    round === "latest"
      ? completedRaces[0]
      : completedRaces.find((race) => String(race.round) === String(round));
  if (!latestRace) {
    throw new Error("No completed race is available");
  }

  const resultPayload = await fetchJolpica(
    `${seasonPath}/${latestRace.round}/results/1.json`,
  );
  const results = resultPayload?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];

  if (!results[0]) {
    throw new Error("No result is available for the latest race");
  }

  return {
    type: "race_winner",
    season: latestRace.season,
    raceName: latestRace.raceName,
    winner: getDriverName(results[0].Driver),
    podium: results.slice(1, 3).map((result) => getDriverName(result.Driver)),
  };
}

export async function getCurrentChampionshipLeader(season = "current") {
  const seasonPath = getSeasonPath(season);
  const [standingsPayload, schedulePayload] = await Promise.all([
    fetchJolpica(`${seasonPath}/driverstandings/1.json`),
    fetchJolpica(`${seasonPath}.json`),
  ]);
  const standings =
    standingsPayload?.MRData?.StandingsTable?.StandingsLists?.[0];
  const leader = standings?.DriverStandings?.[0];

  if (!leader) {
    throw new Error("No championship standings are available");
  }

  const races = getRaceList(schedulePayload);
  const finalRace = races[races.length - 1];
  const seasonComplete =
    finalRace &&
    new Date(`${finalRace.date}T${finalRace.time ?? "23:59:59Z"}`) <= new Date();

  return {
    type: "current_champion",
    season: standings.season,
    status: seasonComplete ? "champion" : "leader",
    driver: getDriverName(leader.Driver),
    points: leader.points,
  };
}

export async function getCurrentDriverStandings() {
  const payload = await fetchJolpica("current/driverstandings.json");
  const standingsList = payload?.MRData?.StandingsTable?.StandingsLists?.[0];

  if (!standingsList?.DriverStandings?.length) {
    throw new Error("No championship standings are available");
  }

  return {
    type: "current_standings",
    season: standingsList.season,
    standings: standingsList.DriverStandings.slice(0, 10).map((standing) => ({
      position: standing.position,
      driver: getDriverName(standing.Driver),
      points: standing.points,
    })),
  };
}