//config/database.js
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: process.env.DB_SERVER || 'DESKTOP-E4O1LKF\SQL2022',
    database: process.env.DB_NAME || 'TiffinDeliverySystem',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 15000,
    requestTimeout: 15000
};

let poolPromise = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const createPool = () => {
    return new sql.ConnectionPool(dbConfig)
        .connect()
        .then(pool => {
            console.log('✓ Connected to SQL Server');
            connectionAttempts = 0;
            
            // Handle pool errors
            pool.on('error', (err) => {
                console.error('Pool error:', err);
                poolPromise = null;
            });
            
            return pool;
        })
        .catch(err => {
            connectionAttempts++;
            console.error(`Database Connection Failed (Attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, err.message);
            
            if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                console.log(`Retrying connection in 3 seconds...`);
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(createPool());
                    }, 3000);
                });
            } else {
                console.error('Max reconnection attempts reached. Please check your database connection.');
                process.exit(1);
            }
        });
};

// Initialize pool on startup
poolPromise = createPool();

// Function to get a valid pool (with reconnection logic)
const getPool = async () => {
    try {
        if (!poolPromise) {
            poolPromise = createPool();
        }
        const pool = await poolPromise;
        return pool;
    } catch (err) {
        console.error('Failed to get database pool:', err);
        throw err;
    }
};

module.exports = {
    sql,
    poolPromise,
    getPool,
    getConnection: getPool  // Alias for controllers
};