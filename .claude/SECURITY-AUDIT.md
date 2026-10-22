# shopper-qqart 보안 검증 결과 (2026-10-03)

- 범위: `pages/api/**` 전체, 클라이언트(`pages/**`, `components/**`, `js/**`, `context/**`), 설정(`next.config.js`, `Dockerfile`, `.github/**`), git 히스토리, 관련 SP(`spGetShprLogin`, `spInsShprAdjReq`, `spInsPiupAtmtAdj`, `spInsShprBtchAcp`, `spInsShprJoin`)
- 방법: 코드/SP 정적 분석. 실제 공격 재현은 하지 않음. ✅ = 직접 코드·SP 로 확인한 항목
- 공통 원인: 서버 공통 인증 게이트(middleware)가 없고, 각 API 가 쿠키 복호화 결과가 NULL 이어도 거부하지 않음. 중복로그인(`tkn_sh`) 체크는 클라이언트 `cmm.ajax` 에만 있음.

## Critical

| # | 위치 | 문제 |
|---|---|---|
| C1 | `pages/btch/ldtn/[ldtnOderUserId].js:77` | 운영 Toss 시크릿키(`live_sk_…`)가 `NEXT_PUBLIC_API_PAY_SECRET` 로 JS 번들에 포함. 결제 취소/환불/키인결제 가능 ✅ |
| C2 | `pages/api/btch/ing/btchDtcOptm.js:26` | `IN (${param.oderUserIds})` SQL 인젝션 + 비인증 ✅ |
| C3 | `pages/api/cmm/login.js` + `spGetShprLogin` | 카카오 로그인이 클라이언트가 보낸 `userCrctno` 만 비교 → 카카오 회원번호만으로 로그인 ✅ |
| C4 | `pages/api/join/index.js` (`isLogin=Y`) + `spInsShprJoin` | 쿠키 검증 없이 userId/userCrctno 로 타인 정보 UPDATE |
| C5 | `pages/api/btch/ldtn/ldtnPgrs.js` | 인증·소유권·결제검증 없이 임의 주문 "현장결제 완료" ✅ |
| C6 | `pages/api/hello.js` | 비인증으로 `T_USER_INFO` 10행 전 컬럼 반환 ✅ |
| C7 | `pages/api/btch/btchAdjPet.js` + `spInsShprAdjReq` | 출금액 `adjAmt` 를 클라이언트 값 그대로 저장 ✅ |
| C8 | `pages/api/join/smsCetinoSend.js`, `authNo.js` | 인증번호 무염 해시를 클라이언트에 주고 재전송 받아 비교 → 항상 우회 가능, 가입 API 는 `cphoneNo` 신뢰 |
| C9 | `js/popbill.jsx:6-7`, `util/smsUtil.js:18,24-25`, `js/firebase.js:63`, `btchDtcOptm.js` | Popbill SecretKey, SMS 게이트웨이 key(평문 http), FCM 서버키, 외부 API 키 하드코딩 |
| C10 | git 커밋 892dd8a `.env` | 개발 DB root 비밀번호 — 현재 값과 동일(유효) |

## High

- H1 `pages/api/btch/[oderUserId].js:86-92` — 비인증으로 고객 이름·전화·주소·공동현관 비밀번호 조회
- H2 `btchStat.js` 상태값 임의 지정 / `btchCan.js` 상태조건 없음(완료건 02 로 되돌려 재정산) / `btchComp.js` 동시요청 시 정산 중복
- H3 `spInsShprBtchAcp` — 체크 후 잠금 없이 `WHERE ODER_USER_ID` 만으로 UPDATE(동시수락 덮어쓰기), shprId NULL 진행 가능성(`fnShprBtchMxvaYn` 확인 필요)
- H4 본인인증 결과(이름·생년월일·전화) 쿼리스트링→localStorage→가입 API, `nameHash` 키 없는 bcrypt → 타인 명의 가입·계좌인증 (`essInfoInpt.js`, `bnkbSelfAhrz.js:64-68`)
- H5 `shpr/modBank.js` — 실명 검증과 무관하게 계좌 UPDATE
- H6 `shpr/pointPet.js` — 음수 금액, 미승인 차감 없음, 잠금 없음
- H7 `s3-upload.js`, `cmm/upload.js` — 인증·확장자·크기 제한 없음(html/svg 저장형 XSS)
- H8 IDOR: `delyschd/[id].js` GET/PATCH, `btchExcp.js`, `cmm/insAppPsPsit.js`(body `shprId`), `ldtn/ldtnHity.js`, `ldtn/[ldtnOderUserId].js`
- H9 저장형 XSS: 배송지 `ODER_DELY_FULL_ADDR` → `cmm.confirm` innerHTML (`components/btchListMain.js:341`, `btchListMain2.js:306`, `pages/btch/ing/[ingOderUserId].js:110`)

