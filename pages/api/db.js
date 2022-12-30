const {createPool} = require("mysql2/promise");

const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
});

export async function getConnectPol(callback) {
    const conn = await pool.getConnection(async conn => conn);

    await callback(conn);

    conn.release();
}