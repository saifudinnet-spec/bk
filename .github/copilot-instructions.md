# Copilot Instructions

## Project Overview
- This repository contains a React 19 + Vite frontend in `frontend/` and a Laravel 12 / PHP 8.2 API in `backend/`.
- The application supports student/general users, tutors, and administrators, with counseling, screening, scheduling, and session workflows.
- Make changes within the owning frontend or backend area. The frontend calls the backend API; avoid duplicating backend business rules in UI code.

## Frontend
- Use the existing React Router structure in `frontend/src/routes/`; preserve authentication and role guards when adding routes.
- Keep API requests in the shared client at `frontend/src/services/api.js` and follow the existing token/error-handling conventions.
- Reuse existing contexts, layouts, components, and page organization under `frontend/src/` before introducing new abstractions.
- Use the existing JavaScript/JSX style and installed libraries. Do not add a dependency without a concrete need.
- Validate frontend changes from `frontend/` with `npm run lint` and `npm run build` when relevant.

## Backend
- Define HTTP endpoints in `backend/routes/api.php`; implement behavior in the existing `backend/app/Http/Controllers/Api/` and service/model layers as appropriate.
- Keep authenticated endpoints behind the existing Sanctum middleware and retain authorization checks for role- and user-specific data.
- Use Laravel migrations for schema changes; do not make schema changes only in a local database or SQL dump.
- Add or update tests under `backend/tests/Feature/` or `backend/tests/Unit/` following the existing PHPUnit conventions.
- Run backend tests from `backend/` with `php artisan test` (or `composer test`).

## Sensitive Data and Configuration
- Counseling, screening, session, and user records are sensitive. Return only data the current user is authorized to access, and avoid logging personal or counseling content.
- Never put credentials, tokens, production URLs, or other secrets in source code or committed environment files. Use environment configuration and keep local `.env` files private.
- Treat SQL dumps, database contents, logs, and uploaded files as potentially sensitive. Do not inspect, expose, modify, or commit them unless required by the task.

## Change Scope
- Keep changes focused and preserve existing API contracts and user-facing behavior unless the task explicitly asks to change them.
- Update relevant tests and documentation when behavior or setup changes.
- Do not edit generated or dependency directories such as `frontend/dist/`, `frontend/node_modules/`, or `backend/vendor/`.
