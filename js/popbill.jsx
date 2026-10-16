const popbill = require('popbill');

popbill.config( {

    // 링크허브에서 발급받은 링크아이디, 비밀키
    LinkID : process.env.POPBILL_LINK_ID,
    SecretKey : process.env.POPBILL_SECRET_KEY,

    // 연동환경 설정값, (true-개발용, false-상업용)
    IsTest : false,

    // 인증토큰 IP제한기능 사용여부, 권장(true)
    IPRestrictOnOff: true,

    // 팝빌 API 서비스 고정 IP 사용여부
    UseStaticIP: false,

    // 로컬시스템 시간 사용여부 true-사용(기본값-권장), false-미사용
    UseLocalTimeYN: true,

    defaultErrorHandler: function (Error) {
        console.log('Error Occur : [' + Error.code + '] ' + Error.message);
    }

});

export function accountCheckService () {
    return popbill.AccountCheckService();
};