## Medium

- M1 `enc_sh` 고정값·로그아웃 무효화 없음, 각 API `tkn_sh` 미검증
- M2 비밀번호 무염 `SHA2(pw,256)`, 로그인 시도 제한 없음
- M3 `cmm/login.js:13` local+운영DB 분기에서 userId 만으로 로그인
- M4 `callbackSelfCfm.js` — `RETURNCODE` 미확인, `ORDERID` 에 `enc_sh` 원문 전송, 개인정보 쿼리스트링 redirect
- M5 `_app.js` RN message 출처 미검증, 푸시 title/body innerHTML, `custom_url` 무검증 `router.push`
- M6 localStorage 가입정보(생년월일·계좌·전화) 잔존
- M7 `pages/join/essInfoInpt.js:76` 주석에 실제 개인정보
- M8 의존성: next 13.1.1, sharp 0.32.1(libwebp CVE), mysql2 2.3.3
- M9 `.dockerignore` 없음 → `.env*`, `*.pem` 빌드 레이어 포함

## Low

- L1 보안 헤더(CSP/HSTS/X-Frame-Options) 없음
- L2 `btchDtcOptm` 외부 호출 실패 시 미응답, conn 반환 후 쿼리, 위경도 뒤바뀜
- L3 `ldtn/[ldtnOderUserId].js:19` 조인 조건 오류(카테시안 곱)
- L4 `cmm/modAppPushTkn.js:15` `param.enc_sh` 사용(푸시토큰 갱신 미동작)
- L5 `logout`, `mbScss` 메서드 제한 없음

## 진행 체크리스트

### 1단계 — 키 재발급 (코드 외, 담당자 조치)
- [ ] Toss 시크릿키 재발급 (C1)
- [ ] Popbill SecretKey 재발급 (C9)
- [ ] SMS 게이트웨이 key 재발급 (C9)
- [ ] FCM 서버키 폐기 (C9)
- [ ] `btchDtcOptm` 외부 API 키 재발급 (C9)
- [ ] 개발 DB root 비밀번호 변경 + 앱 전용 계정 (C10)
- [ ] 운영 DB readonly 계정 비밀번호 변경 (대화에 노출됨)

### 2단계 — 즉시 패치 (이 저장소만)
- [x] `api/join/index.js` POST 제한·필수값 검증·SP 결과 방어 (빈 T_SHPR_INFO 행 INSERT 버그)
- [x] C1 Toss 결제 화면 제거(미사용) — `pages/btch/ldtn/*`, `pages/api/btch/ldtn/*` 삭제(C5, H8 일부 함께 해소), `ing` 화면 "결제 하기" 분기 제거, 로컬 `.env.*` 의 `NEXT_PUBLIC_API_PAY_*` 삭제 (운영 서버 env 와 Toss 키 폐기는 별도)
- [x] C6 `hello.js` 삭제
- [x] C2 `btchDtcOptm` 바인딩 — 숫자 ID 만 허용 + `IN (?)` 바인딩, 쿠키 NULL → 9000, 외부 호출 실패 시 응답, UPDATE await (L2 일부). 위경도 매핑은 저장 컬럼 자체가 뒤바뀌어 있어(`reg.js` 의 `userAddrLat: data.newLon`) 의도된 보정으로 보고 유지
- [x] 공통 인증 헬퍼 `util/authUtil.js#getAuthShprId` 도입 (쿠키 NULL/탈퇴 → 9000, `tkn_sh` 비교)
  - [x] H1 `btch/[oderUserId].js`
  - [x] H8 `delyschd/[id].js` GET/PATCH/DELETE 본인 일정만, `delyschd/index.js` POST/GET
  - [x] H8 `btchExcp.js` 본인 배차 주문만 등록 (`INSERT ... SELECT ... WHERE SHPR_ID = ?`)
  - [x] M2 일부 `cmm/insPsPsit.js` 쿠키 없으면 저장 생략 (조용히 200)
  - [ ] H7 `s3-upload.js`, `cmm/upload.js` — 가입(비로그인) 중 업로드에 쓰여 3단계 가입 세션 도입 후 적용
  - [x] H8 `cmm/insAppPsPsit.js` — 입력값 검증만 적용(C안, 2026-10-04): shprId 숫자 + 존재·미탈퇴 쇼퍼(`INSERT ... SELECT`), 경도(lot) 124~132·위도(lat) 33~39. 쿠키/토큰 인증은 네이티브 소스 부재로 미적용 → 타 쇼퍼 위치 위조는 남은 위험(수용, baskydeli 전환 시 해소)
  - [ ] 나머지 API(기존 `fnDecrypt` 직접 사용)도 헬퍼로 이전 → `tkn_sh` 서버 검증 일원화 (M1)
  - [ ] 참고: `util/delySchdApis.js#requestUpdateSchedule` 가 미정의 변수 `shopIds` 참조(PATCH 미사용 추정)
