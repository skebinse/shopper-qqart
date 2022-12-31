import {useCallback} from "react";
import $cmm from "../js/common";
import {useGlobal} from "../context/globalContext";
import {useRouter} from "next/router";

export default function useCommon() {

    const {setSAlert, setSConfirm} = useGlobal();
    const router = useRouter();

    /**
     * Alert
     * @param txt
     * @param callback
     */
    const alert = useCallback((txt, callback) => {

        setSAlert(prevState => ({...prevState, show: true, txt, callback}))
    }, []);

    /**
     * Confirm
     * @param txt
     * @param callbackOk
     * @param callbackCancel
     */
    const confirm = useCallback((txt, callbackOk, callbackCancel) => {

        setSConfirm(prevState => ({...prevState, show: true, txt, callbackOk, callbackCancel}));
    }, []);

    /**
     * 로그인 여부
     * @param isMove142
     * @returns {boolean}
     */
    const goCheckLogin = useCallback((isMove) => {

        if(!$cmm.checkLogin()) {

            alert('로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.', function () {
                router.push('/cmm/login');
            });
        }
    }, []);

    /**
     * 화면 이동
     * @param url
     * @param param
     */
    const goPage = useCallback((url, param) => {

        if(!!param) {

            router.push({
                pathname: url,
                query: param
            }, url);
        } else {

            router.push(url);
        }
    }, []);

    return {alert, confirm, goCheckLogin, goPage};
}