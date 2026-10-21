/**
 * 이마트 매장 픽업존 안내 (www 관리자 "스토어 > 픽업존 관리" 와 같은 데이터)
 * 쇼퍼 웹(shopper.baskydeli.co.kr) src/lib/pickup-zone.server.ts 와 같은 규칙을 따른다
 */

// 섹션 순서와 라벨
export const PIUP_SECT_LIST = [
    {kd: 'ROUTE', label: '최적 동선'},
    {kd: 'PARKING', label: '주차'},
    {kd: 'SERVICE', label: '고객만족센터'},
    {kd: 'PICKUP', label: '픽업존'},
];

/**
 * 한 줄을 조각으로 나눔
 * - !! 로 먼저 나누고(주의) 그 안팎을 ** 로 나눈다(굵게)
 * - 짝이 맞지 않는 * 나 ! 는 글자 그대로 둔다
 * @param text
 * @returns {{t: string, caution?: boolean, strong?: boolean}[]}
 */
function getSpanList(text) {

    const spanList = [];
    const strongSplit = (part, caution) => {

        part.split(/(\*\*[^*]+?\*\*)/).forEach(p => {

            if(!p) {
                return;
            }

            const strong = /^\*\*[^*]+?\*\*$/.test(p);
            spanList.push({t: strong ? p.slice(2, -2) : p, caution, strong});
        });
    };

    text.split(/(!![^!]+?!!)/).forEach(p => {

        if(!p) {
            return;
        }

        if(/^!![^!]+?!!$/.test(p)) {

            strongSplit(p.slice(2, -2), true);
        } else {

            strongSplit(p, false);
        }
    });

    return spanList;
}

/**
 * GRP_TEXT 표기(www 와 합의) → 줄 목록
 * - "<주차 관련>" 꺾쇠만 있는 줄은 소제목(head) · "- " 로 시작하면 목록(item) · 그 밖은 문장(text)
 * @param text
 * @returns {{kind: string, spans: Array}[]}
 */
export function parseGrpText(text) {

    if(!text) {
        return [];
    }

    return text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {

            if(/^[<＜][^<>＜＞]*[>＞]$/.test(l)) {

                return {kind: 'head', spans: [{t: l.replace(/^[<＜]\s*|\s*[>＞]$/g, '')}]};
            }

            if(/^[-·•]\s+/.test(l)) {

                return {kind: 'item', spans: getSpanList(l.replace(/^[-·•]\s+/, ''))};
            }

            return {kind: 'text', spans: getSpanList(l)};
        });
}

/**
 * API 응답(grpList, fileList) → 섹션 목록
 * 소제목·사진·설명이 모두 없는 그룹과 알 수 없는 섹션은 뺀다
 * @param grpList
 * @param fileList
 * @returns {{kd: string, label: string, grpList: Array}[]}
 */
export function getPiupSectList(grpList = [], fileList = []) {

    const photoMap = {};
    fileList.forEach(f => {

        (photoMap[f.PIUP_ZONE_GRP_ID] = photoMap[f.PIUP_ZONE_GRP_ID] || []).push(f.URL);
    });

    return PIUP_SECT_LIST.map(sect => ({
        ...sect,
        grpList: grpList
            .filter(g => g.PIUP_SECT_KD === sect.kd)
            .map(g => ({
                title: g.GRP_TITLE || null,
                photoList: photoMap[g.PIUP_ZONE_GRP_ID] || [],
                lineList: parseGrpText(g.GRP_TEXT),
            }))
            .filter(g => !!g.title || g.photoList.length > 0 || g.lineList.length > 0),
    })).filter(sect => sect.grpList.length > 0);
}
