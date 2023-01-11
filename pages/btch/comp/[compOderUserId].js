import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import styles from "../../../styles/btch.module.css";
import useCommon from "../../../hooks/useCommon";
import {useRouter} from "next/router";
import Head from "next/head";
import Image from "next/image";
import {Swiper, SwiperSlide} from "swiper/react";
import 'swiper/css';
import cmm from "../../../js/common";

export default function BtchComp() {

    const router = useRouter();
    const [btchInfo, setBtchInfo] = useState([]);
    const [prodList, setProdList] = useState([]);
    const [piupImgList, setPiupImgList] = useState([]);
    const [cplImgList, setCplImgList] = useState([]);
    const {goPage} = useCommon();
    const {compOderUserId} = router.query;

    useEffect(() => {

        cmm.ajax({
            url: `/api/btch/comp/${compOderUserId}`,
            success: res => {

                if(!!res && res.length > 0) {
                    const item = res[0];
                    // 배치 정보
                    setBtchInfo(item);
                    if (!!item.SPBK_ID) {

                        // 상품 리스트
                        setProdList(res);
                    }

                    if (!!item.PIUP_VCHR_IMG) {

                        // 픽업 리스트
                        setPiupImgList(item.PIUP_VCHR_IMG.split(','));
                    }
                    if (!!item.CPL_VCHR_IMG) {

                        // 완료 영수증 리스트
                        setCplImgList(item.CPL_VCHR_IMG.split(','));
                    }
                } else {

                    cmm.alert('완료된 배치가 아니거나 잘못된 주소입니다.', () => {
                        goPage('/');
                    });
                }
            }
        });
    }, [goPage, compOderUserId]);

    return (
        <div className={styles.compDtpt}>
            <Head>
                <script src="/assets/js/blueimp-gallery.min.js" defer></script>
            </Head>
            <HeadTitle title={'완료된 배치 상세'} />
            <div className={styles.content}>
                <ul className={'topTitleUl'}>
                    <li>
                        <h5>배치 페이</h5>
                        <p>{btchInfo.DELY_AMT}원</p>
                    </li>
                    <li>
                        <h5>스토어와 배송지 거리</h5>
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
                        <h5>배달 완료 시간</h5>
                        <p>{btchInfo.ODER_DELY_CPL_DT}</p>
                    </li>
                    <li>
                        <h5>고객명</h5>
                        <p>{btchInfo.ODER_ACPP_NM}</p>
                    </li>
                    <li>
                        <h5>주소</h5>
                        <p>
                            {btchInfo.USER_FULL_ADDR}
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
                            <Swiper slidesPerView={'auto'}>
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
                    {cplImgList.length > 0 &&
                        <li>
                            <h5>업로드한 사진</h5>
                            <Swiper slidesPerView={'auto'}>
                                {cplImgList.map((url, idx) => (
                                    <SwiperSlide key={'prop' + idx}>
                                        <div className={'imgZoomArea'}>
                                            <Image className={'img'} alt={'영수증 이미지'} src={url} width={278} height={278} />
                                            <Image stype={{position: 'absolute', left: 0}} className={'zoom'} onClick={() => cmm.util.showImageZoom(cplImgList, idx)}
                                                   alt={'확대 이미지'} src={'/assets/images/btn/btnZoom.svg'} width={24} height={24} />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </li>
                    }
                </ul>
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