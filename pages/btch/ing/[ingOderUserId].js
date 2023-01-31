import React, {useEffect, useState} from 'react';
import HeadTitle from "../../../components/headTitle";
import useCommon from "../../../hooks/useCommon";
import Image from "next/image";
import cmm from "../../../js/common";
import {Swiper, SwiperSlide} from "swiper/react";
import 'swiper/css';
import {useRouter} from "next/router";
import styles from "../../../styles/btch.module.css";
import Head from "next/head";
import useShopS3Upload from "../../../hooks/useShopS3Upload";

export default function IngOderUserId() {

    const router = useRouter();
    const [title, setTitle] = useState('');
    const [btnText, setBtnText] = useState('');
    const [btchInfo, setBtchInfo] = useState({});
    const [prodList, setProdList] = useState([]);
    const [piupImgList, setPiupImgList] = useState([]);
    const [vchrImgList, setVchrImgList] = useState([]);
    const [vchrPrvImgList, setVchrPrvImgList] = useState([]);
    const {goPage} = useCommon();
    const shopS3Upload = useShopS3Upload();
    const {ingOderUserId} = router.query;

    useEffect(() => {

        cmm.plugin.channelIO();

        cmm.ajax({
            url: `/api/btch/ing/${ingOderUserId}`,
            success: res => {

                if(!!res && res.length > 0) {
                    const item = res[0];

                    console.log(item)
                    if(!!item.SPBK_ID) {

                        // 상품 리스트
                        setProdList(res);
                    }

                    if(!!item.PIUP_VCHR_IMG) {

                        // 픽업 리스트
                        setPiupImgList(item.PIUP_VCHR_IMG.split(','));
                    }

                    switch (item.ODER_PGRS_STAT) {
                        case '03': setBtnText('장보기 시작'); setTitle('스토어로 이동 중'); break;
                        case '04': setBtnText('배달 시작'); setTitle('장보는 중'); break;
                        case '05': setBtnText('배달 완료'); setTitle('픽업하는 중'); break;
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

                    // 배치 정보
                    setBtchInfo(item);
                } else {

                    cmm.alert('배달이 완료된 건입니다.', () => {
                        goPage('/');
                    });
                }
            }
        });

    }, [goPage, ingOderUserId]);

    /**
     * 진행
     */
    const ingClick = () => {

        // 배달 완료
        if(btchInfo.ODER_PGRS_STAT === '05') {

            if(vchrImgList.length === 0) {

                cmm.alert('아직 사진을 등록하지 않았습니다.\n사진을 등록해주세요.');
            } else {

                cmm.confirm('배달을 완료하시겠습니까?', () => {

                    shopS3Upload(vchrImgList, res => {

                        cmm.ajax({
                            url: '/api/btch/ing/btchComp',
                            data: {
                                oderUserId: ingOderUserId,
                                atchFileUuid: res.atchFileUuid,
                            },
                            success: res => {

                                cmm.alert('배달을 완료하였습니다.\n수고하셨습니다.', () => {
                                    goPage('/');
                                });
                            },
                        });
                    });
                }, null, '배달 완료');
            }

        } else {

            let msg = btchInfo.ODER_PGRS_STAT === '03' ? '스토어에 도착하셨나요?\n장보기를 시작하시겠습니까?' : '결제를 완료하였나요?\n지금부터 배달을 시작하시겠습니까?';
            let title = btchInfo.ODER_PGRS_STAT === '03' ? '장보기 시작' : '배달 시작';

            cmm.confirm(msg, () => {

                cmm.ajax({
                    url: '/api/btch/ing/btchStat',
                    data: {
                        oderUserId: ingOderUserId,
                        oderPgrsStat: btchInfo.ODER_PGRS_STAT === '03' ? '04' : '05',
                    },
                    success: res => router.reload()
                });
            }, null, title);
        }
    };

    /**
     * 영수증 변경
     * @param e
     */
    const fileChage = e => {

        if(e.target.files.length > 0) {

            for(let i = 0; i < e.target.files.length; i++) {

                const fileReader = new FileReader();

                fileReader.onload = e => {
                    setVchrPrvImgList(prevState => [...prevState, e.target.result]);
                };

                setVchrImgList(prevState => [...prevState, e.target.files[i]]);

                fileReader.readAsDataURL(e.target.files[i]);
            }
        }
    };

    /**
     * 이미지 삭제
     *
     * @param idx
     */
    const imageDelHandler = imgIdx => {

        setVchrPrvImgList(prevState => prevState.filter((value, idx) => idx !== imgIdx));
        setVchrImgList(prevState => prevState.filter((value, idx) => idx !== imgIdx));
    };

    /**
     * 배치 취소
     */
    const btchCancelHandler = () => {

        cmm.confirm('배치 수락을 정말 취소하시겠습니까?<br/><span>수락 취소 후 1시간동안 배치를 수락하실 수 없습니다.</span>', () => {

            cmm.ajax({
                url: '/api/btch/btchCan',
                data: {
                    oderUserId: btchInfo.ODER_USER_ID
                },
                success: res => {

                    if(!!res.affectedRows) {

                        cmm.alert('배치가 취소 되었습니다.', () => {

                            router.push('/');
                        });
                    }
                },
            });
        }, null, '배치 취소');
    };

    return(
        <>
            <Head>
                <script src="/assets/js/blueimp-gallery.min.js" defer></script>
            </Head>
            <HeadTitle title={title} callbackClose={() => goPage('/')} >
                {btchInfo.ODER_PGRS_STAT === '03' &&
                    <button type={'button'} className={'btnBtchCancel'} onClick={btchCancelHandler}>배치 취소</button>
                }
            </HeadTitle>
            <div className={styles.btchIng}>
                <div className={styles.step}>
                    <Image alt={'스토어 이동'} src={'/assets/images/img/step1On.svg'} width={48} height={48} />
                    <Image alt={'장보기'} src={btchInfo.ODER_PGRS_STAT === '03' ? '/assets/images/img/step2Off.svg' : '/assets/images/img/step2On.svg'} width={48} height={48} />
                    <Image alt={'배달'} src={btchInfo.ODER_PGRS_STAT === '05' ? '/assets/images/img/step3On.svg' : '/assets/images/img/step3Off.svg'} width={48} height={48} />
                </div>
                <ul className={'formUl'}>
                    {btchInfo.ODER_PGRS_STAT === '03' &&
                        <>
                            <li>
                                <h5>스토어</h5>
                                <p>{btchInfo.SHOP_NM}</p>
                            </li>
                            <li>
                                <h5>주소</h5>
                                <p>
                                    {btchInfo.SHOP_FULL_ADDR}
                                    <Image alt={'주소 복사'} src={'/assets/images/btn/btnCopy.svg'} width={44} height={23} onClick={() => cmm.util.clipboard(btchInfo.SHOP_FULL_ADDR)}/>
                                </p>
                                <ul className={'naviLinkUl'}>
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
                                <h5>주문 시간</h5>
                                <p>{btchInfo.ODER_REQ_YMD}</p>
                            </li>
                            <li>
                                <h5>배달 시간</h5>
                                <p>{btchInfo.oderDelySlctVal}</p>
                            </li>
                            {!!btchInfo.ODER_RRV_ID &&
                                <li>
                                    <h5>스토어 적립</h5>
                                    <p>{btchInfo.ODER_RRV_ID}</p>
                                </li>
                            }
                        </>
                    }
                    {btchInfo.ODER_PGRS_STAT === '05' &&
                        <>
                            <li>
                                <h5>배달 시간</h5>
                                <p>{btchInfo.oderDelySlctVal}</p>
                            </li>
                            <li>
                                <h5>주문 시간</h5>
                                <p>{btchInfo.ODER_REQ_YMD}</p>
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
                                <ul className={'naviLinkUl'}>
                                    <li>
                                        <a href={`kakaomap://route?ep=${btchInfo.USER_ADDR_LOT},${btchInfo.USER_ADDR_LAT}&by=CAR`} >
                                            <Image alt={'카카오맵'} src={'/assets/images/icon/iconKakaonavi.svg'} width={24} height={24} />
                                            카카오맵 연결하기
                                        </a>
                                    </li>
                                    <li>
                                        <a href={`tmap://route?goalname=${btchInfo.USER_NCNM} 고객&goaly=${btchInfo.USER_ADDR_LOT}&goalx=${btchInfo.USER_ADDR_LAT}`} >
                                            <Image alt={'티맵'} src={'/assets/images/icon/iconTmap.png'} width={24} height={24} />
                                            티맵 연결하기
                                        </a>
                                    </li>
                                    <li>
                                        <a href={`nmap://route/car?dlat=${btchInfo.USER_ADDR_LOT}&dlng=${btchInfo.USER_ADDR_LAT}&dname=${btchInfo.USER_NCNM} 고객`} >
                                            <Image alt={'네이버지도'} src={'/assets/images/icon/iconNavermap.png'} width={24} height={24} />
                                            네이버지도 연결하기
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <h5>연락처</h5>
                                <p className={'colorGreen bold'}>{cmm.util.hyphenTel(btchInfo.ODER_ACPP_CPHONE_NO)}</p>
                            </li>
                            {!!btchInfo.ODER_JOIN_ENTH_PW &&
                                <li>
                                    <h5>공동 현관 비밀번호</h5>
                                    <p>{btchInfo.ODER_JOIN_ENTH_PW}</p>
                                </li>
                            }
                            {!!btchInfo.ODER_DELY_REQ_MATT &&
                                <li>
                                    <h5>주문시 요청 사항</h5>
                                    <p>{btchInfo.ODER_DELY_REQ_MATT}</p>
                                </li>
                            }
                        </>
                    }
                    {btchInfo.ODER_PGRS_STAT === '04' && !!btchInfo.ODER_RRV_ID &&
                        <>
                            <li>
                                <h5>고객명</h5>
                                <p>{btchInfo.ODER_ACPP_NM}</p>
                            </li>
                            <li>
                                <h5>연락처</h5>
                                <p className={'colorGreen bold'}>{cmm.util.hyphenTel(btchInfo.ODER_ACPP_CPHONE_NO)}</p>
                            </li>
                            <li>
                                <h5>스토어 적립</h5>
                                <p>{btchInfo.ODER_RRV_ID}</p>
                            </li>
                        </>
                    }
                    {btchInfo.ODER_PGRS_STAT !== '03' && prodList.length > 0 &&
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
                    {btchInfo.ODER_PGRS_STAT !== '03' && piupImgList.length > 0 &&
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
                    {btchInfo.ODER_PGRS_STAT === '05' &&
                        <li className={styles.uploadArea}>
                            <h5>사진 업로드</h5>
                            <input type={'file'} id={'inpFile'} onChange={fileChage} multiple={true}/>
                            <div>
                                {vchrPrvImgList.map((url, idx) => (
                                    <div key={'img' + idx}>
                                        <Image className={styles.vchrImg} src={url} alt={'영수증 사진'} width={96} height={72} />
                                        <Image className={styles.del} src={'/assets/images/btn/btnDel.svg'} alt={'영수증 사진'} width={20} height={20} onClick={() => imageDelHandler(idx)} />
                                    </div>
                                ))}
                                <label htmlFor={'inpFile'}>
                                    <div className={styles.upload}>
                                        <Image src={'/assets/images/btn/btnCamera.svg'} width={21.5} height={17} alt={'카메라'} />
                                    </div>
                                </label>
                            </div>
                            <p>영수증 및 현관문 사진을 업로드해주세요.</p>
                        </li>
                    }
                </ul>
                <div className={'btnBottomArea'}>
                    <button type={'button'} className={'button'} onClick={ingClick} >{btnText}</button>
                </div>
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
        </>
    );
}

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}