from pathlib import Path
from typing import Dict, List, Tuple
import os

from .models.sklearn_predictor import SklearnPredictor

MODELS_ROOT = Path(os.getenv("MODELS_ROOT", Path(__file__).resolve().parents[1] / "models"))

class ModelRegistry:
    def __init__(self, root: Path = MODELS_ROOT):
        self.root = root
        self.cache: Dict[str, SklearnPredictor] = {}

    def list_models(self, task: str = "genetic_disorder") -> List[str]:
        task_dir = self.root / task
        if not task_dir.exists():
            return []
        return sorted([p.name for p in task_dir.iterdir() if p.is_dir()])

    def get(self, model_id: str | None = None, task: str = "genetic_disorder") -> Tuple[SklearnPredictor, str]:
        task_dir = self.root / task
        versions = self.list_models(task)
        if not versions:
            raise RuntimeError(f"No model bundles found under: {task_dir}")
        version = model_id or versions[-1]  # latest by timestamped name
        key = f"{task}:{version}"
        if key not in self.cache:
            bundle_dir = task_dir / version
            self.cache[key] = SklearnPredictor(bundle_dir)
        return self.cache[key], version

registry = ModelRegistry()
