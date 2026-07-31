# 강꾸 개발 환경

강꾸는 일반 Android/iOS 앱과 앱인토스 미니앱을 서로 다른 실행 껍데기로 관리합니다.

> 현재 개발 범위는 `apps/mobile`의 Android/iOS 앱뿐입니다. `apps/toss`는 기존 파일을 보존한 채 실행·수정하지 않습니다.

## 현재 앱 확인 계정

- 아이디: `demo`
- 비밀번호: `kangku123`
- 개인 강꾸방 코드: `K7QP2A`

회원가입하면 사용자별 6자리 개인 코드와 기본 강꾸방이 자동 생성됩니다. 현재 데이터는 기기 내부에 안전하게 유지되는 로컬 우선 구조이며, 다른 휴대폰과 실시간으로 동기화하려면 다음 단계에서 서버 API와 소켓 연결이 필요합니다. 로그인 저장소와 화면 로직은 이후 Google OAuth를 붙일 수 있도록 분리되어 있습니다.

수업방을 만들 때 PDF 강의자료 업로드는 필수입니다. 방장 또는 수업 개설자는 대기방에서 자료를 새 버전으로 교체할 수 있고, 이전 PDF와 그 버전에 작성한 필기는 지워지지 않습니다. 수업 화면은 업로드한 PDF를 직접 표시하며 페이지별 필기를 PDF 좌표로 저장합니다.

## 고정 버전

- Node.js 24.18.0 (fnm)
- npm 11.x
- JDK 17
- React 19.2.3
- React Native 0.84.0
- Apps in Toss SDK 2.x (현재 비활성)

루트에서 `npm run doctor`를 실행하면 핵심 버전, Android SDK, 전역 CLI 충돌을 확인합니다.

## 프로젝트 구조

- `apps/mobile`: Google Play와 App Store용 순수 React Native Community CLI 앱
- `apps/toss`: 앱인토스 Granite 런타임용 React Native 미니앱
- `assets`: 캐릭터와 디자인 원본
- 향후 `packages/core`: API 타입, 상태 모델, 순수 TypeScript 로직
- 향후 `packages/ui`: React Native 기본 컴포넌트만 사용하는 공통 UI

두 앱은 각각 독립된 `package.json`, `node_modules`, `package-lock.json`을 사용합니다. 초기 단계에서는 npm workspace로 합치지 않습니다.

## 충돌 방지 규칙

1. `expo`, `expo-router`, `expo-*`, 전역 `expo-cli`, 전역 `react-native-cli`를 설치하지 않습니다.
2. 명령은 항상 로컬 CLI로 실행합니다: `npm run ...` 또는 `npx ...`.
3. React와 React Native는 두 앱 모두 정확히 같은 버전을 유지합니다.
4. 앱인토스 SDK와 Granite 버전은 `ait migrate`가 정한 조합을 우선합니다.
5. 네이티브 라이브러리는 `apps/mobile`에만 추가합니다. 토스 앱에서 같은 기능이 필요하면 토스 SDK 지원 여부를 먼저 확인합니다.
6. 모바일 패키지 추가 후 `npm run doctor`, `npm run mobile:check`를 실행합니다. 토스 작업을 다시 시작할 때만 토스 검사를 별도로 실행합니다.
7. lockfile을 삭제하거나 `npm audit fix --force`를 실행하지 않습니다. 프레임워크 메이저 버전이 바뀔 수 있습니다.

앱인토스 SDK 2.10.8이 Windows 절대 경로를 생성 코드에 넣을 때 역슬래시를 이스케이프하지 않는 문제가 있어, `apps/toss/scripts/fix-granite-windows-path.cjs`가 설치·개발·빌드 전에 해당 경로만 교정합니다. SDK 업데이트 후 코드 형태가 달라지면 자동 수정을 중단하고 오류를 내도록 구성했습니다.

현재 SDK 2.10.8의 `@apps-in-toss/plugin-compat`에는 RN 0.72 하위 호환용 React 18.2와 `use-effect-event`의 peer 범위가 어긋나는 상위 패키지 경고가 하나 있습니다. 앱 루트의 React 19.2.3/RN 0.84.0 조합은 정상이고 RN 0.84·0.72 번들이 모두 빌드됩니다. 이 경고를 없애려고 `--legacy-peer-deps`, 임의 override, SDK 1.x 다운그레이드를 적용하지 않습니다.

`npm audit`의 React Native 및 앱인토스 항목에는 Metro/CLI/Fastify 같은 로컬 개발·빌드 서버 의존성이 포함됩니다. 호환되는 공식 패치가 나오기 전에는 개발 서버를 인터넷에 공개하지 말고 `adb reverse`로만 연결합니다. `npm audit fix`가 제안하는 앱인토스 SDK 1.x 다운그레이드는 사용하지 않습니다.

## 실행

Android 에뮬레이터 `Kangku_API_35`를 Android Studio Device Manager에서 실행한 뒤:

```powershell
npm run android:emulator
npm run mobile:start
npm run mobile:android
```

앱에서 필기를 끝낸 뒤 `PDF로 저장하기`를 누르면 원본 PDF 전체 페이지에 페이지별 필기를 합성합니다. Android는 `다운로드/강꾸`, iOS는 파일 앱의 사용자가 선택한 위치에 결과를 저장합니다.

공동 필기 및 자료 버전 설계는 [`apps/mobile/ARCHITECTURE.md`](apps/mobile/ARCHITECTURE.md)를 참고합니다.

앱인토스 샌드박스는 에뮬레이터에 설치되어 있습니다. 개발 서버를 시작하기 전에:

```powershell
npm run android:ports
npm run toss:dev
```

`apps/toss/granite.config.ts`의 `appName`, 표시 이름, 아이콘 URL은 앱인토스 콘솔 등록값과 반드시 일치해야 합니다.
