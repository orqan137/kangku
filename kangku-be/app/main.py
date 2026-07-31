from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(title=settings.app_name)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


@app.get("/features")
def features() -> dict[str, list[str]]:
    return {
        "mvp": [
            "lecture-material-upload",
            "pdf-annotation",
            "class-time-chat",
            "chat-lock-after-class",
            "professor-feedback-board",
            "study-sharing-feed",
        ]
    }
