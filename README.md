# Mora Notepad

탭과 그룹으로 메모를 정리하고, 대시보드와 공유 보드로 협업하는 브라우저 노트 앱입니다.

**현재 버전:** `1.10.3` · **개발 서버:** `http://localhost:3000` · **E2E:** 748개

[PRD](PRD.md) · [상세 요구사항](tests-prd/) · [E2E 가이드](tests/README.md) · [버전 이력](versions/)

## 핵심 기능

| 영역      | 주요 기능                                                                      |
| --------- | ------------------------------------------------------------------------------ |
| 에디터    | 탭 기반 메모, 줄 번호·줄 선택, 실행 취소/다시 실행, 북마크, 탭 색상, 분할 화면 |
| 그룹      | My Group·Shared Group, 전체 그룹 보기, 생성·수정·삭제·정렬, 그룹별 탭 이동     |
| 대시보드  | Note·To Do·Ready·Doing·Done 상태, 카드 드래그 정렬, 그룹별 상태명 설정         |
| 검색·기록 | 전체 제목·본문 검색, 북마크 목록, 닫은 탭 복원, 브라우저 뒤로가기·앞으로가기   |
| 공유      | 카카오 로그인, 초대 링크, 공유 그룹 공동 편집, 참여·나가기·공유 취소           |
| 보드      | My Group과 Shared Group 목록, 그룹 상세 정보, 공유 노트 탭 미리보기            |
| 개인화    | 다크·라이트 테마, 글자 크기, 탭 색상, 영어·한국어, 패널 위치, PC 푸터 구성     |
| 반응형    | PC·모바일 전용 레이아웃, 고정 모바일 푸터, 터치·스와이프 상호작용              |

## 빠른 시작