- [x] H9 `cmm.alert/confirm` 이스케이프 — `cmm.util.escapeHtml` 추가, 데이터 값만 이스케이프(배송지 3곳, 매장명 2곳, QR 화면 주문번호·박스수·resultMsg, `cmm.ajax` 기본 resultMsg alert 3곳). 실제 브라우저로 배송지 `<img onerror>` 페이로드 미실행 확인
  - [ ] M5 `_app.js` 푸시 title/body innerHTML, `custom_url` 검증은 별도 항목
- [x] C9 하드코딩 키 env 이전 — `js/popbill.jsx`, `util/smsUtil.js`, `btchDtcOptm.js` → env, `js/firebase.js` 클라이언트 토픽 구독(FCM 서버키) 제거, `NEXT_PUBLIC_FCM_KEY`→`FCM_KEY`, `NEXT_PUBLIC_API_DANAL_CPPWD`→`API_DANAL_CPPWD` (L3)
  - **운영 배포 전 서버 env 에 추가 필수**: `POPBILL_LINK_ID`, `POPBILL_SECRET_KEY`, `SMS_API_URL`, `SMS_API_USER_ID`, `SMS_API_KEY`, `ROAD_API_URL`, `ROAD_API_KEY`, `FCM_KEY`, `API_DANAL_CPPWD` (기존 `NEXT_PUBLIC_FCM_KEY`, `NEXT_PUBLIC_API_DANAL_CPPWD`, `NEXT_PUBLIC_API_PAY_*` 삭제)
  - 키 값은 git 히스토리에 남아 있으므로 1단계 재발급 필요

### 3단계 — 서버 상태 기반 재설계
- [x] C3 카카오 로그인 서버측 토큰 검증 — `util/kakaoUtil.js#getKakaoUserId`. `/api/cmm/login`(KAKAO), `/api/join`(KAKAO 신규가입)이 `kakaoAccessToken` 으로 카카오 `/v2/user/me` 를 직접 호출해 확인한 회원번호만 사용. `snsKakaoLogin.js`(SSR 토큰 전달), `login2.js`(SDK 토큰 전달) 수정
  - 실제 카카오 계정 로그인/가입 성공 경로는 기기에서 수동 확인 필요 (자동화 불가)
  - 가입 진행 중 카카오 액세스 토큰이 localStorage `shopperJoinInfo` 에 머무름(가입 완료 시 삭제) — M6 와 함께 개선
- [x] C8 SMS 인증 서버 보관 — 서명 쿠키 `sms_cfm`(3분, httpOnly)에 HMAC 해시만 보관, 클라이언트에 해시 미노출, 번호 형식 검증. (현재 가입 화면은 SMS 대신 다날 사용 — `cphone` 화면 미사용)
  - 남은 위험(수용, 2026-10-03 사용자 결정으로 보류): 무상태라 시도 횟수 제한 불가(4자리 3분), `smsCetinoSend` 비인증 발송 가능. SMS 인증 화면(`cphone`, `cphoneAhrz`)은 2024-04-19(930b626) 다날 전환 후 미사용이나 제거하지 않고 유지. `T_AUTH_TKN`(운영 생성됨) 은 쇼퍼 앱에서 사용하지 않음
