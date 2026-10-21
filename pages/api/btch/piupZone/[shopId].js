import {getConnectPool, result} from "../../db";
import {getAuthShprId} from "../../../../util/authUtil";

/**
 * 이마트 매장 픽업존 안내 조회
 * - www 관리자 "스토어 > 픽업존 관리" 가 쓰는 T_SHOP_PIUP_ZONE_GRP / T_ATCH_FILE 을 읽는다
 * - 매장 정보라 배치 소유는 보지 않고 로그인만 본다
 * - param.existYn === 'Y' 면 안내 존재 여부만 반환 (진행 상세의 [픽업존 안내] 버튼 노출용)
 * - 테이블이 없는 DB(www 운영 배포 전)에서는 ER_NO_SUCH_TABLE → 안내 없음으로 처리
 */
export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const {shopId} = req.query;
        const param = req.body;

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {

                return;
            }

            if(!/^[0-9]+$/.test(`${shopId}`)) {

                res.status(200).json(result('', '9999', '잘못된 요청입니다.'));
                return;
            }

            // 존재 여부만
            if(param?.existYn === 'Y') {

                const [rows] = await conn.query(`SELECT 1 FROM T_SHOP_PIUP_ZONE_GRP WHERE SHOP_ID = ? AND DEL_YN = 'N' LIMIT 1`, [shopId]);

                res.status(200).json(result({isExist: rows.length > 0}));
                return;
            }

            const [shopRows] = await conn.query(`SELECT SHOP_NM FROM T_SHOP_MAG WHERE SHOP_ID = ?`, [shopId]);

            // 그룹 (섹션 순서: 최적 동선 → 주차 → 고객만족센터 → 픽업존)
            const [grpList] = await conn.query(`
                SELECT PIUP_ZONE_GRP_ID
                     , PIUP_SECT_KD
                     , GRP_TITLE
                     , GRP_TEXT
                  FROM T_SHOP_PIUP_ZONE_GRP
                 WHERE SHOP_ID = ?
                   AND DEL_YN = 'N'
              ORDER BY FIELD(PIUP_SECT_KD, 'ROUTE', 'PARKING', 'SERVICE', 'PICKUP')
                     , GRP_SEQ
                     , PIUP_ZONE_GRP_ID
            `, [shopId]);

            // 사진 (순서가 필요해 fnGetAtchFileList 를 쓰지 않는다)
            const [fileList] = await conn.query(`
                SELECT G.PIUP_ZONE_GRP_ID
                     , CONCAT(F.ATCH_FILE_SRVR_PATH, '/', F.ATCH_FILE_SRVR_NM) AS URL
                  FROM T_SHOP_PIUP_ZONE_GRP G
                       INNER JOIN T_ATCH_FILE F
                    ON F.ATCH_FILE_UUID = G.ATCH_FILE_UUID
                   AND F.ATCH_FILE_DEL_YN = 'N'
                 WHERE G.SHOP_ID = ?
                   AND G.DEL_YN = 'N'
              ORDER BY G.PIUP_ZONE_GRP_ID
                     , F.ATCH_FILE_SEQ
                     , F.ATCH_FILE_ID
            `, [shopId]);

            res.status(200).json(result({
                shopNm: shopRows[0]?.SHOP_NM ?? '매장',
                grpList,
                fileList,
            }));
        } catch (e) {

            // 테이블 없음 = 안내 없음
            if(e?.code === 'ER_NO_SUCH_TABLE') {

                res.status(200).json(result(param?.existYn === 'Y' ? {isExist: false} : {grpList: [], fileList: []}));
                return;
            }

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);

            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
