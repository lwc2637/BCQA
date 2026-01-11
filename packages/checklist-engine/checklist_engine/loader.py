import json
from pathlib import Path
from typing import List, Union
from pydantic import ValidationError
from .models import ChecklistTemplate

class TemplateLoader:
    def __init__(self, templates_dir: Union[str, Path]):
        self.templates_dir = Path(templates_dir)
        self._cache: dict[str, ChecklistTemplate] = {}

    def load_all(self) -> List[ChecklistTemplate]:
        """Loads and validates all JSON templates in the directory."""
        templates = []
        if not self.templates_dir.exists():
            print(f"Warning: Templates directory {self.templates_dir} does not exist.")
            return []

        for file_path in self.templates_dir.glob("*.json"):
            try:
                template = self.load_file(file_path)
                templates.append(template)
            except (ValidationError, json.JSONDecodeError) as e:
                print(f"Error loading template {file_path}: {e}")
                # We might want to re-raise or just log, but requirement says "API should refuse to serve it and log a clear error"
                # For now, we print and skip, but the API startup logic should probably fail if critical templates are bad.
                continue
        
        return templates

    def load_file(self, file_path: Path) -> ChecklistTemplate:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        template = ChecklistTemplate(**data)
        self._cache[template.meta.template_id] = template
        return template

    def get_template(self, template_id: str) -> Union[ChecklistTemplate, None]:
        if template_id in self._cache:
            return self._cache[template_id]
        
        # If not in cache, try to reload all (or we could map IDs to filenames if we want to be smarter)
        # For stage 1, loading all is fine.
        self.load_all()
        return self._cache.get(template_id)
