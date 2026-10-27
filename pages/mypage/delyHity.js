import React, {useEffect, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import Image from "next/image";
import CompDtpt from "../../components/btch/comp/compDtpt";
import BottomMenu from "../../components/bottomMenu";
import KakaoTalkChat from "../../components/kakaoTalkChat";
import WeekDate from "../../components/date/WeekDate";
import AdjWekPopup from "../../components/mypage/adjWekPopup";

const WEEK_NM = ['일', '월', '화', '수', '목', '금', '토'];

export default function DelyHity() {

    const [dayList, setDayList] = useState([]);
    const [remAmt, setRemAmt] = useState(null);
    const [oderUserId, setOderUserId] = useState(-1);
    const [searchDate, setSearchDate] = useState(null);
    const [isAdjWekPopup, setIsAdjWekPopup] = useState(false);

    /**
     * 배송 내역 호출 (일자별 배송 · 검수 · 기타 정산)
     */
    const callDelyHity = () => {

        cmm.ajax({
            url: `/api/shpr/delyHity`,
            data: {
                fromDt: searchDate.fromDt,
                toDt: searchDate.toDt,
            },
            success: res => {

                const dayMap = {};
                const getDay = ymd => {

                    if(!dayMap[ymd]) {

                        dayMap[ymd] = {ymd, cnt: 0, amt: 0, list: [], ohrsAdjList: [], chck: null};
                    }

                    return dayMap[ymd];
                };

                res.delyList.forEach(item => {

                    const day = getDay(item.DELY_YMD);
                    day.cnt += 1;
                    day.amt += cmm.util.getNumber(item.ODER_DELY_AMT);
                    day.list.push(item);
                });

                res.ohrsAdjList.forEach(item => getDay(item.YMD).ohrsAdjList.push(item));
                res.chckList.forEach(item => getDay(item.YMD).chck = item);

                setDayList(Object.values(dayMap).sort((a, b) => a.ymd < b.ymd ? 1 : -1));
                setRemAmt(res.remAmt);
            }
        });
    };

    /**
     * 배송 내역 조회
     */
    useEffect(() => {

        if(!!searchDate) {

            callDelyHity();
        }
    }, [searchDate]);

    useEffect(() => {

        document.body.classList.add(styles.bodyBg);
        return () => {

            document.body.classList.remove(styles.bodyBg);
        };
    }, []);

    /**
     * 상세 열기
     * @param _idx
     */
    const liClickHandler = _idx => {

        setDayList(prevState => prevState.map((item, idx) => idx === _idx ? {...item, active: !item.active} : item));
    };

    /**
     * 일자 표시 (10월 22일 (수))
     * @param ymd
     * @returns {string}
     */
    const getDayText = ymd => {

        const date = cmm.date.parseDate(ymd);

        return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEK_NM[date.getDay()]})`;
    };

    return (
        <div className={styles.btchAdjDiv}>
            <div className={styles.headTitle}>
                <h3>내역</h3>
            </div>
            <div className={styles.remAdjDiv}>
                <div>
                    <h5>총 남은 정산 금액</h5>
                    <p className={remAmt < 0 ? styles.minus : ''}>{remAmt === null ? '-' : cmm.util.comma(remAmt) + '원'}</p>
                </div>
                <button type={'button'} className={'button short'} onClick={() => setIsAdjWekPopup(true)}>정산 내역</button>
            </div>
            <div className={styles.btchArea}>
                <WeekDate onSelectDate={date => setSearchDate(date)} title={'배송일'}/>
                <div className={styles.compListDiv}>
                    {dayList.length === 0 &&
                        <p className={styles.noData}>배송 내역이 없습니다.</p>
                    }
                    <ul>
                        {dayList.map((item, idx) =>
                            <li key={item.ymd} className={!!item.active ? styles.active : ''}>
                                <div className={styles.smryDiv} onClick={() => liClickHandler(idx)}>
                                    <p>
                                        {getDayText(item.ymd)}
                                        {!!item.chck &&
                                            <em className={styles.chckY}>검수 완료</em>
                                        }
                                    </p>
                                    <span>{item.cnt}건 · {cmm.util.comma(item.amt)}원</span>
                                    <Image alt={'상세'}
                                           src={!!item.active ? '/assets/images/icon/iconArrowUColor.svg' : '/assets/images/icon/iconArrowL.svg'}
                                           width={24} height={24}/>
                                </div>
                                <div className={styles.dtptDiv}>
                                    <ul>
                                        {item.list.map(itemDtpt =>
                                            <li key={'compDtpt' + itemDtpt.ODER_USER_ID}
                                                onClick={() => setOderUserId(itemDtpt.ODER_USER_ID)}>
                                                <span>{itemDtpt.SHOP_NM}({itemDtpt.ODER_RPRE_NO})</span>
                                                <span>{cmm.util.comma(itemDtpt.ODER_DELY_AMT)}원</span>
                                            </li>
                                        )}
                                        {item.ohrsAdjList.map((ohrsAdj, ohrsIdx) =>
                                            <li key={'ohrsAdj' + ohrsIdx} className={styles.ohrsAdj}>
                                                <span>
                                                    <em>기타 정산</em> {ohrsAdj.SHPR_OHRS_ADJ_NM}
                                                </span>
                                                <span className={ohrsAdj.SHPR_OHRS_ADJ_AMT < 0 ? styles.minus : ''}>{cmm.util.comma(ohrsAdj.SHPR_OHRS_ADJ_AMT)}원</span>
                                            </li>
                                        )}
                                    </ul>
                                    {!!item.chck &&
                                        <p className={styles.chckInfo}>
                                            {item.chck.CHCK_DT} 검수 완료 · 지급 {cmm.util.comma(item.chck.PAY_AMT)}원
                                        </p>
                                    }
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <CompDtpt id={oderUserId} onClose={() => setOderUserId(-1)} isDelyAmt={false}/>
            {isAdjWekPopup &&
                <AdjWekPopup onClose={() => setIsAdjWekPopup(false)}/>
            }
            <KakaoTalkChat/>
            <BottomMenu idx={1}/>
        </div>
    );
}
