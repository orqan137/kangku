from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum


class AnnotationKind(StrEnum):
    HIGHLIGHT = "highlight"
    DOODLE = "doodle"
    STICKY_NOTE = "sticky_note"
    STICKER = "sticker"
    CONFUSION_MARK = "confusion_mark"


@dataclass(frozen=True)
class LectureSession:
    id: str
    course_title: str
    starts_at: datetime
    ends_at: datetime

    def is_chat_open(self, now: datetime | None = None) -> bool:
        current = now or datetime.now(timezone.utc)
        return self.starts_at <= current <= self.ends_at


@dataclass(frozen=True)
class FeedbackNote:
    body: str
    anonymous: bool = True

    def validate(self) -> None:
        if not self.body.strip():
            raise ValueError("feedback body is required")
        if len(self.body) > 160:
            raise ValueError("feedback body must be 160 characters or fewer")
