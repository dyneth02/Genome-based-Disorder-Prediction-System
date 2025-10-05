from typing import Protocol, Dict, List
import pandas as pd
import numpy as np

class Predictor(Protocol):
    id: str
    targets: List[str]
    classes_: Dict[str, List[str]]
    schema: dict
    feature_order: List[str]

    def predict(self, rows: pd.DataFrame) -> Dict[str, List[str]]: ...
    def predict_proba(self, rows: pd.DataFrame) -> Dict[str, np.ndarray] | None: ...
    def explain_one(self, row: pd.Series) -> list[tuple[str, float]]: ...
