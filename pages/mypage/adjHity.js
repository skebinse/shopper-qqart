import React, {useEffect, useRef, useState} from 'react';
import styles from "../../styles/mypage.module.css";
import HeadTitle from "../../components/headTitle";
import cmm from "../../js/common";
import {useRouter} from "next/router";
import useCommon from "../../hooks/useCommon";

export default function AdjHity() {

    const router = useRouter();
    const [tabIdx, setTabIdx] = useState(0);
    const [adjInfo, setAdjInfo] = useState({});
    const [adjList, setAdjList] = useState([[], []]);
    const [porintList, setPorintList] = useState([[], []]);
    const [totalCnt, setTotalCnt] = useState(0);
    const [isWidPopup, setIsWidPopup] = useState(false);
    const [widPoint, setWidPoint] = useState(0);
    const {goPage} = useCommon();
    const page = useRef(1);

    useEffect(() => {


        cmm.ajax({
            url: `/api/shpr/adjInfo`,
            data: {
            },
            success: res => {

                setAdjInfo(res.info);
                setAdjList([res.list.filter(item => !item.SHPR_ADJ_APV_DT), res.list.filter(item => !!item.SHPR_ADJ_APV_DT)]);
            }
        });

    }, []);

    return (
        <div className={styles.adjHity}>
            <HeadTitle title='정산 내역'/>
            <div className={styles.cont}>
                <div className={styles.adjAmt}>
                    <div>
                        <h5>총 정산금액</h5>
                        <p>{cmm.util.comma(adjInfo?.PY_AMT)}원</p>
                    </div>
                    <div>
                        {/*<h5>누적 정산금액</h5>*/}
                        {/*<p>{cmm.util.comma(adjInfo?.info?.LST_ADJ_AMT)}원</p>*/}
                    </div>
                </div>
                <hr/>
                <div className={styles.list}>
                    <div className={'tabArea'}>
                        <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')}
                                onClick={() => setTabIdx(0)}>정산진행중
                        </button>
                        <button className={'button ' + (tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>정산내역
                        </button>
                    </div>
                    {adjList[tabIdx].length === 0 &&
                        <div className={styles.noData}>
                            <img src={'/assets/images/icon/iconWarningType03.svg'}/>
                            <p>
                                {tabIdx === 0 ? '적립하신 내역이 없습니다.' : '출금하신 내역이 없습니다.'}
                            </p>
                        </div>
                    }
                    <ul>
                        {!!adjList[tabIdx] && adjList[tabIdx]?.map((item, idx) =>
                            <li key={'list' + idx}>
                                <div>
                                    {item.SHPR_ADJ_STRT_YMD} ~ {item.SHPR_ADJ_END_YMD}
                                    <p>
                                        {tabIdx === 0 &&
                                            <>
                                                신청일 : {item.SHPR_ADJ_REQ_DT}
                                                <span>
                                                    예정일 : {item.SHPR_ADJ_PAR_YMD}
                                                </span>
                                            </>
                                        }
                                        {tabIdx === 1 &&
                                            <>
                                                지급일 : {item.SHPR_ADJ_APV_DT}
                                            </>
                                        }
                                    </p>
                                </div>
                                <p>
                                    {cmm.util.comma(item.SHPR_ADJ_AMT)}
                                </p>
                            </li>
                        )}
                        {(totalCnt > (page.current - 1) * 10) &&
                            <li className={styles.more} onClick={() => callPoinRrvList()}>
                                <button type={"button"}>더보기</button>
                            </li>
                        }
                    </ul>
                </div>
            </div>
            {isWidPopup &&
                <div className={'confirmArea ' + styles.widPopup }>
                    <div>
                        <h3>출금</h3>
                        <p className={styles.txt}>
                            - 100,000P 이상부터 최대 1,000,000P 현금 출금 신청 가능<br/>
                            - 현금 출금 신청 시, 10% 수수료 공제 후 지급<br/>
                            - 회원 정보에 등록된 이름과 동일한 예금주 명의 계좌만 등록 가능<br/>
                            - 입출금 계좌만 등록 가능(정기예금, 적금, CMA와 같은 계좌는 등록 불가)
                        </p>
                        <p>
                            출금 포인트를 입력 해주세요.
                        </p>
                        <div className={styles.widCont}>
                            <div>
                                <span>포인트<em>({myInfo.SHPR_POIN}P)</em></span>
                                <input type={'tel'} value={!!widPoint ? cmm.util.comma(widPoint) : ''}
                                       onChange={e => setWidPoint(e.target.value)}/>
                            </div>
                        </div>
                        <div>
                            <button className='button white mr16' type="button"
                                    onClick={() => setIsWidPopup(false)}>취소
                            </button>
                            <button className='button' type="button" onClick={widReqHandler}>출금</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}