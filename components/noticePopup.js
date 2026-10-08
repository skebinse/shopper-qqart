import cmm from "../js/common";

// 등급별 정산 기준
const GRADE_ADJ_LIST = [
    {grade: '신규', items: ['가입 후 30일 이내', '격주 화요일 정산', '1회 최대 50만 원 정산']},
    {grade: '일반', items: ['격주 화요일 정산', '1회 최대 60만 원 정산', '고정매장 신청 가능']},
    {grade: '우수', items: ['매주 화요일 정산', '1회 최대 60만 원 정산', '고정매장 배정 시 활동 실적 우대']},
    {grade: 'VIP', items: ['매주 화요일·금요일 정산', '1회 최대 50만 원 / 주 최대 100만 원 정산', '고정매장 배정 시 최상위 활동 실적 반영']},
];

// 등급 승급 조건
const GRADE_UP_LIST = [
    {grade: '신규 → 일반', items: ['전월 10일 이상 활동', '전월 평균 주 정산 금액 30만 원 이상']},
    {grade: '일반 → 우수', items: ['전월 15일 이상 활동', '전월 평균 주 정산 금액 60만 원 이상']},
    {grade: '우수 → VIP', items: ['전월 20일 이상 활동', '전월 평균 주 정산 금액 100만 원 이상']},
];

/**
 * 공지 팝업 표시 여부 (기기당 1회)
 */
export const isNoticeShow = () => {

    try {

        return !cmm.util.getLs(cmm.Cont.NOTICE_ADJ_GRADE);
    } catch (e) {

        return false;
    }
};

export default function NoticePopup({onClose}) {

    /**
     * 확인 클릭 → 다시 표시하지 않음
     */
    const closeHandler = () => {

        try {

            cmm.util.setLs(cmm.Cont.NOTICE_ADJ_GRADE, 'Y');
        } catch (e) {}

        !!onClose && onClose();
    };

    const renderGradeList = list => list.map(item => (
        <div key={item.grade} className={'noticeGrade'}>
            <h5>{item.grade}</h5>
            <ul>
                {item.items.map(txt => <li key={txt}>{txt}</li>)}
            </ul>
        </div>
    ));

    return (
        <div className={'noticePopup'}>
            <h3>정산 등급 안내</h3>
            <div className={'noticeBody'}>
                <p>
                    안녕하세요. 퀵퀵카트 운영팀입니다.<br/>
                    새로운 정산 시스템 변경에 협조해 주신 기사님들께 진심으로 감사드립니다.
                </p>
                <p>
                    이번 정산 시스템 변경으로 인해 기존 정산 방식에서 크게 달라지는 부분은 없으나, 중간 등급인 ‘일반’ 등급의 기준을 새롭게 구분하여 운영하게 되어 안내드립니다.
                </p>
                <p>
                    기존과 비교해 큰 변경 사항은 없는 만큼, 아래 등급별 정산 기준 및 승급 조건을 확인해 주시기 바랍니다.
                </p>

                <h4>■ 등급별 정산 기준</h4>
                {renderGradeList(GRADE_ADJ_LIST)}

                <h4>■ 등급 승급 조건</h4>
                {renderGradeList(GRADE_UP_LIST)}

                <p className={'noticeRemark'}>
                    ※ 활동 및 정산 기준은 전월 1일~말일을 기준으로 적용됩니다.<br/>
                    ※ 예) 9월 활동 실적 → 10월 등급 및 혜택에 적용<br/>
                    ※ 10월 9일 12시 이후 앱에서 본인의 등급을 확인해 주시기 바랍니다.
                </p>
                <p>
                    앞으로도 기사님들께서 보다 안정적으로 활동하실 수 있도록 운영 환경을 지속적으로 개선해 나가겠습니다.
                </p>
                <p>
                    기사님들께서 보내주시는 노력과 협조에 보답할 수 있도록 많은 혜택과 다양한 프로모션을 마련할 수 있도록 최선을 다하겠습니다.
                </p>
                <p>
                    감사합니다.<br/>
                    퀵퀵카트 운영팀 드림
                </p>
            </div>
            <div className={'noticeFooter'}>
                <button className={'button'} type={'button'} onClick={closeHandler}>확인</button>
            </div>
        </div>
    );
}
