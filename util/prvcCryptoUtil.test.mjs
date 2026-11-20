/**
 * 개인정보 암호화 교차 시험 (공통 형식 v1 · 5절 시험 값) — 실행: node util/prvcCryptoUtil.test.mjs
 * 시험 키는 공개 시험용(0x00~0x1f)이며 실제 키가 아니다
 */

import assert from "assert";
import {decryptWithKey, encryptWithKey, maskAcno} from "./prvcCryptoUtil.js";

const key = Buffer.from('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=', 'base64');

const cases = [
    ['110123456789', '000102030405060708090a0b', 'v1:AAECAwQFBgcICQoLdjPmKvfW9i67dq+yHzoRDPZy18YU4Hu7hP2Epg=='],
    ['3333-01-2345678', 'a0a1a2a3a4a5a6a7a8a9aaab', 'v1:oKGio6Slpqeoqaqr1StPHmj7M5JQVrPmMU34ANZQ1Ie/Vk8Z72q2X3BNxw=='],
    ['계좌 테스트 01', 'ffffffffffffffffffffffff', 'v1:////////////////0DJrJcI3/isO0kJbiMMp9JDj0s5ZlOypSZF2MsXqQdfZjs4='],
];

for(const [plain, ivHex, expected] of cases) {

    // (1) 시험 키 · IV 로 암호화 → 기대 값
    assert.strictEqual(encryptWithKey(plain, key, Buffer.from(ivHex, 'hex')), expected);

    // (2) 기대 값 복호화 → 평문
    assert.strictEqual(decryptWithKey(expected, key), plain);

    // (3) 태그 1바이트 변경 → 실패
    const buf = Buffer.from(expected.substring(3), 'base64');

    buf[buf.length - 1] ^= 0x01;
    assert.throws(() => decryptWithKey('v1:' + buf.toString('base64'), key));
}

// 랜덤 IV 왕복
const random = encryptWithKey('110123456789', key);

assert.notStrictEqual(random, encryptWithKey('110123456789', key));
assert.strictEqual(decryptWithKey(random, key), '110123456789');

assert.strictEqual(maskAcno('110123456789'), '********6789');
assert.strictEqual(maskAcno('1234'), '1234');
assert.strictEqual(maskAcno(''), '');
assert.strictEqual(maskAcno(null), '');

console.log('prvcCryptoUtil 시험 통과 (교차 시험 값 3개)');
