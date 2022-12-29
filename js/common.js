import {useGlobal} from "../context/globalContext";
import {useS3Upload} from "next-s3-upload";
import {useRouter} from "next/router";

export const $cmm = {

    /**
     * 전역 변수 및 상수
     */
    Cont: {
        LOING_INFO: 'shooperLoginInfo',
    },
    /**
     * ajax 통신
     * @param options
     */
    ajax: (options) => {

        const _options = {
            method: 'POST',
            contextType: 'application/x-www-form-urlencoded',
            dataType: '',
            body: undefined,
        };

        Object.entries(options).forEach(item => _options[item[0]] = item[1]);

        const init = {
            method: _options.method,
            headers: {},
            body: _options.body,
        };

        // JSON 타입일 경우
        if(_options.dataType === 'json') {

            init.headers.contextType = 'application/json';
            init.body = JSON.stringify(_options.data);
        } else if(!!_options.formData) {

            const formData = new FormData();

            Object.entries(_options.formData).forEach(item => {
                formData.append(item[0], item[1]);
            });

            init.body = formData;
        } else {

            init.headers.contextType = _options.contextType;
            init.body = !!_options.data ? new URLSearchParams(_options.data) : undefined;
        }

        fetch(_options.url, init).then(res => res.json())
            .then(data => {
                if(!!_options.success) {

                    _options.success(data)
                }
            })
            .catch(err => {

                if(!!_options.error) {

                    _options.error();
                }
            });
    },

    /**
     * 로그인 정보
     * @param key
     * @returns {any}
     */
    getLoginInfo: function (key) {

        const loginInfo = !!$cmm.util.getLs($cmm.Cont.LOING_INFO) ? $cmm.util.getLs($cmm.Cont.LOING_INFO) : {};

        if(!!key) {

            return loginInfo[key];
        } else {

            return loginInfo;
        }
    },

    /**
     * Util
     */
    util: {

        /**
         * 메일 형식 체크
         * @param value
         * @returns {boolean}
         */
        checkMail : function(value) {

            var regExp=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
            return regExp.test(value);
        },

        /**
         * 전화번호 하이픈
         * @param value
         * @returns {string|*}
         */
        hyphenTel: function (value) {

            if(!!value) {

                return value.replace(/[^0-9]/g, '')
                    .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
            } else {

                return '';
            }
        },

        /**
         * 문자열에 앞에 특정문자를 붙여 정해진 길이 문자열을 반환한다.
         * @param str
         * @param len
         * @param padStr
         * @returns {string|*}
         */
        lpad : function(str, len, padStr){
            if(str == null){return str;};

            str = String(str);

            if(str.length >= len){
                return str;
            }

            var sb = [];
            for(var i=0;i < len-str.length; i+=padStr.length){
                sb.push(padStr);
            }
            sb.push(str);
            return sb.join('');
        },

        /**
         * 로컬 스토리지에서 조회.
         * @param key
         * @returns {any}
         */
        getLs : function(key) {

            return JSON.parse(window.localStorage.getItem(key));
        },

        /**
         * 로컬 스토리지에 저장.
         * @param key
         * @param val
         */
        setLs : function(key, val) {
            window.localStorage.setItem(key, JSON.stringify(val));
        },

        /**
         * 로컬 스토리지에 삭제
         * @param key
         */
        rmLs : function(key) {
            window.localStorage.removeItem(key);
        },
    },

    /**
     * Event
     */
    event: {

        /**
         * 전화번호 포맷
         * @param e
         */
        formatTelEvent: e => {

            e.target.value = $cmm.util.hyphenTel(e.target.value);
        },
    },
};

const Common = () => {

    const {setSAlert, setSConfirm} = useGlobal();
    const {uploadToS3} = useS3Upload();
    const router = useRouter();

    /**
     * Alert
     * @param txt
     * @param callback
     */
    $cmm.alert = (txt, callback) => {

        setSAlert(prevState => ({...prevState, show: true, txt, callback}))
    };

    /**
     * Confirm
     * @param txt
     * @param callbackOk
     * @param callbackCancel
     */
    $cmm.confirm = (txt, callbackOk, callbackCancel) => {

        setSConfirm(prevState => ({...prevState, show: true, txt, callbackOk, callbackCancel}));
    };

    /**
     * 파일 업로드
     * @param files
     * @param callback
     */
    $cmm.upload = (files, callback) => {

        (async () => {

            const uploadList = [];
            const func = async (file) => {

                const upload = await uploadToS3(file);
                const pathIdx = upload.key.match(/\/[0-9]{6}\//).index;
                console.log(file)
                upload.atchFileActlNm = file.name;
                upload.atchFileSrvrNm = upload.key.substring(pathIdx + 8);
                upload.atchFileSrvrPath = upload.key.substring(0, pathIdx + 7);
                upload.atchFileEts = file.name.substring(file.name.lastIndexOf('.') + 1);
                upload.atchFileSiz = file.size;

                uploadList.push(upload);
            }

            if(Array.isArray(files)) {

                for await (const file of files) {

                    await func(file);
                }
            } else {

                await func(files);
            }

            $cmm.ajax({
                url: '/api/cmm/upload',
                dataType: 'json',
                data: uploadList,
                success: res => {

                    !!callback && callback(res);
                }
            });
        })();
    };


    /**
     * 로그인 여부
     * @param isMove
     * @returns {boolean}
     */
    $cmm.checkLogin = () => {

        const isLogin = !!$cmm.util.getLs($cmm.Cont.LOING_INFO) && !!$cmm.util.getLs($cmm.Cont.LOING_INFO).SHPR_ID;
        if(!isLogin && !!router) {

            $cmm.alert('로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.', function () {
                router.push('/cmm/login')
            });
        }

        return isLogin;
    };

    /**
     * 화면 이동
     * @param url
     * @param param
     */
    $cmm.goPage = (url, param) => {

        if(!!param) {

            router.push({
                pathname: url,
                query: param
            }, url);
        } else {

            router.push(url);
        }
    };

    return $cmm;
};

export default Common;