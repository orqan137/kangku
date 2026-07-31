# Kangku Architecture

## Recommended stack

- Mobile: React Native + Expo + TypeScript + Expo Router.
- Backend: FastAPI + uv + Pydantic v2 + SQLAlchemy 2.x + PostgreSQL.
- Storage: S3-compatible object storage for lecture PDFs, thumbnails, and attachments.
- Web: React + Vite for landing, preview, and share/fallback pages.

## Domain model

- `User`: student, professor, teaching assistant.
- `Course`: class container.
- `LectureSession`: scheduled class session with start/end time and chat lock state.
- `LectureMaterial`: uploaded PDF/PPT metadata and storage object key.
- `Annotation`: highlight, freehand doodle, sticky note, sticker, confusion marker.
- `ChatMessage`: class-time chat entry linked to a lecture session.
- `FeedbackNote`: short message to professor, anonymous or named.
- `StudyPost`: shared notes, summaries, study proof, or exam prep records.

## Storage rule

Do not store PDFs or drawing images in Postgres.

- Postgres: users, courses, sessions, annotation coordinates, chat messages, feedback, study post metadata.
- Object storage: PDF/PPT files, rendered thumbnails, exported annotation layers, attachments.

## Upload flow

1. Client requests upload intent from FastAPI.
2. Backend creates material placeholder and returns presigned upload URL.
3. Client uploads directly to object storage.
4. Client confirms upload completion.
5. Backend finalizes metadata and makes the material available in a lecture session.

## Realtime plan

MVP can start with polling or simple WebSocket rooms for chat. Later phases can add realtime annotation presence and collaborative canvas syncing.