- [x] H4 본인인증 결과 서버 보관 — 서명 쿠키 `join_sc`(`util/joinSession.js`, 1시간, httpOnly). 다날 콜백이 쿠키에 저장하고 URL·localStorage 로 개인정보 전달 중단(M4 일부, M7 주석 삭제), `bnkbSelfAhrz`(joinYn=Y) 는 쿠키의 이름/생년월일로 확인 후 계좌를 쿠키에 기록, `/api/join` 신규가입은 쿠키 값만 사용 후 쿠키 삭제. 화면 표시는 `/api/join/selfCfmInfo`
  - 다날 콜백에서 인증 결과(NAME/IDEN/PHONE)가 없으면 중단 (기존: NULL 로 덮어쓰기 가능)
  - 실제 다날 본인인증 → 가입 완료 경로는 기기에서 수동 확인 필요
- [ ] C5 결제 판정 서버 검증
- [x] H5 계좌 변경 서버 검증 — `bnkbSelfAhrz`(개인정보 수정) 성공 시 서명 쿠키 `bank_vrf`(5분, 쇼퍼ID·은행코드·계좌) 발급, `modBank` 는 공통 인증 + 쿠키의 본인·계좌 일치 시에만 저장 후 쿠키 삭제. 은행명은 `js/bankList.js#getBankNm` 으로 은행코드 기준 서버 결정(가입 경로 포함), 은행 목록 공용화

### 4단계 — SP 수정 (DBA 배포 선행 필요)
- [ ] `spGetShprLogin` 카카오 분기
- [x] `spInsShprAdjReq` 금액 서버 계산 (C7) — 정산 출금 미사용으로 SP 수정 대신 차단(2026-10-04): `btchAdj.js` 출금하기 버튼 숨김(`IS_WID_USE=false`), `btchAdjPet` API 즉시 9999. 재사용 시 SP 서버 계산 수정 후 해제
- [x] `spInsShprBtchAcp` 잠금·NULL 거부 (H3) — `.claude/sql/spInsShprBtchAcp_h3.sql` (개발 DB 적용·검증 완료, 운영 적용됨 — 운영 LAST_ALTERED 2026-10-03 17:39 UTC, 2026-10-17 조회 확인. `backup/spInsShprBtchAcp_prod_20261004.sql` 은 변경 전 백업본)
  - SP: shprId NULL/없는 쇼퍼 → 9000 종료(기존: 비로그인으로 아무 주문을 쇼퍼 없는 03 으로 변경 가능), 수락 UPDATE 에 `SHPR_ID IS NULL AND ODER_PGRS_STAT='02'` + `ROW_COUNT()` 확인 → 동시 수락 시 1명만 반영
  - API(`btchAcp.js`): 공통 인증 헬퍼로 shprId 확인 후 SP 호출 (SP 배포 전에도 비로그인 차단)
  - SQL 파일 상단 `SET NAMES utf8mb4 COLLATE utf8mb4_general_ci` + 운영 sql_mode 필수 (없으면 collation 오류)
- [ ] `spInsShprJoin` NULL 가드 (API 에서는 막음, SP 자체 가드는 DBA)
- [x] C4 `isLogin=Y` 소유권 — SP 수정 없이 API 에서 해결: `/api/join` 이 `getAuthShprId` 로 본인 확인 후 `userSnsType/userCrctno/userId` 를 DB 값으로 덮어씀. 쿠키 없음 → 9000, 타인 userId 지정해도 본인 행만 UPDATE 확인
- [x] 상태 전이 조건부 UPDATE (H2) — SP 수정 없이 API 에서 해결, 상태코드 체계 변경 없음(PARTNER-INTEGRATION 4-1 준수)
  - `btchStat`: 04 는 03 + DELY 만, 05 는 03/04 에서만, 그 외 값 거부, 미변경 시 알림 미발송
  - `btchCan`: 03 이고 관리자 배정 아님일 때만(화면 조건과 동일), `FOR UPDATE` → 완료건 취소·재정산 차단
  - `btchComp`: `FOR UPDATE` + `WHERE ODER_PGRS_STAT='05'` 1건 변경 시에만 정산 SP 호출 → 동시 요청 중복 정산 차단
  - 3개 API 모두 공통 인증 헬퍼 적용

