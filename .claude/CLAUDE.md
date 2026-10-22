# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

QQCART 플랫폼의 **쇼퍼(배달기사) 측** Next.js 13.1.1 (Pages Router) 앱. 모바일 웹과 React Native WebView(Android/iOS)에서 동시에 동작한다. 주문 매니저(가맹점) / 사용자(고객) 앱과는 별개의 코드베이스이며, MySQL 한 개를 공유한다.

## 파트너(이마트) 연동 — 진행 중인 작업

이마트 연동으로 **배송에 방향이 생겼다.** 지금까지 배송은 항상 매장 → 고객이었는데,
반품은 고객 → 매장, 교환은 매장 → 고객 → 매장 왕복이다. 회수지가 일반 주문의 배송지 컬럼에
들어가므로 **앱이 방향을 뒤집어 안내하지 않으면 기사에게 반대로 보인다.**

작업 지시·배경·주의사항은 **`.claude/PARTNER-INTEGRATION.md`** 에 정리되어 있다.
`pages/btch/*`, `pages/api/btch/*`, 배송 상태 변경을 건드리기 전에 반드시 먼저 읽을 것.
특히 **`ODER_PGRS_STAT` 에 새 값을 추가하면 안 되는 이유**(`btchComp.js:36` 의 숫자 비교가 깨진다)가 적혀 있다.

## 자주 쓰는 명령

```bash
yarn dev          # node server.js — HTTPS 3000 (localhost-key.pem / localhost.pem 사용)
yarn build        # next build
yarn start        # next start -p 3001 (운영 컨테이너 시작은 start:prod 가 호출됨, 포트 3000)
yarn start:dev    # next start -p 3000
yarn lint         # next lint
```

- `yarn dev` 는 `next dev` 가 아니라 **HTTPS 커스텀 서버**를 띄운다. 카카오 로그인/RN WebView가 https 를 요구하기 때문이며, 인증서 파일이 없으면 기동 실패한다.
- 단위 테스트 프레임워크는 설정되어 있지 않다(기능 검증은 브라우저 + DB 로직).

## 환경/배포

- 환경 파일: `.env.development`, `.env.production`, `.env.local`. 핵심 변수:
  - `NEXT_PUBLIC_RUN_MODE` (`local` | `dev` | `prod`) — 클라이언트/서버 분기 키.
  - `DB_PROD_YN=Y` — `RUN_MODE=local` 일 때 `PROD_DB_*` 변수 쪽으로 강제 연결한다(`pages/api/db.js` 참조). **로컬에서 운영 DB를 직접 붙는 모드**라는 점을 인지하고 사용할 것.
  - `ENC_KEY` — MySQL `AES_ENCRYPT/fnDecrypt` 에 들어가는 키. 쿠키 `enc_sh` 가 이 키로 암호화된 `SHPR_ID` 다.
  - `S3_UPLOAD_*` — `next-s3-upload` + `aws-sdk` 로 이미지 업로드(`pages/api/s3-upload.js`, `hooks/useShopS3Upload.js`).
- 배포: `real` 브랜치 push → GitHub Actions(`.github/workflows/ci.build.yml`)가 AWS SSM 으로 EC2(`qqcart-shopper-prd`)에서 `/home/ubuntu/deploy.sh` 실행. Dockerfile 은 multi-stage 빌드 후 `yarn start:prod` 로 3000 포트 노출.
- `amplify.yml` 은 정적 빌드 산출물용으로 남아 있으나 현재 운영은 ECS/EC2 경로다.

## 아키텍처

### 페이지 구성 (`pages/`)

- 도메인 디렉터리 명이 비즈니스 약어 그대로다. 신규 코드 작성 전에 약어를 먼저 확인하라:
  - `SHPR` 쇼퍼, `ODER` 주문, `BTCH` 배차/배치, `DELY` 배달, `SHOP` 가맹점, `ENT` 가맹/입점, `ADJ` 정산, `POIN` 포인트, `DUTJ` 업무(근무), `LDTN` 도착(랜딩), `ANNC` 공지, `MAG` 매니저, `CMM` 공통.
- `pages/cmm/login.js` — 카카오/SMS/자체 로그인. 로그인되지 않으면 `context/globalContext.js` 가 강제로 여기로 보낸다.
- `pages/btch/[oderUserId].js` — 쇼퍼가 배차 잡고 진행하는 메인 화면.
- `pages/mypage/*` — 정산내역(`adjHity`, `btchAdj`), 포인트(`poinHity`), 배달내역(`delyHity`), 일정(`delySchd`).
- 같은 화면의 `*2.js` 변형(`btchAdj2.js`, `[oderUserId]2.js`, `login2.js`)은 리뉴얼 중인 사본이다. **원본을 수정해야 하는지 신규 변형을 수정해야 하는지 사용자에게 확인할 것** — 둘 다 라우트로 살아 있다.

### API 라우트 (`pages/api/`)

- 전부 `getConnectPool(async conn => { ... })` 패턴을 쓴다(`pages/api/db.js`). `mysql2/promise` 풀을 공유하며, 콜백 안에서 throw 해도 호출자에게 전파되지 않고 `console.log` 만 찍힌다 — 응답을 보내지 않으면 클라이언트가 멈추므로 catch 블록에서 반드시 `res.status(...).json(result(...))` 로 응답하라.
- 응답은 항상 `result(data, code, msg)` / `resultOne(...)` 으로 래핑한다. 결과 코드 약속:
  - `0000` 정상 → 클라이언트 `success(res.data)` 호출
  - `9000` → "로그인 후 이용가능" alert 후 `/cmm/login` 으로 강제 이동
  - `8000` → alert 후 `/` 로 이동
  - `9999` 서버 오류 → 기본 alert
  - 그 외 → 호출자의 `error` 콜백 또는 기본 alert
  - SP 가 `RESULT_CODE`/`resultCode` 컬럼을 반환하면 `result()` 가 자동으로 그 값을 사용한다.
