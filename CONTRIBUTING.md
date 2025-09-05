# Contributing to YOLO Training Visualization Platform

Thank you for your interest in contributing! This document outlines how to report issues, propose changes, and submit pull requests.

## Code of Conduct

By participating, you agree to uphold a respectful, inclusive environment. Be kind and constructive.

## How to Get Help

- Search existing issues first
- Provide reproduction steps, logs, OS, versions
- Include screenshots or minimal examples when relevant

## Project Structure

- `backend/`: Flask API, training/testing logic
- `frontend/`: React + Vite UI
- `app/`: Electron shell

## Development Setup

Backend:

```bash
cd backend
pip install uv
uv venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
uv pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
python main.py
```

Frontend:

```bash
cd frontend
yarn install
yarn dev
```

Electron (optional):

```bash
cd app
yarn dev
```

## Branching Model

- `main`: stable branch
- feature branches: `feat/<short-name>`
- fix branches: `fix/<short-name>`

## Commit Message Convention

Follow Conventional Commits:

- `feat: add training resume feature`
- `fix: handle missing dataset.yaml`
- `docs: update README badges`
- `refactor: extract model loader`
- `chore: bump dependencies`

## Coding Guidelines

- Backend: Python 3.9+, adhere to PEP8; type hints preferred
- Frontend: React 18, keep components small; prefer hooks; run ESLint
- Electron: keep main process minimal; IPC only for required fs ops
- Add logging where it helps debugging (`backend/ITraining/handlers.py`)
- Keep API responses consistent with `tools/format_output.py`

## Tests & Manual Verification

- Add unit tests when feasible
- For API changes, add examples to `openapi.yaml`
- Manually verify: dataset upload, start training, view logs, run model test

## Submitting PRs

1. Fork and create a feature branch
2. Make focused changes with tests/docs
3. Update `README.md` / `README_en.md` when user-facing behavior changes
4. Update `CHANGELOG.md` under Unreleased
5. Ensure lints pass
6. Open PR with description, screenshots, and breaking change notes if any

## Releases

- Keep a human-readable `CHANGELOG.md` (Keep a Changelog format)
- Tag versions using Semantic Versioning (e.g., `v1.0.0`)

## Roadmap Ideas

- Richer training visualizations (lr, PR curves)
- Resume training & comparison view
- Export models (ONNX/TensorRT/OpenVINO)

Thanks again for contributing! 🙌
