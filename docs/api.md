# Kangku API Sketch

## Health

`GET /health`

Returns backend readiness and application name.

## Features

`GET /features`

Returns the current MVP capability list.

## Planned endpoints

- `POST /courses`
- `POST /courses/{course_id}/sessions`
- `POST /sessions/{session_id}/materials/upload-intent`
- `POST /materials/{material_id}/annotations`
- `GET /sessions/{session_id}/chat`
- `POST /sessions/{session_id}/chat`
- `POST /sessions/{session_id}/feedback`
- `POST /sessions/{session_id}/study-posts`
