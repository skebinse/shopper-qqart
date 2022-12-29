import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import styles from "../../styles/join.module.css";
import {useEffect, useState} from "react";
import Common from "../../js/common";
import {useRouter} from "next/router";
import {smsSend} from "../../util/smsUtil";
import {hash} from "../../util/securityUtil";
import Image from "next/image";

export default function CphoneAhrz() {

    const [btnDisabled, setBtnDisabled] = useState(true);
    const [delClass, setDelClass] = useState('d-none');
    const [cphoneNo, setCphoneNo] = useState('');

    const router = useRouter();
    const $cmm = Common();

    useEffect(() => {

        // 인증번호 버튼 활성화
        setBtnDisabled(cphoneNo.replace(/-/g, '').length < 10);

        if(cphoneNo.length > 0) {
            setDelClass('');

        } else {
            setDelClass('d-none');
        }
    }, [cphoneNo]);

    /**
     * 인증 번호 전송
     */
    const cetinoClick = () => {

        $cmm.ajax({
            url: '/api/cmm/smsCetinoSend',
            data: {
                cphoneNo
            },
            success: res => {

                $cmm.goPage('./cphoneAhrz', {...router.query, cphoneNo, authNoHash: res})
            }
        });
    };

    return (
        <div className={styles.join}>
            <HeadTitle />
            <NaviStep step={2} />
            <div className={styles.content}>
                <h3>휴대폰 인증</h3>
                <p>로그인을 위해 휴대폰 인증이 필요합니다.<br/> 본의 명의의 휴대폰 정보를 입력해주세요.</p>
                <ul className={styles.form}>
                    <li>
                        <label>휴대폰 번호</label>
                        <div>
                            <input id="cphoneNo" value={cphoneNo} onChange={e => setCphoneNo(e.target.value)} type="tel" onKeyUp={$cmm.event.formatTelEvent}
                                   placeholder="휴대폰 번호를 입력해주세요" maxLength={13} />
                            <button type="button" className={delClass} onClick={() => setCphoneNo('')}>
                                <Image alt={'삭제'} src="/assets/images/icon/iconDel.svg" width={8} height={8} />
                            </button>
                        </div>
                    </li>
                </ul>
                <div className={styles.btnArea}>
                    <button disabled={btnDisabled} type={"button"} onClick={cetinoClick}>인증번호 전송</button>
                </div>
            </div>
        </div>
    );
}