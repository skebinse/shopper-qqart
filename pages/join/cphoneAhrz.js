import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css";
import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import Common from "../../js/common";
import {useRouter} from "next/router";
import {hash} from "../../util/securityUtil";

export default function CphoneAhrz(props) {

    const router = useRouter();
    const $cmm = Common();

    const [btnDisabled, setBtnDisabled] = useState(true);
    const [vldtMiSs, setVldtMiSs] = useState('03:00');
    const [vldtSs, setVldtSs] = useState(180);
    const [cetino, setCetino] = useState('');
    const [authNoHash, setAuthNoHash] = useState(router.query.authNoHash);
    const [timer, setTimer] = useState(null);
    const cphoneNo = $cmm.util.hyphenTel(router.query.cphoneNo);

    // init
    useEffect(() => {

        const timer = setInterval(() => {

            setVldtSs(prevState => {

                if(prevState <= 0) {

                    clearInterval(timer);
                    $cmm.alert('인증번호 유효기간이 지났습니다. 재전송을 클릭하시기 바랍니다.');
                }

                return prevState - 1;
            });
        }, 1000);
        return () => {

            clearInterval(timer);
        }
    }, [$cmm]);

    // 재전송 시간 변경
    useEffect(() => {

        setVldtMiSs($cmm.util.lpad(String(Math.floor(vldtSs / 60)), 2, '0') + ':' + $cmm.util.lpad(String(Math.floor(vldtSs % 60)), 2, '0'));
    }, [vldtSs, $cmm]);

    // 인증번호 변경
    useEffect(() => {

        setBtnDisabled(cetino.length !== 4)
    }, [cetino]);

    /**
     * 인증번호 재전송
     */
    const cetinoRtrnClick = () => {

        $cmm.ajax({
            url: '/api/cmm/smsCetinoSend',
            data: {
                cphoneNo: router.query.cphoneNo
            },
            success: res => {
                setAuthNoHash(res);
            }
        });
    };

    /**
     * 인증번호 확인
     */
    const cetionCheckClick = () => {

        if(hash(cetino) === authNoHash) {

            $cmm.alert('인증되었습니다.', () => {

                $cmm.goPage('./info', {...router.query, cphoneNo: router.query.cphoneNo});
            });
        } else {

            $cmm.alert('인증번호가 다릅니다.');
        }
    };

    return (
        <div className={styles.join}>
            <HeadTitle />
            <NaviStep step={2} />
            <div className={styles.content}>
                <h3>인증번호 입력</h3>
                <p>{cphoneNo} 로 인증번호를 전송했습니다.<br/> 인증번호를 입력해주세요.</p>
                <ul className={styles.cetino}>
                    <li>
                        <label>인증번호</label>
                        <div>
                            <input id="cetino" value={cetino} onChange={e => setCetino(e.target.value)} type="tel" placeholder="숫자 4자리" maxLength={4} />
                            <span>{vldtMiSs}</span>
                            <a id="aReAuth" onClick={cetinoRtrnClick} >재전송</a>
                        </div>
                    </li>
                </ul>
                <div className={styles.btnArea}>
                    <button disabled={btnDisabled} type={"button"} onClick={cetionCheckClick}>다음으로</button>
                </div>
            </div>
        </div>
    );
}