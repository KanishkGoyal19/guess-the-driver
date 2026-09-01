import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import driverRoutes from "./routes/driverRoutes.js";
import pool from "./config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/drivers", driverRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});


try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connection established");

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} catch (error) {
    console.error("Failed to connect to PostgreSQL", error);
    process.exit(1);
}
