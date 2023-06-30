import React, {useCallback, useEffect, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import Image from "next/image";
import CompDtpt from "../../components/btch/comp/compDtpt";
import BottomMenu from "../../components/bottomMenu";

export default function BtchAdj() {

    const [btchList, setBtchList] = useState({summ: {amt: 0, adjAmt: 0}});
    const [selIdx, setSelIdx] = useState(-1);
    const [oderUserId, setOderUserId] = useState(-1);
    const [searchDate, setSearchDate] = useState(null);
    const [isLastDate, setIsLastDate] = useState(true);

    /**
     * 배치 완료 리스트 조회
     */
    useEffect(() => {

        if(!!searchDate) {

            cmm.ajax({
                url: `/api/btch/btchCompList`,
                data: {
                    formDt: searchDate.formDt,
                    toDt: searchDate.toDt,
                },
                success: res => {

                    if(!!res) {

                        let date = '';
                        const compList = [];
                        let totalAdjAmt = 0, totalAmt = 0;
                        res.forEach(item => {

                            if(date !== item.ODER_DELY_CPL_DT) {

                                date = item.ODER_DELY_CPL_DT;
                                compList.push({
                                    date,
                                    cnt: 1,
                                    amt: cmm.util.getNumber(item.DELY_AMT),
                                    list: [item]
                                });
                            } else {

                                compList[compList.length - 1].cnt += 1;
                                compList[compList.length - 1].amt += cmm.util.getNumber(item.DELY_AMT);
                                compList[compList.length - 1].list.push(item);
                            }
                            // 정산된 금액
                            totalAdjAmt += (item.ODER_ADJ_YN === 'Y' ? cmm.util.getNumber(item.DELY_AMT) : 0);
                            // 정산예정 금액
                            totalAmt += (item.ODER_ADJ_YN === 'N' ? cmm.util.getNumber(item.DELY_AMT) : 0);
                        });
                        setBtchList({
                            compList,
                            summ: {
                                adjAmt: totalAdjAmt,
                                amt: totalAmt,
                                cnt: res.length,
                            }
                        });
                    }
                }
            });
        }
    }, [searchDate]);

    /**
     * 조회 일자 변경
     * @param kd
     */
    const searchDateChange = useCallback( kd => {

        // 오늘일자 보다 큰 경우 return
        if(kd === 'next' && searchDate.toDt >= cmm.date.getToday('-')) return;

        const stdDate = !!kd ? cmm.date.calDateReturnDt(searchDate.formDt, 'D', (kd === 'prev' ? -7 : 7)) : new Date();
        const weekIdx = stdDate.getDay();
        const formDt = cmm.date.calDate(stdDate, 'D', -(weekIdx > 0 ? weekIdx - 1 : 6), '-');
        const toDt = cmm.date.calDate(stdDate, 'D', 7 - (weekIdx > 0 ? weekIdx : 7), '-');
        setSearchDate({
            formDt,
            toDt,
            text: `${formDt.substring(5).replace('-', '월')}일 ~ ${toDt.substring(5).replace('-', '월')}일`
        });

        setIsLastDate(toDt >= cmm.date.getToday('-'));
    }, [searchDate]);

    useEffect(() => {

        // 조회 일자 변경
        searchDateChange();
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
                <h3>정산</h3>
            </div>
            <div className={styles.btchArea}>
                <div className={styles.searchDiv}>
                    <Image src={'/assets/images/icon/iconArrowL.svg'} alt={'이전일자'} width={24} height={24} onClick={() => searchDateChange('prev')} />
                    <span>{searchDate?.text}</span>
                    <Image className={isLastDate ? styles.noVtlz : ''} src={'/assets/images/icon/iconArrowL.svg'} alt={'다음일자'} width={24} height={24} onClick={() => searchDateChange('next')} />
                </div>
                <div className={styles.adjDiv}>
                    <h5>정산금액</h5>
                    <p>{cmm.util.comma(btchList?.summ?.adjAmt)}원</p>
                    <ul>
                        <li>
                            <label>배달완료</label>
                            <p>{btchList?.summ?.cnt}건</p>
                        </li>
                        <li>
                            <label>정산예정</label>
                            <p>{cmm.util.comma(btchList?.summ?.amt)}원</p>
                        </li>
                    </ul>
                </div>
                <div className={styles.compListDiv}>
                    <ul>
                        {btchList?.compList?.map((item, idx) =>
                            <li key={'comp' + idx} className={!!item.active ? styles.active : ''}>
                                <h5>{item.date}</h5>
                                <div className={styles.smryDiv} onClick={() => liClickHandler(idx)}>
                                    <p>{cmm.util.comma(item.amt)}원</p>
                                    <span>{item.cnt}건</span>
                                    <Image alt={'상세'} src={!!item.active ? '/assets/images/icon/iconArrowUColor.svg' : '/assets/images/icon/iconArrowL.svg'} width={24} height={24}/>
                                </div>
                                <div className={styles.dtptDiv}>
                                    <ul>
                                        {item.list.map((itemDtpt, idxDtpt) =>
                                            <li key={'compDtpt' + idxDtpt} onClick={() => setOderUserId(itemDtpt.ODER_USER_ID)}>
                                                <span>{itemDtpt.DELY_AMT}원</span>
                                                <span>{itemDtpt.SHOP_NM}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <CompDtpt id={oderUserId} onClose={() => setOderUserId(-1)} />
            <BottomMenu idx={1} />
        </div>
    );
}