// index.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// --- 1. Database Connection Configuration ---
// IMPORTANT: Your Neon connection string is already here!
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_SlsjcPh6ea1b@ep-proud-dream-adfn1lly-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
    connectionString: connectionString,
    // Add SSL configuration if you run into connection issues locally
    // ssl: { rejectUnauthorized: false } 
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your Botpress flow to access the API
app.use(express.json());

// --- 2. API Endpoints ---

// Health Check Endpoint 
app.get('/', (req, res) => {
    res.send('Municipal Financial Data API is running!');
});

// GET /api/financial-records
// Lists all records (with optional search filter)
app.get('/api/financial-records', async (req, res) => {
    try {
        // *** UPDATED TABLE NAME ***
        let query = 'SELECT * FROM city_finance'; 
        const { city, year } = req.query; // Check for optional query parameters
        const params = [];

        if (city) {
            params.push(`%${city}%`);
            query += ' WHERE city_names ILIKE $1'; 
        } else if (year) {
            params.push(year);
            query += ' WHERE financial_year = $1';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching records:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/financial-records/ulb/:name
// Gets financial data for a specific ULB (e.g., /ulb/Dhanbad Municipal Corporation)
app.get('/api/financial-records/ulb/:name', async (req, res) => {
    const ulbName = req.params.name;
    try {
        const query = `
            -- *** UPDATED TABLE NAME ***
            SELECT * FROM city_finance
            WHERE ulb_name ILIKE $1 
            ORDER BY financial_year DESC`;

        // Using a wildcard search to handle small variations in the name
        const result = await pool.query(query, [`%${ulbName}%`]); 

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ULB not found or no data available' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching ULB data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- 3. Start Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});