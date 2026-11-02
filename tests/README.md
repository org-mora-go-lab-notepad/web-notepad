# E2E 작성과 공통 리소스

각 번호 파일은 하나의 독립적인 동작을 검증한다. 대응하는 요구사항은 `tests-prd/`에 작성하고, 파일 번호와 요구사항 번호를 함께 변경한다. 테스트 개수를 맞추기 위해 같은 동작의 표시 문구나 입력값만 바꾼 사례를 추가하지 않는다.

## E2E 품질 계약

- 하나의 테스트 파일은 하나의 사용자 또는 서버 시나리오만 검증한다.
- 준비 조건은 테스트 본문이나 이름이 드러나는 준비 함수로 구성한다.
- 실행 동작은 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 수행한다.
- 핵심 결과 assertion은 테스트 파일 안에서 직접 확인할 수 있어야 한다.
- 번호만 전달해 검증 전체를 외부 함수에 위임하지 않는다.
- 실패한 단계와 assertion은 위반된 사용자 계약을 바로 식별할 수 있어야 한다.
- `tests-prd`의 요구사항 번호·내용과 테스트 파일 번호·제목을 항상 일치시킨다.
- 공통 유틸은 데이터 준비와 반복 입력 동작에만 사용한다.
- 테스트 수정 시 대응하는 `tests-prd` 문서도 함께 현행화한다.
- 각 `e2e.spec.ts`는 설명 주석이나 빈 줄로 분량을 채우지 않고 실행 가능한 준비·동작·검증 코드를 20줄 이상 포함한다.

위 항목은 테스트 작성 정책이므로 번호를 붙이지 않는다. 제품 및 서버의 검증 가능한 요구사항은 `tests-prd/` 상세 문서에 `{n}. 요구사항` 형식으로 작성하고, 같은 번호의 `NN.e2e.spec.ts`를 반드시 함께 둔다. 이 문서·코드 계약 자체의 자동 검증 범위는 `tests-prd/01. 앱 기반/18. E2E 문서와 구현 계약.md`와 대응 E2E에서 관리한다.

## 공통화 기준

- `__fixture__`: `createTabFixture`, `createGroupFixture`, `createBookmarkFixture`, `createClosedTabFixture`로 정상 데이터를 만든다. 해당 시나리오의 차이만 overrides에 적는다.
- `__util__/state`: `writeStoredState`는 최초 진입 전에 한 번만 데이터를 넣는다. 저장·새로고침 검증에서는 매번 값을 덮어쓰는 `seedStoredStateOnLoad`를 사용하지 않는다. `restoreWorkspace`는 손상된 입력의 복구 결과를 UI로 확인하고 현재 그룹을 선택해 저장한다.
- `__util__/workspace`: 그룹·메뉴·패널·가이드 진입과 검색 작업공간 준비를 공유한다. `openAccountMenu`는 설정 검증에 로그인 전제가 필요하면 고유한 실제 테스트 세션을 준비한다. `openSettingsPanel`은 계정 메뉴의 설정 항목으로 진입한다. `openPanel`은 토글 동작이므로 이미 열린 패널에 다시 호출하지 않는다.
- `__util__/dashboard`: 카드 상태 이동과 데이터 보존 검증의 공통 준비를 제공한다. 각 테스트는 자신의 데이터·배치·편집 연속성에 대한 결과를 직접 검증한다.
- `__util__/auth`: 서명된 테스트 세션을 실제 API 또는 브라우저 쿠키에 전달한다. 서명 fixture는 앱의 세션 생성 함수를 가져오지 않고 독립적으로 구성한다. 비밀키는 Playwright 서버 설정의 로컬 테스트 값과 맞춘다.
- `__util__/request`: API GET은 `getApi`로 공통화한다. 알려진 읽기 전용 경로만 `ECONNRESET`에 최대 두 번 다시 연결하며 HTTP 오류는 그대로 검증한다. OAuth·콜백처럼 상태를 바꿀 수 있는 GET과 쓰기 요청은 자동 재전송하지 않는다.

인증 세션·OAuth 상태 거부·로그아웃은 실제 로컬 Route Handler로 검증한다. 외부 카카오 인증 서버로의 리다이렉트는 따라가지 않는다. 네트워크 실패·서버 오류 UI 사례에만 해당 요청을 가로챈다.

조건을 기다릴 때는 locator assertion 또는 `expect.poll`을 사용한다. 실행 중인 앱의 스토어 액션을 직접 호출해 E2E 조작을 대체하지 않는다.

## 검증

```sh
npm run test:e2e:structure
npm run test:e2e -- --workers=2
npm run lint
npx tsc --noEmit
```

구조 검사는 PRD 번호, 누락·초과 파일, 파일당 단일 최상위 테스트, 공통 리소스 배럴을 검사한다. 실행 결과는 Playwright가 실제 등록한 사례 수와 함께 확인한다.

## 분리 서버 통합 실행

BFF 체크아웃에서 npm ci를 실행하고 `NOTEPAD_BFF_DIR`로 경로를 지정합니다. Playwright가 3000 프런트와 3101 BFF를 실행합니다. 서버 단독 요구사항 48개는 BFF로 이동했고 카카오 인증과 UI 통합 검증은 유지합니다. BFF의 고정 리비전은 CI checkout ref로 관리합니다. 운영 서버·DB는 사용하지 않습니다.

## API 실행 모드

기본 `npm run test:e2e`는 BFF 저장소 없이 독립 메모리 Mock 서버를 사용합니다. 실제 연동 회귀는 `npm run test:e2e:bff`로 같은 전체 테스트를 실행하고 별도 SQLite 테스트 DB만 사용합니다. 운영 DB로 E2E를 실행하지 않습니다. 새 편집 시나리오는 `openEditor` 또는 `createGroupsWithTabs`처럼 공개 UI의 `+` 동작을 수행하는 준비 함수를 사용합니다. 빈 작업공간 자체의 계약은 `page.goto` 후 자동 생성이 없음을 직접 검증합니다.
