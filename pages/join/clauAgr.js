import styles from "../../styles/join.module.css"
import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/router";
import useCommon from "../../hooks/useCommon";

export default function ClauAgr() {

    const [btnDisabled, setBtnDisabled] = useState(true);
    const router = useRouter();
    const {goPage} = useCommon();

    /**
     * 전체 약관 동의
     */
    const allChkChange = e => {

        clauAgrChk02.checked = e.target.checked;
        clauAgrChk03.checked = e.target.checked;
        clauAgrChk04.checked = e.target.checked;

        setBtnDisabled(!e.target.checked);
    };

    /**
     * 약관 동의
     */
    const chkChagne = () => {

        setBtnDisabled(!(clauAgrChk02.checked && clauAgrChk03.checked));
    };

    /**
     * 화면 이동
     */
    const goPageClick =() => {

        goPage('/join/cphone', router.query);
    };

    return (
        <div className={styles.join}>
            <HeadTitle />
            <NaviStep step={1} />
            <div className={styles.content}>
                <h3>약관 동의</h3>
                <p>쇼퍼 등록을 하기 위해서는 약관 동의가 필요합니다</p>
                <ul className={styles.clau}>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk01'} value={'01'} onChange={allChkChange} />
                        <label htmlFor={'clauAgrChk01'}>
                            <p>전체약관에 동의합니다</p>
                            <span>필수 및 선택정보에 대한 동의를 포함합니다</span>
                        </label>
                    </li>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk02'} value={'02'} onChange={chkChagne} />
                        <label htmlFor={'clauAgrChk02'}>
                            <p>서비스 이용약관 동의 <em>(필수)</em></p>
                        </label>
                        <Link href={'/2'}>
                            보기
                        </Link>
                    </li>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk03'} value={'03'} onChange={chkChagne} />
                        <label htmlFor={'clauAgrChk03'}>
                            <p>개인정보 수집 및 이용동의 <em>(필수)</em></p>
                        </label>
                        <Link href={'/2'}>
                            보기
                        </Link>
                    </li>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk04'} value={'04'} onChange={chkChagne} />
                        <label htmlFor={'clauAgrChk04'}>
                            <p>이벤트 및 광고 수신동의 (선택)</p>
                        </label>
                        <Link href={'/2'}>
                            보기
                        </Link>
                    </li>
                </ul>
                <div className={styles.btnArea}>
                    <button disabled={btnDisabled} type={"button"} onClick={goPageClick}>동의합니다.</button>
                </div>
            </div>
        </div>
    );
}