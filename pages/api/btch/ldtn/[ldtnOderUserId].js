import {getConnectPool, result} from "../../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {
            const {ldtnOderUserId} = req.query;
            let query = `
               SELECT IFNULL(AA.ODER_DRC_LDTN_AMT, 0) AS ODER_DRC_LDTN_AMT
                    , AA.ODER_DRC_LDTN_YN
                    , AA.ODER_CARD_DRC_LDTN_CPL_YN
                    , BB.SHPR_NCNM
                    , CC.SHOP_NM
                FROM T_ODER_USER_INFO AA
                     INNER JOIN T_SHPR_INFO BB
                  ON BB.SHPR_ID = AA.SHPR_ID
                     INNER JOIN T_SHOP_MAG CC
                  ON BB.SHPR_ID = AA.SHPR_ID
               WHERE AA.ODER_USER_ID = ?
            `;

            const [rows] = await conn.query(query, [ldtnOderUserId]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}