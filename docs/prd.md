# 강꾸 Kangku MVP PRD

## Goal

강꾸는 강의자료 위에 낙서, 채팅, 공부 기록, 피드백을 얹어 수업을 함께 꾸미는 강의 참여형 앱이다. MVP는 강의자료를 중심으로 학생 참여 흔적을 남기고, 수업 시간 중 대화를 수업 맥락에 묶는 경험을 검증한다.

## Target users

- 대학생/수강생: 수업 자료에 필기하고, 질문하고, 친구들의 공부 흔적을 참고하고 싶은 사용자.
- 교수자/조교: 학생 반응, 이해도, 질문, 수업 분위기를 빠르게 확인하고 싶은 사용자.

## Core loop

1. 교수자 또는 학생이 수업 자료를 업로드한다.
2. 수업 시간에 자료와 연결된 강꾸 세션이 열린다.
3. 학생은 자료 위에 낙서/형광펜/메모를 남긴다.
4. 수업 중 채팅방에서 반응과 질문을 남긴다.
5. 교수님께 한마디 보드에 짧은 피드백을 남긴다.
6. 수업 종료 후 채팅 작성은 잠기고, 기록은 복습용으로 남는다.

## MVP scope

1. Course and lecture session creation.
2. Lecture material upload metadata and PDF viewer placeholder.
3. Annotation model for highlights, freehand doodles, sticky notes, and confusion markers.
4. Class-time chat room that can be locked after the scheduled end time.
5. Professor feedback board with anonymous or named messages.
6. Study post/feed model for notes, summaries, and proof-of-study entries.
7. Basic public landing/app preview.

## Non-goals for first skeleton

- Full PDF rendering engine implementation.
- Real-time collaborative canvas syncing.
- LMS integration.
- Attendance/quiz integration.
- AI summary generation.
- Payment or marketplace features.
