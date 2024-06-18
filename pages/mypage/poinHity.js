import React, {useEffect, useRef, useState} from 'react';
import styles from "../../styles/mypage.module.css"
import HeadTitle from "../../components/headTitle";
import cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";
import {useRouter} from "next/router";

export default function PoinHity() {

    const router = useRouter();
    const [tabIdx, setTabIdx] = useState(0);
    const [myInfo, setMyInfo] = useState({});
    const [porintList, setPorintList] = useState([[], []]);
    const [totalCnt, setTotalCnt] = useState(0);
    const [isWidPopup, setIsWidPopup] = useState(false);
    const [widPoint, setWidPoint] = useState(0);
    const {goPage} = useCommon();
    const page = useRef(1);

    /**
     * 포인트 적립 리스트
     * @param page
     */
    const callPoinRrvList = () => {

        cmm.ajax({
            url: `/api/shpr/pointList`,
            data: {
                page: page.current++,
                tabIdx,
            },
            success: res => {

                if(!!res.list) {

                    setTotalCnt(res.totalCnt);
                    if(page.current - 1 === 1) {

                        setPorintList(prevState => prevState.map((list, idx) => idx === tabIdx ? res.list : list));
                    } else {

                        setPorintList(prevState => prevState.map((list, idx) => idx === tabIdx ? [...list, ...res.list] : list));
                    }
                }
            }
        });
    };

    useEffect(() => {

        cmm.ajax({
            url: `/api/shpr/pointInfo`,
            success: res => {

                if(!!res) {

                    setMyInfo(res);
                } else {
                    cmm.alert('로그인 후 이용가능합니다.<br/>로그인 화면으로 이동합니다.', () => {

                        goPage('/cmm/login');
                    });
                }
            }
        });

    }, []);

    useEffect(() => {

        page.current = 1;

        // 포인트 적립 리스트
        callPoinRrvList();
    }, [tabIdx]);

    /**
     * 출금 요청
     */
    const widReqHandler = () => {

        if(cmm.util.getNumber(widPoint) < 100000) {

            cmm.alert('100,000P 이상부터 출금 가능합니다.');
        } else if(cmm.util.getNumber(widPoint) > cmm.util.getNumber(myInfo.SHPR_POIN)) {

            cmm.alert(`출금 가능 포인트는 최대 ${myInfo.SHPR_POIN}P 입니다.`);
        } else {

            cmm.confirm(`${widPoint}P를 출금 신청하시겠습니까?`, () => {

                cmm.ajax({
                    url: `/api/shpr/pointPet`,
                    data: {
                        widPoint
                    },
                    success: res => {

                        cmm.alert('신청 되었습니다.', () => {

                            router.reload();
                        });
                    }
                });
            });
        }
    }

    return (
        <div className={styles.pointDiv}>
            <HeadTitle title='포인트'/>
            <div className={styles.cont}>
                <div className={styles.point}>
                    <div>
                        <h5>보유 포인트</h5>
                        <p>{myInfo.SHPR_POIN}원</p>
                    </div>
                    {(myInfo.AC_INPT_YN === 'Y' && cmm.util.getNumber(myInfo.SHPR_POIN) >= 100000 && !myInfo.PY_DT) &&
                        <button className={'button ' + styles.widPet} onClick={() => setIsWidPopup(true)}>출금 신청</button>
                    }
                    {(myInfo.AC_INPT_YN === 'N' && !myInfo.PY_DT) &&
                        <button className={'button white ' + styles.acRgi} onClick={() => goPage('/join/info')}>계좌 등록</button>
                    }
                    {!!myInfo.PY_DT &&
                        <p>
                            <em>지급 예정일 {myInfo.PY_DT}</em>
                            <span>출금 진행중</span>
                        </p>
                    }
                </div>
                <div>
                    - 100,000P 이상부터 현금 출금 신청 가능<br/>
                    - 현금 출금 신청 시, 10% 수수료 공제 후 지급<br/>
                    - 회원 정보에 등록된 이름과 동일한 예금주 명의 계좌만 등록 가능<br/>
                    - 입출금 계좌만 등록 가능(정기예금, 적금, CMA와 같은 계좌는 등록 불가)
                </div>
                <hr/>
                <div className={styles.list}>
                    <div className={'tabArea'}>
                        <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')}
                                onClick={() => setTabIdx(0)}>적립내역
                        </button>
                        <button className={'button ' + (tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>출금내역
                        </button>
                    </div>
                    {porintList[tabIdx]?.length === 0 &&
                        <div className={styles.noData}>
                            <img src={'/assets/images/icon/iconWarningType03.svg'}/>
                            <p>
                                {tabIdx === 0 ? '적립하신 내역이 없습니다.' : '출금하신 내역이 없습니다.'}
                            </p>
                        </div>
                    }
                    <ul>
                        {!!porintList[tabIdx] && porintList[tabIdx]?.map((item, idx) =>
                            <li key={'list' + idx}>
                                <div>
                                    {item.SHPR_POIN_YMD}
                                    <p>{item.SHPR_POIN_RRV_RSN}</p>
                                </div>
                                <p>
                                    {tabIdx === 0 ? '+' : '-'}{item.SHPR_POIN_AMT}
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
                            - 100,000P 이상부터 현금 출금 신청 가능<br/>
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