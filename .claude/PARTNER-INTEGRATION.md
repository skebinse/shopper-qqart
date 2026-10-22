# 파트너(이마트) 연동 — 쇼퍼 앱 작업 인계

작성 2026-09-16. 원본 작업은 `D:/99.workspace/eclipse/justdoeng/kr.co.baskydeli.api`
(파트너 인바운드 API 전용 Spring 서버)에서 했다. 같은 MySQL(qqcart)을 공유한다.

---

## 0. 한 줄 요약

이마트 연동으로 **배송에 방향이 생겼다.** 지금까지 배송은 항상 매장 → 고객이었는데,
**반품은 고객 → 매장**, **교환은 매장 → 고객 → 매장 왕복**이다.
이 건들은 기존 주문과 같은 테이블·같은 `ODER_KD='PIUP'` 이라 **배차 목록에 이미 그대로 나오지만**,
앱이 방향을 모르기 때문에 기사에게 반대로 보인다.

---

## 1. 무엇이 생겼나

이마트가 우리 API 서버로 주문을 넣는 연동이 구현됐다. 주문 유형이 늘었다.

| 유형 | `ODER_PTNR_DELY_KD` | 방향 | 기사가 하는 일 |
|---|---|---|---|
| 일반 | NULL | 매장 → 고객 | 기존과 동일 |
| 미회수 | `UNCOLLECTED` | 매장 → 고객 | 기존과 동일 |
| **반품** | `RETURN` | **고객 → 매장** | 고객 집에서 **받아서** 매장에 갖다준다 |
| **교환** | `EXCHANGE` | **매장 → 고객 → 매장** | 교환품 전달 후 기존품을 **받아서** 매장에 갖다준다 |

모두 `ODER_SYSTEM='PARTNER'`, `ODER_KD='PIUP'`, 시작 상태 `ODER_PGRS_STAT='02'` 다.

---

## 2. DB 에 추가된 컬럼 (dev 적용 완료 / 운영 미적용)

`T_ODER_USER_INFO` 와 `T_ODER_USER_INFO_HIST` 양쪽. 일반 주문은 전부 NULL 이다.

| 컬럼 | 타입 | 값 |
|---|---|---|
| `ODER_PTNR_DELY_KD` | varchar(20) | `RETURN` / `EXCHANGE` / `UNCOLLECTED` / NULL |
| `ODER_PTNR_REF_NO` | varchar(50) | 원 주문번호(파트너가 준 값) |
| `ODER_ORGN_USER_ID` | int | 원 주문의 `ODER_USER_ID` |
| `ODER_PTNR_RTRN_DT` | datetime | 회수 물품 매장 반입 시각(UTC). **교환 건만** |

---

## 3. 해야 할 일

### 3-1. 방향 뒤집기 (필수)

**회수지가 일반 주문의 배송지 컬럼에 그대로 들어간다.** 스키마에 "출발지" 컬럼이 따로 없기 때문이다.
그래서 반품 건을 아무 처리 없이 보여주면 기사에게 **"매장에서 받아 고객에게 간다"** 로 보인다. 반대다.

```js
// ODER_PTNR_DELY_KD === 'RETURN'
//   출발지 = ODER_DELY_ADDR + ODER_DELY_DTPT_ADDR   (고객 집)
//   목적지 = T_SHOP_MAG 의 매장 주소
//
// ODER_PTNR_DELY_KD === 'EXCHANGE'
//   매장 → 고객(교환품 전달) → 매장(기존품 반입)  3지점
//
// 그 외 (NULL / 'UNCOLLECTED')
//   기존과 동일: 매장 → 고객
```

> ⚠️ **위경도 컬럼명이 실제와 반대다.** 위도가 `ODER_DELY_ADDR_LOT`, 경도가 `ODER_DELY_ADDR_LAT` 다.
> 기존 데이터가 그렇게 쌓여 있어 맞춘 것이니 그대로 따를 것. 지도·내비 연동 시 주의.

**손볼 곳**

| 파일 | 할 일 |
|---|---|
| `pages/api/btch/[oderUserId].js` | SELECT 에 `ODER_PTNR_DELY_KD`, `ODER_PTNR_REF_NO`, `ODER_PTNR_RTRN_DT` 추가 |
| `pages/api/btch/btchList.js` | 목록에도 `ODER_PTNR_DELY_KD` 를 내려 배지 표시 |
| `pages/btch/[oderUserId].js` | 배차 진행 화면. 출발지·목적지 표시와 지도 연동을 유형별로 분기 |

