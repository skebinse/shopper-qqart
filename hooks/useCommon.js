import {useCallback} from "react";
import cmm from "../js/common";
import {useGlobal} from "../context/globalContext";
import {useRouter} from "next/router";

export default function useCommon() {

    const {setSAlert, setSConfirm, setIsLoading} = useGlobal();
    const router = useRouter();
    //
    // /**
    //  * ajax 통신
    //  * @param options
    //  */
    // const fontAjax = useCallback((options) => {
    //
    //     const _options = {
    //         method: 'POST',
    //         contextType: 'application/x-www-form-urlencoded',
    //         dataType: '',
    //         isLoaing: true,
    //         isExtr: false,
    //         headers: {},
    //         body: undefined,
    //     };
    //
    //     Object.entries(options).forEach(item => _options[item[0]] = item[1]);
    //
    //     if(!!_options.isLoaing) {
    //
    //         setIsLoading(true);
    //     }
    //
    //     const init = {
    //         method: _options.method,
    //         headers: _options.headers,
    //         body: _options.body,
    //     };
    //
    //     if(cmm.checkLogin()) {
    //         init.headers['X-ENC-USER-ID'] = cmm.getLoginInfo('ENC_SHPR_ID');
    //     }
    //
    //     // JSON 타입일 경우
    //     if(_options.dataType === 'json') {
    //
    //         init.headers.contextType = 'application/json';
    //         init.body = JSON.stringify(_options.data);
    //     } else if(!!_options.formData) {
    //
    //         const formData = new FormData();
    //
    //         Object.entries(_options.formData).forEach(item => {
    //             formData.append(item[0], item[1]);
    //         });
    //
    //         init.body = formData;
    //     } else {
    //
    //         init.headers.contextType = _options.contextType;
    //         init.body = !!_options.data ? new URLSearchParams(_options.data) : undefined;
    //     }
    //
    //     fetch(_options.url, init).then(res => res.json())
    //         .then(res => {
    //
    //             if(!!_options.isExtr) {
    //
    //                 _options.success(res);
    //             } else {
    //
    //                 if(res.resultCode === '0000') {
    //
    //                     if(!!_options.success) {
    //
    //                         _options.success(res.data);
    //                     }
    //                 } else {
    //
    //                     alert(res.resultMsg);
    //                 }
    //             }
    //         })
    //         .catch(err => {
    //
    //             if(!!_options.error) {
    //
    //                 _options.error();
    //             }
    //         })
    //         .finally(() => {
    //
    //             if(!!_options.isLoaing) {
    //
    //                 setIsLoading(false);
    //             }
    //         });
    // }, []);
    //
    // /**
    //  * Alert
    //  * @param txt
    //  * @param callback
    //  */
    // const alert = useCallback((txt, callback) => {
    //
    //     setSAlert(prevState => ({...prevState, show: true, txt, callback}))
    // }, []);
    //
    // /**
    //  * Confirm
    //  * @type {(function(*, *, *, *): void)|*}
    //  */
    // const confirm = useCallback((txt, callbackOk, callbackCancel, title) => {
    //
    //     setSConfirm(prevState => ({...prevState, show: true, txt, callbackOk, callbackCancel, title}));
    // }, []);

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

    return {goCheckLogin, goPage};
}