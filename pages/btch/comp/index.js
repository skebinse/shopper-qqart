import React, {useEffect, useState} from 'react';
import BtchList from "../../../components/btchList";
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/btch.module.css";
import useCommon from "../../../hooks/useCommon";

export default function BtchComp() {

    const [btchList, setBtchList] = useState([]);
    const [isInit, setIsInit] = useState(true);
    const {fontAjax} = useCommon();

    useEffect(() => {

        fontAjax({
            url: `/api/btch/btchCompList`,
            success: res => {

                setIsInit(false);
                setBtchList(res);
            }
        });

        document.body.classList.add(styles.bodyBg);
        return () => {

            document.body.classList.remove(styles.bodyBg);
        };
    }, [fontAjax]);

    return (
        <div>
            <HeadTitle title={'완료된 배치'} />
            <div className={styles.btchArea}>
                <BtchList list={btchList} href={'/btch/comp'} noDataTxt={'완료된 배치가 없습니다.'} isDtptBtn={true} isInit={isInit} />
            </div>
        </div>
    );
}