import {useEffect, useState} from "react";
import Common from "../js/common";
import styles from "/styles/index.module.css"
import Image from "next/image";

export default function Index(props) {

    const $cmm = Common();
    const [addr, setAddr] = useState('');
    const [tabIdx, setTabIdx] = useState(0);
    const [btchList, setBtchList] = useState([]);
    const [ingBtchList, setIngBtchList] = useState([]);

    useEffect(() => {

        console.log('skebinse', process.env.NEXT_PUBLIC_RUN_MODE);
        const call = () => {

            let shprAddr = $cmm.getLoginInfo('SHPR_ADDR');
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);

            setAddr(shprAddr);
        };

        if($cmm.checkLogin(true)) {

            if($cmm.date.getToday('') !== $cmm.getLoginInfo('LOING_DT')) {

                $cmm.ajax({
                    url: '/api/login',
                    data: {
                        shprCrctno: $cmm.getLoginInfo('SHPR_CRCTNO'),
                    },
                    success: res => {

                        // 가입되지 않은 계정
                        if(res.IS_LOGIN === 0) {

                            $cmm.alert('로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.', function () {
                                router.push('/cmm/login');
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
        }

        $cmm.ajax({
            url: '/api/oder/btchList',
            success: res => {

                setBtchList(res);
            }
        });
    }, [$cmm]);

    return (
        <>
            <div className={styles.header}>
                <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={113.6} height={24.5} />
                <span>{addr}<Image alt={'열기'} src={'/assets/images/icon/iconDel.svg'} width={10.4} height={6} /></span>
            </div>
            <div className={styles.btnArea}>
                <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')}>모든 배치 {btchList.length}</button>
                <button className={'button ' + (tabIdx === 0 ? 'white' : '')}>진행중 배치 {ingBtchList.length}</button>
            </div>
            {tabIdx === 0 &&
                <ul className={'btch'}>
                    {btchList.map((item, idx) => (
                        <li key={'btch' + idx}>
                            <div className={'priceArea'}>
                                <p>{item.DELY_AMT}원</p>
                                <Image alt={'상점 이미지'} src={item.SHOP_RRSN_ATCH_FILE_LIST} width={40} height={40} />
                            </div>
                            <div className={'delyArea'}>
                                <Image alt={'배달거리 이미지'} src={'/assets/images/icon/iconDistance.svg'} width={24} height={14.8} />
                                <span>{item.SLIN_DTC}Km</span>
                                <Image alt={'상품 이미지'} src={'/assets/images/icon/iconProduct.svg'} width={17} height={18.4} />
                                <span>{item.PROD_CNT === 0 ? '픽업' : item.PROD_CNT + '개 상품'}</span>
                            </div>
                            <h5>{item.SHOP_NM}</h5>
                            <p>{item.SHOP_FULL_ADDR}</p>
                        </li>
                    ))}
                </ul>
            }
            {tabIdx === 1 &&
                <ul className={'btch'}>
                    {ingBtchList.map((item, idx) => (
                        <li key={'ingBtch' + idx}>
                            <div className={'priceArea'}>
                                <p>{item.DELY_AMT}원</p>
                                <Image alt={'상점 이미지'} src={item.SHOP_RRSN_ATCH_FILE_LIST} width={40} height={40} />
                            </div>
                            <div className={'delyArea'}>
                                <Image alt={'배달거리 이미지'} src={'/assets/images/icon/iconDistance.svg'} width={24} height={14.8} />
                                <span>{item.SLIN_DTC}Km</span>
                                <Image alt={'상품 이미지'} src={'/assets/images/icon/iconProduct.svg'} width={17} height={18.4} />
                                <span>{item.PROD_CNT === 0 ? '픽업' : item.PROD_CNT + '개 상품'}</span>
                            </div>
                            <h5>{item.SHOP_NM}</h5>
                            <p>{item.SHOP_FULL_ADDR}</p>
                        </li>
                    ))}
                </ul>
            }
        </>
    )
}