```bash
npm ci
npm run dev:local
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

운영 공유·저장 API는 [web-notepad-bff](https://github.com/org-mora-go-lab-notepad/web-notepad-bff)에서 제공합니다. 로컬에서는 이 저장소만 설치한 뒤 `npm run dev`를 실행하면 프런트(3000)와 독립 Mock API(3001)가 함께 실행됩니다. BFF 저장소·Turso 자격증명 없이 개인 저장과 공유 그룹 CRUD를 개발하고 테스트할 수 있습니다. 상태는 `.local/mock-api.json`에 유지하며 자동 초기화하지 않습니다. 실제 BFF를 연결할 때는 `npm run dev:bff`를 사용합니다. 카카오 인증은 프런트에 유지하고 로컬 로그인은 Test 1·Test 2 계정을 제공합니다. `Ctrl+C`로 두 서버를 함께 종료합니다.

### 자주 사용하는 명령어

| 명령어                       | 설명                             |
| ---------------------------- | -------------------------------- |
| `npm run dev`                | 프런트 3000 + 독립 Mock API 3001 |
| `npm run build`              | 프로덕션 빌드 생성               |
| `npm run start`              | 3000 포트에서 프로덕션 서버 실행 |
| `npm run lint`               | ESLint 검사                      |
| `npm run format`             | Prettier 형식 적용               |
| `npm run format:check`       | Prettier 형식 검사               |
| `npm run test:e2e:structure` | PRD와 E2E 파일 구조 계약 검사    |
| `npm run test:e2e`           | Playwright E2E 전체 실행         |

## 로그인과 서버 동기화

실제 카카오 로그인과 Turso 동기화를 사용하려면 환경 파일을 준비합니다.

```bash
cp .env.example .env.local
```

| 환경 변수             | 필수 조건             | 용도                                          |
| --------------------- | --------------------- | --------------------------------------------- |
| `KAKAO_REST_API_KEY`  | 카카오 로그인 사용 시 | 카카오 애플리케이션 REST API 키               |
| `KAKAO_REDIRECT_URI`  | 카카오 로그인 사용 시 | OAuth 콜백 주소                               |
| `AUTH_SECRET`         | 카카오 로그인 사용 시 | 세션 서명용 긴 임의 문자열                    |
| `KAKAO_CLIENT_SECRET` | 선택                  | 카카오 Client Secret을 활성화한 경우 사용     |
| `NOTEPAD_BFF_URL`     | 운영 필수             | BFF HTTPS origin (개발 기본값 localhost:3001) |
| `NOTEPAD_BFF_SECRET`  | 운영 필수             | BFF와 공유하는 서버 전용 토큰 서명 키         |

로컬 카카오 콜백 기본값은 다음과 같습니다.

```text
http://localhost:3000/api/auth/oauth/kakao/callback
```

카카오 개발자 콘솔에서 위 Redirect URI를 등록하고, **카카오 로그인 → 동의항목**의 닉네임(`profile_nickname`)과 프로필 사진(`profile_image`)을 활성화해야 합니다.

### 데이터 저장 방식

- 비로그인 작업공간은 Zustand를 통해 브라우저 `localStorage`에 즉시 저장합니다.
- 로그인 작업공간은 로컬 상태를 유지하면서 최신 서버 이력을 Turso와 동기화합니다.
- 탭 본문은 빈 문자열과 1~2자 내용도 저장하며, 내용이 남은 탭은 닫아도 서버에서 보존합니다.
- 저장 실패 항목은 로컬 대기열에 남겨 재시도하며 새로고침 후에도 복구합니다.
- 서버는 기존 탭이 누락된 저장을 차단합니다. 그룹 간 이동은 대상 DB 저장을 확인한 후 원본에서 제거하며, 빈 탭·짧은 본문·닫힌 탭을 자동 삭제하지 않습니다. 사용자가 본문을 완전히 비운 뒤 해당 탭을 직접 닫은 경우에만 최신 저장 기준을 확인하고 백업 후 삭제합니다.
- 공유 탭은 삭제 ID 목록만 보내던 구버전 요청도 차단합니다. 영구 제거는 대상 ID와 별도의 삭제 확인이 함께 있어야 합니다.
- 이동·명시적 삭제 전 스냅샷은 `notepad_removal_backups`에 별도 보관합니다. 일반 변경 이력 100개 제한으로 이 백업을 삭제하지 않으며, 운영 데이터 삭제에는 대상별 사용자 승인이 필요합니다.
- 다른 기기나 사용자의 변경은 초기 진입, 화면 복귀, 연결 복구 시 다시 가져옵니다.
- 동시 수정 충돌이 발생하면 한쪽 내용을 덮어쓰지 않고 복구 가능한 상태로 보존합니다.

> 공유 링크를 가진 로그인 사용자는 해당 그룹의 편집 권한을 얻습니다. 신뢰할 수 있는 사용자에게만 링크를 전달하세요.

## 화면 구성

### 에디터와 그룹

메모는 탭 단위로 관리합니다. 탭을 그룹 사이에서 이동하거나 여러 편집 영역으로 나눌 수 있으며, All Group·All My Group·All Shared Group에서 범위별 메모를 모아 볼 수 있습니다.

PC 푸터에는 Group·Card·계정 진입점을 기본으로 표시합니다. PC에서는 우측 끝 Menu 아이콘, 모바일에서는 동일 너비의 네 번째 영역에 배치한 Menu(메뉴)에서 가이드·검색·북마크·설정을 열고 테마를 바로 전환할 수 있습니다. 그룹·더보기·계정 메뉴 항목을 푸터에 고정하고 드래그해 순서를 바꿀 수 있으며, 설정에서 아이콘만 표시하도록 전환할 수 있습니다.

### 대시보드

탭 색상과 상태를 기준으로 Note·To Do·Ready·Doing·Done 컬럼에 카드를 배치합니다. 카드를 드래그해 상태와 순서를 변경하고, Note·Done 표시 여부 및 상태 이름을 그룹별로 관리할 수 있습니다.

### 공유 보드와 My Page

- `/board`: My Group과 Shared Group을 검색하고 그룹 정보·참여자·공유 노트를 확인합니다.
- `/my-page`: 카카오 프로필, 그룹·공유·참여·노트·북마크 현황과 동기화 상태를 확인합니다.

## 기술 구성

| 구분        | 기술                         |
| ----------- | ---------------------------- |
| 프레임워크  | Next.js 16, React 19         |
| 언어·상태   | TypeScript, Zustand          |
| UI          | SCSS, Lucide React           |
| 인증·데이터 | Kakao OAuth, libSQL·Turso    |
| 품질        | ESLint, Prettier, Playwright |

## 프로젝트 구조

```text
app/                 Next.js 페이지 라우팅과 Route Handler
src/1-page/          페이지 단위 구성
src/2-widget/        헤더·푸터·패널 등 화면 블록
src/3-feature/       편집기·그룹·검색·대시보드 등 사용자 기능
src/4-entity/        노트 도메인, 상태 관리, 저장·복원 로직
src/5-shared/        공통 UI, 훅, 스타일, 다국어 문구
tests-prd/           번호가 지정된 상세 요구사항
tests/               요구사항과 1:1로 대응하는 Playwright E2E
versions/            버전별 변경 이력
```

상세 아키텍처와 기능 요구사항은 [PRD.md](PRD.md), 테스트 작성 원칙과 공통 fixture 사용법은 [tests/README.md](tests/README.md)를 참고하세요.

## 검증

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm run test:e2e:structure
npm run build
npx playwright install chromium
npm run test:e2e
```

