import crypto from "crypto"

/**
 * Hash
 * @param value
 * @returns {*}
 */
export function hash(value) {

    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/**
 * 서명 키 (서버 전용, ENC_KEY 기반)
 * @param purpose
 * @returns {Buffer}
 */
function signKey(purpose) {

    return crypto.createHmac('sha256', String(process.env.ENC_KEY)).update('sign:' + purpose).digest();
}

/**
 * HMAC 해시 (인증번호 등 비교용)
 * @param purpose
 * @param value
 * @returns {string}
 */
export function hmac(purpose, value) {

    return crypto.createHmac('sha256', signKey(purpose)).update(String(value)).digest('base64url');
}

/**
 * 서명 토큰 생성 (DB 저장 없이 서버가 발급한 값임을 보증)
 * @param purpose 토큰 용도 (다른 용도의 토큰 재사용 방지)
 * @param payload
 * @param ttlSec 유효시간(초)
 * @returns {string}
 */
export function signToken(purpose, payload, ttlSec) {

    const body = Buffer.from(JSON.stringify({...payload, exp: Date.now() + ttlSec * 1000})).toString('base64url');

    return body + '.' + hmac(purpose, body);
}

/**
 * 서명 토큰 검증
 * @param purpose
 * @param token
 * @returns {object|null} 위변조/만료 시 null
 */
export function verifyToken(purpose, token) {

    if(!token || typeof token !== 'string' || token.indexOf('.') < 0) {

        return null;
    }

    const [body, sig] = token.split('.');
    const expected = hmac(purpose, body);

    if(!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {

        return null;
    }

    try {

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

        return (!!payload.exp && payload.exp > Date.now()) ? payload : null;
    } catch (e) {

        return null;
    }
}