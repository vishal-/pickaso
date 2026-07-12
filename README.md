# Pickaso

Pickaso is a multi-tenant image management backend and dashboard built with Next.js, Prisma, and PostgreSQL. It provides API-key based upload and media management APIs backed by Cloudflare R2, with per-tenant isolation and app-level access control.

## What This Project Does

- Supports secure image upload using API keys.
- Strips EXIF/metadata on upload using Sharp.
- Stores image objects in Cloudflare R2 using tenant-scoped paths.
- Persists image, collection, and ownership metadata in PostgreSQL via Prisma.
- Provides collection and image management APIs (list, fetch, delete).
- Includes a web dashboard for app and key management.

## Tech Stack

- Next.js (App Router + Route Handlers)
- TypeScript
- Prisma ORM
- PostgreSQL
- Cloudflare R2 (S3-compatible)
- Sharp (image processing)
- Firebase Auth (tenant/user session sync for dashboard flows)

## Project Structure

- [app](app): App Router pages and API route handlers.
- [app/api](app/api): Session-authenticated internal APIs for dashboard/app management.
- [app/api/v1](app/api/v1): API-key authenticated public API endpoints.
- [components](components): UI components.
- [lib](lib): Shared infrastructure code (Prisma client, logger, auth/session helpers).
- [prisma](prisma): Database schema and migrations.
- [docs/api-reference.md](docs/api-reference.md): Complete API request/response examples.

## API Reference

Use the full endpoint documentation here:

- [docs/api-reference.md](docs/api-reference.md)


## Notes

- API keys are stored hashed and compared by hashing inbound Bearer tokens.
- Public API routes under /api/v1 enforce scope checks (READ/WRITE/DELETE/ALL).
- Collection and image operations are constrained to the app associated with the provided API key.
