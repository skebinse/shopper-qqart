import React, {useEffect, useState} from 'react';
import Image from "next/image";
import cmm from "../../js/common";
import styles from "../../styles/mypage.module.css"
import BottomMenu from "../../components/bottomMenu";
import Link from "next/link";
import useCommon from "../../hooks/useCommon";

export default function MyPage() {

    const [myInfo, setMyInfo] = useState({});
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

            cmm.util.rmLs(cmm.Cont.LOING_INFO);
            goPage('/cmm/login');
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
           <ul className={'ulType01'}>
               <li>
                   <Link href={'/btch/comp'}>
                       <h5>완료된 배치</h5>
                       <Image src={'/assets/images/icon/iconArrowR.svg'} width={9} height={16} alt={'바로가기'} />
                   </Link>
               </li>
           </ul>
           <hr />
           <div className={styles.logout}>
               <button type={'button'} onClick={logoutClick}>로그아웃</button>
           </div>
           <BottomMenu idx={1} />
       </div>
    );
}