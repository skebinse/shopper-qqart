import React, {useEffect, useRef, useState} from "react";
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
    const loginInfo = useRef({});
    const {goPage} = useCommon();
    const {oderUserId} = router.query;

    useEffect(() => {

        loginInfo.current = cmm.getLoginInfo();
    }, []);

    useEffect(() => {

        cmm.ajax({
            url: `/api/btch/${oderUserId}`,
            success: res => {
                console.log(res)
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

                    cmm.alert('배치가 취소됐거나 이미 완료된 건입니다.', () => {
                        goPage('/');
                    });
                }
            }
        });

    }, [goPage, oderUserId]);

    /**
     * 쇼퍼와의 거리 계산
     */
    const getShprDtcCal = (item, callback) => {

        // 쇼퍼 현재 위치
        const shprPsPsitInfo = cmm.util.getLs(cmm.Cont.SHPR_PS_PSIT);
        const param = {
            directionOption: 1,
            endX: item.SHOP_ADDR_LAT,
            endY: item.SHOP_ADDR_LOT,
            reqCoordType: 'WGS84GEO',
            startX: shprPsPsitInfo.shprPsitLat,
            startY: shprPsPsitInfo.shprPsitLot,
            resCoordType: 'WGS84GEO',
        };

        if(!!shprPsPsitInfo) {

            cmm.loading(true);
            cmm.ajax({
                url: 'https://apis.openapi.sk.com/tmap/routes?version=1&callback=function',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    appKey: process.env.NEXT_PUBLIC_TMAP_KEY
                },
                isExtr: true,
                data: param,
                success: res => {

                    cmm.loading(false);

                    const disItem = res.features[0].properties;
                    callback({...shprPsPsitInfo, oderPiupFrcsMi: Math.ceil(disItem.totalTime / 60) + 5});
                },
            });
        } else {

            // DB에 로그 남기기
            cmm.insDbLog('배치수락 예상시간', 'shprPsPsitInfo is null');
            callback({shprPsitLat: '', shprPsitLot: '', oderPiupFrcsMi: 30});
        }
    };

    /**
     * 배치 수락
     */
    const btchAcpClick = () => {

        // 쇼퍼와의 거리 계산
        getShprDtcCal(btchInfo, res => {

            cmm.confirm(`${btchInfo.SHOP_NM} 매장까지 
                        픽업예상 <span style="color: #02B763;font-weight: 700">"${res.oderPiupFrcsMi}분"</span>으로 확인됩니다.
                        
                        매장은 쇼퍼님을 기다리고 있으니 
                        빠르게 이동해 주세요.`, () => {

                cmm.ajax({
                    url: '/api/btch/btchAcp',
                    data: {
                        ...res,
                        oderUserId: btchInfo.ODER_USER_ID,
                    },
                    success: res => {

                        cmm.alert('배치 수락이 완료되었습니다.', () => {

                            goPage('/', {
                                tabIdx: 1,
                            });
                        });
                    }, error: res => {

                        if(res.resultMsg) {

                            cmm.alert(res.resultMsg, null, '실패');
                        }
                    },
                });
            }, null, '배치 수락');
        });
    };

    return (
        <div className={styles.btchInfo}>
            <Head>
                <script src="/assets/js/blueimp-gallery.min.js" defer></script>
            </Head>
            <HeadTitle type={'close'} callbackClose={() => goPage('/')} />
            <ul className={'topTitleUl'}>
                {loginInfo.current.SHPR_GRD_CD !== 'ETPS' &&
                    <li>
                        <h5>서비스이용료</h5>
                        <p>{btchInfo.DELY_AMT}원</p>
                        {btchInfo.SHPR_ADJ_POIN > 0 &&
                            <span className={styles.amt}>+{cmm.util.comma(btchInfo.SHPR_ADJ_POIN)}P</span>
                        }
                    </li>
                }
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
                {btchInfo.ODER_DRC_LDTN_YN === 'N' &&
                    <li>
                        <h5>결제</h5>
                        {btchInfo.ODER_DRC_LDTN_AMT === 0 &&
                            <p style={{color: '#F4997A'}}>카드 단말기 필요</p>
                        }
                        {btchInfo.ODER_DRC_LDTN_AMT > 0 &&
                            <p style={{color: '#02B763'}}>직접 결제</p>
                        }
                    </li>
                }
                <li>
                    <h5>주문 시간</h5>
                    <p>{btchInfo.ODER_REQ_YMD}</p>
                </li>
                <li>
                    <h5>배달 시간</h5>
                    <p>{btchInfo.oderDelySlctVal}</p>
                </li>
                {!!btchInfo.ODER_DELY_ARTG &&
                    <li>
                        <h5>배달 물품</h5>
                        <p>{btchInfo.ODER_DELY_ARTG}</p>
                    </li>
                }
                {!!btchInfo.ODER_DELY_MENS &&
                    <li>
                        <h5>배달 수단</h5>
                        <p>{btchInfo.ODER_DELY_MENS}</p>
                    </li>
                }
                <li>
                    <h5>스토어 주소</h5>
                    <p>
                        {btchInfo.SHOP_FULL_ADDR}
                        <Image alt={'주소 복사'} src={'/assets/images/btn/btnCopy.svg'} width={44} height={23} onClick={() => cmm.util.clipboard(btchInfo.SHOP_FULL_ADDR)} />
                    </p>
                    <ul className={'naviLinkUl d-none'}>
                        <li>
                            <a href={`kakaomap://route?ep=${btchInfo.SHOP_ADDR_LOT},${btchInfo.SHOP_ADDR_LAT}&by=CAR`} >
                                <Image alt={'카카오맵'} src={'/assets/images/icon/iconKakaonavi.svg'} width={24} height={24} />
                                카카오맵 연결하기
                            </a>
                        </li>
                        <li>
                            <a href={`tmap://route?goalname=${btchInfo.SHOP_NM}&goaly=${btchInfo.SHOP_ADDR_LOT}&goalx=${btchInfo.SHOP_ADDR_LAT}`} >
                                <Image alt={'티맵'} src={'/assets/images/icon/iconTmap.png'} width={24} height={24} />
                                티맵 연결하기
                            </a>
                        </li>
                        <li>
                            <a href={`nmap://route/car?dlat=${btchInfo.SHOP_ADDR_LOT}&dlng=${btchInfo.SHOP_ADDR_LAT}&dname=${btchInfo.SHOP_NM}`} >
                                <Image alt={'네이버지도'} src={'/assets/images/icon/iconNavermap.png'} width={24} height={24} />
                                네이버지도 연결하기
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <h5>고객 주소</h5>
                    <p>
                        {btchInfo.ODER_DELY_ADDR}
                        <Image alt={'주소 복사'} src={'/assets/images/btn/btnCopy.svg'} width={44} height={23}
                               onClick={() => cmm.util.clipboard(btchInfo.ODER_DELY_ADDR)}/>
                    </p>
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
                                        <img className={'img'} alt={'영수증 이미지'} src={url} />
                                        <Image className={'zoom'} onClick={() => cmm.util.showImageZoom(piupImgList, idx)}
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