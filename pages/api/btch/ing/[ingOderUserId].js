import {getConnectPool, result} from "../../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const {ingOderUserId} = req.query;

        let query = `
           SELECT AA.SHOP_ID
                 , BB.SHOP_NM
                 , CC.PROD_ID
                 , CC.SPBK_AMT
                 , CC.SPBK_DELY_DTC
                 , CC.SPBK_DELY_ACTL_DTC
                 , BB.SHOP_SBSN_STRT_HH
                 , BB.SHOP_SBSN_END_HH
                 , CC.SPBK_PGRS_STAT
                 , fnGetAtchFileList(BB.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_IMG
                 , fnGetAtchFileList(DD.PROD_RRSN_ATCH_FILE_UUID) AS PROD_IMG
                 , fnGetAtchFileList(AA.ODER_PIUP_VCHR_ATCH_FILE_UUID) AS PIUP_VCHR_IMG
                 , CC.SPBK_CCN
                 , CC.SPBK_ID
                 , IFNULL(DD.PROD_NM, CC.SPBK_HNDC_PROD_NM) AS PROD_NM
                 , IFNULL(DD.PROD_DIS_PRICE, DD.PROD_PRICE) AS PROD_PRICE
                 , BB.SHOP_ADDR_LAT
                 , BB.SHOP_ADDR_LOT
                 , EE.USER_ADDR_LAT
                 , EE.USER_ADDR_LOT
                 , EE.USER_NCNM
                 , EE.USER_CPHONE_NO
                 , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                 , fnGetCdNm(BB.SHOP_RRV_KD) AS SHOP_RRV_NM
                 , AA.ODER_USER_ID
                 , AA.ODER_ACPP_NM
                 , AA.ODER_ACPP_CPHONE_NO
                 , AA.ODER_DELY_STDO_CD
                 , AA.ODER_DELYD_ZIPC
                 , AA.ODER_DELY_ADDR
                 , AA.ODER_DELY_DTPT_ADDR
                 , CONCAT(AA.ODER_DELY_ADDR, ' ' , AA.ODER_DELY_DTPT_ADDR) AS USER_FULL_ADDR
                 , AA.ODER_DELY_ADDR_LAT
                 , AA.ODER_DELY_ADDR_LOT
                 , AA.ODER_DELY_SLCT_VAL
                 , AA.ODER_DELY_REQ_MATT
                 , AA.ODER_DELY_NNME_YN
                 , AA.ODER_RRV_ID
                 , AA.USER_CARD_ID
                 , DATE_FORMAT(AA.ODER_DELY_YMD, '%y년 %m월 %d일') AS ODER_DELY_YMD
                 , AA.ODER_DELY_HH
                 , AA.ODER_USER_COUP_ID_LIS
                 , AA.ODER_USE_POIN
                 , AA.ODER_LDTN_SLCT_VAL
                 , AA.ODER_DELY_DTC
                 , AA.ODER_JOIN_ENTH_PW
                 , AA.ODER_DELY_ADIX_DIS_AMT
                 , AA.ODER_KD
                 , AA.ODER_PGRS_STAT
                 , AA.ODER_REQ_APV_MNGR_ID
                 , AA.ODER_DRC_LDTN_YN
                 , AA.ODER_DELY_MENS
                 , AA.ODER_DELY_ARTG
                 , CASE WHEN AA.ODER_MNGR_RGI_YN = 'Y'
                     THEN DATE_FORMAT(AA.ODER_REQ_YMD, '%y년 %m월 %d일 %H:%i')
                   ELSE DATE_FORMAT(DATE_ADD(AA.ODER_REQ_YMD, INTERVAL 9 HOUR), '%y년 %m월 %d일 %H:%i') END AS ODER_REQ_YMD
                 , AA.ODER_PIUP_FRCS_MI
                 , TIMESTAMPDIFF(MINUTE, AA.ODER_REQ_APV_DT, NOW()) AS BTCH_ACP_PGRS_MI
            FROM T_ODER_USER_INFO AA
                 INNER JOIN T_SHOP_MAG BB
              ON BB.SHOP_ID = AA.SHOP_ID
                 LEFT OUTER JOIN T_USER_SPBK CC
              ON AA.USER_ID = CC.USER_ID
             AND AA.SHOP_ID = CC.SHOP_ID
             AND AA.ODER_USER_ID = CC.ODER_USER_ID
             AND CC.SPBK_PGRS_STAT = '02'
                 LEFT OUTER JOIN T_SHOP_CL_PROD DD
              ON DD.PROD_ID = CC.PROD_ID
                 LEFT OUTER JOIN T_USER_INFO EE
              ON EE.USER_ID = AA.USER_ID
           WHERE AA.ODER_USER_ID = ?
             AND AA.SHPR_ID = fnDecrypt(?, ?)
        ORDER BY CC.SPBK_HNDC_PROD_NM
        `;

        const [rows] = await conn.query(query, [ingOderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(result(rows));
    });
}