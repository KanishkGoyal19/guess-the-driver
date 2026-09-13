import express from "express";
import {
	getF1Answer,
	getF1AssistantOptions,
} from "../controllers/f1Controller.js";

const router = express.Router();

router.get("/options", getF1AssistantOptions);
router.post("/answer", getF1Answer);

export default router;