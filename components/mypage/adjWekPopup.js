import React, {useEffect, useRef, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import Image from "next/image";

/**
 * 주별 정산 내역 팝업 (월~일, 출금만 있는 주도 한 줄, 최근 주부터 12주씩 더보기)
 * @param onClose
 */
export default function AdjWekPopup({onClose}) {

    const [wekList, setWekList] = useState(null);
    const [totalCnt, setTotalCnt] = useState(0);
    const page = useRef(1);

    /**
     * 주별 정산 내역 호출 (다음 페이지를 뒤에 붙임)
     */
    const callAdjWekList = () => {

        cmm.ajax({
            url: '/api/shpr/adjWekList',
            data: {
                page: page.current,
            },
            success: res => {

                setWekList(prevState => page.current === 1 ? res.list : [...prevState, ...res.list]);
                setTotalCnt(res.totalCnt);
                page.current++;
            }
        });
    };

    useEffect(() => {

        callAdjWekList();
    }, []);

    /**
     * 주 표시 (10.20 ~ 10.26)
     * @param item
     * @returns {string}
     */
    const getWekText = item => `${item.WEK_STRT_YMD.substring(2).replaceAll('-', '.')} ~ ${item.WEK_END_YMD.substring(5).replace('-', '.')}`;

    return (
        <div className={styles.adjWekDiv}>
            <div className={styles.titleDiv}>
                <h5>정산 내역</h5>
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={22} height={22} onClick={onClose} />
            </div>
            <p className={styles.adjWekTxt}>검수 전인 날은 금액이 확정되지 않아 포함되지 않습니다.</p>
            {!!wekList && wekList.length === 0 &&
                <p className={styles.noData}>정산 내역이 없습니다.</p>
            }
            <ul>
                {wekList?.map(item =>
                    <li key={item.WEK_STRT_YMD}>
                        <h4>
                            {getWekText(item)}
                            <span>검수 {item.CHCK_DAYS}일</span>
                        </h4>
                        <dl>
                            <dt>지급 합</dt>
                            <dd>{cmm.util.comma(item.PAY_AMT)}원</dd>
                            <dt>수수료</dt>
                            <dd>{item.FEE_AMT > 0 ? '-' : ''}{cmm.util.comma(item.FEE_AMT)}원</dd>
                            <dt>원천세</dt>
                            <dd>{item.TWH_AMT > 0 ? '-' : ''}{cmm.util.comma(item.TWH_AMT)}원</dd>
                            <dt className={styles.strong}>실지급액</dt>
                            <dd className={styles.strong}>{cmm.util.comma(item.NET_AMT)}원</dd>
                            <dt>출금</dt>
                            <dd>
                                {item.WTHD_AMT > 0 ? '-' + cmm.util.comma(item.WTHD_AMT) + '원' : '-'}
                                {!!item.WTHD_RMK &&
                                    <em>{item.WTHD_RMK}</em>
                                }
                            </dd>
                        </dl>
                    </li>
                )}
                {!!wekList && totalCnt > wekList.length &&
                    <li className={styles.more}>
                        <button type={'button'} onClick={callAdjWekList}>더보기</button>
                    </li>
                }
            </ul>
        </div>
    );
}
