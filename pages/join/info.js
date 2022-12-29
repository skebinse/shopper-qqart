import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css"
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Head from "next/head";
import Common from "../../js/common";
import {useS3Upload} from "next-s3-upload";
import Image from "next/image";

export default function Info() {

    const router = useRouter();
    const $cmm = Common();
    const [prflPrvImg, setPrflPrvImg] = useState('');
    const [popupClass, setPopupClass] = useState('');
    const [joinInfo, setJoinInfo] = useState({
        cphoneNo: router.query.cphoneNo,
        userNcnm: '',
        shprSfitdText: '',
        profile: '',
    });
    const {uploadToS3} = useS3Upload();

    useEffect(() => {
        console.log(joinInfo);
    }, [joinInfo]);

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
                psArea.innerHTML = data.roadAddress;

                const options = {
                    method: 'GET',
                    headers: {accept: 'application/json', appKey: 'l7xx7eddba679e184d3287a0a2a7b191d865'}
                };

                fetch(`https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?addressFlag=F02&coordType=WGS84GEO&version=1&fullAddr=${encodeURIComponent(data.roadAddress)}&page=1&count=20`, options)
                    .then(response => response.json())
                    .then(res => {

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

                            $cmm.alert('주소 입력에 실패하였습니다.');
                        }
                    })
                    .catch(err => {
                        $cmm.alert('주소 입력에 실패하였습니다.');
                    });
            }
        }).embed(divDaumPost);
    };

    /**
     * 가입
     */
    const joinCompClick = () => {

        if(!joinInfo.profile) {

            $cmm.alert('사진을 등록해 주세요.');
        } else {

            const call = param => {

                $cmm.ajax({
                    url: '/api/cmm/join',
                    data: param,
                    success: res => {

                        $cmm.util.setLs($cmm.Cont.LOING_INFO, res);
                        $cmm.goPage('./comp');
                    }
                });
            };

            if(!!joinInfo.atchFileUuid) {

                call({...joinInfo, ...router.query});
            } else {

                $cmm.upload(joinInfo.profile, res => {

                    const param = {...joinInfo, ...router.query};
                    param.atchFileUuid = res.atchFileUuid;
                    setJoinInfo(prevState => ({...prevState, atchFileUuid: res.atchFileUuid}));

                    call(param);
                });
            }
        }
    };

    return (
        <div className={styles.join}>
            <Head>
                <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" defer></script>
            </Head>
            <HeadTitle />
            <NaviStep step={3} />
            <div className={styles.content}>
                <h3>기본 정보 설정</h3>
                <div className={styles.profile}>
                    <Image src={!!prflPrvImg ? prflPrvImg : "/assets/images/img/noProfile.svg"} alt={'프로필 사진'} />
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
                            <p id="psArea"><span>주소를 입력해주세요.</span></p>
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