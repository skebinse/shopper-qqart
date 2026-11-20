/**
 * 050 안심번호 (세종텔레콤 050Biz REST v1.260917) — 서버 전용
 * env: SAFE_NO_API_URL, SAFE_NO_API_TOKEN, SAFE_NO_CHANNEL_ID, SAFE_NO_END_DAYS, SAFE_NO_AGING_DAYS
 */

import crypto from "crypto";

/**
 * 고객 번호 해시 (T_ODER_SAFE_NO.RCV_NO_HASH) — 숫자만 남긴 뒤 SHA-256 소문자 hex 64자
 * 바스키 쇼퍼 웹과 같은 규칙이어야 한다. 예) '010-1234-5678' → sha256('01012345678')
 * @param rcvNo
 * @returns {string}
 */
export function hashRcvNo(rcvNo) {

    return crypto.createHash('sha256').update(String(rcvNo || '').replace(/[^0-9]/g, '')).digest('hex');
}

/**
 * 세종 착신번호로 쓸 수 있는 번호인지 (숫자만 넘긴다)
 * 050Biz 문서: 부가번호(012, 014, 015, 030, 050, 060, 080, 1~ 등)를 제외한 국내번호
 * - 0 으로 시작하는 9~11자리 국내번호만 허용 (1588 같은 대표번호 · 국제번호 제외)
 * - 부가번호 대역으로 시작하면 제외
 * @param rcvNo
 * @returns {boolean}
 */
export function isValidRcvNo(rcvNo) {

    const digits = String(rcvNo || '');

    if(!/^0\d{8,10}$/.test(digits)) {

        return false;
    }

    return !/^0(12|14|15|30|50|60|80)/.test(digits);
}

/**
 * 오늘(KST) 기준 n일 뒤 날짜 yyyyMMdd
 * @param days
 * @returns {string}
 */
export function getKstYmd(days = 0) {

    const date = new Date(Date.now() + (9 * 60 + days * 24 * 60) * 60 * 1000);

    return date.toISOString().substring(0, 10).replace(/-/g, '');
}

/**
 * 할당 유지 · 재할당 금지 일수 (재할당 금지일은 종료일보다 커야 함, 5042)
 * @returns {{endDays: number, agingDays: number}}
 */
export function getSafeNoDays() {

    const toInt = (value, defaultValue) => {

        const num = parseInt(value, 10);

        return isNaN(num) ? defaultValue : num;
    };

    // 기본: 오늘 23:59:59 해제(0), 재할당 금지는 내일까지(1) — 운영 번호 1,000개라 묶이는 기간을 최소로
    const endDays = Math.max(0, toInt(process.env.SAFE_NO_END_DAYS, 0));
    const agingDays = Math.max(endDays + 1, toInt(process.env.SAFE_NO_AGING_DAYS, endDays + 1));

    return {endDays, agingDays};
}

/**
 * env 설정 여부
 * @returns {boolean}
 */
export function isSafeNoConfigured() {

    return !!process.env.SAFE_NO_API_URL && !!process.env.SAFE_NO_API_TOKEN && !!process.env.SAFE_NO_CHANNEL_ID;
}

/**
 * 세종 API 호출
 * @param path
 * @param body
 * @returns {Promise<{code: string, message?: string, data?: any}>}
 */
async function callSafeNoApi(path, body, timeoutMs = 10000, method = 'POST') {

    const baseUrl = process.env.SAFE_NO_API_URL.replace(/\/+$/, '');

    const res = await fetch(`${baseUrl}/${path}`, {
        method,
        headers: {
            'Authorization': 'Bearer ' + process.env.SAFE_NO_API_TOKEN,
            'Content-Type': 'application/json',
        },
        body: !!body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
    });

    return await res.json();
}

/**
 * 050서비스 할당 v2 (2.1.6) — 세종이 번호를 골라 돌려준다
 * @param rcvNo 착신번호(고객 실번호, 숫자만)
 * @param endYmd 서비스 종료일 yyyyMMdd (그날 23:59:59 자동 해제)
 * @param agingYmd 재할당 금지일 yyyyMMdd
 * @returns {Promise<{code: string, message?: string, vno?: string}>}
 */
export async function assignSafeNo(rcvNo, endYmd, agingYmd) {

    const res = await callSafeNoApi('050biz/v2/service/assign', {
        channelId: process.env.SAFE_NO_CHANNEL_ID,
        rcvNo1: rcvNo,
        endDay: endYmd,
        agingDay: agingYmd,
        colorringIdx: 0,
        rcvMentIdx: 0,
        bizEndMentIdx: 0,
        holiMentIdx: 0,
        callMentIdx: 0,
        bizStartTime: '0000',
        bizEndTime: '2359',
        holiWeek: '11111',
        holiDay: '1111111',
        holidaySet: 'N',
        recType: '0',
        status: 'Y',
    });

    return {
        code: String(res?.code ?? ''),
        message: res?.message,
        vno: res?.code === '0000' && !!res?.data ? String(res.data) : undefined,
    };
}

/**
 * 050서비스 초기화 (2.1.3) — 할당 해제
 * @param vno
 * @returns {Promise<{code: string, message?: string}>}
 */
