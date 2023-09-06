import React, {useEffect, useState} from 'react';
import Image from "next/image";
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import BottomMenu from "../../components/bottomMenu";
import Link from "next/link";
import useCommon from "../../hooks/useCommon";
import {useRouter} from "next/router";

export default function MyPage() {

    const [myInfo, setMyInfo] = useState({
        SHPR_PRFL_FILE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNs/Q8AAg8Bhso7688AAAAASUVORK5CYII='
    });
    const [ntfy, setNtfy] = useState(false);
    const router = useRouter();
    const {goPage} = useCommon();

    useEffect(() => {

        document.body.classList.add(styles.body);

        cmm.ajax({
            url: `/api/cmm/myInfo`,
            method: 'GET',
            success: res => {
                if(!!res) {

                    setMyInfo(res);
                    setNtfy(res.SHPR_NTFY_YN === 'Y');
                } else {
                    cmm.alert('없는 계정입니다.');
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

            cmm.util.rmLs(cmm.Cont.LOGIN_INFO);
            goPage('/cmm/login');
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
                        url: '/api/cmm/mbScss',
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
                url: '/api/cmm/dutj',
                data: {
                    type: 'end'
                },
                success: res => {

                    // 리액트 앱일 경우
                    if(cmm.isReactApp()) {

                        window.postMessage(JSON.stringify({
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
            url: `/api/cmm/myInfo`,
            method: 'PUT',
            data: {
                shprNtfyYn: e.target.checked ? 'Y' : 'N'
            },
            success: res => {
            }
        });
    };

    return (
        <div className={styles.mypage}>
            <div className={styles.head}>
                {!!myInfo.SHPR_PRFL_FILE &&
                    <Image src={myInfo.SHPR_PRFL_FILE} width={48} height={48} alt={'프로필 사진'} />
                }
                <p>
                    반갑습니다. 쇼퍼님!
                    <span>{myInfo.SHPR_NCNM}</span>
                    <span className={styles.point}>
                        <Image src={'/assets/images/icon/iconPoint.svg'} alt={'포인트 아이콘'} width={16} height={16} />
                        {cmm.util.comma(myInfo?.SHPR_POIN)}P
                    </span>
                </p>
                <Link href={'/join/info'}>
                    <button type={'button'} className={'button short white'} >개인정보 수정</button>
                </Link>
            </div>
            <div className={styles.dutjEndDiv}>
                <button type="button" className={'button'} onClick={dutjEndHanler}>업무 종료</button>
            </div>
            <ul className={'ulType01'}>
                <li>
                    <Link href={'/mypage/delySchd'}>
                        <h5>일정관리</h5>
                        <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />
                    </Link>
                </li>
                <li>
                    <Link href={'/mag/annc'}>
                        <h5>공지사항/이벤트</h5>
                        <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />
                    </Link>
                </li>
                {/*<li>*/}
                {/*    <div>*/}
                {/*        <h5>알림</h5>*/}
                {/*        <span className={'toggleArea'}>*/}
                {/*            <input type="checkbox" id="toggleNtfy" hidden onChange={ntfyChangeHandler} checked={ntfy} />*/}
                {/*            <label htmlFor="toggleNtfy" className={'toggleSwitch'}>*/}
                {/*                <span className={'toggleButton'}></span>*/}
                {/*            </label>*/}
                {/*        </span>*/}
                {/*    </div>*/}
                {/*</li>*/}
            </ul>
            <hr />
            <div className={styles.logout}>
                <button type={'button'} onClick={logoutClick}>로그아웃</button>
            </div>
            <p onClick={mbScssClick}>회원 탈퇴</p>
            <BottomMenu idx={2} />
        </div>
    );
}