import React, {useEffect, useState} from 'react';
import cmm from "../../../js/common";
import styles from "../../../styles/btch.module.css";
import Image from "next/image";
import {Swiper, SwiperSlide} from "swiper/react";
import 'swiper/css';
import Script from "next/script";

export default function CompDtpt({id, onClose, isDelyAmt = true}) {

    const [dtptInfo, setDtptInfo] = useState({});
    const [dtptInfoImg, setDtptInfoImg] = useState([]);

    useEffect(() => {

        if(id > -1) {

            cmm.ajax({
                url: `/api/btch/comp/${id}`,
                success: res => {

                    if(!!res && res.length > 0) {

                        setDtptInfo(res[0]);

                        let imgList = [];
                        if (!!res[0].PIUP_VCHR_IMG) {

                            // 픽업 리스트
                            imgList = res[0].PIUP_VCHR_IMG.split(',');
                        }
                        if (!!res[0].CPL_VCHR_IMG) {

                            // 완료 영수증 리스트
                            imgList = [...imgList, ...res[0].CPL_VCHR_IMG.split(',')];
                        }

                        setDtptInfoImg(imgList);
                    }
                }
            });
        }
    }, [id]);

    return (
        <div className={styles.compDtptDiv + ' ' + (id > -1 ? styles.active : '')}>
            <Script src="/assets/js/blueimp-gallery.min.js" defer></Script>
            <div className={styles.titleDiv}>
                <h5>완료된 배치 상세내역</h5>
                <Image alt={'닫기'} src={'/assets/images/icon/iconClose.svg'} width={22} height={22} onClick={onClose} />
            </div>
            {dtptInfo.ODER_ERRR_SPPN_YN === 'Y' &&
                <div className={styles.errrSppn}>
                    <Image src={'/assets/images/icon/iconWarningType04.svg'} alt={'경고'} width={25} height={24} />
                    <p>앗! 배송이 잘못되었어요!!</p>
                </div>
            }
            <div className={styles.summDiv}>
                {isDelyAmt &&
                    <>
                        <h5>배달금액</h5>
                        <p>
                            {cmm.util.comma(dtptInfo.ODER_DELY_AMT)}원
                            {!!dtptInfo.SHPR_ADJ_POIN &&
                                <em> +{cmm.util.comma(dtptInfo.SHPR_ADJ_POIN)}P</em>
                            }
                            {/*<span className={dtptInfo.ODER_ADJ_YN === 'Y' ? styles.adj : ''}>{dtptInfo.ODER_ADJ_YN === 'Y' ? '정산완료' : '정산예정'}</span>*/}
                        </p>
                    </>
                }
                <ul>
                    <li>
                        <label>주문시간</label>
                        <span>{dtptInfo.ODER_REQ_YMD}</span>
                    </li>
                    <li>
                        <label>배달완료시간</label>
                        <span>{dtptInfo.ODER_DELY_CPL_DT}</span>
                    </li>
                    {!!dtptInfo.SHPR_POIN_RRV_RSN &&
                        <li>
                            <label>포인트 내용</label>
                            <span>{dtptInfo.SHPR_POIN_RRV_RSN}</span>
                        </li>
                    }
                </ul>
            </div>
            <div className={styles.divArea}>
                <ul>
                    <li>
                        <label>스토어</label>
                        <span>{dtptInfo.SHOP_NM}</span>
                    </li>
                    <li>
                        <label>배치종류</label>
                        <span>{dtptInfo.ODER_KD === 'PIUP' ? '픽업 및 배달' : '장보기 및 배달'}</span>
                    </li>
                    <li>
                        <label>배달거리</label>
                        <span>{dtptInfo.ODER_DELY_DTC}Km</span>
                    </li>
                </ul>
            </div>
            <div className={styles.divArea}>
                <ul>
                    <li>
                        <label>고객명</label>
                        <span>{dtptInfo.ODER_ACPP_NM}</span>
                    </li>
                    <li>
                        <label>주소</label>
                        <span>{dtptInfo.ODER_DELY_ADDR} {dtptInfo.ODER_DELY_DTPT_ADDR}</span>
                    </li>
                    <li>
                        <label>요청사항</label>
                        <span>{dtptInfo.ODER_DELY_REQ_MATT}</span>
                    </li>
                </ul>
            </div>
            <div className={styles.uploadArea}>
                <h5>업로드한 사진</h5>
                <Swiper slidesPerView={'auto'}>
                    {dtptInfoImg?.map((url, idx) => (
                        <SwiperSlide key={'prop' + idx}>
                            <div className={'imgZoomArea'}  onClick={() => cmm.util.showImageZoom(dtptInfoImg, idx)}>
                                <Image className={'img'} alt={'영수증 이미지'} src={url} width={278} height={278} />
                                <Image className={'zoom'}
                                       alt={'확대 이미지'} src={'/assets/images/btn/btnZoom.svg'} width={24} height={24} />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
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