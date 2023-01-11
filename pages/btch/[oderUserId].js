import React, {useEffect, useState} from "react";
import useCommon from "../../hooks/useCommon";
import {useRouter} from "next/router";
import HeadTitle from "../../components/headTitle";
import styles from "../../styles/btch.module.css";
import cmm from "../../js/common";
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import Head from "next/head";

export default function OderUserId(props) {

    const router = useRouter();
    const [btchInfo, setBtchInfo] = useState({});
    const [prodList, setProdList] = useState([]);
    const [piupImgList, setPiupImgList] = useState([]);
    const {goPage} = useCommon();
    const {oderUserId} = router.query;

    useEffect(() => {

        cmm.ajax({
            url: `/api/btch/${oderUserId}`,
            success: res => {

                if(!!res && res.length > 0) {

                    const item = res[0];
                    // 배치 정보
                    setBtchInfo(item);
                    if(!!item.SPBK_ID) {

                        // 상품 리스트
                        setProdList(res);
                    }

                    if(!!item.PIUP_VCHR_IMG) {

                        // 픽업 리스트
                        setPiupImgList(item.PIUP_VCHR_IMG.split(','));
                    }

                    let oderDelySlctVal;
                    switch (item.ODER_DELY_SLCT_VAL) {
                        case 'imm' : oderDelySlctVal = '즉시 배달'; break;
                        case '2Hour' : oderDelySlctVal = '2~3시간 내'; break;
                        case 'today' : oderDelySlctVal = '오늘 안에만'; break;
                        case 'resv' :
                            oderDelySlctVal = `${item.ODER_DELY_YMD + ' ' + item.ODER_DELY_HH}`;
                            break;
                    }

                    item.oderDelySlctVal = oderDelySlctVal;
                } else {

                    cmm.alert('배치가 완료된 건입니다.', () => {
                        goPage('/');
                    });
                }
            }
        });

    }, [goPage, oderUserId]);

    /**
     * 배치 수락
     */
    const btchAcpClick = () => {

        cmm.confirm('정말로 배치를 수락하시겠습니까?', () => {

            cmm.ajax({
                url: '/api/btch/btchAcp',
                data: {
                    oderUserId
                },
                success: res => {

                    cmm.alert('배치 수락이 완료되었습니다.', () => {

                        goPage('/', {
                            tabIdx: 1,
                        });
                    });
                }
            });
        }, null, '배치 수락');
    };

    return (
        <div className={styles.btchInfo}>
            <Head>
                <script src="/assets/js/blueimp-gallery.min.js" defer></script>
            </Head>
            <HeadTitle type={'close'} callbackClose={() => goPage('/')} />
            <ul className={'topTitleUl'}>
                <li>
                    <h5>서비스이용료</h5>
                    <p>{btchInfo.DELY_AMT}원</p>
                </li>
                <li>
                    <h5>스토어와 고객과의 거리</h5>
                    <p>{btchInfo.ODER_DELY_DTC}Km</p>
                </li>
                <li>
                    <h5>스토어</h5>
                    <p>{btchInfo.SHOP_NM}</p>
                </li>
                <li>
                    <h5>장보기 종류</h5>
                    <p>{btchInfo.ODER_KD === 'PIUP' ? '픽업 및 배달' : '장보기 및 배달'}</p>
                </li>
            </ul>
            <ul className={'formUl'}>
                <li>
                    <h5>주문 시간</h5>
                    <p>{btchInfo.ODER_REQ_YMD}</p>
                </li>
                <li>
                    <h5>배달 시간</h5>
                    <p>{btchInfo.oderDelySlctVal}</p>
                </li>
                <li>
                    <h5>고객명</h5>
                    <p>{btchInfo.ODER_ACPP_NM}</p>
                </li>
                <li>
                    <h5>주소</h5>
                    <p>
                        {btchInfo.USER_FULL_ADDR}
                        <Image alt={'주소 복사'} src={'/assets/images/btn/btnCopy.svg'} width={44} height={23} onClick={() => cmm.util.clipboard(btchInfo.USER_FULL_ADDR)} />
                    </p>
                </li>
                <li>
                    <h5>연락처</h5>
                    <p className={'colorGreen bold'}>{cmm.util.hyphenTel(btchInfo.ODER_ACPP_CPHONE_NO)}</p>
                </li>
                {!!btchInfo.ODER_DELY_REQ_MATT &&
                    <li>
                        <h5>주문시 요청 사항</h5>
                        <p>{btchInfo.ODER_DELY_REQ_MATT}</p>
                    </li>
                }
                {prodList.length > 0 &&
                    <li>
                        <h5>{prodList.length}개 상품</h5>
                        <ul className={'prodUl'}>
                            {prodList.map((item, key) => (
                                <li key={'prop' + key}>
                                    {!!item.PROD_IMG &&
                                        <Image alt={'상품 이미지'} src={item.PROD_IMG} width={38} height={38} />
                                    }
                                    <span className={'prodNm'}>{item.PROD_NM}</span>
                                    <span className={'prodCnt'}>{item.SPBK_CCN}</span>
                                    <span className={'prodAmt'}>{!!item.SPBK_AMT ? cmm.util.comma(item.SPBK_AMT) + '원' : '가격 미정'}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                }
                {piupImgList.length > 0 &&
                    <li>
                        <h5>상품 픽업</h5>
                        <Swiper slidesPerView={'auto'} >
                            {piupImgList.map((url, idx) => (
                                <SwiperSlide key={'prop' + idx}>
                                    <div className={'imgZoomArea'}>
                                        <Image className={'img'} alt={'영수증 이미지'} src={url} width={278} height={278} />
                                        <Image stype={{position: 'absolute', left: 0}} className={'zoom'} onClick={() => cmm.util.showImageZoom(piupImgList, idx)}
                                               alt={'확대 이미지'} src={'/assets/images/btn/btnZoom.svg'} width={24} height={24} />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </li>
                }
            </ul>
            <div className={'btnBottomArea'}>
                <button type={'button'} className={'button'} onClick={btchAcpClick}>배치 수락</button>
            </div>
            <div id="blueimp-gallery" className="blueimp-gallery blueimp-gallery-controls" aria-label="image gallery"
                 aria-modal="true" role="dialog">
                <div className="slides" aria-live="polite"></div>
                <h3 className="title"></h3>
                <a className="prev" aria-controls="blueimp-gallery" aria-label="previous slide"
                   aria-keyshortcuts="ArrowLeft"></a>
                <a className="next" aria-controls="blueimp-gallery" aria-label="next slide"
                   aria-keyshortcuts="ArrowRight"></a>
                <a className="close" aria-controls="blueimp-gallery" aria-label="close" aria-keyshortcuts="Escape"></a>
                <ol className="indicator"></ol>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}