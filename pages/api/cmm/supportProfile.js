import {createHmac} from "crypto";
import {getConnectPool, result} from "../db";
import {getAuthShprId} from "../../../util/authUtil";
import {hasProxyCookie} from "../../../util/proxyUtil";

/**
 * 채널톡(바스키 딜리 쇼퍼 채널) boot 용 회원 정보
 * - 사용자 정보 암호화(memberHash)가 켜진 채널이라 memberId 는 서버가 memberHash 와 함께 줄 때만 쓴다.
 *   (클라이언트가 memberId 를 정하면 다른 쇼퍼 ID 로 boot 해 그 사람의 상담 내역을 볼 수 있음)
 * - 비로그인 · 대행 · 시크릿 미설정이면 빈 값 → 익명 boot
 * - env: CHANNEL_MEMBER_SECRET (채널톡 보안 › 사용자 정보 암호화 16진수 키, 서버 전용)
 *        CHANNEL_MEMBER_PREFIX (운영 qqshopper-, 개발 dev-qqshopper- / 바스키 쇼퍼는 shopper- 라 겹치지 않게)
 */
export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {

            // 관리자 대행 중에는 쇼퍼 이름으로 상담이 열리지 않게 익명
            const shprId = hasProxyCookie(req, res) ? null : await getAuthShprId(conn, req, res, {respond: false});

            if(!shprId) {

                res.status(200).json(result({}));
                return;
            }

            const [rows] = await conn.query(`
                SELECT SHPR_NCNM
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = ?
            `, [shprId]);

            const name = !!rows[0]?.SHPR_NCNM ? `쇼퍼 ${rows[0].SHPR_NCNM}` : '';
            const secret = String(process.env.CHANNEL_MEMBER_SECRET || '').trim();

            if(!/^([0-9a-fA-F]{2})+$/.test(secret)) {

                res.status(200).json(result({name}));
                return;
            }

            const prefix = process.env.CHANNEL_MEMBER_PREFIX ?? (process.env.NEXT_PUBLIC_RUN_MODE === 'prod' ? 'qqshopper-' : 'dev-qqshopper-');
            const memberId = `${prefix}${shprId}`;
            const memberHash = createHmac('sha256', Buffer.from(secret, 'hex')).update(memberId).digest('hex');

            res.status(200).json(result({name, memberId, memberHash}));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
            console.log(e);
            res.status(200).json(result({}));
        }
    });
}
