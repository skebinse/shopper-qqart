import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/mag.module.css";
import cmm from "../../../js/common";
import Link from "next/link";
import BottomMenu from "../../../components/bottomMenu";
import KakaoTalkChat from "../../../components/kakaoTalkChat";

export default function Index() {
    const [tabIdx, setTabIdx] = useState(0);
    const [anncList, setAnncList] = useState([]);

    useEffect(() => {
        cmm.ajax({
            url: `/api/mag/anncs`,
            data: {
                bbadKd: tabIdx === 0 ? '공지' : '이벤트'
            },
            success: res => {

                setAnncList(res);
            }
        });
    }, [tabIdx]);

    return (
        <div className={styles.anncList}>
            <div className={styles.headTitle}>
                <h3>공지/이벤트</h3>
            </div>
            <div className={'tabArea'}>
                <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')} onClick={() => setTabIdx(0)}>공지사항</button>
                <button className={'button ' + (tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>이벤트</button>
            </div>
            <div className={styles.anncArea + ' ' +  (tabIdx === 0 ? '' : styles.ing)}>
                <List tabIdx={tabIdx} list={tabIdx === 0 ? anncList : []} noDataTxt={'등록된 공지사항이 없습니다.'}/>
                <List tabIdx={tabIdx} list={tabIdx === 1 ? anncList : []} noDataTxt={'등록된 이벤트가 없습니다.'} />
            </div>
            <KakaoTalkChat />
            <BottomMenu idx={2} />
        </div>
    );
}

function List({tabIdx, list, noDataTxt}) {

    return <ul>
        {list.length === 0 &&
            <li className={styles.noData}>{noDataTxt}</li>
        }
        {list.length > 0 && list.map((item, idx) =>
            <li key={'annc' + idx}>
                <Link href={`/mag/annc/${item.BBAD_ID}`}>
                    <h5>{item.BBAD_TITL}</h5>
                    {tabIdx === 1 &&
                        <p>{item.RGI_DT}</p>
                    }
                </Link>
            </li>
        )}
    </ul>
    ;
}