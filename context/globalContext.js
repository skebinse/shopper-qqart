import {createContext, useContext, useEffect, useState} from "react";
import {useRouter} from "next/router";
import cmm from "../js/common";
import useCommon from "../hooks/useCommon";

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
    const notLoginList = ['/cmm/login', '/join/clauAgr', '/join/cphone', '/join/cphoneAhrz', '/join/info'];

    useEffect(() => {

        if(notLoginList.indexOf(router.route) === -1) {

            console.log('is loing', cmm.checkLogin())
            // 로그인 체크
            if(!cmm.checkLogin()) {

                setSAlert(prevState => ({
                    ...prevState,
                    show: true,
                    txt: '로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.',
                    callback: () => router.push('/cmm/login'),
                }));
            } else if(cmm.date.getToday('') !== cmm.getLoginInfo('LOING_DT')) {

                cmm.ajax({
                    url: '/api/login',
                    data: {
                        encShprId: cmm.getLoginInfo('ENC_SHPR_ID'),
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

                            cmm.util.setLs(cmm.Cont.LOING_INFO, res);
                            router.reload();
                        }
                    }
                });
            }
        }
    }, []);

    return (
        <GlobalContext.Provider value={{sAlert, setSAlert, sConfirm, setSConfirm, isLoading, setIsLoading}}>
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobal = () => useContext(GlobalContext);