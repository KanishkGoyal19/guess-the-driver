import pool from "../config/db.js";

export const randomDriverService = async () => {
  const query = `
    INSERT INTO daily_driver (selected_date, driver_id)
    SELECT CURRENT_DATE, id
    FROM driver
    ORDER BY RANDOM()
    LIMIT 1
    ON CONFLICT (selected_date) DO NOTHING;

    SELECT *
    FROM driver
    WHERE id = (
      SELECT driver_id
      FROM daily_driver
      WHERE selected_date = CURRENT_DATE
    );
  `;

  const result = await pool.query(query);
  return result[1].rows[0];
};

export const driverNameService = async () => {
  const tableName = process.env.DB_TABLE || "driver";

  const queryText = `
    SELECT drivername
    FROM ${tableName}
    WHERE drivername IS NOT NULL
      AND TRIM(drivername) <> ''
    ORDER BY drivername
  `;

  const result = await pool.query(queryText);
  return result.rows;
};

export const allDriverService = async (searchName = "") => {
  const tableName = process.env.DB_TABLE || "driver";
  const trimmed = searchName?.trim();

  const queryText = trimmed
    ? {
        text: `
          SELECT *
          FROM ${tableName}
          WHERE drivername ILIKE $1
          ORDER BY drivername
          LIMIT 10
        `,
        values: [`%${trimmed}%`],
      }
    : {
        text: `
          SELECT *
          FROM ${tableName}
          ORDER BY drivername
          LIMIT 10
        `,
      };

  const result = await pool.query(queryText);
  return result.rows;
};