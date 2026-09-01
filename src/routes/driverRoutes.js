import express from "express";
import {
  getAllDrivers,
  getDriverNames,
  getRandomDriver,
} from "../controllers/driverController.js";

const router = express.Router();

router.get("/", getAllDrivers);
router.get("/names", getDriverNames);
router.get("/random", getRandomDriver);

export default router;

