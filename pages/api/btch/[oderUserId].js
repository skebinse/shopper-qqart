import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const {oderUserId} = req.query;
        const encShprId = getCookie('enc_sh', {req, res});
        
        try {
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
                     , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
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
                     , DATE_FORMAT(EE.ODER_DELY_YMD, '%y년 %m월 %d일') AS ODER_DELY_YMD
                     , EE.ODER_DELY_HH
                     , EE.ODER_USER_COUP_ID_LIS
                     , EE.ODER_USE_POIN
                     , EE.ODER_LDTN_SLCT_VAL
                     , EE.ODER_DELY_DTC
                     , EE.ODER_JOIN_ENTH_PW
                     , EE.ODER_DELY_ADIX_DIS_AMT
                     , EE.ODER_KD
                     , EE.ODER_SHPR_TIP_AMT
                     , EE.ODER_DRC_LDTN_YN
                     , EE.ODER_URG_DELY_MI
                     , EE.ODER_DELY_MENS
                     , EE.ODER_DELY_ARTG
                     , fnGetPromPoin(EE.SHOP_ID, fnDecrypt(?, ?)) AS SHPR_ADJ_POIN
                     , IFNULL(EE.ODER_DRC_LDTN_AMT, 0) AS ODER_DRC_LDTN_AMT
                     , FORMAT(fnGetShprDelyDtcAmt(EE.ODER_USER_ID, fnDecrypt(?, ?), EE.ODER_DELY_DTC) + EE.ODER_SHPR_TIP_AMT, 0) AS DELY_AMT
                     , DATE_FORMAT(fnGetOderReqYmd(EE.ODER_MNGR_RGI_YN, EE.ODER_REQ_YMD), '%y년 %m월 %d일 %H:%i') AS ODER_REQ_YMD
                     , CASE WHEN EE.ODER_URG_DELY_MI != '' THEN 
                        EE.ODER_URG_DELY_MI - TIMESTAMPDIFF(MINUTE, fnGetOderReqYmd(EE.ODER_MNGR_RGI_YN, EE.ODER_REQ_YMD), DATE_ADD(NOW(), INTERVAL 9 HOUR))
                       ELSE '' END AS BTCH_RGI_PGRS_MI
                FROM T_ODER_USER_INFO EE
                     INNER JOIN T_SHOP_MAG BB
                  ON BB.SHOP_ID = EE.SHOP_ID
                     LEFT OUTER JOIN T_USER_SPBK AA
                  ON EE.USER_ID = AA.USER_ID
                 AND EE.SHOP_ID = AA.SHOP_ID
                 AND EE.ODER_USER_ID = AA.ODER_USER_ID
                 AND AA.SPBK_PGRS_STAT = '02'
                     LEFT OUTER JOIN T_SHOP_CL_PROD CC
                  ON CC.PROD_ID = AA.PROD_ID
                     LEFT OUTER JOIN T_USER_INFO DD
                  ON DD.USER_ID = EE.USER_ID
               WHERE EE.ODER_USER_ID = ?
                 AND EE.SHPR_ID IS NULL
                 AND EE.ODER_PGRS_STAT = '02'
            ORDER BY AA.SPBK_HNDC_PROD_NM
            `;

            const [rows] = await conn.query(query, [encShprId, process.env.ENC_KEY, encShprId, process.env.ENC_KEY, oderUserId]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);

            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}