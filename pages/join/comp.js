import Link from "next/link";
import styles from "../../styles/join.module.css"
import {useEffect, useState} from "react";
import Image from "next/image";
import cmm from "../../js/common";

export default function Comp() {

    const [shprNcnm, setShprNcnm] = useState();

    useEffect(() => {

        setShprNcnm(cmm.getLoginInfo('SHPR_NCNM'));
    }, []);

    return (
        <div className={styles.join}>
            <Image alt={'로고'} src="/assets/images/logoGreen.svg" width={241} height={52} />
            <h3>쇼퍼 등록 완료</h3>
            <p>
                <em>{shprNcnm}</em>님의 첫 출발을 진심으로<br/>
                축하드립니다.<br/>
                앞으로 쇼퍼님의 큰 활약을 기대하겠습니다.
            </p>
            <Link href={'/'}>
                메인으로
            </Link>
            <p className={styles.callInfo}>
                <em>1533-9171</em>
                위 번호로 전화를 드리면<br/>
                꼭 받아주세요.
            </p>
        </div>
    );
}