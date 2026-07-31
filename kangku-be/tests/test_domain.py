from datetime import datetime, timedelta, timezone

import pytest

from app.domain import FeedbackNote, LectureSession


def test_chat_is_open_only_during_class_time() -> None:
    now = datetime.now(timezone.utc)
    session = LectureSession(
        id="lecture-1",
        course_title="UX Design",
        starts_at=now - timedelta(minutes=5),
        ends_at=now + timedelta(minutes=45),
    )

    assert session.is_chat_open(now)
    assert not session.is_chat_open(now + timedelta(hours=2))


def test_feedback_note_requires_body() -> None:
    with pytest.raises(ValueError):
        FeedbackNote(body="   ").validate()


def test_feedback_note_limits_length() -> None:
    with pytest.raises(ValueError):
        FeedbackNote(body="x" * 161).validate()
