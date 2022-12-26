// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {createPool} from "mysql2/promise";
import {getConnectPol} from "./db";

export default async function handler(req, res) {

  await getConnectPol(async conn => {

      try {
          const [rows, fields] = await conn.query('select * from T_USER_INFO limit 10');

          res.status(200).json(rows);
      } catch (e) {
          console.log(e);
          res.status(500).json({msg: '에러에러'});
      }

      // const [rows, fields] = await conn.query('select * from T_USER_INFO limit 10');
      // console.log('rows')

  });
}
