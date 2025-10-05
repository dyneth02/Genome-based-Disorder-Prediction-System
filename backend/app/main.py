from fastapi import FastAPI

from .config import settings
from .routers import predict, model_admin
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Genetic Disorder Prediction API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(model_admin.router)
app.include_router(predict.router)

@app.get("/health")
def health():
    return {"status": "ok"}
