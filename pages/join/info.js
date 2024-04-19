import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css"
import React, {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import Image from "next/image";
import useShopS3Upload from "../../hooks/useShopS3Upload";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";
import Script from "next/script";
import Select from "react-select";

export default function Info() {

    const router = useRouter();
    const shopS3Upload = useShopS3Upload();
    const [prflPrvImg, setPrflPrvImg] = useState('');
    const [popupClass, setPopupClass] = useState('');
    const [joinInfoLS, setJoinInfoLS] = useState({});
    const [isBankPopup, setIsBankPopup] = useState(false);
    const [carKdList, setCarKdList] = useState([]);
    const [joinInfo, setJoinInfo] = useState({
        inpBankCd: '',
        inpBankNum: '',
        shprVhclNm: '',
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

    const options = [
        {value: '0002', label: '산업은행'},
        {value: '0003', label: '기업은행'},
        {value: '0004', label: '국민은행'},
        {value: '0007', label: '수협중앙회'},
        {value: '0011', label: '농협은행'},
        {value: '0012', label: '지역농축협'},
        {value: '0020', label: '우리은행'},
        {value: '0023', label: 'SC은행'},
        {value: '0027', label: '씨티은행'},
        {value: '0031', label: '대구은행'},
        {value: '0032', label: '부산은행'},
        {value: '0034', label: '광주은행'},
        {value: '0035', label: '제주은행'},
        {value: '0037', label: '전북은행'},
        {value: '0039', label: '경남은행'},
        {value: '0045', label: '새마을금고'},
        {value: '0048', label: '신협'},
        {value: '0050', label: '저축은행'},
        {value: '0054', label: 'HSBC'},
        {value: '0055', label: '도이치은행'},
        {value: '0057', label: 'JP모간'},
        {value: '0060', label: 'BOA은행'},
        {value: '0061', label: 'BNP 은행'},
        {value: '0062', label: 'ICBC'},
        {value: '0064', label: '산림조합'},
        {value: '0067', label: 'CCB'},
        {value: '0071', label: '우체국'},
        {value: '0081', label: '하나은행'},
        {value: '0088', label: '신한은행'},
        {value: '0089', label: '케이뱅크'},
        {value: '0090', label: '카카오뱅크'},
        {value: '0092', label: '토스뱅크'},
    ]
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
                    url: '/api/cmm/commCdList',
                    data: {
                        cdSppoId: 208
                    },
                    success: res => {

                        setCarKdList(res.map(item => ({value: item.CD_NM, label: item.CD_NM})));

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
                                    shprVhclKd: res.SHPR_VHCL_KD,
                                    shprVhclNm: res.SHPR_VHCL_NM,
                                    shprVhclNo: res.SHPR_VHCL_NO,
                                    shprBankNm: res.SHPR_BANK_NM,
                                    shprBankAcno: res.SHPR_BANK_ACNO,
                                    shprBrdt: res.SHPR_BRDT,
                                    shprName: res.SHPR_NAME,
                                });
                                setPrflPrvImg(res.SHPR_PRFL_FILE);
                            }
                        });
                    },
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
        } else if(!joinInfo.shprVhclKd) {

            cmm.alert('차종을 선택해 주세요.');
        } else if(!joinInfo.shprVhclNm) {

            cmm.alert('차량명을 입력해 주세요.');
        } else if(!joinInfo.shprVhclNo) {

            cmm.alert('차량번호를 입력해 주세요.');
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

    /**
     * 저장
     */
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

    /**
     * 은행 변경 팝업 호출
     */
    const bankPopupHandler = () => {

        setIsBankPopup(true);
    };

    /**
     * 은행 변경
     */
    const bankChageHandler = () => {

        if(!joinInfo.inpBankCd) {

            cmm.alert('은행을 선택해 주세요.');
        } else if(!joinInfo.inpBankNm) {

            cmm.alert('통장번호를 입랙혀 주세요.');
        } else {

            cmm.confirm('은행을 변경하시겠습니까?', () => {

                cmm.ajax({
                    url: '/api/join/bnkbSelfAhrz',
                    data: {
                        bankCd: joinInfo.inpBankCd,
                        bankNum: joinInfo.inpBankNum,
                    },
                    success: res => {

                        if(res) {

                            cmm.ajax({
                                url: '/api/shpr/modBank',
                                data: {
                                    bankNm: joinInfo.inpBankNm,
                                    bankNum: joinInfo.inpBankNum,
                                },
                                success: res => {

                                    cmm.alert('저장 되었습니다.', () => {

                                        router.reload();
                                    });
                                }
                            });
                        }
                    }
                });
            });

        }
    };

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
                            <input id="ncnm" value={joinInfo.userNcnm}
                                   onChange={e => setJoinInfo(prevState => ({...prevState, userNcnm: e.target.value}))}
                                   type="text" placeholder="닉네임을 입력해주세요" maxLength={8}/>
                        </div>
                    </li>
                    <li>
                        <label>차종</label>
                        <div className={styles.select2}>
                            <Select placeholder={'차종을 선택해 주세요'}
                                value={!!joinInfo.shprVhclKd ? {label: joinInfo.shprVhclKd, value: joinInfo.shprVhclKd} : null}
                                onChange={e => setJoinInfo(prevState => ({
                                    ...prevState,
                                    shprVhclKd: e.label,
                                }))} options={carKdList}/>
                        </div>
                    </li>
                    <li>
                        <label>차량명</label>
                        <div>
                            <input value={joinInfo.shprVhclNm}
                               onChange={e => setJoinInfo(prevState => ({
                                   ...prevState,
                                   shprVhclNm: e.target.value
                               }))}
                               type="text" placeholder="차량명을 입력해 주세요"/>
                        </div>
                    </li>
                    <li>
                        <label>차량 번호</label>
                        <div>
                            <input value={joinInfo.shprVhclNo}
                               onChange={e => setJoinInfo(prevState => ({
                                   ...prevState,
                                   shprVhclNo: e.target.value
                               }))}
                               type="text" placeholder="123퀵4567"/>
                        </div>
                    </li>
                    {!!joinInfo.shprBrdt &&
                        <li>
                            <label>은행/계좌정보</label>
                            <div className={styles.zip}>
                                <p>
                                    {!!joinInfo.bankNm &&
                                        <>
                                            {joinInfo.bankNm} / {joinInfo.bankNum}
                                        </>
                                    }
                                    {!!joinInfo.shprBankNm &&
                                        <>
                                            {joinInfo.shprBankNm} / {joinInfo.shprBankAcno}
                                        </>
                                    }
                                </p>
                                <button type={'button'} onClick={bankPopupHandler}>수정</button>
                            </div>
                        </li>
                    }
                    <li>
                        <label>자기소개</label>
                        <div>
                            <textarea id="sfitd" value={joinInfo.shprSfitdText} onChange={e => {
                                if (e.target.value.length <= 50) {

                                    setJoinInfo(prevState => ({...prevState, shprSfitdText: e.target.value}));
                                }
                            }} placeholder="멋진 쇼퍼님을 표현해주세요." rows={3} maxLength={50}/>
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
                            <input id="shprDelyPosDtc" value={joinInfo.shprDelyPosDtc}
                                   onChange={e => setJoinInfo(prevState => ({
                                       ...prevState,
                                       shprDelyPosDtc: e.target.value
                                   }))} type="number"/>
                        </div>
                    </li>
                </ul>
                <p className={styles.infoTxt}>* 설정한 지역을 중심으로 배치를 확인하실 수 있습니다.</p>
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={joinCompClick}>{joinInfo.isLogin ? '설정완료' : '가입하기'}</button>
                </div>
            </div>
            <div className={styles.popup + ' ' + popupClass}>
                <HeadTitle title={'우편번호 검색'} type={'close'} callbackClose={() => setPopupClass('')}/>
                <div className={styles.daumPost} id={'divDaumPost'}></div>
            </div>
            {isBankPopup &&
                <div className={'confirmArea ' + styles.bankInfo}>
                    <div>
                        <h3>은행 변경</h3>
                        <div>
                            <ul>
                                <li>
                                    <label>예금주</label>
                                    <div>
                                        <input value={joinInfo.shprName} disabled={true} />
                                    </div>
                                </li>
                                <li>
                                    <label>차종</label>
                                    <div className={styles.select2}>
                                        <Select placeholder={'은행을 선택해 주세요'}
                                                value={!!joinInfo.inpBankCd ? {
                                                    label: joinInfo.inpBankNm,
                                                    value: joinInfo.inpBankCd
                                                } : null}
                                                onChange={e => setJoinInfo(prevState => ({
                                                    ...prevState,
                                                    inpBankCd: e.value,
                                                    inpBankNm: e.label
                                                }))} options={options}/>
                                    </div>
                                </li>
                                <li>
                                    <label>통장번호</label>
                                    <div>
                                        <input value={joinInfo.inpBankNum}
                                            onChange={e => setJoinInfo(prevState => ({
                                                   ...prevState,
                                                   inpBankNum: e.target.value
                                               }))}
                                               type="text" placeholder="통장번호를 입력해 주세요"/>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <button className='button white mr16' type="button" onClick={() => setIsBankPopup(false)}>취소
                            </button>
                            <button className='button' type="button" onClick={bankChageHandler}>저장</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}