export async function clearSafeNo(vno, timeoutMs = 10000) {

    const res = await callSafeNoApi(`050biz/v1/service/clear/${encodeURIComponent(vno)}`, undefined, timeoutMs);

    return {code: String(res?.code ?? ''), message: res?.message};
}

/**
 * 저장해 둔 050 번호가 세종에서 지금도 이 고객 번호로 연결돼 있는지 (050서비스 조회 2.1.2)
 * DB 기록만 믿으면, 세종에서 먼저 풀려 다른 고객에게 간 번호를 재사용 · 해제할 수 있다
 * - MATCH: 사용 중(status Y) · 같은 채널 · 착신번호 해시가 같음
 * - OTHER: 할당 안 됨(6005) · 해제 상태 · 다른 번호로 연결됨
 * - UNKNOWN: 조회 실패(접속 오류 · 그 외 코드)
 * @param vno
 * @param rcvNoHash
 * @returns {Promise<'MATCH'|'OTHER'|'UNKNOWN'>}
 */
export async function checkSafeNoMapping(vno, rcvNoHash) {

    try {

        const res = await callSafeNoApi(`050biz/v1/service/${encodeURIComponent(vno)}`, undefined, 5000, 'GET');
        const code = String(res?.code ?? '');

        if(code === '6005') {

            return 'OTHER';
        }

        if(code !== '0000') {

            return 'UNKNOWN';
        }

        const data = res?.data || {};
        const sameChannel = !data.channelId || data.channelId === process.env.SAFE_NO_CHANNEL_ID;

        return data.status === 'Y' && sameChannel && !!data.rcvNo1 && hashRcvNo(data.rcvNo1) === rcvNoHash ? 'MATCH' : 'OTHER';
    } catch (e) {

        return 'UNKNOWN';
    }
}

/**
 * 저장된 번호가 다른 고객에게 넘어가 있던 경우 — 원인 추적용으로 눈에 띄게 남긴다(고객 번호는 남기지 않음)
 * @param where
 * @param oderUserId
 * @param vno
 */
export function logSafeNoMismatch(where, oderUserId, vno) {

    const now = new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date());

    console.error(`[SAFE_NO_MISMATCH] ${now} ${where} — 저장된 050 이 이 고객에게 연결돼 있지 않음 oderUserId=${oderUserId} vno=${vno}`);
}

/**
 * 배달 완료 후 그 주문의 안심번호 해제 — 응답을 보낸 뒤 호출한다
 * - 해제 전에 세종 조회로 지금도 이 고객에게 연결된 번호인지 확인한다(다른 고객에게 간 번호를 끊지 않게)
 *   - 연결돼 있음 → 해제, 성공(0000) 또는 이미 풀림(6005)이면 행 삭제
 *   - 이미 다른 고객 · 해제 상태 → 해제하지 않고 행만 삭제
 *   - 조회 실패 → 해제하지 않고 행은 둠(endDay 자동 해제에 맡김)
 * - 예외를 던지지 않는다(배달 완료에 영향 없음). 로그에 고객 번호는 남기지 않는다
 * @param conn
 * @param oderUserId
 * @returns {Promise<'NONE'|'CLEARED'|'SKIPPED'|'FAILED'>}
 */
export async function releaseSafeNo(conn, oderUserId) {

    try {

        const [rows] = await conn.query(`
            SELECT SAFE_VNO
                 , RCV_NO_HASH
              FROM T_ODER_SAFE_NO
             WHERE ODER_USER_ID = ?
        `, [oderUserId]);

        if(rows.length === 0) {

            return 'NONE';
        }

        if(!isSafeNoConfigured()) {

            console.log('safeNo clear: SAFE_NO_* env 미설정', oderUserId);
            return 'FAILED';
        }

        const vno = rows[0].SAFE_VNO;
        const mapping = await checkSafeNoMapping(vno, rows[0].RCV_NO_HASH);

        if(mapping === 'UNKNOWN') {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log('safeNo clear 건너뜀 · 세종 조회 실패', oderUserId, vno);
            return 'FAILED';
        }

        if(mapping === 'OTHER') {

            logSafeNoMismatch('배달 완료 해제', oderUserId, vno);

            await conn.query(`
                DELETE FROM T_ODER_SAFE_NO
                 WHERE ODER_USER_ID = ?
                   AND SAFE_VNO = ?
            `, [oderUserId, vno]);

            return 'SKIPPED';
        }

        const clear = await clearSafeNo(vno, 5000).catch(e => ({code: 'FETCH', message: String(e?.message || e)}));

        if(clear.code !== '0000' && clear.code !== '6005') {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log('safeNo clear 실패', oderUserId, vno, clear.code, clear.message);
            return 'FAILED';
        }

        // 해제한 번호만 지운다 (그 사이 다시 할당된 행은 건드리지 않음)
        await conn.query(`
            DELETE FROM T_ODER_SAFE_NO
             WHERE ODER_USER_ID = ?
               AND SAFE_VNO = ?
        `, [oderUserId, vno]);

        return 'CLEARED';
    } catch (e) {

        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log('safeNo clear 오류', oderUserId, e?.message || e);
        return 'FAILED';
    }
}