### 3-2. 교환의 "회수 완료" 동작 (필수)

교환은 **한 건에서 완료가 두 번**이다.

```
① 고객에게 교환품 전달  → ODER_PGRS_STAT = '06'      (기존 배달완료 처리 그대로)
② 기존품을 매장에 반입  → ODER_PTNR_RTRN_DT = NOW()   ← 이 동작이 아직 없다
```

②를 누를 버튼이 필요하다. 이 값이 채워지면 파트너에게 `RETURNED`(회수완료)를 통보한다.

```sql
UPDATE T_ODER_USER_INFO
   SET ODER_PTNR_RTRN_DT = NOW()
     , MDFC_DT = NOW()
 WHERE ODER_USER_ID = ?
   AND SHPR_ID = ?
   AND ODER_PTNR_DELY_KD = 'EXCHANGE'
```

> **`ODER_PGRS_STAT` 은 절대 바꾸지 말 것.** `06` 그대로 두고 이 컬럼만 채운다. 이유는 4절.

교환 건에서만 버튼을 노출한다(`ODER_PTNR_DELY_KD === 'EXCHANGE'` 이고 `ODER_PGRS_STAT === '06'` 일 때).

### 3-3. 회수 물품 표시

교환은 물품이 둘인데 컬럼이 하나라 이렇게 나뉘어 있다.

```
ODER_DELY_ARTG   우유 2개 (교환품), 파손주의          ← 매장에서 픽업할 것
ODER_RMK         파트너 접수(...) / 배송서비스: 교환 / 원주문: ... / 사유: ... / 회수품: 우유 2개 (기존품) 1박스
```

기사는 **받아 올 물건**을 알아야 하므로 `ODER_RMK` 의 `회수품:` 뒤를 화면에 보여줘야 한다.

**비고를 파싱하는 게 불안하면 알려 달라.** 회수 물품 전용 컬럼을 두는 쪽으로 바꿀 수 있다
(`kr.co.baskydeli.api` 의 `OrderFollowUpService.toFollowUpOrder(ExchangeRequest)` 한 곳 수정).

### 3-4. 파트너 상태 통보 — **설계 결정이 필요하다**

이마트에 배송 상태를 알려 줘야 하는데, **상태를 실제로 바꾸는 곳이 이 앱이다.**

```
pages/api/btch/btchAcp.js          배차 수락        → PICKUP
pages/api/btch/ing/btchStat.js     상태 변경        → DELIVERING 등
pages/api/btch/ing/btchComp.js:46  배달완료 ('06')  → DELIVERED / RETURNED
```

당초에는 통보 호출을 `shop.qqcart.www`(관리자)에 넣기로 했는데, 관리자가 수동으로 바꾸는 경우는
일부이고 **대부분의 상태 변경은 이 앱에서 일어난다.** 그래서 선택이 필요하다.

| 안 | 내용 | 장단 |
|---|---|---|
| (a) 각자 전송 | 이 앱과 www 가 각각 이마트로 HTTP 전송 | 중복 구현. 재시도·키 관리가 두 곳 |
| (b) **API 서버 경유** | 상태 변경 후 `kr.co.baskydeli.api` 의 내부 엔드포인트를 호출 → 거기서 이마트로 전송 | 전송·재시도·키가 한 곳. **권장** |
| (c) 폴링 | API 서버가 주기적으로 변경 감지 | 지연·부하. 비권장 |

**(b)로 간다면** 이 앱은 상태 변경 커밋 후 내부 API 하나만 호출하면 된다(예: `POST /internal/delivery-status`).
그 엔드포인트는 아직 없다 — 만들기 전에 결정해야 한다.

전송 규격·재시도 규칙은
`kr.co.baskydeli.api/docs/api/비하이브→이마트 API.xlsx` 와
`src/test/.../OutboundDeliveryStatusTests.java`(참고 구현) 참조.

**통보 대상은 `ODER_SYSTEM='PARTNER'` 인 건만이다.** 일반 주문은 보내지 않는다.

상태 번역 규칙:

