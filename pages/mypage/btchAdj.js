import React, {useCallback, useEffect, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import Image from "next/image";
import CompDtpt from "../../components/btch/comp/compDtpt";
import BottomMenu from "../../components/bottomMenu";
import WeekDate from "../../components/date/WeekDate";
import KakaoTalkChat from "../../components/kakaoTalkChat";

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

                    // 월별 수수료
                    const mthlCmss = [];
                    res.shprGrdList.forEach(item => {
                        item.cmssAmt = 0;
                        mthlCmss.push(item.SHPR_GRD_YM.slice(-2));
                        setIsWidBtn(item.IS_WID === 'Y');
                    });

                    let date = '';
                    const compList = [];
                    let totalAdjAmt = 0, totalAmt = 0, totalPoint = 0;
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

                        // 수수료가 있을 경우
                        const shprGrdIdx = mthlCmss.indexOf(date.substring(0, 2));

                        if(shprGrdIdx > -1) {

                            // 수수료
                            const cmssAmt= item.ODER_DELY_AMT * res.shprGrdList[shprGrdIdx].SHPR_GRD_CMSS_RATE / 100;
                            // 수수료 금액 합계
                            res.shprGrdList[shprGrdIdx].cmssAmt += cmssAmt;
                        }
                        // 정산된 금액
                        totalAdjAmt += item.ODER_DELY_AMT;
                        // 정산예정 금액
                        totalAmt += (item.ODER_ADJ_YN === 'N' ? cmm.util.getNumber(item.ODER_DELY_AMT) : 0);
                        // 포인트
                        totalPoint += cmm.util.getNumber(item.SHPR_ADJ_POIN);
                    });

                    // 쇼퍼 등급 리스트
                    setShprGrdList(res.shprGrdList);

                    // 출금요청 정보
                    setWidReqInfo(res.widReqInfo);

                    // 원천세 제외 정산금액
                    let totalAdjAmtEcpt = 0;
                    // 기타 정산 리스트
                    setOhrsAdjList(res.ohrsAdjList);
                    res.ohrsAdjList.forEach(item => {
                        totalAdjAmt += item.SHPR_OHRS_ADJ_AMT;

                        // 수수료 계산
                        if(item.SHPR_OHRS_ADJ_CMSS_YN === 'Y') {

                            // 수수료가 있을 경우
                            const shprGrdIdx = mthlCmss.indexOf(item.SHPR_OHRS_ADJ_MM);
                            // 수수료 금액 합계
                            res.shprGrdList[shprGrdIdx].cmssAmt += item.SHPR_OHRS_ADJ_AMT * res.shprGrdList[shprGrdIdx].SHPR_GRD_CMSS_RATE / 100;
                        }

                        // 원천세 제외
                        if(item.SHPR_OHRS_ADJ_TWH_YN === 'N') {

                            totalAdjAmtEcpt += item.SHPR_OHRS_ADJ_AMT;
                        }
                    });

                    // 전체 수수료 계산
                    let totalCmssAmt = 0;
                    res.shprGrdList.map(item => {

                        item.cmssAmt = Math.floor(item.cmssAmt / 10) * 10;
                        totalCmssAmt += item.cmssAmt;

                        return item;
                    });

                    // 정산예정 - 전체 수수료
                    totalAdjAmt -= totalCmssAmt;
                    // 원천세
                    const srTax = Math.floor((totalAdjAmt - totalAdjAmtEcpt) * 0.033 / 10) * 10;

                    setBtchList({
                        compList,
                        summ: {
                            adjAmt: totalAdjAmt - srTax,
                            amt: totalAmt,
                            point: totalPoint,
                            srTax: srTax,
                            cnt: res.compList.length,
                        }
                    });
                }
            }
        });
    };

    /**
     * 배치 완료 리스트 조회
     */
    useEffect(() => {

        // 업체 쇼퍼일 경우
        if(cmm.getLoginInfo('SHPR_GRD_CD') === 'ETPS') {
            setBtchList({});
            return;
        }

        if(!!searchDate) {

            // 출금일자
            const toDate = cmm.date.parseDate(searchDate.toDt);
            const widDate = cmm.date.calDate(toDate, 'D', 11 - toDate.getDay(), '');
            setWidDate(`${widDate.substring(4, 6)}월 ${widDate.substring(6)}일`);

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

    /**
     * 출금 요청
     */
    const widReqHandler = () => {

        if(btchList?.summ?.adjAmt === 0) {

            cmm.alert('정산금액이 없습니다.')
        } else {

            cmm.ajax({
                url: `/api/btch/btchAdjPet`,
                data: {
                    fromDt: searchDate.fromDt,
                    toDt: searchDate.toDt,
                    adjAmt: btchList?.summ?.adjAmt,
                },
                success: res => {

                    setIsWidPopup(false);
                    // 배치 완료 리스트 호출
                    callBtchCompList();
                }
            });
        }
    };

    return (
        <div className={styles.btchAdjDiv}>
            <div className={styles.headTitle}>
                <h3>정산</h3>
            </div>
            <div className={styles.btchArea}>
                <WeekDate onSelectDate={date => setSearchDate(date)}/>
                <div className={styles.adjDiv}>
                    {(isWidBtn && shprGrdList.length > 0 && !!widReqInfo.SHPR_ADJ_CHCK_YMD && !widReqInfo.SHPR_ADJ_REQ_DT && btchList?.summ?.adjAmt > 0) &&
                        <>
                            <h5>정산금액</h5>
                            <p>0원</p>
                            <button onClick={() => setIsWidPopup(true)} className={'button'} type={'button'}>출금하기
                            </button>
                        </>
                    }
                    {(!!widReqInfo.SHPR_ADJ_CHCK_YMD && !!widReqInfo.SHPR_ADJ_REQ_DT && !widReqInfo.SHPR_ADJ_APV_DT) &&
                        <>
                            <h5>정산금액</h5>
                            <p>0원</p>
                            <span className={styles.adjIng}>정산 진행중</span>
                        </>
                    }
                    {(!!widReqInfo.SHPR_ADJ_CHCK_YMD && !!widReqInfo.SHPR_ADJ_APV_DT) &&
                        <>
                            <h5>정산금액</h5>
                            <p>{cmm.util.comma(widReqInfo.SHPR_ADJ_AMT)}원</p>
                            <span className={styles.adj}>정산완료</span>
                        </>
                    }
                    <ul>
                        <li>
                            <label>배달완료({btchList?.summ?.cnt}건)</label>
                            <p>{cmm.util.comma(btchList?.summ?.amt)}원</p>
                        </li>
                        {ohrsAdjList.map((item, idx) =>
                            <li key={'ohrsAdj' + idx}>
                                <label>{item.SHPR_OHRS_ADJ_NM}</label>
                                <p>{cmm.util.comma(item.SHPR_OHRS_ADJ_AMT)}원</p>
                            </li>
                        )}
                        {shprGrdList.map((item, idx) =>
                            <li key={'shprGrd' + idx}>
                                <label>{item.SHPR_GRD_YM.slice(-2)}월 수수료({item.SHPR_GRD_CMSS_RATE}%)</label>
                                <p>{item.cmssAmt === 0 ? '' : '-'}{cmm.util.comma(item.cmssAmt)}원</p>
                            </li>
                        )}
                        {shprGrdList.length > 0 &&
                            <li>
                                <label>원천세(3.3%)</label>
                                <p>{btchList?.summ?.srTax === 0 ? '' : '-'}{cmm.util.comma(btchList?.summ?.srTax)}원</p>
                            </li>
                        }
                        <li>
                            <label>정산예정</label>
                            <p>{cmm.util.comma(btchList?.summ?.adjAmt)}원</p>
                        </li>
                        {!!btchList?.summ?.point &&
                            <li>
                                <label>포인트</label>
                                <p>{cmm.util.comma(btchList?.summ?.point)}P</p>
                            </li>
                        }
                    </ul>
                </div>
                <div className={styles.compListDiv}>
                    <ul>
                        {btchList?.compList?.map((item, idx) =>
                            <li key={'comp' + idx} className={!!item.active ? styles.active : ''}>
                                <h5>{item.date}</h5>
                                <div className={styles.smryDiv} onClick={() => liClickHandler(idx)}>
                                    <p>
                                        {cmm.util.comma(item.amt)}원
                                        {!!item.point &&
                                            <em> +{cmm.util.comma(item.point)}P</em>
                                        }
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
                                                    {cmm.util.comma(itemDtpt.ODER_DELY_AMT)}원
                                                    {!!itemDtpt.SHPR_ADJ_POIN &&
                                                        <em> +{cmm.util.comma(itemDtpt.SHPR_ADJ_POIN)}P</em>
                                                    }
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
            <CompDtpt id={oderUserId} onClose={() => setOderUserId(-1)}/>
            <KakaoTalkChat/>
            <BottomMenu idx={1}/>
            {isWidPopup &&
                <div className="confirmArea">
                    <div>
                        <h3>출금</h3>
                        <p>아래 내용으로 출금 신청 하시겠습니까?</p>
                        <div className={styles.widCont}>
                            <div>
                                <span>정산금액</span>
                                <p>{cmm.util.comma(btchList?.summ?.adjAmt)}원</p>
                            </div>
                            <div>
                                <span>출금일</span>
                                <p>영업일 5~10일</p>
                                {/*<p>{widDate}</p>*/}
                            </div>
                        </div>
                        <div>
                            <button className='button white mr16' type="button" onClick={() => setIsWidPopup(false)}>취소</button>
                            <button className='button' type="button" onClick={widReqHandler}>출금</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}