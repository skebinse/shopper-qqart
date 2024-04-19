import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css"
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import Head from "next/head";
import Image from "next/image";
import useShopS3Upload from "../../hooks/useShopS3Upload";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";
import Script from "next/script";
import Link from "next/link";

export default function Reg() {

    const router = useRouter();
    const shopS3Upload = useShopS3Upload();
    const [prflPrvImg, setPrflPrvImg] = useState('');
    const [popupClass, setPopupClass] = useState('');
    const [joinInfoLS, setJoinInfoLS] = useState('');
    const [joinInfo, setJoinInfo] = useState({
        userId: '',
        userPw: '',
        userPwCfm: '',
        userNcnm: '',
        addrTxt: '<span>주소를 입력해주세요.</span>',
        shprSfitdText: '',
        profile: '',
        isLogin: 'N',
    });
    const {goPage} = useCommon();

    useEffect(() => {

        setJoinInfoLS(cmm.util.getLs(cmm.Cont.JOIN_INFO));
        setJoinInfo(prevState => ({...prevState, appToken: !!cmm.util.getLs(cmm.Cont.APP_TOKEN) ? cmm.util.getLs(cmm.Cont.APP_TOKEN) : ''}));

        if(!cmm.util.getLs(cmm.Cont.JOIN_INFO)) {
            cmm.alert('가입정보가 없습니다.\n로그인 화면으로 이동합니다.', () => {
                goPage('/cmm/login');
            });
        }

    }, [router.query.userCrctno, router.query.basis, goPage]);

    /**
     * 프로필 변경
     * @param e
     */
    const fileChage = e => {

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
        } else if(!joinInfo.userId){

            cmm.alert('아이디를 입력해 주세요.');
        } else if(!cmm.util.checkId(joinInfo.userId)){

            cmm.alert('아이디는 최소 4자이상 \n알파벳, 숫자만 입력해 주세요.');
        } else if(!joinInfo.userPw){

            cmm.alert('비밀번호를 입력해 주세요.');
        } else if(joinInfo.userPw !== joinInfo.userPwCfm){

            cmm.alert('비밀번호가 서로 다릅니다.');
        } else if(!cmm.util.checkPassword(joinInfo.userPw)){

            cmm.alert('비밀번호는 최소 6자리 이상으로\n알파벳, 숫자, 특수기호가 포함되어야 합니다.');
        } else if(!joinInfo.userNcnm){

            cmm.alert('닉네임을 입력해 주세요.');
        } else if(!joinInfo.shprSfitdText){

            cmm.alert('자기소개를 입력해 주세요.');
        } else if(!joinInfo.userZipc){

            cmm.alert('지역을 선택해 주세요.');
        } else {

            cmm.confirm('가입 진행하겠습니까?', () => {

                cmm.ajax({
                    url: '/api/join/ncnmNIdDplc',
                    data: {
                        userNcnm: joinInfo.userNcnm,
                        userId: joinInfo.userId,
                    },
                    success: res => {

                        const call = param => {
                            cmm.ajax({
                                url: '/api/join',
                                data: param,
                                success: res => {

                                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                                    window.drvLicImg = null;
                                    cmm.util.rmLs(cmm.Cont.JOIN_INFO);
                                    goPage('./comp');
                                }
                            });
                        };

                        if(!!window.drvLicImg) {
                            shopS3Upload(window.drvLicImg, resLic => {

                                const param = {...joinInfo, ...joinInfoLS};
                                param.shprDrvLicAtchFileUuid = resLic.atchFileUuid;
                                setJoinInfo(prevState => ({...prevState, shprDrvLicAtchFileUuid: resLic.atchFileUuid}));

                                shopS3Upload(joinInfo.profile, res => {

                                    param.atchFileUuid = res.atchFileUuid;
                                    setJoinInfo(prevState => ({...prevState, atchFileUuid: res.atchFileUuid}));

                                    call(param);
                                });
                            });
                        }
                    }
                });
            });
        }
    };

    return (
        <div className={styles.join}>
            <HeadTitle title={''} />
            <NaviStep step={3} />
            <div className={styles.content} style={joinInfo.isLogin === 'N' ? {paddingTop: '0px'} : {}}>
                <div className={styles.profile}>
                    <Image src={!!prflPrvImg ? prflPrvImg : "/assets/images/img/noProfile.svg"} alt={'프로필 사진'} width={96} height={96} />
                    <input id={'inpFile'} type={"file"} accept={'image/*'} onChange={fileChage} />
                    <label htmlFor={'inpFile'}>
                        사진업로드
                    </label>
                </div>
                <ul className={styles.info}>
                    <li>
                        <label>아이디</label>
                        <div>
                            <input value={joinInfo.userId} onChange={e => setJoinInfo(prevState => ({...prevState, userId: e.target.value}))} type="text"  placeholder="아이디를 입력해주세요" maxLength={8} />
                        </div>
                    </li>
                    <li>
                        <label>비밀번호</label>
                        <div>
                            <input value={joinInfo.userPw} onChange={e => setJoinInfo(prevState => ({...prevState, userPw: e.target.value}))} type="password"  placeholder="비밀번호를 입력해주세요" />
                        </div>
                    </li>
                    <li>
                        <label>비밀번호 확인</label>
                        <div>
                            <input value={joinInfo.userPwCfm} onChange={e => setJoinInfo(prevState => ({...prevState, userPwCfm: e.target.value}))} type="password"  placeholder="비밀번호를 다시 입력해주세요" />
                        </div>
                    </li>
                    <li>
                        <label>닉네임</label>
                        <div>
                            <input id="ncnm" value={joinInfo.userNcnm} onChange={e => setJoinInfo(prevState => ({...prevState, userNcnm: e.target.value}))} type="text"  placeholder="닉네임을 입력해주세요" />
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
                </ul>
                <p className={styles.infoTxt}>* 설정한 지역을 중심으로 배치를 확인하실 수 있습니다.</p>
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={joinCompClick}>가입하기</button>
                </div>
            </div>
            <div className={styles.popup + ' ' + popupClass}>
                <HeadTitle title={'우편번호 검색'} type={'close'} callbackClose={() => setPopupClass('')} />
                <div className={styles.daumPost} id={'divDaumPost'}></div>
            </div>
            <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" defer />
        </div>
    );
}