from fastapi import APIRouter, HTTPException
from ..registry import registry

router = APIRouter(prefix="/models", tags=["models"])

@router.get("")
def list_models():
    return {"available": registry.list_models()}

@router.get("/{model_id}")
def model_meta(model_id: str):
    try:
        predictor, resolved = registry.get(model_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "model_id": resolved,
        "targets": predictor.targets,
        "classes": predictor.classes_,
        "schema": predictor.schema
    }
