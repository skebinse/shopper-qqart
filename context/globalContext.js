import {createContext, useContext, useEffect, useState} from "react";
import {useRouter} from "next/router";
import cmm from "../js/common";

const GlobalContext = createContext();

export function GlobalProvider({children}) {

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [sAlert, setSAlert] = useState({
        show: false,
        title: '알림',
        txt: '',
        callback: null,
    });
    const [sConfirm, setSConfirm] = useState({
        show: false,
        title: '확인',
        txt: '',
        callbackOk: null,
        callbackCancel: null,
    });
    const notLoginList = ['/cmm/login', '/cmm/login2', '/join/clauAgr', '/join/cphone', '/join/cphoneAhrz', '/join/info', '/join/reg'];

    /**
     * 로그인 정보 갱신
     */
    const loginInfoRnw = () => {

        cmm.ajax({
            url: '/api/login',
            data: {
                encShprId: cmm.getLoginInfo('ENC_SHPR_ID'),
                appToken: cmm.util.getLs(cmm.Cont.APP_TOKEN),
            },
            success: res => {

                // 가입되지 않은 계정
                if(res.IS_LOGIN === 0) {

                    setSAlert(prevState => ({
                        ...prevState,
                        show: true,
                        txt: '로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.',
                        callback: () => router.push('/cmm/login'),
                    }));
                } else {

                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                    router.reload();
                }
            }
        });
    };

    useEffect(() => {

        if(cmm.isApp()) {
            // PUSH Token
            cmm.app.getPushToken(() => {
                if(!!cmm.checkLogin() && cmm.date.getToday('') !== cmm.getLoginInfo('LOING_DT')) {

                    // 로그인 정보 갱신
                    loginInfoRnw();
                }
            });
        }

        if(notLoginList.indexOf(router.route) === -1) {

            // 로그인 체크
            if(!cmm.checkLogin()) {

                setSAlert(prevState => ({
                    ...prevState,
                    show: true,
                    txt: '로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.',
                    callback: () => router.push('/cmm/login'),
                }));
            } else if(cmm.date.getToday('') !== cmm.getLoginInfo('LOING_DT')) {

                if(!cmm.isApp()) {

                    // 로그인 정보 갱신
                    loginInfoRnw();
                }
            }
        }
    }, []);

    return (
        <GlobalContext.Provider value={{sAlert, setSAlert, sConfirm, setSConfirm, isLoading, setIsLoading}}>
            <div className={'webPushDiv'}>
                <div>
                    <p id={'webPushTxt'}></p>
                    <a id={'webPushHref'} href={''}></a>
                </div>
                <img src={'/assets/images/btn/btnDel.svg'} width={20} height={20} onClick={() => document.querySelector('.webPushDiv').classList = 'webPushDiv'} />
            </div>
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobal = () => useContext(GlobalContext);