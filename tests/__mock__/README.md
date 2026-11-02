# 독립 로컬 API Mock

`npm run dev` 또는 `npm run dev:mock`은 이 저장소만으로 프런트(3000)와 Mock API(3001)를 실행합니다. BFF 체크아웃이나 Turso 자격증명이 필요하지 않습니다. 로컬 로그인은 Test 1·Test 2 순서로 발급되고 서로 다른 브라우저 컨텍스트에서 개인 저장과 그룹 공유를 테스트할 수 있습니다.

- 상태: `.local/mock-api.json`, 원자적 교체로 저장하며 자동 초기화하지 않습니다.
- API: 개인 저장 이력, 그룹 공유·참여·수정·나가기·공유 해제, 보드, 알림, Swagger.
- 인증: 프런트 카카오/개발 세션의 Origin 바인딩 단기 토큰을 검증합니다. 서버 키와 DB 자격증명은 브라우저에 공개하지 않습니다.
- 보존: 누락 탭 차단, revision 충돌, 저장 완료된 이동 대상 확인, 명시적 빈 탭 닫기와 제거 직전 로컬 백업을 지원합니다.
- 테스트: `npm run test:e2e`는 별도 포트의 메모리 Mock을 사용합니다. 영구 저장 테스트만 임시 JSON을 사용하고 종료 시 정리합니다.
- 실제 연동: `npm run dev:bff`, `npm run test:e2e:bff`. 운영 빌드와 `npm start`는 기존 실제 BFF 연결을 사용합니다.

`api/openapi.json`은 BFF API의 계약 fixture입니다. 계약 변경 시 실제 BFF 문서와 함께 갱신하고, 동일 프런트 E2E를 Mock·실제 BFF 양쪽에서 검증합니다. Mock에는 Turso 클라이언트·원격 DB 연결·운영 데이터 정리 기능을 넣지 않습니다.
