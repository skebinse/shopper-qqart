import React, {useEffect, useRef, useState} from 'react';
import styles from "../../styles/mypage.module.css"
import HeadTitle from "../../components/headTitle";
import cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";

export default function PoinHity() {

    const [tabIdx, setTabIdx] = useState(0);
    const [myInfo, setMyInfo] = useState({});
    const [porintList, setPorintList] = useState([[], []]);
    const [totalCnt, setTotalCnt] = useState(0);
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
            url: `/api/shpr/myInfo`,
            method: 'GET',
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

    console.log(porintList[tabIdx])
    return (
        <div className={styles.pointDiv}>
            <HeadTitle title='포인트'/>
            <div className={styles.cont}>
                <div className={styles.point}>
                    <h5>보유 포인트</h5>
                    <p>{cmm.util.comma(myInfo.SHPR_POIN)}원</p>
                </div>
                <hr/>
                <div className={styles.list}>
                    <div className={'tabArea'}>
                        <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')}
                                onClick={() => setTabIdx(0)}>적립내역
                        </button>
                        <button className={'button ' + ( tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>출금내역
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
        </div>
    );
}