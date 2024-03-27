import React, {useEffect, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import Image from "next/image";
import {Swiper, SwiperSlide} from "swiper/react";
import 'swiper/css';
import Head from "next/head";
import Script from "next/script";

export default function LvlInfo({isOpenLvlInfo, onClose, shprGrdCd}) {

    return (
        <div className={styles.lvlInfoDiv + ' ' + (isOpenLvlInfo ? styles.active : '')}>
            <Script src="/assets/js/blueimp-gallery.min.js" defer></Script>
            <div className={styles.titleDiv}>
                <h5>등급정보</h5>
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={22} height={22} onClick={onClose} />
            </div>
            <ul>
                <li>
                    <h4 className={styles.honey}>
                        <Image src={'/assets/images/icon/iconLvlHONEY1.svg'} alt={'허니비 L.1'} width={32} height={32}/>
                        허니비
                        {shprGrdCd === 'HONEY1' &&
                            <span>
                                현재 등급
                            </span>
                        }
                    </h4>
                    <ul>
                        <li>
                            <h3>활동일수</h3>
                            1~5일
                        </li>
                        <li>
                            <h3>주문량</h3>
                            0~100건
                        </li>
                        <li>
                            <h3>배달시작</h3>
                            60분
                        </li>
                        <li>
                            <h3>오배달</h3>
                            10건 이하
                        </li>
                        <li>
                            <h3>인센티브</h3>
                            0P
                        </li>
                        <li>
                            <h3>수수료</h3>
                            15%
                        </li>
                    </ul>
                </li>
                <li>
                    <h4 className={styles.honey}>
                        <Image src={'/assets/images/icon/iconLvlHONEY2.svg'} alt={'허니비 L.2'} width={32} height={32}/>
                        허니비
                        {shprGrdCd === 'HONEY2' &&
                            <span>
                                현재 등급
                            </span>
                        }
                    </h4>
                    <ul>
                        <li>
                            <h3>활동일수</h3>
                            6~10일
                        </li>
                        <li>
                            <h3>주문량</h3>
                            101~300건
                        </li>
                        <li>
                            <h3>배달시작</h3>
                            60분
                        </li>
                        <li>
                            <h3>오배달</h3>
                            9건 이하
                        </li>
                        <li>
                            <h3>인센티브</h3>
                            5,000P
                        </li>
                        <li>
                            <h3>수수료</h3>
                            12%
                        </li>
                    </ul>
                </li>
                <li>
                    <h4 className={styles.honey}>
                        <Image src={'/assets/images/icon/iconLvlHONEY3.svg'} alt={'허니비 L.3'} width={32} height={32}/>
                        허니비
                        {shprGrdCd === 'HONEY3' &&
                            <span>
                                현재 등급
                            </span>
                        }
                    </h4>
                    <ul>
                        <li>
                            <h3>활동일수</h3>
                            11~15일
                        </li>
                        <li>
                            <h3>주문량</h3>
                            301~600건
                        </li>
                        <li>
                            <h3>배달시작</h3>
                            60분
                        </li>
                        <li>
                            <h3>오배달</h3>
                            7건 이하
                        </li>
                        <li>
                            <h3>인센티브</h3>
                            10,000P
                        </li>
                        <li>
                            <h3>수수료</h3>
                            9%
                        </li>
                    </ul>
                </li>
                <li>
                    <h4 className={styles.honey}>
                        <Image src={'/assets/images/icon/iconLvlBUMB1.svg'} alt={'범블비 L.1'} width={32} height={32}/>
                        범블비
                        {shprGrdCd === 'BUMB1' &&
                            <span>
                                현재 등급
                            </span>
                        }
                    </h4>
                    <ul>
                        <li>
                            <h3>활동일수</h3>
                            16~20일
                        </li>
                        <li>
                            <h3>주문량</h3>
                            601~900건
                        </li>
                        <li>
                            <h3>배달시작</h3>
                            60분
                        </li>
                        <li>
                            <h3>오배달</h3>
                            5건 이하
                        </li>
                        <li>
                            <h3>인센티브</h3>
                            30,000P
                        </li>
                        <li>
                            <h3>수수료</h3>
                            7%
                        </li>
                    </ul>
                </li>
                <li>
                    <h4 className={styles.honey}>
                        <Image src={'/assets/images/icon/iconLvlBUMB2.svg'} alt={'범블비 L.2'} width={32} height={32}/>
                        범블비
                        {shprGrdCd === 'BUMB2' &&
                            <span>
                                현재 등급
                            </span>
                        }
                    </h4>
                    <ul>
                        <li>
                            <h3>활동일수</h3>
                            21일 이상
                        </li>
                        <li>
                            <h3>주문량</h3>
                            901건 이상
                        </li>
                        <li>
                            <h3>배달시작</h3>
                            60분
                        </li>
                        <li>
                            <h3>오배달</h3>
                            2건 이하
                        </li>
                        <li>
                            <h3>인센티브</h3>
                            50,000P
                        </li>
                        <li>
                            <h3>수수료</h3>
                            5%
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    );
}