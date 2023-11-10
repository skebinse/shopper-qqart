const {createPool} = require("mysql2/promise");

const pool = createPool({
    host: process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y' ? process.env.PROD_DB_HOST : process.env.DB_HOST,
    user: process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y' ? process.env.PROD_DB_USER : process.env.DB_USER,
    password: process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y' ? process.env.PROD_DB_PASSWORD : process.env.DB_PASSWORD,
    port: process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y' ? process.env.PROD_DB_PORT : process.env.DB_PORT,
    database: process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y' ? process.env.PROD_DB : process.env.DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Connect Pool
 * @param callback
 * @returns {Promise<void>}
 */
export async function getConnectPool(callback) {
    const conn = await pool.getConnection(async conn => conn);

    try {

        await callback(conn);
    } catch (e) {

        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log('db.js');
        console.log(e);
    }

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

/**
 * 결과 값
 *
 * @param data
 * @param code
 * @param msg
 * @returns {{data, resultCode: string, resultMsg}}
 */
export function resultOne(data, code = '0000', msg) {

    data = !!data && data.length > 0 ? data[0] : data;
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