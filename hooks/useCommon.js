import {useCallback} from "react";
import cmm from "../js/common";
import {useGlobal} from "../context/globalContext";
import {useRouter} from "next/router";

export default function useCommon() {

    const router = useRouter();

    /**
     * 로그인 여부
     * @param isMove142
     * @returns {boolean}
     */
    const goCheckLogin = useCallback(() => {

        const isLogin = cmm.checkLogin();
        if(!cmm.checkLogin()) {

            cmm.alert('로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.', function () {
                router.push('/cmm/login');
            });
        }

        return isLogin;
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

    /**
     * 화면 이동
     * @param url
     * @param param
     */
    const goReplacePage = useCallback((url, param) => {

        if(!!param) {

            router.replace({
                pathname: url,
                query: param
            }, url);
        } else {

            router.replace(url);
        }
    }, []);

    return {goCheckLogin, goPage, goReplacePage};
}