### 5단계 — 의존성·설정
- [ ] next / sharp / mysql2 업그레이드 (M8)
- [ ] 보안 헤더 (L1)
- [ ] `.dockerignore` (M9)

## [완료] 최초 화면 호출 시 팝업 호출

### 개요
아래 내용으로 화면 최초 호출 시 전체 팝업으로 띄워줘. 딱 한번만 호출 되게 해줘.
----------------------------------------------------
안녕하세요. 퀵퀵카트 운영팀입니다.
새로운 정산 시스템 변경에 협조해 주신 기사님들께 진심으로 감사드립니다.
이번 정산 시스템 변경으로 인해 기존 정산 방식에서 크게 달라지는 부분은 없으나, 중간 등급인 ‘일반’ 등급의 기준을 새롭게 구분하여 운영하게 되어 안내드립니다.
기존과 비교해 큰 변경 사항은 없는 만큼, 아래 등급별 정산 기준 및 승급 조건을 확인해 주시기 바랍니다.
■ 등급별 정산 기준
신규

가입 후 30일 이내
격주 화요일 정산
1회 최대 50만 원 정산
일반

격주 화요일 정산
1회 최대 60만 원 정산
고정매장 신청 가능
우수

매주 화요일 정산
1회 최대 60만 원 정산
고정매장 배정 시 활동 실적 우대
VIP

매주 화요일·금요일 정산
1회 최대 50만 원 / 주 최대 100만 원 정산
고정매장 배정 시 최상위 활동 실적 반영
■ 등급 승급 조건
신규 → 일반

전월 10일 이상 활동
전월 평균 주 정산 금액 30만 원 이상
일반 → 우수

전월 15일 이상 활동
전월 평균 주 정산 금액 60만 원 이상
우수 → VIP

전월 20일 이상 활동
전월 평균 주 정산 금액 100만 원 이상
※ 활동 및 정산 기준은 전월 1일~말일을 기준으로 적용됩니다.
※ 예) 9월 활동 실적 → 10월 등급 및 혜택에 적용
※ 10월 9일 12시 이후 앱에서 본인의 등급을 확인해 주시기 바랍니다.
앞으로도 기사님들께서 보다 안정적으로 활동하실 수 있도록 운영 환경을 지속적으로 개선해 나가겠습니다.
기사님들께서 보내주시는 노력과 협조에 보답할 수 있도록 많은 혜택과 다양한 프로모션을 마련할 수 있도록 최선을 다하겠습니다.
감사합니다.
퀵퀵카트 운영팀 드림
----------------------------------------------------

### 작업 범위
- [x] 공지 컴포넌트 `components/noticePopup.js` 신규 — 전체 화면 레이어(헤더 제목, 본문 스크롤, 하단 "확인" 버튼). 등급별 기준·승급 조건은 등급명/항목 블록으로 정리해 표시, 본문은 JSX 정적 텍스트(innerHTML 미사용)
- [x] 표시 위치: 로그인 후 메인 `pages/index.js` 진입 시(입점 승인 `isEntApv` 상태일 때만). 로그인/가입 등 비로그인 화면에는 띄우지 않음
- [x] 1회 표시: "확인" 클릭 시 localStorage 에 공지 키(`noticeShown_202610_adjGrade`) 저장 → 이후 미표시. 키는 `cmm.Cont` 에 상수로 추가, 접근은 try/catch(`cmm.util.getLs/setLs` 재사용)
  - 한계: 기기·앱 재설치·localStorage 초기화 단위로 1회 (서버 저장 아님)
- [x] 스타일: 기존 `alertArea` 톤에 맞춘 CSS 를 `styles/globals.css` 에 추가, 모바일/WebView 높이에서 스크롤 확인
- [x] 검증: 로컬 dev, 개발 테스트 계정 로그인 → 최초 1회 노출, 확인 후 새로고침 시 미노출, LS 키 삭제 시 재노출 (2026-10-08 Playwright 375x740 확인, 본문 스크롤 동작)