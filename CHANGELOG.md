# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
### Added
- API specification draft `openapi.yaml` (covers `IDataset`, `ITraining`, `IModel` endpoints)
- Contribution guide `CONTRIBUTING.md`
- Badges (Node, Python, License, Release) in `README.md` and `README_en.md`
- Cross-language parity: synced English README with Chinese README

### Changed
- Updated installation steps to use `uv` for faster, reproducible Python env setup
- Fixed repository links and release badges to `Zim9729/YoloTrainingVisualizationPlatform`

### Known Issues
- OpenAPI examples are minimal; request/response schemas can be expanded further

## [1.0.0] - 2025-09-05
### Added
- Initial public release of YOLO Visualization Training Platform
- Electron-based desktop app, Flask backend, React + Vite frontend
- Dataset upload/validation, training task management, log streaming, model testing & result visualization

[Unreleased]: https://github.com/Zim9729/YoloTrainingVisualizationPlatform/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Zim9729/YoloTrainingVisualizationPlatform/releases/tag/v1.0.0
