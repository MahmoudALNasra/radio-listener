"""Download the small English Vosk model into device/models/."""

from __future__ import annotations

import zipfile
from pathlib import Path
from urllib.request import urlretrieve

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
TARGET = MODELS / "vosk-model-small-en-us-0.15"


def main() -> None:
    MODELS.mkdir(parents=True, exist_ok=True)
    if TARGET.exists():
        print(f"Model already present: {TARGET}")
        return
    zip_path = MODELS / "vosk-model-small-en-us-0.15.zip"
    print(f"Downloading {URL} …")
    urlretrieve(URL, zip_path)
    print("Extracting …")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(MODELS)
    zip_path.unlink(missing_ok=True)
    print(f"Ready: {TARGET}")


if __name__ == "__main__":
    main()
