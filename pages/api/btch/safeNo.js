import {getConnectPool, result} from "../db";
import {getAuthShprId} from "../../../util/authUtil";
import {assignSafeNo, checkSafeNoMapping, getKstYmd, logSafeNoMismatch, getSafeNoDays, hashRcvNo, isSafeNoConfigured, isValidRcvNo} from "../../../util/safeNoUtil";

/**
 * 고객 전화 걸기용 050 안심번호 조회
 * - 고객 실번호는 응답에 넣지 않는다. 같은 주문은 종료일 전까지 한 번 할당한 번호를 다시 쓴다(T_ODER_SAFE_NO)
 * - 담당 쇼퍼만, 장보기(04) · 배달 중(05) 건만 호출 가능. 배달 완료(btchComp) 시 번호를 해제한다(releaseSafeNo)
 */
export default async function handler(req, res) {

    if(req.method !== 'POST') {

        res.status(405).json(result('', '9999', '잘못된 요청입니다.'));
        return;
    }

    await getConnectPool(async conn => {

        const oderUserId = parseInt(req.body?.oderUserId, 10);

        let shprId;
        let lockName;

        try {

            shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {

                return;
            }

            if(!oderUserId) {

                res.status(200).json(result('', '1001', '주문 정보가 없습니다.'));
                return;
            }

            const [oderRows] = await conn.query(`
                SELECT ODER_ACPP_CPHONE_NO
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT IN ('04', '05')
            `, [oderUserId, shprId]);

            if(oderRows.length === 0) {

                res.status(200).json(result('', '1002', '지금은 고객에게 전화할 수 없는 주문입니다.'));
                return;
            }

            const rcvNo = String(oderRows[0].ODER_ACPP_CPHONE_NO || '').replace(/[^0-9]/g, '');

            if(!rcvNo) {

                res.status(200).json(result('', '1003', '고객 연락처가 등록되어 있지 않습니다.'));
                return;
            }

            // 세종이 받지 않는 부가번호 · 대표번호는 할당 전에 거른다 (050 번호가 그대로 할당되는 것 방지)
            if(!isValidRcvNo(rcvNo)) {

                res.status(200).json(result('', '1007', '고객 번호가 올바르지 않습니다.\n고객센터에 문의해 주세요.'));
                return;
            }

            if(!isSafeNoConfigured()) {

                console.log('safeNo: SAFE_NO_* env 미설정');
                res.status(200).json(result('', '1004', '안심번호 설정이 되어 있지 않습니다.\n고객센터에 문의해 주세요.'));
                return;
            }

            // 같은 주문 동시 요청 시 중복 할당 방지
            lockName = 'safeNo_' + oderUserId;

            const [lockRows] = await conn.query(`SELECT GET_LOCK(?, 10) AS LOCK_YN`, [lockName]);

            if(lockRows[0].LOCK_YN !== 1) {

                lockName = null;
                res.status(200).json(result('', '1005', '잠시 후 다시 시도해 주세요.'));
                return;
            }

            const todayYmd = getKstYmd(0);
            const chnlId = process.env.SAFE_NO_CHANNEL_ID;

            // 실번호는 저장하지 않고 해시로만 비교 (바스키 쇼퍼 웹과 같은 규칙)
            const rcvNoHash = hashRcvNo(rcvNo);

            // 종료일이 남아 있고 고객 번호 · 채널이 그대로면 기존 번호 재사용
            const [safeRows] = await conn.query(`
                SELECT SAFE_VNO
                  FROM T_ODER_SAFE_NO
                 WHERE ODER_USER_ID = ?
                   AND RCV_NO_HASH = ?
                   AND CHNL_ID = ?
                   AND SAFE_END_YMD >= ?
            `, [oderUserId, rcvNoHash, chnlId, todayYmd]);

            if(safeRows.length > 0) {

                // 세종에서 먼저 풀려 다른 고객에게 갔을 수 있어, 지금도 이 고객에게 연결돼 있을 때만 재사용한다
                const vno = safeRows[0].SAFE_VNO;
                const mapping = await checkSafeNoMapping(vno, rcvNoHash);

                if(mapping === 'MATCH') {

                    res.status(200).json(result({safeNo: vno}));
                    return;
                }

                // 다른 고객 · 해제 상태면 이 행은 더 이상 우리 번호가 아니다(해제하지 않고 지운다). 조회 실패면 행은 두고 새로 받는다(아래 INSERT 가 덮어씀)
                if(mapping === 'OTHER') {

                    logSafeNoMismatch('전화 걸기 재사용', oderUserId, vno);

                    await conn.query(`
                        DELETE FROM T_ODER_SAFE_NO
                         WHERE ODER_USER_ID = ?
                           AND SAFE_VNO = ?
                    `, [oderUserId, vno]);
                }
            }

            const {endDays, agingDays} = getSafeNoDays();
            const endYmd = getKstYmd(endDays);
            const agingYmd = getKstYmd(agingDays);

            // 세종 접속 실패(시간 초과 · IP 미등록으로 연결 차단 등)는 할당 실패와 같이 안내
            const assign = await assignSafeNo(rcvNo, endYmd, agingYmd).catch(e => ({code: 'FETCH', message: String(e?.message || e)}));

            if(!assign.vno) {

                const now = new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date());

                // 6004: 사용할 수 있는 050 번호 없음 — 번호 고갈 감지용으로 눈에 띄게 남긴다 (docker logs | grep SAFE_NO_EXHAUSTED)
                if(assign.code === '6004') {

                    console.error(`[SAFE_NO_EXHAUSTED] ${now} 050 번호 고갈 — 할당 실패 oderUserId=${oderUserId} channelId=${chnlId} code=6004 message=${assign.message}`);
                    res.status(200).json(result('', '1008', '지금 사용할 수 있는 안심번호가 없습니다.\n고객센터에 문의해 주세요.'));
                    return;
                }

                console.log(now);
                console.log('safeNo assign 실패', oderUserId, assign.code, assign.message);

                res.status(200).json(result('', '1006', '안심번호를 받지 못했습니다.\n잠시 후 다시 시도해 주세요.'));
                return;
            }

            await conn.query(`
                INSERT INTO T_ODER_SAFE_NO
                     ( ODER_USER_ID
                     , SAFE_VNO
                     , RCV_NO_HASH
                     , CHNL_ID
                     , SAFE_END_YMD
                     , SAFE_AGING_YMD
                     , SHPR_ID
                     )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                       SAFE_VNO = VALUES(SAFE_VNO)
                     , RCV_NO_HASH = VALUES(RCV_NO_HASH)
                     , CHNL_ID = VALUES(CHNL_ID)
                     , SAFE_END_YMD = VALUES(SAFE_END_YMD)
                     , SAFE_AGING_YMD = VALUES(SAFE_AGING_YMD)
                     , SHPR_ID = VALUES(SHPR_ID)
                     , MDFC_DT = NOW()
            `, [oderUserId, assign.vno, rcvNoHash, chnlId, endYmd, agingYmd, shprId]);

            res.status(200).json(result({safeNo: assign.vno}));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);

            if(!res.headersSent) {

                res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
            }
        } finally {

            if(!!lockName) {

                await conn.query(`SELECT RELEASE_LOCK(?)`, [lockName]).catch(() => {});
            }
        }
    });
}
