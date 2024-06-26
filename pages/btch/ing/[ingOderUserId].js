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
    const [cplImgList, setCplImgList] = useState([]);
    const [cplPrvImgList, setCplPrvImgList] = useState([]);
    const {goPage} = useCommon();
    const shopS3Upload = useShopS3Upload();
    const {ingOderUserId} = router.query;

    useEffect(() => {

        cmm.ajax({
            url: `/api/btch/ing/${ingOderUserId}`,
            success: res => {

                if(!!res && res.length > 0) {
                    const item = res[0];

                    if('03|04|05'.indexOf(item.ODER_PGRS_STAT) === -1) {

                        cmm.alert('이미 완료된 건이거나 삭제된 건입니다.', () => {

                            goPage('/');
                        });
                        return;
                    }

                    if(!!item.SPBK_ID) {

                        // 상품 리스트
                        setProdList(res);
                    }

                    if(!!item.PIUP_VCHR_IMG) {

                        // 픽업 리스트
                        setPiupImgList(item.PIUP_VCHR_IMG.split(','));
                    }

                    switch (item.ODER_PGRS_STAT) {
                        case '03': setBtnText(item.ODER_KD === 'DELY' ? '장보기 시작' : '배달 시작'); setTitle('스토어로 이동 중'); break;
                        case '04': setBtnText('배달 시작'); setTitle('장보는 중'); break;
                        case '05': setBtnText((item.ODER_DRC_LDTN_YN === 'N' && item.ODER_DRC_LDTN_AMT > 0 && item.ODER_CARD_DRC_LDTN_CPL_YN !== 'Y') ? '결제 하기' : '배달 완료'); setTitle('배달하는 중'); break;
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

            if(btnText === '결제 하기') {

                goPage('/btch/ldtn/' + ingOderUserId);
                return;
            }
            if(cplImgList.length === 0) {

                cmm.alert('아직 사진을 등록하지 않았습니다.\n사진을 등록해주세요.', () => {

                    inpFile.click();
                });
            } else {
                cmm.confirm(`<span>${btchInfo.USER_FULL_ADDR}\n\n벨누르기 완료</span>하셨나요?\n벨누르기 하지 않으면 배달 완료로\n 인정이 되지 않을 수 있으니 꼭 벨을 눌러주세요`, () => {

                    // 업로드
                    shopS3Upload(cplImgList, res => {

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
            // 픽업일 경우
            if(btchInfo.ODER_PGRS_STAT === '03' && btchInfo.ODER_KD === 'PIUP') {
                msg = '스토어에 도착하셨나요?\n지금부터 배달을 시작하시겠습니까?';
                title = '배달 시작'

                if(!!btchInfo.ODER_DELY_ARTG) {

                    const check1 = btchInfo.ODER_DELY_ARTG.indexOf('계란') > -1;
                    const check2 = btchInfo.ODER_DELY_ARTG.indexOf('파손주의') > -1;
                    if(check1 || check2) {

                        msg += '\n\n';
                        msg += '<span style="color: red">' + (check1 ? '계란\n' : '') + '</span>';
                        msg += '파.손.주.의 물품이 있습니다!!!\n\n배달 전 파손여부를 확인 후\n주의해서 배달해주시기 바랍니다.\n\n' ;
                        msg += '<input type="checkbox" id="confirmChk" /><label for="confirmChk">네, 주의해서 배달하겠습니다.</label>' ;
                        msg += '<span id="confirmVali">체크 후 진행 가능합니다.</span>' ;
                    }
                }

                if(vchrImgList.length === 0) {
                    cmm.alert('아직 영수증사진을 등록하지 않았습니다.\n영수증사진을 등록해주세요.', () => {

                        inpVchrFile.click();
                    });

                    return;
                }
            }

            // 업로드
            cmm.confirm(msg, () => {

                // 배치 상태 변경
                const callBtchStatChg = atchFileUuid => {

                    cmm.ajax({
                        url: '/api/btch/ing/btchStat',
                        data: {
                            oderUserId: ingOderUserId,
                            oderPgrsStat: (btchInfo.ODER_PGRS_STAT === '03' && btchInfo.ODER_KD === 'DELY') ? '04' : '05',
                            atchFileUuid
                        },
                        success: res => router.reload()
                    });
                };

                // 픽업일 경우
                if(btchInfo.ODER_PGRS_STAT === '03' && btchInfo.ODER_KD === 'PIUP') {

                    // 업로드
                    shopS3Upload(vchrImgList, res => {

                        // 배치 상태 변경
                        callBtchStatChg(res.atchFileUuid);
                    });
                } else {

                    // 배치 상태 변경
                    callBtchStatChg();
                }
            }, null, title);
        }
    };

    /**
     * 완료 이미지 변경
     * @param e
     */
    const fileChage = e => {

        if(e.target.files.length > 0) {

            let fileIdx = 0, uploadFile;
            cmm.loading(true);
            for(let i = 0; i < e.target.files.length; i++) {

                uploadFile = e.target.files[i];

                // 썸네일
                cmm.util.getThumbFile({file: uploadFile, maxSize: 1024, type: uploadFile.type}).then(imgData => {
                    fileIdx++;
                    setCplImgList(prevState => [...prevState, imgData.blob]);
                    setCplPrvImgList(prevState => [...prevState, window.URL.createObjectURL(imgData.blob)]);

                    if(fileIdx === e.target.files.length) {

                        e.target.value = '';
                        cmm.loading(false);
                    }
                });
            }
        }
    };

    /**
     * 영수증 이미지 변경
     * @param e
     */
    const fileVchrChage = e => {

        if(e.target.files.length > 0) {

            let fileIdx = 0, uploadFile;
            cmm.loading(true);
            for(let i = 0; i < e.target.files.length; i++) {

                uploadFile = e.target.files[i];

                // 썸네일
                cmm.util.getThumbFile({file: uploadFile, maxSize: 1024, type: uploadFile.type}).then(imgData => {
                    fileIdx++;
                    setVchrImgList(prevState => [...prevState, imgData.blob]);
                    setVchrPrvImgList(prevState => [...prevState, window.URL.createObjectURL(imgData.blob)]);

                    if(fileIdx === e.target.files.length) {

                        e.target.value = '';
                        cmm.loading(false);
                    }
                });
            }
        }
    };

    /**
     * 완료 이미지 삭제
     *
     * @param idx
     */
    const imageDelHandler = imgIdx => {

        setCplPrvImgList(prevState => prevState.filter((value, idx) => idx !== imgIdx));
        setCplImgList(prevState => prevState.filter((value, idx) => idx !== imgIdx));
    };

    /**
     * 영수증 이미지 삭제
     *
     * @param idx
     */
    const imageVchrDelHandler = imgIdx => {

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
            <HeadTitle title={title} callbackClose={() => goPage('/', {tabIdx: 1})} >
                {(btchInfo.ODER_PGRS_STAT === '03' && !btchInfo.ODER_REQ_APV_MNGR_ID) &&
                    <button type={'button'} className={'btnBtchCancel'} onClick={btchCancelHandler}>배치 취소</button>
                }
            </HeadTitle>
            <div className={styles.btchIng}>
                <div className={styles.step}>
                    <Image alt={'스토어 이동'} src={'/assets/images/img/step1On.svg'} width={48} height={48} />
                    {btchInfo.ODER_KD === 'DELY' &&
                        <Image alt={'장보기'} src={btchInfo.ODER_PGRS_STAT === '03' ? '/assets/images/img/step2Off.svg' : '/assets/images/img/step2On.svg'} width={48} height={48} />
                    }
                    <Image alt={'배달'} src={btchInfo.ODER_PGRS_STAT === '05' ? '/assets/images/img/step3On.svg' : '/assets/images/img/step3Off.svg'} width={48} height={48} />
                </div>
                <ul className={'formUl'}>
                    {btchInfo.ODER_PGRS_STAT === '03' &&
                        <>
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
                            {!!btchInfo.ODER_PIUP_FRCS_MI &&
                                <li>
                                    <h5>픽업남은시간</h5>
                                    <p>
                                        <Image style={{paddingLeft: 0,paddingRight: '8px'}} alt={'주문 정보'} src={'/assets/images/icon/iconWarning.svg'} width={17} height={17} />
                                        <span style={{color: '#F4997A'}}>{Math.abs(btchInfo.ODER_PIUP_FRCS_MI - btchInfo.BTCH_ACP_PGRS_MI)}분 {btchInfo.ODER_PIUP_FRCS_MI - btchInfo.BTCH_ACP_PGRS_MI >= 0 ? '남음' : '지남'}</span>
                                    </p>
                                </li>
                            }
                            <li>
                                <h5>스토어
                                    {!!btchInfo?.ODER_RPRE_NO &&
                                        <em className={styles.oderNo}>
                                            (주문번호: {btchInfo?.ODER_RPRE_NO?.length === 11 ? cmm.util.getNumber(btchInfo?.ODER_RPRE_NO?.substring(6)) : btchInfo?.ODER_RPRE_NO})
                                        </em>
                                    }
                                </h5>
                                <p>{btchInfo.SHOP_NM}</p>
                            </li>
                            <li>
                                <h5>주소</h5>
                                <p>
                                    {btchInfo.SHOP_FULL_ADDR}
                                    <Image alt={'주소 복사'} src={'/assets/images/btn/btnCopy.svg'} width={44} height={23} onClick={() => cmm.util.clipboard(btchInfo.SHOP_FULL_ADDR)}/>
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
                                <h5>주문 시간</h5>
                                <p>{btchInfo.ODER_REQ_YMD}</p>
                            </li>
                            <li>
                                <h5>배달 시간</h5>
                                <p>{btchInfo.oderDelySlctVal}</p>
                            </li>
                            {!!btchInfo.ODER_DELY_REQ_MATT &&
                                <li>
                                    <h5>주문시 요청 사항</h5>
                                    <p>{btchInfo.ODER_DELY_REQ_MATT}</p>
                                </li>
                            }
                            {!!btchInfo.ODER_RRV_ID &&
                                <li>
                                    <h5>스토어 적립</h5>
                                    <p>{btchInfo.ODER_RRV_ID}</p>
                                </li>
                            }
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
                            {btchInfo.ODER_KD === 'PIUP' &&
                                <li className={styles.uploadArea}>
                                    <h5>사진 업로드</h5>
                                    <input type={'file'} id={'inpVchrFile'} onChange={fileVchrChage} multiple={true} accept={'image/*'} />
                                    <div>
                                        {vchrPrvImgList.map((url, idx) => (
                                            <div key={'img' + idx}>
                                                <img className={styles.vchrImg} src={url} alt={'영수증 사진'} />
                                                <Image className={styles.del} src={'/assets/images/btn/btnDel.svg'} alt={'영수증 사진'} width={20} height={20} onClick={() => imageVchrDelHandler(idx)} />
                                            </div>
                                        ))}
                                        <label htmlFor={'inpVchrFile'}>
                                            <div className={styles.upload}>
                                                <Image src={'/assets/images/btn/btnCamera.svg'} width={21.5} height={17} alt={'카메라'} />
                                            </div>
                                        </label>
                                    </div>
                                    <p>영수증 사진을 업로드해주세요.</p>
                                </li>
                            }
                        </>
                    }
                    {btchInfo.ODER_PGRS_STAT === '05' &&
                        <>
                            {btchInfo.ODER_DRC_LDTN_YN === 'N' &&
                                <li>
                                    <h5>결제</h5>
                                    {btchInfo.ODER_DRC_LDTN_AMT === 0 &&
                                        <p style={{color: '#F4997A'}}>카드 단말기 필요</p>
                                    }
                                    {btchInfo.ODER_DRC_LDTN_AMT > 0 &&
                                        <>
                                            <span style={{color: '#02B763'}}>직접 결제 {btchInfo.ODER_CARD_DRC_LDTN_CPL_YN === 'Y' ? '완료' : ''}</span>
                                        </>
                                    }
                                </li>
                            }
                            <li>
                                <h5>스토어

                                    {!!btchInfo?.ODER_RPRE_NO &&
                                        <em className={styles.oderNo}>
                                            (주문번호: {btchInfo.ODER_RPRE_NO.length === 11 ? cmm.util.getNumber(btchInfo.ODER_RPRE_NO.substring(6)) : btchInfo.ODER_RPRE_NO})
                                        </em>
                                    }
                                </h5>
                                <p>{btchInfo.SHOP_NM}</p>
                            </li>
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
                                <ul className={'naviLinkUl d-none'}>
                                    <li>
                                        <a href={`kakaomap://route?ep=${btchInfo.ODER_DELY_ADDR_LOT},${btchInfo.ODER_DELY_ADDR_LAT}&by=CAR`} >
                                            <Image alt={'카카오맵'} src={'/assets/images/icon/iconKakaonavi.svg'} width={24} height={24} />
                                            카카오맵 연결하기
                                        </a>
                                    </li>
                                    <li>
                                        <a href={`tmap://route?goalname=${btchInfo.ODER_ACPP_NM} 고객&goaly=${btchInfo.ODER_DELY_ADDR_LOT}&goalx=${btchInfo.ODER_DELY_ADDR_LAT}`} >
                                            <Image alt={'티맵'} src={'/assets/images/icon/iconTmap.png'} width={24} height={24} />
                                            티맵 연결하기
                                        </a>
                                    </li>
                                    <li>
                                        <a href={`nmap://route/car?dlat=${btchInfo.ODER_DELY_ADDR_LOT}&dlng=${btchInfo.ODER_DELY_ADDR_LAT}&dname=${btchInfo.ODER_ACPP_NM} 고객`} >
                                            <Image alt={'네이버지도'} src={'/assets/images/icon/iconNavermap.png'} width={24} height={24} />
                                            네이버지도 연결하기
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <h5>연락처</h5>
                                <p>
                                    <a className={'colorGreen bold'} href={'tel:' + btchInfo.ODER_ACPP_CPHONE_NO}>
                                        {cmm.util.hyphenTel(btchInfo.ODER_ACPP_CPHONE_NO)}
                                    </a>
                                </p>
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
                                <a className={'colorGreen bold'} href={'tel:' + btchInfo.ODER_ACPP_CPHONE_NO}>
                                    {cmm.util.hyphenTel(btchInfo.ODER_ACPP_CPHONE_NO)}
                                </a>
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
                                            <img className={'img'} alt={'영수증 이미지'} src={url} />
                                            <Image className={'zoom'} onClick={() => cmm.util.showImageZoom(piupImgList, idx)}
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
                            <input type={'file'} id={'inpFile'} onChange={fileChage} multiple={true} accept={'image/*'} />
                            <div>
                                {cplPrvImgList.map((url, idx) => (
                                    <div key={'img' + idx}>
                                        <img className={styles.vchrImg} src={url} alt={'영수증 사진'} />
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