현재 프런트 743개의 E2E가 등록되어 있습니다. `npm run test:e2e`는 BFF 체크아웃 없이 격리된 메모리 Mock 서버에서 전체 테스트를 실행합니다. `npm run test:e2e:bff`는 같은 전체 테스트를 실제 로컬 BFF에 연결해 검증하며 `NOTEPAD_BFF_DIR`로 경로를 지정할 수 있습니다. 이 모드에서만 BFF 저장소의 `npm ci`가 필요하며 별도 로컬 파일 DB를 사용합니다. CI도 Mock·BFF 전체 검증을 각각 실행합니다. `tests-prd/` 번호 요구사항과 `tests/` 파일은 1:1로 대응합니다. [Mock 개발 안내](tests/__mock__/README.md)를 참고하세요.

## 버전과 배포

1. `main`에서 `1.9.35`과 같은 버전 브랜치를 생성합니다.
2. `package.json`과 `package-lock.json`의 버전을 함께 올립니다.
3. 검증을 통과한 변경을 PR로 `main`에 병합합니다.
4. 병합된 최신 `main`에서 다음 버전 브랜치를 시작합니다.

Vercel의 Production Branch는 `main`을 사용합니다. 배포 환경에서 카카오 로그인을 사용한다면 실제 배포 도메인의 콜백 주소를 카카오 Redirect URI와 `KAKAO_REDIRECT_URI`에 동일하게 등록해야 합니다.

```text
https://<배포-도메인>/api/auth/oauth/kakao/callback
```

