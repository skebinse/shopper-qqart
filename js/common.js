import {format} from "date-fns";

const cmm = {

    /**
     * 전역 변수 및 상수
     */
    Cont: {
        LOGIN_INFO: 'shopperLoginInfo',
        JOIN_INFO: 'shopperJoinInfo',
        WEB_TOKEN: 'webToken',
        APP_TOKEN: 'appToken',
        DAY_OF_WEEK: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
        APP_MESSAGE_TYPE: {
            NOTIFICATION: 'NOTIFICATION',
            ONE_SIGNAL_PLAYER_ID: 'ONE_SIGNAL_PLAYER_ID',
        }
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
            isLoaing: true,
            isExtr: false,
            headers: {},
            body: undefined,
        };

        Object.entries(options).forEach(item => _options[item[0]] = item[1]);

        if(!_options.isExtr && !!_options.isLoaing) {

            cmm.loading(true);
        }

        const init = {
            method: _options.method,
            headers: _options.headers,
            body: _options.body,
        };

        if(!_options.isExtr && cmm.checkLogin()) {
            init.headers['X-ENC-USER-ID'] = cmm.getLoginInfo('ENC_SHPR_ID');
        }

        // JSON 타입일 경우
        if(_options.dataType === 'json') {

            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(_options.data);
        } else if(!!_options.formData) {

            // FormData로 변경
            init.body = cmm.util.convertFormData(_options.formData);
        } else {

            init.headers['Content-Type'] = _options.contextType;
            init.body = !!_options.data ? new URLSearchParams(_options.data) : undefined;
        }

        fetch(_options.url, init).then(res => {

            if(_options.responseType === 'arraybuffer') {

                return res.arrayBuffer();
            } else {

                return res.json();
            }
        })
        .then(res => {

            if(!!_options.isExtr) {

                _options.success(res);
            } else {

                if(res.resultCode === '0000') {

                    if(!!_options.success) {

                        _options.success(res.data);
                    }
                } else if(res.resultCode === '8000') {

                    cmm.alert(res.resultMsg, () => {

                        location.href = '/';
                    });
                } else {

                    cmm.alert(res.resultMsg);
                }
            }
        })
        .catch(err => {
            console.log(err)
            if(!!_options.error) {

                _options.error();
            }
        })
        .finally(() => {

            if(!_options.isExtr && !!_options.isLoaing) {

                cmm.loading(false);
            }
        });
    },

    /**
     * 로그인 정보
     * @param key
     * @returns {any}
     */
    getLoginInfo: function (key) {

        const loginInfo = !!cmm.util.getLs(cmm.Cont.LOGIN_INFO) ? cmm.util.getLs(cmm.Cont.LOGIN_INFO) : {};

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

        const isLogin = !!window && !!cmm.util.getLs(cmm.Cont.LOGIN_INFO) && !!cmm.util.getLs(cmm.Cont.LOGIN_INFO).ENC_SHPR_ID;

        return isLogin;
    },

    /**
     * Alert
     *
     * @param txt
     * @param callback
     * @param title
     */
    alert: (txt, callback, title) => {

        document.querySelector('#alertArea').innerHTML = `
            <div class="confirmArea">
                <div>
                    <h3>${!!title ? title : '알림'}</h3>
                    <p>${txt.replace(/\n/g, '<br/>')}</p>
                    <div>
                        <button class="button" type="button">확인</button>
                    </div>
                </div>
            </div>`;

        document.querySelector('#alertArea .button').addEventListener('click', () => {
            document.querySelector('#alertArea').innerHTML = '';
            !!callback && callback();
        });
    },

    /**
     * confirm
     * @param txt
     * @param callback
     * @param title
     */
    confirm: (txt, callback, cancelCallback, title) => {

        document.querySelector('#alertArea').innerHTML = `
            <div class='confirmArea'>
                <div>
                    <h3>${!!title ? title : '알림'}</h3>
                    <p>${txt.replace(/\n/g, '<br/>')}</p>
                    <div>
                        <button class='button white mr16' type="button">취소</button>
                        <button class='button' type="button">확인</button>
                    </div>
                </div>
            </div>`;

        document.querySelectorAll('#alertArea .button').forEach(elet => {

            elet.addEventListener('click', e => {

                // 확인
                if(e.target.classList.length === 1) {

                    !!callback && callback();
                } else {

                    !!cancelCallback && cancelCallback();
                }

                document.querySelector('#alertArea').innerHTML = '';
            });
        });
    },

    /**
     * 로딩바
     * @param isShow
     */
    loading: isShow => {

        if(!!isShow) {

            document.querySelector('#loadingArea').innerHTML = `
                <div class="loader">
                    <span>
                        Shopper
                        <img alt='로딩 이미지' src='/assets/images/icon/iconDistance2.svg' />
                    </span>
                </div>`;
        } else {

            document.querySelector('#loadingArea').innerHTML = '';
        }
    },

    /**
     * 앱여부
     */
    isApp: () => {

        return !!window.webkit;
    },

    /**
     * 리액트 앱여부
     */
    isReactApp: () => {

        return !!window.ReactNativeWebView;
    },

    /**
     * 컴포넌트 - 날짜
     */
    date: {

        /**
         * 문자열 날짜를 Date 타입으로 변환하여 반환.
         * @param strDate
         * @returns {null}
         */
        parseDate : function(strDate) {

            let date = null;

            strDate = strDate.replace(/[^0-9]/g, '');

            // 날짜 설정.
            if(strDate.length > 7) {
                date = new Date(strDate.substring(0, 4), strDate
                    .substring(4, 6) - 1, strDate.substring(6, 8));
            }

            // 시간 설정.
            if(strDate.length > 13) {
                date.setHours(strDate.substring(8, 10),
                    strDate.substring(10, 12), strDate.substring(12, 14));
            }

            return date;
        },

        /**
         * 날짜 계산 함수 - Date 함수로 반환
         * @param selDate
         * @param periodKind
         * @param period
         * @param div
         */
        calDateReturnDt : function(selDate, periodKind, period) {

            return cmm.date.parseDate(cmm.date.calDate(selDate, periodKind, period, ''));
        },

        /**
         * 날짜 계산 함수
         * @param selDate : "YYYYMMDD"
         * @param periodKind : "Y" or "M" or "D" 증감할것이 년인지 월인지 날짜인지
         * @param period     : 계산할 값 양수이면 이후 음수이전 이전값
         * @param div  옵션  : 계산 후 반환될 년, 월, 일 사이 구분자(구분자가 필요없으면 "")
         * @returns {string}
         */
        calDate : function(selDate, periodKind, period, div) {

            if(typeof selDate === 'object') {
                selDate = selDate.getFullYear() +
                    cmm.util.lpad(selDate.getMonth() + 1, 2, '0') +
                    cmm.util.lpad(selDate.getDate(), 2, '0');
            }

            if(selDate === 'toDay') {
                selDate = cmm.date.getToday('');
            }

            selDate = selDate.replace(/[^0-9]/g, '');

            let cDate = new Date(selDate.substring(0, 4), selDate.substring(4, 6) - 1,
                selDate.substring(6, 8));
            period = Number(period);
            periodKind = periodKind.toUpperCase();
            if (periodKind == "D") {
                cDate.setDate(cDate.getDate() + period);
            }
            if (periodKind == "M") {
                cDate.setMonth(cDate.getMonth() + period);
                // 현재달이 31 이고 이전 또는 이후 달에 31 이 없는경우 마지막 날로 설정
                if(parseInt(selDate.substring(6, 8),10) > 20 && cDate.getDate() < 10){
                    cDate.setDate(0);
                }
            }
            if (periodKind == "Y") {
                cDate.setFullYear(cDate.getFullYear() + period);
            }

            let rDate = new Date(cDate);
            let strDate = new Array();

            let year = rDate.getFullYear();
            strDate[strDate.length] = year;

            strDate[strDate.length] = cmm.util.lpad(String(rDate.getMonth() + 1), 2, "0");
            strDate[strDate.length] = cmm.util.lpad(String(rDate.getDate()), 2, "0");

            if (div == null) {
                div = "";
            }
            return strDate.join(div);
        },

        /**
         * 현재 날짜 를 YYYYMMDD 형태로 반환한다.
         *
         * @param {String} div  옵션  : 계산 후 반환될 년, 월, 일 사이 구분자(구분자가 필요없으면 "")
         * @param {String} optValue 시간, 분, 초까지 표시. 옵션 H:시, M:분 , S:초
         *
         * @returns 현재 날짜 기간
         */
        getToday: (div, optValue) => {

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

        /**
         입력받은 월의 마지막 일자 반환.
         * @param dateStr
         * @returns {number|*}
         */
        getLastDay : dateStr => {

            if(!!dateStr) {
                dateStr = dateStr.replace(/-/g, "");
                return (new Date(Number(dateStr.substring(0, 4)), Number(dateStr.substring(4, 6)), 0) ).getDate();
            } else {

                return dateStr;
            }
        },

        /**
         * 요일 index 반환: 0부터 일요일
         * @param strDate
         * @param type
         * @returns {string|number}
         */
        getDayOfWeek : function(strDate, type) {

            if(type === 'ko') {

                return cmm.Cont.DAY_OF_WEEK[cmm.date.parseDate(strDate).getDay()];
            } else {

                return cmm.date.parseDate(strDate).getDay();
            }
        },
    },

    /**
     * Util
     */
    util: {

        /**
         * 아이디 체크
         * 최소 4자리 이상 알파뱃, 숫자
         * @param str
         * @returns {boolean}
         */
        checkId: function(str) {
            const regExp = /^[A-Za-z\d]{4,}$/;
            return regExp.test(str);
        },

        /**
         * 비밀번호 체크
         * 최소 6자리 이상 알파뱃, 숫자, 특수기호 포함
         * @param str
         * @returns {boolean}
         */
        checkPassword: function(str) {
            const regExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
            return regExp.test(str);
        },

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

            val = (!val && val != '0') ? '' : String(val);
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

            let sb = [];
            for(let i=0;i < len-str.length; i+=padStr.length){
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
        },

        /**
         * 클립보드 복사
         * @param value
         */
        clipboard: value => {

            window.navigator.clipboard.writeText(value).then(() => {

                cmm.alert('복사 되었습니다.');
            });
        },

        /**
         * 썸네일
         * @param options
         * @returns {Promise<unknown>}
         */
        getThumbFile: options => {

            const file = options.file;
            const maxSize = options.maxSize;
            const reader = new FileReader();
            const image = new Image();
            const canvas = document.createElement("canvas");

            const dataURItoBlob = (dataURI) => {
                const bytes =
                    dataURI.split(",")[0].indexOf("base64") >= 0
                        ? atob(dataURI.split(",")[1])
                        : unescape(dataURI.split(",")[1]);
                const mime = dataURI.split(",")[0].split(":")[1].split(";")[0];
                const max = bytes.length;
                const ia = new Uint8Array(max);
                for (let i = 0; i < max; i++) ia[i] = bytes.charCodeAt(i);

                const blob = new Blob([ia], {type: mime});
                blob.name = file.name.substring(0, file.name.lastIndexOf('.')) + '.jpg';
                blob.lastModified  = file.lastModified;

                return {blob: blob, options: options};
            };

            const resize = () => {
                let width = image.width;
                let height = image.height;
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(image, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/jpeg");
                return dataURItoBlob(dataUrl);
            };

            return new Promise((ok, no) => {
                if (!file) {
                    return;
                }
                if (!file.type.match(/image.*/)) {

                    cmm.loading(false);
                    cmm.alert('지원하지 않는 이미지입니다.');
                    no(new Error("Not an image"));
                    return;
                }
                reader.onload = (readerEvent) => {
                    image.onload = () => {
                        return ok(resize());
                    };
                    image.src = readerEvent.target.result;
                };
                reader.readAsDataURL(file);
            });
        },

        /**
         * FormData로 변경
         * @returns {FormData}
         */
        convertFormData: data => {

            const formData = new FormData();

            Object.entries(data).forEach(item => {
                formData.append(item[0], item[1]);
            });

            return formData;
        },

        /**
         * GUID 생성
         * @memberOf $comm.util
         * @param value
         */
        guid: function() {
            function _s4() {
                return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
            }
            return _s4() + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + _s4() + _s4();
        },

        /**
         * QueryString to Json
         * @memberOf $comm.util
         * @param value
         */
        queryStringToJSON: val => {
            //파라메터별 분리
            const pairs = val.split('&');

            const result = {};//json 빈 객체

            //각 파라메터별 key/val 처리
            pairs.forEach(function(pair) {
                pair = pair.split('=');//key=val 분리
                result[pair[0]] = decodeURIComponent(pair[1] || '');
            });

            return JSON.parse(JSON.stringify(result));//json 객체를 문자열화해서 리턴
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

            e.target.value = cmm.util.hyphenTel(e.target.value);
        },
    },
    plugin: {

        /**
         * Daum Post
         * @param elet
         * @param callback
         */
        daumPost: (elet, callback) => {

            new daum.Postcode({
                oncomplete: function(data) {

                    cmm.ajax({
                        url: `https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?addressFlag=F02&coordType=WGS84GEO&version=1&fullAddr=${encodeURIComponent(data.roadAddress)}&page=1&count=20`,
                        headers: {
                            appKey: process.env.NEXT_PUBLIC_TMAP_KEY
                        },
                        isExtr: true,
                        contextType: 'application/json',
                        success: res => {

                            if(!!res.coordinateInfo && !!res.coordinateInfo.coordinate && res.coordinateInfo.coordinate.length > 0) {

                                callback({...data, newLon: res.coordinateInfo.coordinate[0].newLon, newLat: res.coordinateInfo.coordinate[0].newLat});
                            } else {

                                cmm.alert('주소 입력에 실패하였습니다.');
                            }
                        },
                        error: res => {

                            cmm.alert('주소 입력에 실패하였습니다.');
                        },
                    });
                }
            }).embed(elet);
        },

        /**
         * Channel IO
         */
        channelIO: () => {

            (function() {
                let w = window;
                if (w.ChannelIO) {

                    return;}
                let ch = function() {
                    ch.c(arguments);
                };
                ch.q = [];
                ch.c = function(args) {
                    ch.q.push(args);
                };
                w.ChannelIO = ch;
                function l() {
                    if (w.ChannelIOInitialized) {
                        return;
                    }
                    w.ChannelIOInitialized = true;
                    let s = document.createElement('script');
                    s.type = 'text/javascript';
                    s.async = true;
                    s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
                    s.charset = 'UTF-8';
                    let x = document.getElementsByTagName('script')[0];
                    x.parentNode.insertBefore(s, x);
                }
                if (document.readyState === 'complete') {
                    l();
                } else if (window.attachEvent) {
                    window.attachEvent('onload', l);
                } else {
                    window.addEventListener('DOMContentLoaded', l, false);
                    window.addEventListener('load', l, false);
                }
            })();

            const options = {
                "pluginKey": "0486be4e-a136-4c55-b767-f625b42e7a75"
            };

            if(cmm.checkLogin()) {

                options.memberId = cmm.getLoginInfo('ENC_SHPR_ID');
                options.profile = {
                    name: cmm.getLoginInfo('SHPR_NCNM')
                };
            }

            ChannelIO('boot', options);
        }
    },

    app: {

        /**
         * PUSH Token
         * @param callback
         */
        getPushToken: callback => {

            setTimeout(function(){
                webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({"action": "getpushid","callback": "window.getPushToken"}));
                setTimeout(callback, 500);
            },1500);
        },


        /**
         * 안드로이드 여부
         * @returns {boolean}
         */
        isAndroid: () => {
            const agent = navigator.userAgent.toLowerCase();

            if( agent.indexOf('android') > -1 ) {

                return true;
            }else{
                // 기타
                return false;
            }
        },

        /**
         * IOS 여부
         * @returns {boolean}
         */
        isIOS: () => {
            const agent = navigator.userAgent.toLowerCase();

            if( agent.indexOf("iphone") > -1 || agent.indexOf("ipad") > -1 || agent.indexOf("ipod") > -1 ) {
                // IOS인 경우
                return true;
            }else{
                // 기타
                return false;
            }
        },
    },

    biz: {

        /**
         * 공통 코드 리스트 조회
         * @param options
         * @param callback
         */
        commCdList: (options, callback) => {

            if(typeof options === 'string') {

                cmm.ajax({
                    url: '/api/cmm/commCdList',
                    data: {
                        cdSppoId: options
                    },
                    success: callback,
                });
            }
        }
    }
};

export default cmm;