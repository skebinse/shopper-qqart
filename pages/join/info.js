import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css"
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Head from "next/head";
import Image from "next/image";
import useShopS3Upload from "../../hooks/useShopS3Upload";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";

export default function Info() {

    const router = useRouter();
    const shopS3Upload = useShopS3Upload();
    const [prflPrvImg, setPrflPrvImg] = useState('');
    const [popupClass, setPopupClass] = useState('');
    const [joinInfo, setJoinInfo] = useState({
        cphoneNo: router.query.cphoneNo,
        userNcnm: '',
        addrTxt: '<span>주소를 입력해주세요.</span>',
        shprSfitdText: '',
        profile: '',
        isLogin: false,
    });
    const {goPage} = useCommon();

    useEffect(() => {

        if(!cmm.checkLogin() && !router.query.userCrctno) {
            cmm.alert('로그인정보가 없습니다.\n로그인 화면으로 이동합니다.', () => {
                goPage('/cmm/login');
            });
        } else {

            if(!!cmm.checkLogin()) {

                cmm.ajax({
                    url: '/api/cmm/user',
                    success: res => {

                        setJoinInfo({
                            isLogin: cmm.checkLogin(),
                            userCrctno: res.SHPR_CRCTNO,
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
                        });
                        setPrflPrvImg(cmm.getLoginInfo('SHPR_PRFL_FILE'));
                    }
                });
            }
        }

    }, [router.query.userCrctno, goPage]);

    /**
     * 프로필 변경
     * @param e
     */
    const fileChage = e => {

        const fileReader = new FileReader();

        if(e.target.files.length > 0) {

            fileReader.onload = e => {
                setPrflPrvImg(e.target.result );
            };
            setJoinInfo(prevState => ({...prevState, profile: e.target.files[0], atchFileUuid: ''}));

            fileReader.readAsDataURL(e.target.files[0]);
        }
    };

    /**
     * 다음 우편번호
     */
    const daumPostClick = () => {

        // 팝업 오픈
        setPopupClass(styles.active);

        new daum.Postcode({
            oncomplete: function(data) {
                // 팝업 close
                setPopupClass('');
                setJoinInfo(prevState => ({...prevState, addrTxt: data.roadAddress}));

                cmm.ajax({
                    url: `https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?addressFlag=F02&coordType=WGS84GEO&version=1&fullAddr=${encodeURIComponent(data.roadAddress)}&page=1&count=20`,
                    headers: {
                        appKey: process.env.NEXT_PUBLIC_TMAP_KEY
                    },
                    isExtr: true,
                    contextType: 'application/json',
                    success: res => {

                        if(!!res.coordinateInfo && !!res.coordinateInfo.coordinate && res.coordinateInfo.coordinate.length > 0) {
                            setJoinInfo(prevState => ({
                                ...prevState,
                                userStdoCd: data.bcode,
                                userZipc: data.zonecode,
                                userAddr: data.roadAddress,
                                userAddrLat: res.coordinateInfo.coordinate[0].newLon,
                                userAddrLot: res.coordinateInfo.coordinate[0].newLat,
                            }));
                        } else {

                            alert('주소 입력에 실패하였습니다.');
                        }
                    },
                    error: res => {

                        alert('주소 입력에 실패하였습니다.');
                    },
                });
            }
        }).embed(divDaumPost);
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
        } else {

            cmm.confirm(joinInfo.isLogin ? '개인정보를 수정하시겠습니까?' : '가입 진행하겠습니까?', () => {

                const call = param => {

                    cmm.ajax({
                        url: '/api/cmm/join',
                        data: param,
                        success: res => {

                            cmm.util.setLs(cmm.Cont.LOING_INFO, res);
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

                    call({...joinInfo, ...router.query});
                } else {

                    shopS3Upload(joinInfo.profile, res => {

                        const param = {...joinInfo, ...router.query};
                        param.atchFileUuid = res.atchFileUuid;
                        setJoinInfo(prevState => ({...prevState, atchFileUuid: res.atchFileUuid}));

                        call(param);
                    });
                }
            });
        }
    };

    return (
        <div className={styles.join}>
            <Head>
                <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" defer></script>
            </Head>
            <HeadTitle title={joinInfo.isLogin ? '개인정보수정' : ''} />
            {!joinInfo.isLogin &&
                <NaviStep step={3} />
            }
            <div className={styles.content} style={joinInfo.isLogin ? {paddingTop: '0px'} : {}}>
                {!joinInfo.isLogin &&
                    <h3>기본 정보 설정</h3>
                }
                <div className={styles.profile}>
                    <Image src={!!prflPrvImg ? prflPrvImg : "/assets/images/img/noProfile.svg"} alt={'프로필 사진'} width={96} height={96} />
                    <input id={'inpFile'} type={"file"} accept={'image/*'} onChange={fileChage} />
                    <label htmlFor={'inpFile'}>
                        사진업로드
                    </label>
                </div>
                <ul className={styles.info}>
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
                <p className={styles.infoTxt}>* 쇼퍼님의 현재 계신 곳을 중심으로 배치해줍니다.</p>
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={joinCompClick}>설정완료</button>
                </div>
            </div>
            <div className={styles.popup + ' ' + popupClass}>
                <HeadTitle title={'우편번호 검색'} type={'close'} callbackClose={() => setPopupClass('')} />
                <div className={styles.daumPost} id={'divDaumPost'}></div>
            </div>
        </div>
    );
}