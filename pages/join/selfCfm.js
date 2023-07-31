import React, {useEffect, useState} from 'react';
import cmm from "../../js/common";
import styles from "../../styles/join.module.css";
import HeadTitle from "../../components/headTitle";
import NaviStep from "../../components/naviStep";
import useCommon from "../../hooks/useCommon";

export default function SelfCfm() {

    const {goPage} = useCommon();
    const [danalTid, setDanalTid] = useState('');

    useEffect(() => {
        cmm.util.rmLs('selfCfm');

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
     * 본인 인증하기
     */
    const selfCfmHandler = () => {
        cmm.ajax({
            url: '/api/cmm/selfCfmReq',
            success: res => {

                if(res.RETURNCODE === '0000') {
                    setDanalTid(res.TID);
                } else {
                    cmm.alert('본인확인 초기화에 실패하였습니다.');
                }
            }
        });
    };

    useEffect(() => {
        console.log(danalTid);
        if(!!danalTid) {
            frmSelfCfm.submit();
        }
    }, [danalTid]);
    return (
        <div className={styles.join}>
            <HeadTitle callbackClose={() => goPage('/join/clauAgr')} />
            <NaviStep step={2} />
            <div className={styles.content}>
                <h3>본인인증</h3>
                <p>로그인을 위해 본인인증이 필요합니다</p>
                <button className={styles.btnSelfCfm} type={'button'} onClick={selfCfmHandler}>본인 인증하기</button>
            </div>
            <form id={'frmSelfCfm'} action={'https://wauth.teledit.com/Danal/WebAuth/Web/Start.php'} method={'POST'}>
                <input type={'hidden'} name={'TID'} value={danalTid} />
                <input type={'hidden'} name={'BgColor'} value={'00'} />
                <input type={'hidden'} name={'BackURL'} value={process.env.NEXT_PUBLIC_LOCAL_URL + '/join/selfCfm'} />
                <input type={'hidden'} name={'IsCharSet'} value={'EUC-KR'} />
                <input type={'hidden'} name={'ByBuffer'} value={'This value bypass to CPCGI Page'} />
                <input type={'hidden'} name={'ByAnyName'} value={'Anyvalue'} />
            </form>
        </div>
    );
}