```js
// 회수 시각이 있으면 무조건 회수완료 (교환의 매장 반입)
if (ODER_PTNR_RTRN_DT) return 'RETURNED';
// 반품은 매장 도착이 곧 회수완료 (고객 → 매장 단방향이라 완료가 한 번뿐)
if (stat >= '06' && ODER_PTNR_DELY_KD === 'RETURN') return 'RETURNED';
// 그 외
if (stat === '03' || stat === '04') return 'PICKUP';
if (stat === '05') return 'DELIVERING';
if (stat >= '06') return 'DELIVERED';
```

---

## 4. 하지 말아야 할 것

### 4-1. `ODER_PGRS_STAT` 에 새 코드 추가 금지

`varchar(2)` 이고 www/store 쿼리 92곳에 하드코딩돼 있다. 특히 `NOT IN` / `!=` 조건 10곳은
**모르는 코드를 "진행중"으로 취급**해서 종결된 건이 배차 목록에 계속 남는다.

**이 앱에도 위험한 코드가 있다.**

```js
// pages/api/btch/ing/btchComp.js:36
if (cmm.util.getNumber(rows[0].ODER_PGRS_STAT) >= 6) { ... }   // '06' → 6
```

문자열 상태 코드를 숫자로 바꿔 비교한다. 만약 `'061'` 같은 3자리 코드를 넣었다면 `61 >= 6` 이 되어
엉뚱하게 동작한다. 그래서 **상태 코드 체계는 건드리지 않고** 별도 컬럼(`ODER_PTNR_RTRN_DT`)으로
회수 완료를 표현하기로 한 것이다.

`pages/api/btch/ing/btchStat.js:27,41` 의 `ODER_PGRS_STAT != '06'` 도 같은 이유로 주의.

### 4-2. `ODER_KD` 에 반품·교환 코드 추가 금지

`ODER_KD='PIUP'` 는 분류가 아니라 **매장 목록·배차 대기 목록의 필터**다
(`shop.qqcart.store` 의 `store/sql_oder.xml:43,222`, `etps/sql_etps_shpr.xml:134` 등).
여기에 `RTRN`/`EXCH` 를 넣으면 반품·교환 건이 목록에서 사라져 배차 자체가 안 된다.

### 4-3. 후속 건을 원 주문과 같은 번호로 묶지 말 것

각 건은 자기 번호(`ODER_RPRE_NO`)를 갖고, 원 주문은 `ODER_PTNR_REF_NO`(번호) /
`ODER_ORGN_USER_ID`(PK)로 연결된다.

---

## 5. 참고 위치

`D:/99.workspace/eclipse/justdoeng/kr.co.baskydeli.api` 기준.

| 파일 | 내용 |
|---|---|
| `docs/internal/partner-order-extension.md` | 전체 설계. 왜 이렇게 했는지가 다 적혀 있다 |
| `docs/api/이마트→비하이브 API.xlsx` | 파트너 규격서. 반품·교환·미회수 시트에 물품·주소 항목 정의 |
| `docs/api/비하이브→이마트 API.xlsx` | 파트너 규격서(상태 통보) |
| `src/main/.../domain/order/dto/PartnerDeliveryType.java` | `ODER_PTNR_DELY_KD` 값 정의 |
| `src/main/.../domain/order/dto/DeliveryStatus.java` | 상태 번역 규칙(3-4절 그대로) |
| `src/test/.../OutboundDeliveryStatusTests.java` | 통보 참고 구현 + 규격 고정 테스트 |
| `docs/internal/sql/partner_order_columns.sql` | DDL (구분 3컬럼) |
| `docs/internal/sql/partner_exchange_column.sql` | DDL (회수 시각) |

형제 프로젝트에도 같은 성격의 인계 문서가 있다.
`shop.qqcart.www/.claude/PARTNER-INTEGRATION.md`,
`shop.qqcart.store/.claude/PARTNER-INTEGRATION.md`

---

## 6. 아직 못 하는 것

1. **이마트 수신 엔드포인트가 안 열렸다.** 2026-09-11 기준 `dev-omnipo.emart.com` 이 DNS 에 없고
   `43.201.213.76` 도 타임아웃이다(당사 송신 IP 미등록). 통보 구현은 해 두되 실제 전송 확인은 그 뒤.
2. **API 키를 아직 못 받았다.**
3. **운영 DB 에 2절 컬럼이 없다.** 배포 전에 DDL 적용이 필요하다.
4. **정산 요금 체계 미확정** — 회수 건·교환(왕복인데 한 건)의 배달료를 어떻게 볼지.
