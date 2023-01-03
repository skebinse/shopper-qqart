
const $cmm = {

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
    ajax: async (options) => {

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

        if(typeof window !== 'undefined' && $cmm.checkLogin()) {
            init.headers['X-ENC-USER-ID'] = $cmm.getLoginInfo('ENC_SHPR_ID');
        }

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

        const res = await fetch(_options.url, init);
        const data = await res.json();

        if(data.resultCode === '0000') {

            if(!!_options.success) {

                _options.success(data.data);
            }
            return [data.data];
        } else {

            alert(data.resultMsg);
        }
        // fetch(_options.url, init).then(res => res.json())
        //     .then(res => {
        //
        //         if(res.resultCode === '0000') {
        //
        //             if(!!_options.success) {
        //
        //                 _options.success(res.data);
        //             }
        //         } else {
        //
        //             alert(res.resultMsg);
        //         }
        //     })
        //     .catch(err => {
        //
        //         if(!!_options.error) {
        //
        //             _options.error();
        //         }
        //     });
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
     * 로그인 여부
     * @returns {boolean}
     */
    checkLogin: () => {

        const isLogin = !!$cmm.util.getLs($cmm.Cont.LOING_INFO) && !!$cmm.util.getLs($cmm.Cont.LOING_INFO).ENC_SHPR_ID;

        return isLogin;
    },

    /**
     * 컴포넌트 - 날짜
     */
    date: {

        /**
         * 현재 날짜 를 YYYYMMDD 형태로 반환한다.
         *
         * @memberOf $comm.date
         * @param {String} div  옵션  : 계산 후 반환될 년, 월, 일 사이 구분자(구분자가 필요없으면 "")
         * @param {String} optValue 시간, 분, 초까지 표시. 옵션 H:시, M:분 , S:초
         *
         * @returns 현재 날짜 기간
         */
        getToday: function (div, optValue) {

            div = div === undefined ? '-' : div;
            const TIME_ZONE = 3240 * 10000;
            const date = new Date(+new Date() + TIME_ZONE).toISOString().split('T')[0].replace(/-/g, div);

            if(!optValue) {

                return date;
            } else {

                const hhmmss = new Date().toTimeString().split(' ')[0];

                if(optValue === 'H') {

                    return `${date} ${hhmmss.substring(0, 2)}`;
                } else if(optValue === 'M') {

                    return `${date} ${hhmmss.substring(0, 5)}`;
                } else {

                    return `${date} ${hhmmss}`;
                }
            }
        },
    },

    /**
     * Util
     */
    util: {

        /**
         * 숫자만 추출
         *
         * @memberOf $comm.util
         * @param val
         * @returns {*|string}
         */
        getNumber: function (val) {

            return !!val ? Number(String(val).replace(/[^-0-9.]/g, "")) : 0;
        },

        /**
         * 콤마
         * @memberOf $comm.util
         * @param val
         * @returns {*|string}
         */
        comma: function (val) {

            val = !val ? '' : String(val);
            let dec = '';

            if(val.indexOf('.') > -1) {
                dec = val.substring(val.indexOf('.'));
                val = val.replaceAll(dec, '');
            }

            return !!val ? String(this.getNumber(val)).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + dec : '';
        },

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

        /**
         * Image Zoom
         * @param idx
         */
        showImageZoom :(list, idx) => {

            const imgs = [];
            list.forEach(url => {

                imgs.push({href: url});
            });

            window.blueimp.Gallery(imgs, {index: idx});
        }
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

export default $cmm;