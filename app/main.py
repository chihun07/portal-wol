from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .api.routes import router
from .core.settings import get_settings

# Load .env if present before evaluating settings
load_dotenv()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="WOL-Web", version="1.0.0")
    app.include_router(router)

    static_dir = settings.static_dir
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")
        app.mount("/app/static", StaticFiles(directory=static_dir, html=True), name="static-app")
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
    return app


app = create_app()


def run() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)


if __name__ == "__main__":
    run()
