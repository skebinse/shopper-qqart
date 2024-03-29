import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css"
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import Image from "next/image";
import useShopS3Upload from "../../hooks/useShopS3Upload";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";
import Script from "next/script";

export default function Info() {

    const router = useRouter();
    const shopS3Upload = useShopS3Upload();
    const [prflPrvImg, setPrflPrvImg] = useState('');
    const [popupClass, setPopupClass] = useState('');
    const [joinInfoLS, setJoinInfoLS] = useState({});
    const [joinInfo, setJoinInfo] = useState({
        userId: '',
        userPw: '',
        userNcnm: '',
        addrTxt: '<span>주소를 입력해주세요.</span>',
        shprSfitdText: '',
        profile: '',
        appToken: '',
        shprDelyPosDtc: '10',
        isLogin: false,
    });
    const {goPage} = useCommon();

    useEffect(() => {

        if(!!cmm.util.getLs(cmm.Cont.JOIN_INFO)) {

            setJoinInfoLS(cmm.util.getLs(cmm.Cont.JOIN_INFO));
        }

        if(!cmm.checkLogin() && !cmm.util.getLs(cmm.Cont.JOIN_INFO) && !cmm.util.getLs(cmm.Cont.JOIN_INFO)?.userCrctno) {
            cmm.alert('로그인정보가 없습니다.\n로그인 화면으로 이동합니다.', () => {
                goPage('/cmm/login');
            });
        } else {

            if(!!cmm.checkLogin()) {

                cmm.ajax({
                    url: '/api/shpr/myInfo',
                    method: 'GET',
                    success: res => {

                        setJoinInfo({
                            isLogin: cmm.checkLogin(),
                            userCrctno: res.SHPR_CRCTNO,
                            userId: res.SHPR_LOGIN_ID,
                            userSnsType: res.SHPR_SNS_TYPE,
                            userNcnm: res.SHPR_NCNM,
                            shprSfitdText: res.SHPR_SFITD_TEXT,
                            profile: res.SHPR_NCNM,
                            addrTxt: res.SHPR_ADDR,
                            userStdoCd: res.SHPR_STDO_CD,
                            userZipc: res.SHPR_ZIPC,
                            userAddr: res.SHPR_ADDR,
                            userAddrLat: res.SHPR_ADDR_LAT,
                            userAddrLot: res.SHPR_ADDR_LOT,
                            atchFileUuid: res.SHPR_PRFL_ATCH_FILE_UUID,
                            shprDelyPosDtc: res.SHPR_DELY_POS_DTC,
                        });
                        setPrflPrvImg(res.SHPR_PRFL_FILE);
                    }
                });
            }
        }

    }, [goPage]);

    /**
     * 프로필 변경
     * @param e
     */
    const fileChage = e => {

        const fileReader = new FileReader();

        if(e.target.files.length > 0) {

            cmm.loading(true);
            const uploadFile = e.target.files[0];

            // 썸네일
            cmm.util.getThumbFile({file: uploadFile, maxSize: 1024, type: uploadFile.type}).then(imgData => {

                setJoinInfo(prevState => ({...prevState,
                    profile: imgData.blob,
                    atchFileUuid: ''}));
                setPrflPrvImg(window.URL.createObjectURL(imgData.blob));

                cmm.loading(false);
            });
        }
    };

    /**
     * 다음 우편번호
     */
    const daumPostClick = () => {

        // 팝업 오픈
        setPopupClass(styles.active);

        cmm.plugin.daumPost(divDaumPost, data => {

            // 팝업 close
            setPopupClass('');

            setJoinInfo(prevState => ({
                ...prevState,
                addrTxt: data.roadAddress,
                userStdoCd: data.bcode,
                userZipc: data.zonecode,
                userAddr: data.roadAddress,
                userAddrLat: data.newLon,
                userAddrLot: data.newLat,
            }));
        });
    };

    /**
     * 가입
     */
    const joinCompClick = () => {

        if(!joinInfo.profile) {

            cmm.alert('사진을 등록해 주세요.');
        } else if(!joinInfo.userNcnm){

            cmm.alert('닉네임을 입력해 주세요.');
        } else if(!joinInfo.shprSfitdText){

            cmm.alert('자기소개를 입력해 주세요.');
        } else if(!joinInfo.userZipc){

            cmm.alert('지역을 선택해 주세요.');
        } else if(!joinInfo.shprDelyPosDtc){

            cmm.alert('반경(Km)을 입력해 주세요.');
        } else {

            if(!joinInfo.isLogin) {

                cmm.ajax({
                    url: '/api/join/ncnmDplc',
                    data: {
                        userNcnm: joinInfo.userNcnm
                    },
                    success: res => {

                        if (res.CNT === 1) {

                            cmm.alert('동일한 별명이 있습니다.');
                            return;
                        }

                        cmm.confirm('가입 진행하겠습니까?', () => {

                            callJoin();
                        });
                    }
                });
            } else {

                cmm.confirm('개인정보를 수정하시겠습니까?', () => {

                    callJoin();
                });
            }
        }
    };

    const callJoin = () => {

        const call = param => {

            cmm.ajax({
                url: '/api/join',
                data: {
                    ...param,
                    appToken: (!!cmm.util.getLs(cmm.Cont.APP_TOKEN) ? cmm.util.getLs(cmm.Cont.APP_TOKEN) : ''),
                    isLogin: cmm.checkLogin() ? 'Y' : 'N',
                },
                success: res => {

                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                    cmm.util.rmLs(cmm.Cont.JOIN_INFO);
                    if(!!res && !joinInfo.isLogin) {

                        goPage('./comp');
                    } else {

                        cmm.alert('수정 되었습니다.', () => {

                            router.reload();
                        });
                    }
                }
            });
        };

        if(!!joinInfo.atchFileUuid) {

            call({...joinInfo, ...joinInfoLS});
        } else {

            shopS3Upload(joinInfo.profile, res => {

                const param = {...joinInfo, ...joinInfoLS};
                param.atchFileUuid = res.atchFileUuid;
                setJoinInfo(prevState => ({...prevState, atchFileUuid: res.atchFileUuid}));

                call(param);
            });
        }
    }

    return (
        <div className={styles.join}>
            <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" defer/>
            <HeadTitle title={joinInfo.isLogin ? '개인정보수정' : ''} />
            {!joinInfo.isLogin &&
                <NaviStep step={3} />
            }
            <div className={styles.content} style={joinInfo.isLogin ? {paddingTop: '0px'} : {}}>
                {!joinInfo.isLogin &&
                    <h3>기본 정보 설정</h3>
                }
                <div className={styles.profile}>
                    <Image src={!!prflPrvImg ? prflPrvImg : "/assets/images/img/noProfile.svg"} priority={true} alt={'프로필 사진'} width={96} height={96} />
                    <input id={'inpFile'} type={"file"} accept={'image/*'} onChange={fileChage} />
                    <label htmlFor={'inpFile'}>
                        사진업로드
                    </label>
                </div>
                <ul className={styles.info}>
                    <li>
                        <label>닉네임</label>
                        <div>
                            <input id="ncnm" value={joinInfo.userNcnm} onChange={e => setJoinInfo(prevState => ({...prevState, userNcnm: e.target.value}))} type="text"  placeholder="닉네임을 입력해주세요" maxLength={8} />
                        </div>
                    </li>
                    <li>
                        <label>자기소개</label>
                        <div>
                            <textarea id="sfitd" value={joinInfo.shprSfitdText} onChange={e => {
                                if(e.target.value.length <= 50) {

                                    setJoinInfo(prevState => ({...prevState, shprSfitdText: e.target.value}));
                                }
                            }} placeholder="멋진 쇼퍼님을 표현해주세요." rows={3} maxLength={50} />
                            <span>{joinInfo.shprSfitdText.length}/50</span>
                        </div>
                    </li>
                    <li>
                        <label>현재 지역 설정</label>
                        <div className={styles.zip}>
                            <p dangerouslySetInnerHTML={{__html: joinInfo.addrTxt}}></p>
                            <button type={'button'} onClick={daumPostClick}>주소검색</button>
                        </div>
                    </li>
                    <li>
                        <label>반경(Km)</label>
                        <div>
                            <input id="shprDelyPosDtc" value={joinInfo.shprDelyPosDtc} onChange={e => setJoinInfo(prevState => ({...prevState, shprDelyPosDtc: e.target.value}))} type="number" />
                        </div>
                    </li>
                </ul>
                <p className={styles.infoTxt}>* 설정한 지역을 중심으로 배치를 확인하실 수 있습니다.</p>
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={joinCompClick}>{joinInfo.isLogin ? '설정완료' : '가입하기'}</button>
                </div>
            </div>
            <div className={styles.popup + ' ' + popupClass}>
                <HeadTitle title={'우편번호 검색'} type={'close'} callbackClose={() => setPopupClass('')} />
                <div className={styles.daumPost} id={'divDaumPost'}></div>
            </div>
        </div>
    );
}