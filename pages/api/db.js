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

/**
 * Connect Pool
 * @param callback
 * @returns {Promise<void>}
 */
export async function getConnectPool(callback) {
    const conn = await pool.getConnection(async conn => conn);

    await callback(conn);

    conn.release();
}

/**
 * 결과 값
 *
 * @param data
 * @param code
 * @param msg
 * @returns {{data, resultCode: string, resultMsg}}
 */
export function result(data, code = '0000', msg) {

    if(!!data && (!!data.RESULT_CODE || !!data.resultCode)) {

        code = (data.RESULT_CODE || data.resultCode);
        msg = (data.RESULT_MSG || data.resultMsg);
    }

    return {
        data: data,
        resultCode: code,
        resultMsg: msg,
    }
}