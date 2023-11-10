import styles from "../../styles/join.module.css"
import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import useCommon from "../../hooks/useCommon";
import cmm from "../../js/common";

export default function ClauAgr() {

    const [btnDisabled, setBtnDisabled] = useState(true);
    const router = useRouter();
    const {goPage} = useCommon();

    useEffect(() => {

        if(!!document.querySelector('#ch-plugin')) {
            document.querySelector('#ch-plugin').classList.add('d-none');
        }

        return () => {
            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        };
    }, []);

    /**
     * 전체 약관 동의
     */
    const allChkChange = e => {
        clauAgrChk02.checked = e.target.checked;
        clauAgrChk03.checked = e.target.checked;
        clauAgrChk04.checked = e.target.checked;
        clauAgrChk05.checked = e.target.checked;

        setBtnDisabled(!(clauAgrChk02.checked && clauAgrChk03.checked && clauAgrChk04.checked ));
    };

    /**
     * 약관 동의
     */
    const chkChagne = () => {

        // setBtnDisabled(!(clauAgrChk02.checked && clauAgrChk03.checked));
        setBtnDisabled(!(clauAgrChk02.checked && clauAgrChk03.checked && clauAgrChk04.checked ));
    };

    /**
     * 화면 이동
     */
    const goPageClick =() => {

        const joinInfoLS = cmm.util.getLs(cmm.Cont.JOIN_INFO);
        joinInfoLS.mktnAgrYn = !!document.querySelector('#clauAgrChk05').checked ? 'Y' : 'N'
        cmm.util.setLs(cmm.Cont.JOIN_INFO, joinInfoLS);

        goPage('/join/cphone');
        // goPage('/join/selfCfm');
    };

    return (
        <div className={styles.join}>
            <HeadTitle callbackClose={() => goPage('/cmm/login')}/>
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
                        <Link href={'/join/clauSvcUtlz'}>
                            보기
                        </Link>
                    </li>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk03'} value={'03'} onChange={chkChagne} />
                        <label htmlFor={'clauAgrChk03'}>
                            <p>위치기반 서비스 이용 약관 <em>(필수)</em></p>
                        </label>
                        <Link href={'/join/clauPsitUtlz'}>
                            보기
                        </Link>
                    </li>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk04'} value={'04'} onChange={chkChagne} />
                        <label htmlFor={'clauAgrChk04'}>
                            <p>개인정보 수집 이용 동의 <em>(필수)</em></p>
                        </label>
                        <Link href={'/join/clauIndvInfo'}>
                            보기
                        </Link>
                    </li>
                    <li>
                        <input type={'checkbox'} id={'clauAgrChk05'} value={'05'} />
                        <label htmlFor={'clauAgrChk05'}>
                            마케팅 정보 앱 푸시 알림 수신 동의 (선택)
                            <span>이벤트 및 혜택 정보를 받아보실 수 있어요.</span>
                        </label>
                    </li>
                </ul>
                <div className={styles.btnArea}>
                    <button disabled={btnDisabled} type={"button"} onClick={goPageClick}>동의합니다.</button>
                </div>
            </div>
        </div>
    );
}