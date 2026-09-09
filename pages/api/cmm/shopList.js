import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {

            const query = `
                SELECT SHOP_ID
                     , SHOP_NM
                  FROM T_SHOP_MAG
                 WHERE SHOP_SHPR_EXPO_YN = 'Y'
                   AND SHOP_DEL_YN = 'N'
                   AND SHOP_EXPO_YN = 'Y'
              ORDER BY SHOP_NM
            `;

            const [rows, fields] = await conn.query(query);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
