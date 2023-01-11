import React, {useEffect, useState} from 'react';
import BtchList from "../../../components/btchList";
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/btch.module.css";
import useCommon from "../../../hooks/useCommon";
import cmm from "../../../js/common";

export default function BtchComp() {

    const [btchList, setBtchList] = useState([]);
    const [isInit, setIsInit] = useState(true);

    useEffect(() => {

        cmm.ajax({
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
    }, []);

    return (
        <div>
            <HeadTitle title={'완료된 배치'} />
            <div className={styles.btchArea}>
                <BtchList list={btchList} href={'/btch/comp'} noDataTxt={'완료된 배치가 없습니다.'} isDtptBtn={true} isInit={isInit} />
            </div>
        </div>
    );
}