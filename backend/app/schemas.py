from pydantic import BaseModel, create_model
from typing import Any, Dict

def build_request_model(schema: Dict[str, Any]) -> type[BaseModel]:
    fields = {}
    for f in schema["features"]:
        dtype = f.get("dtype","").lower()
        if "int" in dtype or "float" in dtype or "double" in dtype or "number" in dtype:
            pytype = float
        else:
            pytype = str
        default = None if f.get("allow_null", True) else ...
        fields[f["name"]] = (pytype | None, default)
    return create_model("PredictRequest", **fields)  # type: ignore
