import React, {useEffect, useState} from 'react';
import Image from "next/image";
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import BottomMenu from "../../components/bottomMenu";
import Link from "next/link";
import useCommon from "../../hooks/useCommon";
import {useRouter} from "next/router";
import LvlInfo from "../../components/mypage/lvlInfo";
import KakaoTalkChat from "../../components/kakaoTalkChat";

export default function MyPage() {

    const [myInfo, setMyInfo] = useState({
        SHPR_PRFL_FILE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNs/Q8AAg8Bhso7688AAAAASUVORK5CYII='
    });
    const [ntfy, setNtfy] = useState(false);
    const [isOpenLvlInfo, setIsOpenLvlInfo] = useState(false);
    const [loginInfo, setLoginInfo] = useState({});
    const router = useRouter();
    const {goPage} = useCommon();

    useEffect(() => {

        setLoginInfo(cmm.getLoginInfo());
        document.body.classList.add(styles.body);

        cmm.ajax({
            url: `/api/shpr/myInfo`,
            method: 'GET',
            success: res => {
                if(!!res) {

                    setMyInfo(res);
                    setNtfy(res.SHPR_NTFY_YN === 'Y');

                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, {...cmm.getLoginInfo(), ...{
                        SHPR_PRFL_FILE: res.SHPR_PRFL_FILE,
                        SHPR_NCNM: res.SHPR_NCNM,
                        SHPR_ADDR: res.SHPR_ADDR,
                    }});
                } else {
                    cmm.alert('로그인 후 이용가능합니다.<br/>로그인 화면으로 이동합니다.', () => {

                        goPage('/cmm/login');
                    });
                }
            }
        });

        return () => {

            document.body.classList.remove(styles.body);
        };
    }, []);

    /**
     * 로그 아웃
     */
    const logoutClick = () => {

        cmm.confirm('로그아웃 하시겠습니까?', () => {

            cmm.ajax({
                url: `/api/cmm/logout`,
                success: res => {

                    cmm.util.rmLs(cmm.Cont.LOGIN_INFO);
                    goPage('/cmm/login');
                }
            });

        });
    };

    /**
     * 회원 탈퇴
     */
    const mbScssClick = () => {

        cmm.confirm('<b style="color: red;font-weight: 700">탈퇴</b> 하시겠습니까?', () => {

            setTimeout(() => {

                cmm.confirm('정말로 <b style="color: red;font-weight: 700">탈퇴</b> 하시겠습니까?', () => {

                    cmm.ajax({
                        url: '/api/shpr/mbScss',
                        success: res => {

                            cmm.alert('탈퇴 되었습니다.', () => {

                                goPage('/cmm/login');
                            });
                        }
                    });
                });
            }, 100);
        });
    };

    /**
     * 업무 종료
     */
    const dutjEndHanler = () => {

        cmm.confirm('업무를 종료하시겠습니까?', () => {

            cmm.ajax({
                url: '/api/shpr/dutj',
                data: {
                    type: 'end'
                },
                success: res => {

                    // 리액트 앱일 경우
                    if(cmm.isReactApp()) {

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'LOCATION_INFO_CONSENT',
                            data: {
                                psitTnsmYn: false,
                            }
                        }))
                    }
                    router.push('/');
                }
            });
        });
    };

    /**
     * 알림 변경
     * @param e
     */
    const ntfyChangeHandler = e => {

        setNtfy(e.target.checked);
        cmm.ajax({
            url: `/api/shpr/myInfo`,
            method: 'PUT',
            data: {
                shprNtfyYn: e.target.checked ? 'Y' : 'N'
            },
            success: res => {
            }
        });
    };

    useEffect(() => {

        if(isOpenLvlInfo) {

            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.add('d-none');
            }
        } else {

            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        }
    }, [isOpenLvlInfo]);

    return (
        <div className={styles.mypage}>
            <div className={styles.head}>
                {!!myInfo.SHPR_PRFL_FILE &&
                    <div>
                        <img src={myInfo.SHPR_PRFL_FILE} width={48} height={48} alt={'프로필 사진'} />
                        {(!!myInfo.SHPR_GRD_CD && (myInfo.SHPR_GRD_CD.indexOf('HONEY') > -1 || myInfo.SHPR_GRD_CD.indexOf('BUMB') > -1)) &&
                            <Image alt={'등급'} className={styles.level} src={`/assets/images/icon/iconLvl${myInfo.SHPR_GRD_CD}.svg`}  width={24} height={24} />
                        }
                    </div>
                }
                <p>
                    반갑습니다.
                    {(!!myInfo.SHPR_GRD_CD && myInfo.SHPR_GRD_CD.indexOf('HONEY') > -1) &&
                        <span className={styles.shprGrdHoney}>허니비</span>
                    }
                    {(!!myInfo.SHPR_GRD_CD && myInfo.SHPR_GRD_CD.indexOf('BUMB') > -1) &&
                        <span className={styles.shprGrdBumb}>범블비</span>
                    }
                    쇼퍼님!
                    <span>{myInfo.SHPR_NCNM}</span>
                </p>
                {loginInfo?.SHPR_GRD_CD !== 'ETPS' &&
                    <div className={styles.info}>
                        <Link href={'#'} onClick={() => setIsOpenLvlInfo(true)}>
                            <Image alt={'등급확인'} src={'/assets/images/icon/iconInfoType01.svg'} width={14} height={14}/>
                            등급정보
                        </Link>
                        <span className={styles.point}>
                            <Image src={'/assets/images/icon/iconPoint.svg'} alt={'포인트 아이콘'} width={16} height={16} />
                            {cmm.util.comma(myInfo?.SHPR_POIN)}P
                        </span>
                    </div>
                }
            </div>
            {loginInfo?.SHPR_GRD_CD !== 'ETPS' &&
                <div className={styles.modInfo}>
                    <Link href={'/join/info'}>
                        <button type={'button'} className={'button short white'} >개인정보 수정</button>
                    </Link>
                </div>
            }
            <ul className={'ulType01'}>
                {loginInfo?.SHPR_GRD_CD !== 'ETPS' &&
                    <>
                    <li>
                        <Link href={'/mypage/delySchd'}>
                            <h5>일정관리</h5>
                            <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />
                        </Link>
                    </li>
                    <li>
                        <Link href={'/mypage/poinHity'}>
                            <h5>포인트 내역</h5>
                            <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />
                        </Link>
                    </li>
                    </>
                }
                <li>
                    <div>
                        <h5>알림</h5>
                        <span className={'toggleArea'}>
                            <input type="checkbox" id="toggleNtfy" hidden onChange={ntfyChangeHandler} checked={ntfy} />
                            <label htmlFor="toggleNtfy" className={'toggleSwitch'}>
                                <span className={'toggleButton'}></span>
                            </label>
                        </span>
                    </div>
                </li>
            </ul>
            <hr />
            <div className={styles.logout}>
                <button type={'button'} onClick={logoutClick}>로그아웃</button>
            </div>
            {loginInfo?.SHPR_GRD_CD !== 'ETPS' &&
                <div className={styles.mbScss}>
                    <p onClick={mbScssClick}>회원 탈퇴</p>
                </div>
            }
            <LvlInfo isOpenLvlInfo={isOpenLvlInfo} onClose={() => setIsOpenLvlInfo(false)} shprGrdCd={myInfo.SHPR_GRD_CD} />
            <KakaoTalkChat />
            <BottomMenu idx={3} />
        </div>
    );
}