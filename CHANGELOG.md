# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2025-01 🆕

#### IImageProcessor Module - TCP Image Processing Service
- **feat**: New backend module `backend/IImageProcessor/` for TCP-based image processing service integration
  - `routes.py` (860 lines): Complete REST API with 15 endpoints
  - `tcp_image_client.py` (235 lines): TCP client implementation with custom protocol
  - `image_processor.py` (173 lines): Image preprocessing utilities (resize, format conversion, RGB normalization)
  - `models.py` (187 lines): Data models (ProcessingRecord, ServiceStatus) with JSON persistence
  - `utils.py`: Helper functions for image validation and metadata extraction
- **feat**: TCP protocol implementation with Big-Endian byte order
  - Custom header: `{[(tcp_header)]}` (16 bytes)
  - Custom tail: `{[(tcp_tail)]}` (14 bytes)
  - Request structure: Header + CameraID(2) + ImageID(2) + Height(2) + Width(2) + Channels(2) + FileSize(4) + ImageData + Tail
  - Response structure: Header + CameraID(2) + ImageID(2) + JSONLength(2) + JSON + Tail
- **feat**: Image processing capabilities
  - Single image upload processing with multipart form-data
  - Dataset image processing (process images from existing datasets)
  - Batch folder processing with recursive directory scanning
  - Support for multiple formats: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.tiff`, `.webp`
  - Automatic image preprocessing (max 1920×1080, RGB conversion, JPEG encoding)
- **feat**: Processing history and statistics
  - Paginated history retrieval (default 20 records per page)
  - Comprehensive statistics: success rate, processing time distribution, daily breakdown
  - Individual record deletion and bulk history clearing
  - JSON export for single and batch results
  - Batch processing records with detailed file-level results
- **feat**: Connection management
  - Automatic retry mechanism (max 3 retries)
  - Connection timeout control (default 30s)
  - Health check endpoint
  - Service status monitoring (online/offline/error)
- **feat**: Configuration via environment variables
  - `TCP_IMAGE_SERVICE_HOST` (default: 127.0.0.1)
  - `TCP_IMAGE_SERVICE_PORT` (default: 16000)
  - `TCP_CONNECTION_TIMEOUT` (default: 5s)
  - `TCP_MAX_RETRIES` (default: 3)

#### Frontend Enhancements
- **feat**: New frontend page `frontend/src/page/TcpImageProcessorPage.jsx` for TCP image processing
  - Connection testing and service status display
  - Single image upload with drag-and-drop
  - Batch folder processing interface
  - Processing history table with pagination
  - Statistics dashboard with charts
  - Result download (single/batch JSON export)
- **feat**: New frontend page `frontend/src/page/ServicesPage.jsx` for service management
  - Central hub for all service modules
  - Service status overview
  - Quick access to different processing services
- **feat**: Error boundary component `frontend/src/components/ErrorBoundary.jsx`
  - Graceful error handling for React components
  - Error stack trace display in development mode
  - Fallback UI for production
- **feat**: Global state management with Context API
  - `frontend/src/contexts/TaskContext.jsx`: Manage running tasks globally
  - Auto-refresh every 5 seconds
  - Task status monitoring across all pages
  - Utility hooks: `useRunningTasks()`, `isTaskRunning()`, `getRunningFilenames()`
- **feat**: API client improvements in `frontend/src/api.js`
  - Health check with 30s interval caching
  - Automatic retry for network errors (max 2 retries with exponential backoff)
  - Better timeout handling (default 30s, upload 60s)
  - Improved error messages with error codes
  - Support for both raw and retry-enabled requests

#### Documentation
- **docs**: Comprehensive documentation updates
  - New `TCP_IMAGE_PROCESSOR_README.md`: Complete TCP service usage guide
  - New `INSTALLATION_GUIDE.md`: Detailed installation instructions
  - New `TROUBLESHOOTING_GUIDE.md`: Common issues and solutions
  - New `FRONTEND_BUG_FIXES_SUMMARY.md`: Frontend optimization summary
  - New `FRONTEND_OPTIMIZATION_SUMMARY.md`: Performance improvements log
  - New `DUPLICATE_LOADING_FIXES_SUMMARY.md`: Loading optimization details
  - New `FINAL_UPDATE_GUIDE.md`: Comprehensive update guide
- **docs**: README.md major update (Chinese version)
  - Restructured features section with 6 major categories
  - Detailed project structure tree with line counts
  - Visual three-tier architecture diagram
  - Table-format data directory documentation
  - Complete API overview for all 4 backend modules
  - New section: TCP Image Processing Service Configuration
  - Updated roadmap with completed items
- **docs**: README_en.md synchronized update (English version)
  - All new content translated professionally
  - Consistent structure with Chinese version
- **docs**: OpenAPI specification greatly expanded (`openapi.yaml`)
  - Added complete IImageProcessor module documentation (15 endpoints)
  - Added missing IModel validation and Triton endpoints
  - Added Label Studio integration endpoints
  - Improved metadata: contact info, license, module descriptions
  - All endpoints now have detailed parameter and response schemas
  - Total: 560 lines → 1000+ lines (+440 lines)

#### Backend Improvements
- **feat**: Enhanced configuration in `backend/config.py`
  - New function: `get_tcp_image_service_config()`
  - New function: `get_image_processing_history_path()`
  - New function: `get_image_processing_config()`
  - Image processing constants: `MAX_IMAGE_SIZE`, `SUPPORTED_IMAGE_FORMATS`, `JPEG_QUALITY`
- **feat**: Main application updated `backend/main.py`
  - Register new IImageProcessor blueprint at `/IImageProcessor`
  - Now supports 4 major blueprint modules (was 3)
- **feat**: Test files for new module
  - `backend/test_image_processor.py`: Unit tests for image processor
  - `backend/test_tcp_image_processing.py`: Integration tests for TCP service

#### Build and Deployment
- **build**: Electron app packaging improvements
  - New build scripts: `app/build.sh`, `app/build.bat`, `app/build-fix.ps1`
  - New `app/README_BUILD.md`: Packaging guide
  - Resource optimization and filtering

### Previous Features
- feat: Backend model validation module `backend/IModel/validate.py` using `ultralytics.YOLO`, outputs overall metrics and optional per-class rows with robust serialization.
- feat: Backend model export pipeline `backend/IModel/export.py` with formats `onnx/torchscript/openvino/engine`, unified output under `export/`, and optional Triton model repository integration via `backend/IModel/triton_integration.py`.
- feat: Frontend components for test/validation flows:
  - `frontend/src/components/TestForm.jsx` (model selection, file browse/upload, start test with `/IModel/runModelTest`).
  - `frontend/src/components/ValidationForm.jsx` (dataset list `/IDataset/getAllDatasets`, start validation with `/IModel/runModelValidation`).
  - `frontend/src/components/LogPanel.jsx` (poll logs via `/IModel/getTaskLog` or `/IModel/getValTaskLog`).
- feat: Frontend page `frontend/src/page/TritonRepoPage.jsx` to browse Triton model repository, list versions/files, copy paths, and delete models/versions.
- feat: API client enhancements in `frontend/src/api.js`:
  - Request `signal` support (AbortController friendly).
  - `api.upload()` for multipart uploads, used by test input upload.
- docs: Frontend README adds env vars (`.env.development`, `.env.production` with `VITE_API_BASE_URL`), directory structure, Prism code highlight usage, and troubleshooting; README bilingual docs updated with Export & Triton sections.
- build: Add dependency `vite-plugin-prismjs` and corresponding Vite configuration notes.
- chore: Add environment files `frontend/.env.development` and `frontend/.env.production`.
- test/data: Add dataset sample `test/datasets_3/`.

### Fixed
- **fix**: Thread management memory leak prevention
  - Added `cleanup_finished_threads()` in `backend/IModel/routes.py`
  - Using `weakref` to prevent memory leaks
  - Thread-safe operations with `threading.Lock`
- **fix**: Temporary file cleanup in Windows
  - Enhanced file handle management in `backend/IImageProcessor/routes.py`
  - Multiple retry attempts for file deletion
  - Delayed cleanup thread for stubborn files
- **fix**: Image loading with proper resource release
  - New `load_image_safe()` method in `image_processor.py`
  - Immediate file handle release after loading
  - Memory optimization with image copy strategy
- fix: Ensure thread starts in `backend/run_in_thread.py` by adding `t.start()`.
- fix: Return `VALIDATION_RESULT_FILES_PATH` in `backend/config.py` to avoid missing return value.
- fix: Frontend robustness and UX improvements in new components (validation/test forms and log polling).

### Changed
- **refactor**: Backend blueprint architecture now supports 4 modules (was 3)
  - IDataset: Dataset management + Label Studio integration
  - ITraining: Training task management + multi-task execution
  - IModel: Testing + validation + export + Triton deployment
  - IImageProcessor: TCP image processing service (NEW)
- **improve**: Data storage structure expanded
  - New directory: `~/.yolo_training_visualization_platform/image_processing_history`
  - Total: 7 directories → 8 directories
- **improve**: Frontend routing enhanced
  - Total pages: 11 → 13 pages (added ServicesPage, TcpImageProcessorPage)
  - Improved navigation structure
- docs: Keep bilingual READMEs aligned; clarify environment variable usage in frontend and base64 image return convention; document model export endpoints and Triton integration page.
- build: Update `frontend/package.json` to include `vite-plugin-prismjs`.

### Deprecated
- **deprecated**: `getProcessingStatistics` endpoint (use `getStatistics` instead)
  - The new endpoint provides more comprehensive statistics

### Security
- **security**: Enhanced path validation in download endpoints
  - Prevent path traversal attacks with `Path.relative_to()` check
  - File size limits (max 500MB) to prevent resource exhaustion
  - Strict path sanitization for file operations

### Performance
- **perf**: Optimized image processing pipeline
  - Lazy loading of TCP client (singleton pattern)
  - Context manager for automatic connection cleanup
  - Batch processing with progress reporting
- **perf**: Frontend optimization
  - Task context with 5s polling instead of per-component polling
  - Shared state reduces duplicate API calls
  - Lazy component loading with React.lazy (planned)

### Known Issues
- OpenAPI specification greatly improved but may need further refinement as features evolve
- Video inference support is planned but not yet implemented
- Batch processing for very large folders (10000+ images) may need pagination

## [1.0.0] - 2025-09-05
### Added
- Initial public release of YOLO Visualization Training Platform
- Electron-based desktop app, Flask backend, React + Vite frontend
- Dataset upload/validation, training task management, log streaming, model testing & result visualization

[Unreleased]: https://github.com/Zim9729/YoloTrainingVisualizationPlatform/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Zim9729/YoloTrainingVisualizationPlatform/releases/tag/v1.0.0


