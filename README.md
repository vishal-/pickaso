# Pickaso — Enterprise-Grade Media Infrastructure

Pickaso is a multi-tenant image management backend and dashboard built with Next.js, Prisma, and PostgreSQL. It provides API-key based upload and media management APIs backed by Cloudflare R2, with per-tenant isolation, app-level access control, and dynamic on-the-fly image variant generation.

---

## Features

### 🖼️ Core Media Management
- **Secure Image Uploads**: Upload files scoped to custom collections via standard multipart form data.
- **EXIF Sanitization**: Strips sensitive EXIF/metadata using Sharp during upload.
- **Relative Path Key Storage**: Stores only relative storage keys in the database. Absolute CDN/bucket URLs are dynamically resolved at runtime using the `R2_PUBLIC_BASE_URL` configuration, enabling seamless migrations and custom CDN/domain configurations.
- **Cascaded Cleanups**: Deleting collections or images triggers a complete deletion of all associated original files and variants from Cloudflare R2 storage.

### ⚡ On-The-Fly Image Variants
- **Dynamic Redirection**: GET requests to `/api/v1/image/[slug]` redirect client requests to the R2 public/CDN URL.
- **Format & Size Conversions**: Supports dynamic query parameters:
  - `fmt`: Convert to target format (`webp`, `png`, `jpg`, `jpeg`, `avif`, `tiff`).
  - `size`: Convert to pre-defined widths (`sm` = 320px, `md` = 640px, `lg` = 1280px) preserving aspect ratio.
- **On-Demand Generation**: If a requested variant does not exist, Pickaso automatically downloads the original image, processes it with Sharp, uploads the new variant to R2, indexes it in the database, and redirects the request.
- **Thundering Herd Protection**: Implements an in-memory lock map at the Node process level to serialize concurrent requests for identical variants, eliminating redundant image processing and storage writes.

### 🛡️ Access Control & Admin Approval
- **Multi-Tenancy**: Complete isolation of data, assets, and configurations between user accounts.
- **Tenant Approval Flow**: Newly registered tenants start as unapproved (`approved: false`) and are blocked from utilizing API keys or dashboard functionalities until approved by an administrator in the database.
- **Scoped API Keys**: Fine-grained authorization scopes (`READ`, `WRITE`, `DELETE`, `ALL`) are checked on versioned routes.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router & Route Handlers)
- **Language**: TypeScript
- **Database ORM**: Prisma ORM
- **Database**: PostgreSQL (e.g. Neon)
- **Object Storage**: Cloudflare R2 (S3-compatible API client)
- **Image Manipulation**: Sharp
- **Authentication**: Firebase Authentication (dashboard user sync)

---

## Project Structure

- [/app](app): App Router pages and API route handlers.
  - [/app/api/auth](app/api/auth): Session synchronization endpoints.
  - [/app/api/apps](app/api/apps): Workspace and application management.
  - [/app/api/v1](app/api/v1): API-key authenticated versioned developer endpoints (Upload, Collections, Images, Redirects).
- [/components](components): Shared UI/UX components (e.g., `ApiKeyManager`, `CollectionManager`, `PendingApproval`).
- [/lib](lib): Centralized helpers (Prisma client, cached S3/R2 client manager, logger).
- [/prisma](prisma): Database schema and relation mappings.
- [/docs/api-reference.md](docs/api-reference.md): Detailed API endpoint documentation and request/response payloads.

---

## Documentation

For full API endpoint requests, parameters, and payloads, see:
- [docs/api-reference.md](docs/api-reference.md)
