/**
 * 개인정보 암호화 (공통 형식 v1) — 서버 전용
 * 형식: 'v1:' + base64( IV 12바이트 | 암호문 | GCM 태그 16바이트 ), AES-256-GCM, AAD 없음
 * www · 바스키 쇼퍼 웹과 같은 형식이어야 한다 (총괄 docs/20261120_개인정보암호화/암호화_형식.md)
 * env: PRVC_DATA_KEY_V1 — KMS 로 암호화된 데이터 키(base64). 첫 사용 시 KMS Decrypt 로 풀어 메모리에만 둔다
 * 평문 데이터 키 · 원문은 로그 · 응답 · 에러 메시지에 남기지 않는다
 */

import crypto from "crypto";
import AWS from "aws-sdk";

const PREFIX_V1 = 'v1:';
const IV_LEN = 12;
const TAG_LEN = 16;
const ENCRYPTION_CONTEXT = {app: 'qqcart', purpose: 'prvc'};

let dataKeyPromise = null;

/**
 * 데이터 키(평문 32바이트) — 실패하면 다음 호출에서 다시 시도한다
 * @returns {Promise<Buffer>}
 */
function getDataKey() {

    if(!dataKeyPromise) {

        const blob = process.env.PRVC_DATA_KEY_V1;

        if(!blob) {

            return Promise.reject(new Error('PRVC_DATA_KEY_V1 미설정'));
        }

        const kms = new AWS.KMS({region: 'ap-northeast-2'});

        dataKeyPromise = kms.decrypt({CiphertextBlob: Buffer.from(blob, 'base64'), EncryptionContext: ENCRYPTION_CONTEXT}).promise()
            .then(res => {

                const key = Buffer.from(res.Plaintext);

                if(key.length !== 32) {

                    throw new Error('데이터 키 길이 오류');
                }

                return key;
            })
            .catch(e => {

                dataKeyPromise = null;
                throw new Error('KMS 데이터 키 복호화 실패: ' + (e?.code || e?.name || 'ERROR'));
            });
    }

    return dataKeyPromise;
}

/**
 * 키 · IV 를 받아 암호화 (시험 값 확인용으로 IV 를 넘길 수 있게 분리. 실제 저장은 encryptPrvc 사용)
 * @param plain
 * @param key
 * @param iv
 * @returns {string}
 */
export function encryptWithKey(plain, key, iv = crypto.randomBytes(IV_LEN)) {

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);

    return PREFIX_V1 + Buffer.concat([iv, enc, cipher.getAuthTag()]).toString('base64');
}

/**
 * 키를 받아 'v1:' 값 복호화 — 형식 · 태그가 맞지 않으면 예외
 * @param value
 * @param key
 * @returns {string}
 */
export function decryptWithKey(value, key) {

    const buf = Buffer.from(String(value).substring(PREFIX_V1.length), 'base64');

    if(buf.length < IV_LEN + TAG_LEN) {

        throw new Error('암호문 길이 오류');
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, IV_LEN));

    decipher.setAuthTag(buf.subarray(buf.length - TAG_LEN));

    return Buffer.concat([decipher.update(buf.subarray(IV_LEN, buf.length - TAG_LEN)), decipher.final()]).toString('utf8');
}

/**
 * 'v1:' 로 암호화된 값인지
 * @param value
 * @returns {boolean}
 */
export function isEncrypted(value) {

    return typeof value === 'string' && value.startsWith(PREFIX_V1);
}

/**
 * 저장용 암호화 — NULL · 빈 값은 그대로 둔다. 키를 못 얻으면 예외(평문으로 저장하지 않도록 호출자가 저장을 거부)
 * @param plain
 * @returns {Promise<string|null|undefined>}
 */
export async function encryptPrvc(plain) {

    if(plain === null || plain === undefined || plain === '') {

        return plain;
    }

    return encryptWithKey(plain, await getDataKey());
}

/**
 * 읽기용 복호화 — 이행 기간에는 'v1:' 가 아니면 평문으로 그대로 돌려준다. 실패하면 예외
 * @param value
 * @returns {Promise<string>}
 */
export async function decryptPrvc(value) {

    if(!isEncrypted(value)) {

        return value;
    }

    return decryptWithKey(value, await getDataKey());
}

/**
 * 화면 표시용 복호화 — 예외를 던지지 않는다. 실패하면 빈 값을 돌려주고 로그에는 쇼퍼 ID 만 남긴다
 * @param value
 * @param shprId
 * @returns {Promise<string>}
 */
export async function readPrvc(value, shprId) {

    try {

        return await decryptPrvc(value);
    } catch (e) {

        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log('개인정보 복호화 실패 shprId=' + shprId, e?.message);
        return '';
    }
}

/**
 * 계좌번호 마스킹 — 뒤 4자리만 보이고 앞은 '*' (4자리 이하는 그대로)
 * @param acno
 * @returns {string}
 */
export function maskAcno(acno) {

    const str = String(acno ?? '');

    return str.length > 4 ? '*'.repeat(str.length - 4) + str.slice(-4) : str;
}