Turso 환경 변수는 BFF에만 설정합니다. BFF를 먼저 배포한 뒤 프런트에 `NOTEPAD_BFF_URL`, `NOTEPAD_BFF_SECRET`을 설정합니다. 기존 `AUTH_SECRET`은 프런트에서 변경 없이 유지합니다. 프런트는 카카오 세션에서 60초짜리 BFF 토큰을 발급하고 기존 공유 링크를 검증합니다. 브라우저가 BFF를 직접 호출하며 새 공유 링크는 BFF가 서명하므로 BFF에 AUTH_SECRET을 복사하거나 SHARE_TOKEN_SECRET을 설정할 필요가 없습니다. BFF는 토큰의 서명·만료·Origin과 기존 링크 검증 결과를 확인하고 DB의 공유 활성 상태·버전을 다시 검사합니다. [전환·롤백 절차](https://github.com/org-mora-go-lab-notepad/web-notepad-bff/blob/main/docs/migration.md)를 참고하세요. 이번 코드 이관으로 운영 DB를 정리하거나 탭을 삭제하지 않습니다.

## 로컬 Mock·BFF와 Swagger

- `npm run dev:local`: 3000 → 3001로 고정 연결하고 두 프로세스의 요청 서명 키와 공유 링크 키를 일치시킵니다. 환경 파일을 덮어쓰지 않습니다.
- 기본 `npm run dev`와 `npm run dev:mock`은 BFF를 탐색하지 않는 독립 Mock 모드입니다.
- 실제 BFF 모드의 BFF 위치는 `NOTEPAD_BFF_DIR`, 같은 상위 폴더의 `web-notepad-bff`, 기존 조직 폴더의 체크아웃 순서로 찾습니다. `npm run dev:bff -- --check`로 경로를 확인합니다.
- BFF의 `.env.local` DB 설정을 유지합니다. 기존 로컬 DB 파일을 초기화하거나 복사하지 않습니다.
- [http://localhost:3000/docs](http://localhost:3000/docs): 로컬 프런트의 카카오/Test 로그인 세션으로 Swagger Try it out을 실행합니다. 브라우저에 서버 비밀키를 넣을 필요가 없습니다. 저장 요청은 실제 로컬 데이터를 변경하므로 테스트용 작업공간을 사용합니다.
- [http://localhost:3001/docs](http://localhost:3001/docs): BFF 직접 호출용 명세입니다. 업무 API는 브라우저 Bearer 토큰 또는 서버 게이트웨이 서명이 필요합니다.
- 프런트 `/docs`는 개발 모드에만 제공하며 실제 API의 인증·Origin 검증은 그대로 적용합니다.

탭이 없는 작업공간은 상단 새 탭 `+`만 표시합니다. 마지막 탭 닫기·그룹 이동·새로고침·그룹 생성으로 빈 탭을 자동 생성하지 않습니다. 기존 그룹·닫힌 탭 데이터는 보존하고 사용자의 명시적 빈 탭 닫기만 기존 삭제 규칙을 따릅니다.

탭 검색은 탭 제목·본문만 대상으로 하며, 검색·북마크 본문 미리보기는 줄바꿈을 보존하고 최대 6줄로 표시합니다. 푸터 우측은 메뉴 아이콘을 사용하고 모바일에서는 아이콘 아래 Menu(한국어 메뉴)를 표시합니다.

모든 탭이 닫혔을 때 빈 에디터를 클릭·터치해 + 버튼처럼 새 탭을 생성할 수 있습니다. 그룹 사이드바 상단은 Group, 하단 시스템 그룹 옵션은 Group Option입니다. 모바일 Card는 Doing·Ready·To Do·Done·Note 순서로 표시합니다.

패널은 슬라이드 애니메이션 없이 즉시 열립니다. 설정의 Group Position으로 그룹 패널의 Left·Right 위치를 선택하고, Card·Settings 등의 Panel Position과 독립적으로 저장합니다. 푸터 Menu는 Theme를 맨 위에, Board를 기본 명령 맨 아래에 표시합니다. 계정 메뉴에는 Logout·My Page만 남깁니다. PC 기본 Group·Card·계정도 푸터에서 해제해 Menu 하단으로 옮기거나 다시 고정할 수 있으며, 모두 해제하면 중앙은 비어 있습니다. 모바일의 기본 네 진입점은 유지합니다.

모바일은 선택한 그룹의 Card 화면에서 시작합니다. 카드를 누르면 해당 노트를 선택하고 바텀시트에서 본문 편집·줄 선택을 제공합니다. 시트는 25·50·75·100% 높이로 조절하고 마지막 높이를 기억하며, 닫기·뒤로가기는 선택한 카드를 유지합니다. 상태 제목으로 카드 목록을 접고 펼칠 수 있습니다. 모바일 푸터는 Group을 고정 표시하고 그룹명은 카드 헤더에 표시합니다. PC 탭과 좌우 패널 헤더는 44px 높이로 정렬하며 푸터 고정 설정을 보존합니다. 보드 상세는 PC·모바일에서 편집기 스와이프로 노트를 전환합니다. Group Option 폭은 10% 줄이고, PC 그룹 사이드바의 최대 폭은 화면의 45.9%로 조정합니다.
