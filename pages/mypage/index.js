import React, {useEffect, useState} from 'react';
import Image from "next/image";
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import BottomMenu from "../../components/bottomMenu";
import Link from "next/link";
import useCommon from "../../hooks/useCommon";
import {useRouter} from "next/router";

export default function MyPage() {

    const [myInfo, setMyInfo] = useState({});
    const router = useRouter();
    const {goPage} = useCommon();

    useEffect(() => {

        document.body.classList.add(styles.body);
        setMyInfo(cmm.getLoginInfo());
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

        cmm.confirm('탈퇴 하시겠습니까?', () => {

            cmm.ajax({
                url: '/api/cmm/mbScss',
                success: res => {

                    cmm.alert('탈퇴 되었습니다.', () => {

                        goPage('/cmm/login');
                    });
                }
            });
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

                    router.push('/');
                }
            });
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
                </p>
                <Link href={'/join/info'}>
                    <button type={'button'} className={'button short white'} >개인정보 수정</button>
                </Link>
            </div>
            <div className={styles.dutjEndDiv}>
                <button type="button" className={'button'} onClick={dutjEndHanler}>업무 종료</button>
            </div>
            <ul className={'ulType01'}>
                {/*<li>*/}
                {/*    <Link href={'/mypage/delySchd'}>*/}
                {/*        <h5>일정관리</h5>*/}
                {/*        <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />*/}
                {/*    </Link>*/}
                {/*</li>*/}
                <li>
                    <Link href={'/mag/annc'}>
                        <h5>공지사항/이벤트</h5>
                        <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />
                    </Link>
                </li>
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