# 강꾸 (kangku)

> 함께 꾸미는 강의실 — PDF 강의자료에 실시간으로 필기하고 공유하는 협업 학습 앱

![강꾸 캐릭터 라인업](assets/characters/ganggung-character-lineup.png)

## 캐릭터 소개

| 몽글 | 토리 | 콩콩 | 누리 | 모아 |
|:---:|:---:|:---:|:---:|:---:|
| ![몽글](assets/characters/ganggung-01-mongle-pencil.png) | ![토리](assets/characters/ganggung-02-tori-question.png) | ![콩콩](assets/characters/ganggung-03-kong-focus.png) | ![누리](assets/characters/ganggung-04-nuri-share.png) | ![모아](assets/characters/ganggung-05-moa-group.png) |
| 공동 필기 리더 | 질문·채팅 버디 | 집중 타이머 버디 | 자료 공유 버디 | 스터디 그룹 오거나이저 |

## 주요 기능

- **수업방 생성** — PDF 강의자료 업로드와 함께 수업방 개설
- **공동 필기** — PDF 페이지 위에 실시간 필기, 정규화 좌표로 기기 간 동일한 위치 보장
- **자료 버전 관리** — PDF 교체 시 이전 버전과 필기 보존
- **PDF 내보내기** — 원본 PDF 전체 페이지에 필기를 벡터 합성하여 저장
- **로컬 우선** — 오프라인에서도 동작, 향후 서버 동기화 예정

## 화면 구성

| 화면 | 설명 |
|------|------|
| Auth | 로그인 / 회원가입 |
| Home | 내 강꾸방 목록 |
| Classes | 수업방 관리, PDF 업로드 |
| Lecture | PDF 뷰어 + 페이지별 필기 |
| Study | 공동 필기 세션 |
| My | 프로필, 개인 코드, 설정 |

## 기술 스택

- React Native 0.84.0 (Community CLI)
- React 19.2.3
- TypeScript
- Node.js 24.x / npm 11.x
- Android (API 35) / iOS

## 프로젝트 구조

```
kangku/
├── apps/
│   ├── mobile/       # Android/iOS 네이티브 앱 (활성 개발)
│   └── toss/         # 앱인토스 미니앱 (비활성)
├── assets/
│   └── characters/   # 캐릭터 일러스트
├── scripts/          # 개발 환경 PowerShell 스크립트
└── DEVELOPMENT.md    # 개발 환경 가이드
```

## 시작하기

### 요구 사항

- Node.js 24.18.0 (fnm 권장)
- JDK 17
- Android SDK (API 35)
- Android 에뮬레이터 `Kangku_API_35`

### 실행

```powershell
# 환경 점검
npm run doctor

# 에뮬레이터 연결
npm run android:emulator

# Metro 번들러 시작
npm run mobile:start

# Android 빌드 & 실행
npm run mobile:android
```

### 테스트 계정

- 아이디: `demo`
- 비밀번호: `kangku123`
- 개인 강꾸방 코드: `K7QP2A`

## 문서

- [개발 환경 가이드](DEVELOPMENT.md)
- [모바일 아키텍처](apps/mobile/ARCHITECTURE.md)