- **비즈니스 로직 다수가 MySQL stored procedure (`spXxx`) 와 함수(`fnXxx`)에 들어 있다.** 예: `spGetBtchNoList`, `spGetShprLogin`, `fnDecrypt`, `fnGetAtchFileList`, `fnGetShprDelyDtcAmt`. API 라우트 코드만 봐서는 동작을 다 알 수 없으므로, 동작이 의심스러우면 DB 의 SP 정의를 함께 확인해야 한다.
- 인증: 쿠키 `enc_sh` (AES 로 암호화된 `SHPR_ID`, `httpOnly`+`secure`, 30일) + `tkn_sh` (중복로그인 토큰). API 라우트 시작부에서 `getCookie('enc_sh')` 로 받아 `SELECT fnDecrypt(?, ?) AS SHPR_ID` 로 복호화하는 패턴이 표준이다.

### 클라이언트 코어

- `js/common.js` 의 `cmm` 객체가 사실상 표준 라이브러리다. 새 fetch/alert/confirm/loading 헬퍼를 만들지 말고 기존 것을 사용/확장하라.
  - `cmm.ajax(options)` — 모든 API 호출 진입점. **요청 직전마다 `/api/cmm/dplcLogin` 으로 중복 로그인 체크를 한 번 더 한다**(`/api/cmm/insPsPsit` 는 예외). 자체 fetch 를 직접 쓰면 이 가드를 우회한다.
  - `cmm.alert / cmm.confirm` — `#alertArea` DOM 을 직접 innerHTML 로 갈아끼우는 명령형 헬퍼. 컴포넌트 트리와 별개로 동작하므로 이걸 호출하면 React 상태 동기화 책임은 호출자에게 있다.
  - `cmm.Cont` — localStorage 키와 RN 메시지 타입 상수.
  - `cmm.getLoginInfo(key)` — localStorage `shopperLoginInfo` 에서 값 꺼내기. 서버 진실의 원천은 `T_SHPR_INFO` 이므로 LS 값은 캐시일 뿐이다.
- `context/globalContext.js` — `<GlobalProvider>` 가 alert/confirm/loading/push 모달의 React 측 상태를 보유한다. 로그인 미체크 라우트 화이트리스트(`notLoginList`)가 여기 있다. 새 공개 페이지를 추가하면 이 리스트에 넣어야 한다.
- `components/cmmComponent.js` — 위 컨텍스트의 모달들을 실제로 렌더한다. `_app.js` 가 모든 페이지 하단에 한 번 박는다.
- `hooks/useCommon.js` — `goPage / goReplacePage / goCheckLogin` 라우팅 헬퍼. `router.push` 를 직접 쓰는 대신 이걸 쓰는 컨벤션이다.

### React Native 브릿지

`pages/_app.js` 가 RN WebView 와 연결되는 글로벌 콜백을 등록한다. 새 네이티브 ↔ 웹 연동을 추가할 때는 여기서 패턴을 그대로 따른다:
- Android 는 `document.addEventListener("message", ...)`, iOS 는 `window.addEventListener("message", ...)` (분기 필요).
- 웹 → 앱: `window.ReactNativeWebView.postMessage(JSON.stringify({type, data}))`.
- iOS → 위치 콜백: `window.webkit.messageHandlers.cordova_iab.postMessage({action, callback})`. 위치는 2 분 간격 폴링.
- 등록되어 있는 글로벌: `window.onPushMessage`, `window.getPushToken`, `window.getPsPsit`, `window.call_position`. 이름을 바꾸면 네이티브 빌드와 깨진다.
- 메시지 타입 상수는 `cmm.Cont.APP_MESSAGE_TYPE` 에 모여 있다.

## 스타일 / 코딩 컨벤션

- 모든 식별자/주석/UI 문구가 한국어다. 응답도 한국어로.
- 파일은 `.js`/`.jsx` 혼재(예: `js/popbill.jsx`). TypeScript 미사용.
- ESLint 설정은 `next/core-web-vitals` 기본만(`.eslintrc.json`). 린트가 깐깐하지 않으니 의존하지 말 것.
- 들여쓰기는 4-space, 함수/블록 내부에서 빈 줄을 한 줄씩 끼워 넣는 스타일이 일관돼 있다(`pages/_app.js` 참고). 신규 코드도 맞추는 편이 리뷰가 편하다.

## 작업 흐름 메모

- `TASKS.md` 가 루트에 생기면 그 내용대로 작업한다(글로벌 지침). 작업 범위가 비어 있으면 범위부터 정의하고 사용자 승인을 받는다.
- 새 CLAUDE.md / 메모리 파일은 항상 `.claude/` 아래에 만든다.
- DB 스키마 변경 / SP 수정은 이 저장소에 없다. 호환을 깨는 SQL 변경이 필요하면 백엔드/DBA 와 합의된 SP 가 먼저 배포돼야 한다고 사용자에게 명시할 것.
