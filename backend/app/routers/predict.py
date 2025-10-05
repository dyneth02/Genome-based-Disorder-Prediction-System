from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
from ..registry import registry
from ..schemas import build_request_model
from ..services.llm import LLMClient

router = APIRouter(prefix="/predict", tags=["predict"])
llm = LLMClient()

@router.post("")
async def predict(payload: dict, model_id: str | None = Query(None)):
    try:
        predictor, resolved = registry.get(model_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    ReqModel = build_request_model(predictor.schema)
    data = ReqModel(**payload).model_dump()

    df = pd.DataFrame([data])
    preds = predictor.predict(df)
    probas = predictor.predict_proba(df)

    conf = None
    if probas is not None:
        conf = {}
        for t, mat in probas.items():
            class_names = predictor.classes_[t]  # already human names in order
            conf[t] = {class_names[i]: float(mat[0, i]) for i in range(len(class_names))}

    top_feats = [name for name, _ in predictor.explain_one(df.iloc[0])]

    note = await llm.note(
        inputs={k: data.get(k) for k in top_feats},
        preds={k: v[0] for k, v in preds.items()},
        confidences=conf
    )

    return JSONResponse({
        "model_id": resolved,
        "targets": predictor.targets,
        "predictions": {k: v[0] for k, v in preds.items()},
        "confidences": conf,
        "note": note
    })
