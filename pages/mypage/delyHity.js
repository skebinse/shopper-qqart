import React, {useCallback, useEffect, useRef, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import Image from "next/image";
import CompDtpt from "../../components/btch/comp/compDtpt";
import BottomMenu from "../../components/bottomMenu";
import WeekDate from "../../components/date/WeekDate";
import KakaoTalkChat from "../../components/kakaoTalkChat";
import MonthHalfDate from "../../components/date/MonthHalfDate";

export default function BtchAdj() {

    const [btchList, setBtchList] = useState({summ: {amt: 0, adjAmt: 0}});
    const [shprGrdList, setShprGrdList] = useState([]);
    const [ohrsAdjList, setOhrsAdjList] = useState([]);
    const [oderUserId, setOderUserId] = useState(-1);
    const [searchDate, setSearchDate] = useState(null);
    const [widReqInfo, setWidReqInfo] = useState({});
    const [widDate, setWidDate] = useState(null);
    const [isWidPopup, setIsWidPopup] = useState(false);
    const [isWidBtn, setIsWidBtn] = useState(false);
    const [adjMaxAmt, setAdjMaxAmt] = useState(0);

    /**
     * 배치 완료 리스트 호출
     */
    const callBtchCompList = () => {

        cmm.ajax({
            url: `/api/btch/btchCompList`,
            data: {
                fromDt: searchDate.fromDt,
                toDt: searchDate.toDt,
            },
            success: res => {

                if(!!res) {

                    let date = '';
                    const compList = [];

                    res.compList.forEach(item => {

                        if(date !== item.ODER_DELY_CPL_DT) {

                            date = item.ODER_DELY_CPL_DT;
                            compList.push({
                                date,
                                cnt: 1,
                                amt: cmm.util.getNumber(item.ODER_DELY_AMT),
                                point: cmm.util.getNumber(item.SHPR_ADJ_POIN),
                                list: [item]
                            });
                        } else {

                            compList[compList.length - 1].cnt += 1;
                            compList[compList.length - 1].amt += cmm.util.getNumber(item.ODER_DELY_AMT);
                            compList[compList.length - 1].point += cmm.util.getNumber(item.SHPR_ADJ_POIN);
                            compList[compList.length - 1].list.push(item);
                        }
                    });

                    setBtchList({
                        compList
                    });
                }
            }
        });
    };

    /**
     * 배치 완료 리스트 조회
     */
    useEffect(() => {

        if(!!searchDate) {

            // 출금일자
            const toDate = cmm.date.parseDate(searchDate.toDt);

            let widDate;
            if(toDate.getDate() === 15) {

                toDate.setDate(1);
                widDate = cmm.date.calDate(cmm.date.calDate(toDate, 'M', 1, ''), 'D', -1, '');
            } else {

                widDate = cmm.date.calDate(toDate, 'D', 15, '');
            }
            setWidDate(widDate);

            // 출금 버튼(수 오후 6시부터 금요일 오후 6시까지)


            // 배치 완료 리스트 호출
            callBtchCompList();
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

        setBtchList(prevState => ({...prevState, compList: prevState.compList.map((item, idx) => {

                if(idx === _idx) {
                    item.active = !item.active;
                }

                return item;
            })}));
    }

    return (
        <div className={styles.btchAdjDiv}>
            <div className={styles.headTitle}>
                <h3>내역</h3>
            </div>
            <div className={styles.btchArea}>
                <MonthHalfDate onSelectDate={date => setSearchDate(date)} title={'배송일'}/>
                <div className={styles.compListDiv}>
                    <ul>
                        {btchList?.compList?.map((item, idx) =>
                            <li key={'comp' + idx} className={!!item.active ? styles.active : ''}>
                                <div className={styles.smryDiv} onClick={() => liClickHandler(idx)}>
                                    <p>
                                        {item.date}
                                    </p>
                                    <span>{item.cnt}건</span>
                                    <Image alt={'상세'}
                                           src={!!item.active ? '/assets/images/icon/iconArrowUColor.svg' : '/assets/images/icon/iconArrowL.svg'}
                                           width={24} height={24}/>
                                </div>
                                <div className={styles.dtptDiv}>
                                    <ul>
                                        {item.list.map((itemDtpt, idxDtpt) =>
                                            <li key={'compDtpt' + idxDtpt}
                                                onClick={() => setOderUserId(itemDtpt.ODER_USER_ID)}>
                                                <span>
                                                </span>
                                                <span>{itemDtpt.SHOP_NM}({itemDtpt.ODER_RPRE_NO})</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <CompDtpt id={oderUserId} onClose={() => setOderUserId(-1)} isDelyAmt={false}/>
            <KakaoTalkChat/>
            <BottomMenu idx={1}/>
        </div>
    );
}