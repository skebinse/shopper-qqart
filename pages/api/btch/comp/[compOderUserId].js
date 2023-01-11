import {getConnectPool, result} from "../../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const {compOderUserId} = req.query;
        let query = `
           SELECT EE.SHOP_ID
                 , BB.SHOP_NM
                 , AA.PROD_ID
                 , AA.SPBK_AMT
                 , AA.SPBK_DELY_DTC
                 , AA.SPBK_DELY_ACTL_DTC
                 , BB.SHOP_SBSN_STRT_HH
                 , BB.SHOP_SBSN_END_HH
                 , AA.SPBK_PGRS_STAT
                 , fnGetAtchFileList(BB.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_IMG
                 , fnGetAtchFileList(CC.PROD_RRSN_ATCH_FILE_UUID) AS PROD_IMG
                 , fnGetAtchFileList(EE.ODER_PIUP_VCHR_ATCH_FILE_UUID) AS PIUP_VCHR_IMG
                 , fnGetAtchFileList(EE.ODER_DELY_CPL_ATCH_FILE_UUID) AS CPL_VCHR_IMG
                 , AA.SPBK_CCN
                 , AA.SPBK_ID
                 , IFNULL(CC.PROD_NM, AA.SPBK_HNDC_PROD_NM) AS PROD_NM
                 , IFNULL(CC.PROD_DIS_PRICE, CC.PROD_PRICE) AS PROD_PRICE
                 , BB.SHOP_ADDR_LAT
                 , BB.SHOP_ADDR_LOT
                 , DD.USER_ADDR_LAT
                 , DD.USER_ADDR_LOT
                 , DD.USER_NCNM
                 , DD.USER_CPHONE_NO
                 , CONCAT(DD.USER_ADDR, ' ' , DD.USER_DTPT_ADDR) AS USER_FULL_ADDR
                 , fnGetCdNm(BB.SHOP_RRV_KD) AS SHOP_RRV_NM
                 , EE.ODER_USER_ID
                 , EE.ODER_ACPP_NM
                 , EE.ODER_ACPP_CPHONE_NO
                 , EE.ODER_DELY_STDO_CD
                 , EE.ODER_DELYD_ZIPC
                 , EE.ODER_DELY_ADDR
                 , EE.ODER_DELY_DTPT_ADDR
                 , EE.ODER_DELY_ADDR_LAT
                 , EE.ODER_DELY_ADDR_LOT
                 , EE.ODER_DELY_SLCT_VAL
                 , EE.ODER_DELY_REQ_MATT
                 , EE.ODER_DELY_NNME_YN
                 , EE.ODER_RRV_ID
                 , EE.USER_CARD_ID
                 , EE.ODER_DELY_YMD
                 , EE.ODER_DELY_HH
                 , EE.ODER_USER_COUP_ID_LIS
                 , EE.ODER_USE_POIN
                 , EE.ODER_LDTN_SLCT_VAL
                 , EE.ODER_DELY_DTC
                 , EE.ODER_JOIN_ENTH_PW
                 , EE.ODER_DELY_ADIX_DIS_AMT
                 , EE.ODER_KD
                 , CASE WHEN EE.ODER_MNGR_RGI_YN = 'Y'
                     THEN DATE_FORMAT(EE.ODER_REQ_YMD, '%y년 %m월 %d일 %H:%i')
                   ELSE DATE_FORMAT(DATE_ADD(EE.ODER_REQ_YMD, INTERVAL 9 HOUR), '%y년 %m월 %d일 %H:%i') END AS ODER_REQ_YMD
                 , DATE_FORMAT(DATE_ADD(EE.ODER_DELY_CPL_DT, INTERVAL 9 HOUR), '%y년 %m월 %d일 %H:%i') AS ODER_DELY_CPL_DT
                 , FORMAT(fnGetDelyDtcAmt(EE.ODER_DELY_DTC), 0) AS DELY_AMT
            FROM T_ODER_USER_INFO EE
                 INNER JOIN T_SHOP_MAG BB
              ON BB.SHOP_ID = EE.SHOP_ID
                 LEFT OUTER JOIN T_USER_SPBK AA
              ON EE.USER_ID = AA.USER_ID
             AND EE.SHOP_ID = AA.SHOP_ID
             AND AA.SPBK_PGRS_STAT = '02'
                 LEFT OUTER JOIN T_SHOP_CL_PROD CC
              ON CC.PROD_ID = AA.PROD_ID
                 LEFT OUTER JOIN T_USER_INFO DD
              ON DD.USER_ID = EE.USER_ID
           WHERE EE.ODER_USER_ID = ?
             AND EE.SHPR_ID = fnDecrypt(?, ?)
        ORDER BY AA.SPBK_HNDC_PROD_NM
        `;

        const [rows] = await conn.query(query, [compOderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(result(rows));
    });
}