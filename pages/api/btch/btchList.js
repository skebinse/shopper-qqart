import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        let query = '';

        // 접속 로그
        if(param.isLog === 'true') {

            const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
            const ip = req.headers["x-real-ip"] || req.connection.remoteAddress;
            const protocol = req ? 'https:' : 'http:'
            const host = req
                ? req.headers['x-forwarded-host'] || req.headers['host']
                : window.location.host

            query = `
                INSERT INTO T_ACES_LOG(ACES_LOG_BROW, ACES_LOG_SCRN_URL, ACES_LOG_IP, SHPR_ID)
                VALUES (?, ?, ?, fnDecrypt(?, ?))
            `;

            await conn.query(query, [userAgent, protocol + '//' + host, ip, req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        }

        // 정지 계정 확인
        query = `
            SELECT SHPR_ACT_SPNS_DT
              FROM T_SHPR_INFO
             WHERE SHPR_ID = fnDecrypt(?, ?)
        `;

        const [actSpnsRow] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        if(!!actSpnsRow[0] && !!actSpnsRow[0].SHPR_ACT_SPNS_DT) {

            res.status(200).json(result(null, '9999', '활동이 정지된 계정입니다.'));

            return;
        }

        let row;

        // 가입 승인 여부
        query = `
            SELECT COUNT(*) AS CNT
              FROM T_SHPR_INFO
             WHERE SHPR_ID = fnDecrypt(?, ?)
               AND SHPR_ENT_APV_DT IS NULL
        `;

        [row] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        if(row[0].CNT > 0) {

            res.status(200).json(result({isEntApv: false}));

            return;
        }

        // 금일 업무시작 여부
        query = `
            SELECT COUNT(*) AS CNT
              FROM T_SHPR_DUTJ_MAG
             WHERE SHPR_ID = fnDecrypt(?, ?)
               AND SHPR_DUTJ_YMD = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
               AND SHPR_DUTJ_END_DT IS NULL
        `;

        [row] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        if(row[0].CNT === 0) {

            res.status(200).json(result({isDutjStrt: false, isEntApv: true}));

            return;
        }

        // 배치 취소 패널티 확인
        query = `
        SELECT IFNULL(TIMESTAMPDIFF(MINUTE, MAX(RGI_DT), NOW()), 60) AS MIN 
          FROM T_BTCH_CAN_HITY
         WHERE SHPR_ID = fnDecrypt(?, ?)
           AND BTCH_CAN_SANCT_YN = 'Y'
        `;

        [row] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        let rows = [];

        if (row[0].MIN >= 60) {

            // 미배치 리스트
            query = `
            SELECT AA.ODER_MNGR_RGI_YN
                 , AA.ODER_RPRE_NO
                 , AA.SHOP_NM
                 , AA.PROD_CNT
                 , AA.SHOP_FULL_ADDR
                 , AA.ODER_DELY_FULL_ADDR
                 , AA.ODER_USER_ID
                 , AA.ODER_KD
                 , AA.ODER_DRC_LDTN_YN
                 , AA.ODER_DELY_SLCT_VAL
                 , AA.ODER_DRC_LDTN_AMT
                 , DATE_FORMAT(AA.ODER_DELY_YMD, '%m월 %d일') AS ODER_DELY_YMD
                 , AA.ODER_DELY_HH
                 , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
                 , FORMAT(fnGetDelyDtcAmt(AA.ODER_USER_ID, AA.SHPR_ID, AA.ODER_DELY_DTC) + ODER_SHPR_TIP_AMT, 0) AS DELY_AMT
                 , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
                 , CASE WHEN AA.ODER_URG_DELY_MI != '' THEN 
                    AA.ODER_URG_DELY_MI - TIMESTAMPDIFF(MINUTE, AA.ODER_REQ_YMD, DATE_ADD(NOW(), INTERVAL 9 HOUR))
                   ELSE '' END AS BTCH_RGI_PGRS_MI
              FROM (
                SELECT AA.ODER_MNGR_RGI_YN
                     , fnGetOderReqYmd(AA.ODER_MNGR_RGI_YN, AA.ODER_REQ_YMD) AS ODER_REQ_YMD
                     , AA.ODER_URG_DELY_MI
                     , AA.ODER_RPRE_NO
                     , AA.ODER_USER_ID
                     , AA.ODER_DELY_DTC
                     , AA.ODER_KD
                     , AA.ODER_SHPR_TIP_AMT
                     , AA.ODER_DELY_SLCT_VAL
                     , AA.ODER_DELY_YMD
                     , AA.ODER_DELY_HH
                     , BB.SHOP_NM
                     , BB.SHOP_RRSN_ATCH_FILE_UUID
                     , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                     , CONCAT(AA.ODER_DELY_ADDR, ' ' , AA.ODER_DELY_DTPT_ADDR) AS ODER_DELY_FULL_ADDR
                     , IFNULL(DD.PROD_CNT, 0) AS PROD_CNT
                     , IFNULL(DD.SPBK_DELY_DTC, 0) AS SPBK_DELY_DTC
                     , BB.SHOP_ADDR_LAT
                     , BB.SHOP_ADDR_LOT
                     , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                     , EE.SHPR_ID
                     , EE.SHPR_DELY_POS_DTC
                     , AA.ODER_DRC_LDTN_YN
                     , IFNULL(AA.ODER_DRC_LDTN_AMT, 0) AS ODER_DRC_LDTN_AMT
                  FROM T_ODER_USER_INFO AA
                       INNER JOIN T_SHOP_MAG BB
                    ON BB.SHOP_ID = AA.SHOP_ID
                       INNER JOIN T_USER_INFO CC
                    ON CC.USER_ID = AA.USER_ID
                   AND CC.USER_SCSS_YN = 'N'
                       LEFT OUTER JOIN
                        (
                        SELECT USER_ID
                             , SHOP_ID
                             , SPBK_DELY_DTC
                             , ODER_USER_ID
                             , COUNT(SHOP_ID) AS PROD_CNT
                          FROM T_USER_SPBK
                         WHERE SPBK_PGRS_STAT = '02'
                      GROUP BY USER_ID
                             , SHOP_ID
                             , SPBK_DELY_DTC
                             , ODER_USER_ID
                        ) DD
                    ON AA.ODER_USER_ID = DD.ODER_USER_ID
                       INNER JOIN T_SHPR_INFO EE
                    ON EE.SHPR_ID = fnDecrypt(?, ?)
                 WHERE AA.ODER_ID IS NULL
                   AND AA.ODER_REQ_YMD IS NOT NULL
                   AND AA.ODER_REQ_APV_DT IS NULL
               ) AA
         WHERE (AA.PROD_CNT > 0 OR AA.ODER_KD = 'PIUP')
           AND AA.SLIN_DTC < AA.SHPR_DELY_POS_DTC * 1000
           AND AA.ODER_REQ_YMD BETWEEN CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' 00:00:00') AND CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' 23:59:59')
      ORDER BY AA.ODER_REQ_YMD
        `;

            [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        }

        // 배치 리스트
        query = `
        SELECT AA.ODER_MNGR_RGI_YN
             , AA.ODER_RPRE_NO
             , AA.SHOP_NM
             , AA.PROD_CNT
             , AA.SHOP_FULL_ADDR
             , AA.ODER_DELY_FULL_ADDR
             , AA.ODER_USER_ID
             , AA.ODER_KD
             , AA.ODER_DRC_LDTN_YN
             , AA.ODER_DELY_SLCT_VAL
             , AA.ODER_DRC_LDTN_AMT
             , DATE_FORMAT(AA.ODER_DELY_YMD, '%m월 %d일') AS ODER_DELY_YMD
             , AA.ODER_DELY_HH
             , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
             , FORMAT(fnGetDelyDtcAmt(AA.ODER_USER_ID, AA.SHPR_ID, AA.ODER_DELY_DTC) + AA.ODER_SHPR_TIP_AMT, 0) AS DELY_AMT
             , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
             , CASE 
                WHEN AA.ODER_URG_DELY_MI != '' THEN ''
               ELSE ODER_PIUP_FRCS_MI END AS ODER_PIUP_FRCS_MI
             , AA.BTCH_ACP_PGRS_MI
             , CASE 
                WHEN AA.ODER_URG_DELY_MI != '' THEN AA.ODER_URG_DELY_MI - TIMESTAMPDIFF(MINUTE, AA.ODER_REQ_YMD, DATE_ADD(NOW(), INTERVAL 9 HOUR))
               ELSE '' END AS BTCH_RGI_PGRS_MI
          FROM (
            SELECT AA.ODER_MNGR_RGI_YN
                 , fnGetOderReqYmd(AA.ODER_MNGR_RGI_YN, AA.ODER_REQ_YMD) AS ODER_REQ_YMD
                 , AA.ODER_RPRE_NO
                 , AA.ODER_USER_ID
                 , AA.ODER_DELY_DTC
                 , AA.ODER_REQ_APV_DT
                 , AA.ODER_KD
                 , AA.ODER_SHPR_TIP_AMT
                 , AA.ODER_DELY_SLCT_VAL
                 , AA.ODER_DELY_YMD
                 , AA.ODER_DELY_HH
                 , AA.ODER_URG_DELY_MI
                 , BB.SHOP_NM
                 , BB.SHOP_RRSN_ATCH_FILE_UUID
                 , AA.ODER_DELY_ADDR
                 , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                 , CONCAT(AA.ODER_DELY_ADDR, ' ' , AA.ODER_DELY_DTPT_ADDR) AS ODER_DELY_FULL_ADDR
                 , IFNULL(DD.PROD_CNT, 0) AS PROD_CNT
                 , IFNULL(DD.SPBK_DELY_DTC, 0) AS SPBK_DELY_DTC
                 , BB.SHOP_ADDR_LAT
                 , BB.SHOP_ADDR_LOT
                 , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                 , EE.SHPR_ID
                 , AA.ODER_DRC_LDTN_YN
                 , AA.ODER_PIUP_FRCS_MI
                 , IFNULL(AA.ODER_DRC_LDTN_AMT, 0) AS ODER_DRC_LDTN_AMT
                 , TIMESTAMPDIFF(MINUTE, AA.ODER_REQ_APV_DT, NOW()) AS BTCH_ACP_PGRS_MI
              FROM T_ODER_USER_INFO AA
                   INNER JOIN T_SHOP_MAG BB
                ON BB.SHOP_ID = AA.SHOP_ID
                   INNER JOIN T_USER_INFO CC
                ON CC.USER_ID = AA.USER_ID
               AND CC.USER_SCSS_YN = 'N'
                   LEFT OUTER JOIN
                    (
                    SELECT USER_ID
                         , SHOP_ID
                         , SPBK_DELY_DTC
                         , ODER_USER_ID
                         , COUNT(SHOP_ID) AS PROD_CNT
                      FROM T_USER_SPBK
                     WHERE SPBK_PGRS_STAT = '02'
                  GROUP BY USER_ID
                         , SHOP_ID
                         , SPBK_DELY_DTC
                         , ODER_USER_ID
                    ) DD
                ON AA.ODER_USER_ID = DD.ODER_USER_ID
                   INNER JOIN T_SHPR_INFO EE
                ON EE.SHPR_ID = fnDecrypt(?, ?)
               AND AA.SHPR_ID = EE.SHPR_ID
             WHERE AA.ODER_ID IS NULL
               AND AA.ODER_REQ_YMD IS NOT NULL
               AND AA.ODER_PGRS_STAT IN ('03', '04', '05')
           ) AA
  ORDER BY AA.ODER_REQ_APV_DT
         , AA.ODER_REQ_YMD
    `;

        const [rows2] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(result({
            isEntApv: true,
            isDutjStrt: true,
            btchList: rows,
            btchAcpList: rows2,
            btchCanMin: row[0].MIN,
        }));
    });
}