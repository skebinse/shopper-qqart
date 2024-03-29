import {getConnectPool, result} from "../db";
import {uuid} from "next-s3-upload";

export default async function Upload(req, res) {

    const atchFileUuid = uuid();

    await getConnectPool(async conn => {

        const data = req.body;
        try {

            for await (const item of data) {

                // 서버 경로
                item.atchFileSrvrPath = `${process.env.S3_DOMAIN}/` + item.atchFileSrvrPath;

                await conn.query(`
                    INSERT INTO T_ATCH_FILE (
                        ATCH_FILE_UUID,	 -- 첨부파일 UUID
                        ATCH_FILE_SEQ,	 -- 첨부파일 순서
                        ATCH_FILE_ACTL_NM,	 -- 첨부파일 실제명
                        ATCH_FILE_SRVR_NM,	 -- 첨부파일 서버명
                        ATCH_FILE_SRVR_PATH,	 -- 첨부파일 서버경로
                        ATCH_FILE_ETS,	 -- 첨부파일 확장자
                        ATCH_FILE_SIZ,	 -- 첨부파일 사이즈
                        RGI_DT,	 -- 등록 일시
                        MDFC_DT -- 수정 일시
                    ) VALUES (
                        ?,
                        (SELECT COUNT(1) + 1 FROM T_ATCH_FILE AA WHERE ATCH_FILE_UUID = ?),
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW(),
                        NOW()
                    )
                `, [atchFileUuid, atchFileUuid, item.atchFileActlNm, item.atchFileSrvrNm, item.atchFileSrvrPath, item.atchFileEts, item.atchFileSiz]);
            }

            res.status(200).json(result({atchFileUuid: atchFileUuid}));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}