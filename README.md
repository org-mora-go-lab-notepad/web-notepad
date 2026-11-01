# Mora Notepad

탭과 그룹으로 메모를 정리하고, 대시보드와 공유 보드로 협업하는 브라우저 노트 앱입니다.

**현재 버전:** `1.9.35` · **개발 서버:** `http://localhost:3000` · **E2E:** 700개

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
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

공유·저장 API는 [web-notepad-bff](https://github.com/org-mora-go-lab-notepad/web-notepad-bff)에서 제공합니다. BFF 저장소에서도 `npm ci && npm run dev`를 실행하면 3001 포트로 연결됩니다. 카카오 인증은 이 저장소에 유지하며 로컬 개발 로그인은 Test 계정을 제공합니다. 기존 로컬 DB는 BFF의 TURSO_DATABASE_URL에 원래 파일의 절대 경로를 지정해 이어 사용합니다.

### 자주 사용하는 명령어

| 명령어                       | 설명                             |
| ---------------------------- | -------------------------------- |
| `npm run dev`                | 3000 포트에서 개발 서버 실행     |
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
| `NOTEPAD_BFF_SECRET`  | 운영 필수             | BFF와 공유하는 서버 전용 요청 서명 키         |

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

PC 푸터에는 Menu·Card·계정 진입점을 기본으로 표시합니다. 그룹·더보기·계정 메뉴 항목을 푸터에 고정하고 드래그해 순서를 바꿀 수 있으며, 설정에서 아이콘만 표시하도록 전환할 수 있습니다.

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

현재 프런트 700개의 E2E가 등록되어 있습니다. BE 전용 48개와 대응 문서는 BFF로 이관했습니다. 프런트 통합 테스트 실행 시 `NOTEPAD_BFF_DIR`에 BFF 체크아웃 경로를 지정합니다. 기본값은 `../../org-mora-go-lab-notepad/web-notepad-bff`이며 BFF의 `npm ci`를 먼저 실행해야 합니다. 테스트는 별도 BFF 프로세스와 로컬 파일 DB를 사용합니다. `tests-prd/`의 각 번호 요구사항은 `tests/`의 같은 번호 `e2e.spec.ts`와 1:1로 대응합니다. 구조 검사는 번호 대응, 파일당 단일 테스트, 최소 코드 분량과 공통 리소스 배럴을 확인합니다.

## 버전과 배포

1. `main`에서 `1.9.35`과 같은 버전 브랜치를 생성합니다.
2. `package.json`과 `package-lock.json`의 버전을 함께 올립니다.
3. 검증을 통과한 변경을 PR로 `main`에 병합합니다.
4. 병합된 최신 `main`에서 다음 버전 브랜치를 시작합니다.

Vercel의 Production Branch는 `main`을 사용합니다. 배포 환경에서 카카오 로그인을 사용한다면 실제 배포 도메인의 콜백 주소를 카카오 Redirect URI와 `KAKAO_REDIRECT_URI`에 동일하게 등록해야 합니다.

```text
https://<배포-도메인>/api/auth/oauth/kakao/callback
```

Turso 환경 변수는 BFF에만 설정합니다. BFF를 먼저 배포한 뒤 프런트에 `NOTEPAD_BFF_URL`, `NOTEPAD_BFF_SECRET`을 설정합니다. 기존 공유 링크를 유지하도록 BFF의 `SHARE_TOKEN_SECRET`은 기존 프런트의 AUTH_SECRET과 같아야 합니다. [전환·롤백 절차](https://github.com/org-mora-go-lab-notepad/web-notepad-bff/blob/main/docs/migration.md)를 참고하세요. 이번 코드 이관으로 운영 DB를 정리하거나 탭을 삭제하지 않습니다.
