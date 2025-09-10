# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
### Added
- feat: Backend model validation module `backend/IModel/validate.py` using `ultralytics.YOLO`, outputs overall metrics and optional per-class rows with robust serialization.
- feat: Frontend components for test/validation flows:
  - `frontend/src/components/TestForm.jsx` (model selection, file browse/upload, start test with `/IModel/runModelTest`).
  - `frontend/src/components/ValidationForm.jsx` (dataset list `/IDataset/getAllDatasets`, start validation with `/IModel/runModelValidation`).
  - `frontend/src/components/LogPanel.jsx` (poll logs via `/IModel/getTaskLog` or `/IModel/getValTaskLog`).
- feat: API client enhancements in `frontend/src/api.js`:
  - Request `signal` support (AbortController friendly).
  - `api.upload()` for multipart uploads, used by test input upload.
- docs: Frontend README adds env vars (`.env.development`, `.env.production` with `VITE_API_BASE_URL`), directory structure, Prism code highlight usage, and troubleshooting.
- build: Add dependency `vite-plugin-prismjs` and corresponding Vite configuration notes.
- chore: Add environment files `frontend/.env.development` and `frontend/.env.production`.
- test/data: Add dataset sample `test/datasets_3/`.

### Fixed
- fix: Ensure thread starts in `backend/run_in_thread.py` by adding `t.start()`.
- fix: Return `VALIDATION_RESULT_FILES_PATH` in `backend/config.py` to avoid missing return value.
- fix: Frontend robustness and UX improvements in new components (validation/test forms and log polling).

### Changed
- docs: Keep bilingual READMEs aligned; clarify environment variable usage in frontend and base64 image return convention.
- build: Update `frontend/package.json` to include `vite-plugin-prismjs`.

### Known Issues
- OpenAPI specification extended but may still miss some response schema details for new endpoints; iterate as backend stabilizes.

## [1.0.0] - 2025-09-05
### Added
- Initial public release of YOLO Visualization Training Platform
- Electron-based desktop app, Flask backend, React + Vite frontend
- Dataset upload/validation, training task management, log streaming, model testing & result visualization

[Unreleased]: https://github.com/Zim9729/YoloTrainingVisualizationPlatform/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Zim9729/YoloTrainingVisualizationPlatform/releases/tag/v1.0.0

