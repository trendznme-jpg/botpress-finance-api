// Updated API deployment for query endpoint
// D:\city-finance-api\index.js

import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();
app.use(express.json());
app.use(cors());

// --- PostgreSQL connection ---
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_SlsjcPh6ea1b@ep-proud-dream-adfn1lly-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

// --- FLEXIBLE QUERY ENDPOINT ---
app.post("/api/query", async (req, res) => {
  const { cities, metric, year, queryType, limit } = req.body;
  let sql = "";

  if (!cities || !metric) {
    return res
      .status(400)
      .json({ error: "Missing required parameters: cities and metric." });
  }

  if (queryType === "ranking") {
    const rankLimit = parseInt(limit) || 5;
    sql = `
      SELECT ulb_name, "${metric}", financial_year 
      FROM city_finance 
      WHERE financial_year = '${year || "2021-22"}'
      ORDER BY "${metric}" DESC 
      LIMIT ${rankLimit};
    `;
  } else {
    const ulbList = cities
      .map((city) => `'${city.replace(/'/g, "''")}'`)
      .join(", ");
    const yearCondition =
      year && Array.isArray(year) && year.length > 0
        ? `AND financial_year IN (${year.map((y) => `'${y}'`).join(", ")})`
        : "";

    sql = `
      SELECT ulb_name, financial_year, "${metric}" 
      FROM city_finance 
      WHERE ulb_name IN (${ulbList})
      ${yearCondition}
      ORDER BY ulb_name, financial_year DESC;
    `;
  }

  console.log("Executing SQL:", sql);

  try {
    const client = await pool.connect();
    const result = await client.query(sql);
    client.release();

    res.json({ data: result.rows, sql: sql });
  } catch (err) {
    console.error("Database query failed:", err.message);
    res
      .status(500)
      .json({ error: "Database query execution failed.", details: err.message });
  }
});

// --- Default route ---
app.get("/", (req, res) => {
  res.send("City Finance API is running 🚀");
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
