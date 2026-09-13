import {
  getCurrentChampionshipLeader,
  getCurrentDriverStandings,
  getF1Options,
  getLatestRaceWinner,
} from "../services/f1Service.js";

const actions = {
  last_race_winner: getLatestRaceWinner,
  current_champion: getCurrentChampionshipLeader,
  current_standings: getCurrentDriverStandings,
};

export const getF1Answer = async (req, res) => {
  const service = actions[req.body?.action];

  if (!service) {
    return res.status(400).json({ message: "Unsupported F1 action" });
  }

  try {
    const data = await service(req.body?.season, req.body?.round);
    return res.json({ data });
  } catch {
    return res.status(502).json({
      message: "Unable to retrieve the latest F1 data",
    });
  }
};

export const getF1AssistantOptions = async (req, res) => {
  try {
    const data = await getF1Options();
    return res.json({ data });
  } catch {
    return res.status(502).json({
      message: "Unable to retrieve F1 selection options",
    });
  }
};