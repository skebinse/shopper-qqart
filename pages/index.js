import {useCallback, useEffect, useState} from "react";
import styles from "/styles/index.module.css"
import Image from "next/image";
import {useRouter} from "next/router";
import cmm from "../js/common";
import BtchList from "../components/btchList";
import BottomMenu from "../components/bottomMenu";
import Link from "next/link";

export default function Index(props) {

    const router = useRouter();
    const [addr, setAddr] = useState('');
    const [isInit, setIsInit] = useState(true);
    const [tabIdx, setTabIdx] = useState(0);
    const [windowHeight, setWindowHeight] = useState(0);
    const [btchInfo, setBtchInfo] = useState({
        btchList: [],
        btchAcpList: [],
    });

    /**
     * 배치 리스트 조회
     */
    const callBtchList = useCallback(isInit => {

        if(!isInit) {

            cmm.loading(true);
            setTimeout(() => {

                cmm.ajax({
                    url: '/api/btch/btchList',
                    isLoaing: false,
                    success: res => {

                        setBtchInfo({btchList: res.btchList, btchAcpList: res.btchAcpList});
                    }
                });

                cmm.loading(false);
            }, 950);
        } else {

            let dateInfo = cmm.util.getLs('dateInfo');
            dateInfo = dateInfo || {};

            cmm.ajax({
                url: '/api/btch/btchList',
                data:{
                    isLog: dateInfo.log !== cmm.date.getToday('')
                },
                success: res => {

                    dateInfo.log = cmm.date.getToday('');
                    cmm.util.setLs('dateInfo', dateInfo);

                    setBtchInfo({btchList: res.btchList, btchAcpList: res.btchAcpList});

                    // 진행중인 배치가 있을 경우
                    if(res.btchAcpList.length > 0) {
                        setTabIdx(1);
                    }
                }
            });
        }
    }, []);

    useEffect(() => {

        if(!!router.query.tabIdx) {
            setTabIdx(router.query.tabIdx);
        }

        // setWindowHeight(window.outerHeight + 10);

        if(cmm.checkLogin()) {

            let shprAddr = cmm.getLoginInfo('SHPR_ADDR');
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);

            setAddr(shprAddr);

            // 배치 리스트 조회
            callBtchList(true);
            setIsInit(false);
        }
    }, [router.query.tabIdx, callBtchList]);

    return (
        // <div className={styles.index} style={{height: windowHeight}}>
        <div className={styles.index}>
            <div className={styles.header}>
                <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={113.6} height={24.5} />
                <Link href={'/join/info'}>
                    <span>{addr}<Image alt={'열기'} src={'/assets/images/icon/iconAllowDown.svg'} width={10.4} height={6} /></span>
                </Link>
            </div>
            <div className={styles.btnArea}>
                <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')} onClick={() => setTabIdx(0)}>모든 배치 {btchInfo.btchList.length}</button>
                <button className={'button ' + (tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>진행중 배치 {btchInfo.btchAcpList.length}</button>
            </div>
            <div className={styles.btchArea + ' ' +  (tabIdx === 0 ? '' : styles.ing)}>
                <BtchList list={btchInfo.btchList} href={'/btch'} isInit={isInit} />
                <BtchList list={btchInfo.btchAcpList} href={'/btch/ing'} isInit={isInit} noDataTxt={'현재 수락한 배치가 없습니다.'} isIngBtch={true} />
            </div>
            <div className={styles.refresh} onClick={() => callBtchList()}>
                <Image src={'/assets/images/icon/iconRefresh.svg'} alt={'새로고침'} width={18.5} height={18.5} />
                <span>새로고침</span>
            </div>
            <BottomMenu idx={0} />
        </div>
    )
}
