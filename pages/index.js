import {useCallback, useEffect, useState} from "react";
import styles from "/styles/index.module.css"
import Image from "next/image";
import {useRouter} from "next/router";
import $cmm from "../js/common";
import useCommon from "../hooks/useCommon";
import BtchList from "../components/btchList";
import BottomMenu from "../components/bottomMenu";
import {useGlobal} from "../context/globalContext";
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
    const {goCheckLogin, goPage, alert, fontAjax} = useCommon();
    const {setIsLoading} = useGlobal();

    /**
     * 배치 리스트 조회
     */
    const callBtchList = useCallback(() => {

        if(!isInit) {

            setIsLoading(true);
            setTimeout(() => {

                // setBtchInfo({btchList: [], btchAcpList: []});
                fontAjax({
                    url: '/api/btch/btchList',
                    isLoaing: false,
                    success: res => {

                        setBtchInfo({btchList: res.btchList, btchAcpList: res.btchAcpList});
                    }
                });

                setIsLoading(false);
            }, 950);
        } else {

            fontAjax({
                url: '/api/btch/btchList',
                success: res => {

                    setIsInit(false);
                    setBtchInfo({btchList: res.btchList, btchAcpList: res.btchAcpList});
                }
            });
        }
    }, [fontAjax, setIsLoading, isInit]);

    useEffect(() => {

        if(!!router.query.tabIdx) {
            setTabIdx(router.query.tabIdx);
        }

        setWindowHeight(window.outerHeight);

        const call = () => {
            let shprAddr = $cmm.getLoginInfo('SHPR_ADDR');
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);

            setAddr(shprAddr);
        };

        // 로그인 체크
        goCheckLogin();

        if($cmm.date.getToday('-') !== $cmm.getLoginInfo('LOING_DT')) {

            fontAjax({
                url: '/api/login',
                data: {
                    encShprId: $cmm.getLoginInfo('ENC_SHPR_ID'),
                },
                success: res => {

                    // 가입되지 않은 계정
                    if(res.IS_LOGIN === 0) {

                        alert('로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.', function () {

                            goPage('/cmm/login');
                        });
                    } else {

                        $cmm.util.setLs($cmm.Cont.LOING_INFO, res);
                        call();
                    }
                }
            });
        } else {

            call();
        }

        // 배치 리스트 조회
        callBtchList(true);
    }, [goCheckLogin, goPage, alert, router.query.tabIdx, fontAjax, callBtchList]);


    return (
        <div className={styles.index} style={{height: windowHeight}}>
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
                <BtchList list={btchInfo.btchAcpList} href={'/btch/ing'} isInit={isInit} />
            </div>
            <div className={styles.refresh} onClick={() => callBtchList()}>
                <Image src={'/assets/images/icon/iconRefresh.svg'} alt={'새로고침'} width={18.5} height={18.5} />
                <span>새로고침</span>
            </div>
            <BottomMenu idx={0} />
        </div>
    )
}
