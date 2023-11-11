import React, {useEffect} from 'react';
import styles from '../../styles/join.module.css';
import HeadTitle from '../../components/headTitle';

export default function ClauIndvInfo() {

    useEffect(() => {

        if (!!document.querySelector('#ch-plugin')) {
            document.querySelector('#ch-plugin').classList.add('d-none');
        }

        return () => {
            if (!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        };
    }, []);
    return (
        <>
            <HeadTitle title={'개인정보 수집 이용 동의'}/>
            <div className={styles.clauSvcUtlz}>
                <h1><strong> (주식회사 베리비지비) 개인정보 수집 이용 동의</strong></h1>

                (주)베리비지비는 서비스 제공을 위해 최소한의 범위 내에서 아래와 같이 개인정보를 수집 이용합니다.<br/><br/>
                (1) 회사는 서비스 제공을 위하여 아이디, 비밀번호, 이름, 생년월일, 성별, 휴대전화번호, 운행정보를 수집 이용합니다.<br/>
                (2) 서비스 이용과정에서 아래와 같은 정보들이 자동으로 생성되어 수집·저장·조합·분석될 수 있습니다.<br/>
                <ul>
                    <li>IP Address, 쿠키, 서비스 이용 기록, 기기 정보(기기고유번호, OS, 버전, 모델명) 등</li>
                </ul>
                (3) 회사는 다음의 목적을 위하여 이용자의 개인정보를 처리하고 있으며, 명시된 목적 이외의 용도로는 처리하지않습니다. 이용자의 개인정보는 계정탈퇴 시 즉시 파기합니다.<br/>
                <ul>
                    <li>이용자 식별 및 관리, 본인인증</li>
                    <li>배달 서비스 운영</li>
                    <li>서비스 개선, 신규 서비스 개발</li>
                    <li>민원처리 및 고객상담</li>
                    <li>고지사항 전달</li>
                    <li>분쟁조정을 위한 기록 보존</li>
                    <li>서비스 이용 기록 통계 및 분석</li>
                    <li>맞춤 서비스 제공</li>
                </ul>
                개인정보 수집 이용에 동의하지 않으실 수 있으며 동의하지 않는 경우 회원가입이 제한됩니다.<br/>
                그 밖의 사항은 (주)베리비지비 개인정보 처리방침에 따릅니다.<br/><br/>

                (주식회사 베리비지비) 개인정보 수집 이용 동의<br/>
                (주)베리비지비는 서비스 제공을 위해 최소한의 범위 내에서 아래와 같이 개인정보를 수집 이용합니다.

                <p><strong>1. 수집 이용 항목</strong></p>
                <ul>
                    <li>이름, 아이디, 휴대전화번호, 주소, 생년월일, 성별, CI, 운행정보, 위치정보, 계좌정보(은행명, 예금주, 계좌번호), 추천인ID</li>
                    <li>이륜차, 자동차를 이용하는 경우 : 차량번호, 운전면허정보(일련번호, 종별)</li>
                    <li>택배용 탑차, 트럭을 이용하는 경우 : 운전면허정보(일련번호, 종별)</li>
                    <li>
                        개인유상보험을 이용하는 경우 (회사가 별도로 요구할 수 있습니다)
                        <ul>
                            <li>이륜차 : 이륜자동차 사용신고필증, 자동차 보험증권(이륜자동차),(가족보험이거나 가족차량일 경우)가족관계증명서</li>
                            <li>자동차 : 자동차등록증, 자동차 보험증권, (가족보험이거나 가족차량일 경우) 가족관계증명서</li>
                        </ul>
                    </li>
                    <li>서비스 이용과정에서 아래 정보가 자동 생성되어 수집, 저장, 조합, 분석될 수 있습니다.</li>
                    <li>자동 수집 정보(생성정보) : 접속지 정보, 쿠키, 기기고유번호, 서비스 이용기록, 방문기록</li>
                    <li>외국인인 경우, 국적, 비자유형, 외국인 등록증 사본, 통장사본, 운전면허증 사본을 추가로 수집합니다.</li>
                    <li>본인의 계좌가 아닌 타인의 계좌를 등록하고자 하는 경우, 채권양도통지서(양수인의 이름, 생년월일, 주소, 연락처), 인감증명서, 신분증사본을 수집합니다.</li>
                    <li>제출한 정보의 증빙이 필요한 경우, 주민등록증 사본, 통장사본, 운전면허증 사본을 추가로 수집합니다.</li>
                    <li>운행정보와 위치정보는 주식회사 베리비지비로부터 제공받아 수집 이용합니다</li>
                </ul>

                <p><strong>2. 수집 이용 목적</strong></p>
                <ul>
                    <li>개인 식별 및 본인확인</li>
                    <li>쇼퍼 등록 및 운영</li>
                    <li>운전 자격 증명 확인</li>
                    <li>보험가입 여부 확인 및 보험 관리(보험가입, 보험료 책정, 사고접수, 사고조사 등)</li>
                    <li>배송비 지급, 정산 지급, 급여 지급, 세금신고</li>
                    <li>고지사항 전달</li>
                    <li>불법 및 부정 이용 방지</li>
                    <li>문의 및 상담</li>
                    <li>서비스 이용 기록 통계 및 분석</li>
                    <li>맞춤 서비스 제공</li>
                </ul>

                <p><strong>3. 보유 및 이용기간</strong></p>
                계약 종료 1개월 후 파기<br/>
                <ul>
                    <li>서류 심사 시 운행 불가로 판단된 경우 가입이 제한되며, 수집된 개인정보는 운행 불가 판단 시점으로부터 1개월 후 파기됩니다.</li>
                    <li>혜택 중복 방지, 불법 및 부정 이용 방지 등을 위해 CI는 계약 종료 1년 후 파기됩니다.</li>
                    <li>
                        법령 또는 계약 위반 쇼퍼 재가입 제한을 위해 CI, 법령 또는 계약 위반 이력은 아래 기간동안 보관 후 파기됩니다.
                        <ul>
                            <li>법령 위반 쇼퍼 : 영구보관</li>
                            <li>계약 위반 쇼퍼 : 계약종료 3년 후 파기</li>
                        </ul>
                    </li>
                    <li>관련 법령에 의해 보관해야 하는 의무가 있는 경우에는 해당 기간동안 보관됩니다.</li>
                </ul>
                개인정보 수집 이용에 동의하지 않으실 수 있으며 동의하지 않는 경우 배달 업무가 제한됩니다. 그 밖의 사항은 (주)베리비지비 개인정보 처리방침에 따릅니다.
            </div>
        </>
    )
}