import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/mag.module.css";
import cmm from "../../../js/common";
import Link from "next/link";

export default function Index() {
    const [tabIdx, setTabIdx] = useState(0);
    const [anncList, setAnncList] = useState([]);

    /**
     * 게시판 리스트 조회
     * @param bbadKd
     */
    const callAnncList = () => {

        cmm.ajax({
            url: `/api/mag/anncs`,
            data: {
                bbadKd: tabIdx === 0 ? '공지' : '이벤트'
            },
            success: res => {

                setAnncList(res);
            }
        });
    };

    useEffect(() => {
        // 게시판 리스트 조회
        callAnncList();
    }, [tabIdx]);

    return (
        <div className={styles.anncList}>
            <HeadTitle title={'공지사항/이벤트'} />
            <div className={'tabArea'}>
                <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')} onClick={() => setTabIdx(0)}>공지사항</button>
                <button className={'button ' + (tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>이벤트</button>
            </div>
            <div className={styles.anncArea + ' ' +  (tabIdx === 0 ? '' : styles.ing)}>
                <List list={tabIdx === 0 ? anncList : []} noDataTxt={'등록된 공지사항이 없습니다.'}/>
                <List list={tabIdx === 1 ? anncList : []} noDataTxt={'등록된 이벤트가 없습니다.'} />
            </div>
        </div>
    );
}

function List({list, noDataTxt}) {

    useEffect(() => {
        console.log(list)
    }, []);

    return <ul>
        {list.length === 0 &&
            <li className={styles.noData}>{noDataTxt}</li>
        }
        {list.length > 0 && list.map((item, idx) =>
            <li key={'annc' + idx}>
                <Link href={`/mag/annc/${item.BBAD_ID}`}>
                    <h5>{item.BBAD_TITL}</h5>
                    <p>{item.RGI_DT}</p>
                </Link>
            </li>
        )}
    </ul>
    ;
}