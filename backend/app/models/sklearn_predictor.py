from pathlib import Path
import json
import joblib
import pandas as pd
import numpy as np
from .base import Predictor

class SklearnPredictor:
    def __init__(self, bundle_dir: Path):
        self.bundle_dir = bundle_dir
        self.id = bundle_dir.name

        self.pipeline = joblib.load(bundle_dir / "pipeline.joblib")
        self.schema    = json.loads((bundle_dir / "schema.json").read_text())
        meta           = json.loads((bundle_dir / "targets.json").read_text())
        self.targets   = meta["targets"]
        self.classes_  = meta["classes"]  # {target: [class labels in order]}
        self.feature_order = [f["name"] for f in self.schema["features"]]
        self.global_importances = self._try_global_importances()
        self._idx_to_name = {t: {i: name for i, name in enumerate(names)}
        for t, names in self.classes_.items()}
        self._name_to_idx = {t: {name: i for i, name in enumerate(names)}
        for t, names in self.classes_.items()}

    def _try_global_importances(self):
        try:
            clfs = self.pipeline.named_steps["clf"].estimators_
            imps = []
            for est in clfs:
                if hasattr(est, "feature_importances_"):
                    imps.append(est.feature_importances_)
            if imps:
                return np.mean(np.vstack(imps), axis=0)
        except Exception:
            pass
        return None

    def _align(self, rows: pd.DataFrame) -> pd.DataFrame:
        for col in self.feature_order:
            if col not in rows.columns:
                rows[col] = np.nan
        return rows[self.feature_order]

    def predict(self, rows: pd.DataFrame):
        rows = self._align(rows)
        preds = self.pipeline.predict(rows)   # shape (n, n_targets)
        out = {}
        for i, t in enumerate(self.targets):
            names = self.classes_[t]                  # human names in correct order
            idx_map = self._idx_to_name[t]
            labs = []
            for j in range(len(rows)):
                raw = preds[j, i] if preds.ndim == 2 else preds[j]
                # raw might be int (0..K-1) or already a label
                if isinstance(raw, (int, np.integer)):
                    labs.append(idx_map[int(raw)])
                elif isinstance(raw, str) and raw.isdigit():
                    labs.append(idx_map[int(raw)])
                else:
                    # If unexpectedly already a name, trust it
                    labs.append(str(raw))
            out[t] = labs
        return out

    def predict_proba(self, rows: pd.DataFrame):
        rows = self._align(rows)
        try:
            proba_list = self.pipeline.predict_proba(rows)  # list per target
            out = {}
            for i, t in enumerate(self.targets):
                # proba_list[i]: shape (n_samples, n_classes) aligned with estimator.classes_
                mat = proba_list[i]
                names = self.classes_[t]   # class order == columns in mat
                # return as list[dict[name->prob]] or keep just row 0 later, your router picks row 0
                out[t] = mat
            return out
        except Exception:
            return None

    def explain_one(self, row: pd.Series) -> list[tuple[str, float]]:
        if self.global_importances is None:
            return []
        df = pd.DataFrame([row])
        df = self._align(df)
        row = df.iloc[0]
        idxs = np.argsort(self.global_importances)[::-1][:5]
        return [(self.feature_order[i], float(row[self.feature_order[i]])) for i in idxs]
