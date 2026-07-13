# Pickaso API Reference

Base URL
- Local: http://localhost:3000/api
- Versioned routes in this document use /v1/* under /api.

Authentication
- All endpoints require an API key in the Authorization header.
- Format:
  - Authorization: Bearer pk_xxxxx

Common Error Responses
```json
{ "error": "Unauthorized" }
```
```json
{ "error": "Forbidden" }
```
```json
{ "error": "Internal Server Error" }
```

## 1) Upload Image

Endpoint
- POST /api/v1/upload

Headers
- Authorization: Bearer pk_xxxxx
- Content-Type: multipart/form-data

Body (multipart/form-data)
- image (required): image file
- collection (optional): lowercase alphanumeric only; defaults to default

Notes
- EXIF/metadata is stripped using Sharp during upload.
- Object path in R2: {slug}.{extension} (stored directly in the bucket root)

Sample Request (curl)
```bash
curl -X POST "http://localhost:3000/api/v1/upload" \
  -H "Authorization: Bearer pk_xxxxx" \
  -F "image=@/path/to/photo.jpg" \
  -F "collection=pets"
```

Sample Success Response (201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "img_mcxhuz9k7e2a4b6c8d0f1g2h",
  "url": "https://cdn.example.com/tenant-uuid/550e8400-e29b-41d4-a716-446655440000.jpg",
  "width": 4032,
  "height": 3024,
  "mimeType": "image/jpeg",
  "size": 2145832,
  "collection": "pets"
}
```

Sample Validation Error (400)
```json
{ "error": "collection must be lowercase alphanumeric only" }
```

## 2) List Collections

Endpoint
- GET /api/v1/collections

Headers
- Authorization: Bearer pk_xxxxx

Query Params (optional)
- page: page number (defaults to 1)
- limit: items per page (defaults to 10)

Sample Request (curl)
```bash
curl -X GET "http://localhost:3000/api/v1/collections?page=1&limit=2" \
  -H "Authorization: Bearer pk_xxxxx"
```

Sample Success Response (200)
```json
{
  "collections": [
    {
      "id": "9f4dd347-2e7a-4a82-9e43-646c8d425d5a",
      "name": "pets",
      "imageCount": 12
    },
    {
      "id": "9e6bce90-c2df-4d95-a8a9-31fa53f24a66",
      "name": "default",
      "imageCount": 3
    }
  ],
  "pagination": {
    "total": 2,
    "pages": 1,
    "page": 1,
    "limit": 2
  }
}
```

## 3) Get Images In A Collection

Endpoint
- GET /api/v1/collection/{id}

Headers
- Authorization: Bearer pk_xxxxx

Path Params
- id: collection id

Sample Request (curl)
```bash
curl -X GET "http://localhost:3000/api/v1/collection/9f4dd347-2e7a-4a82-9e43-646c8d425d5a" \
  -H "Authorization: Bearer pk_xxxxx"
```

Sample Success Response (200)
```json
{
  "images": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://cdn.example.com/tenant-uuid/550e8400-e29b-41d4-a716-446655440000.jpg",
      "size": 2145832
    },
    {
      "id": "6e7a65e3-67f1-43f1-bb88-c8e24ff4f6d2",
      "url": "https://cdn.example.com/tenant-uuid/6e7a65e3-67f1-43f1-bb88-c8e24ff4f6d2.png",
      "size": 478321
    }
  ]
}
```

Sample Not Found Response (404)
```json
{ "error": "Collection not found" }
```

## 4) Delete A Collection

Endpoint
- DELETE /api/v1/collection/{id}

Headers
- Authorization: Bearer pk_xxxxx

Path Params
- id: collection id

Behavior
- Deletes the collection and all associated images.
- Attempts to delete related image objects from R2 when keys are available.

Sample Request (curl)
```bash
curl -X DELETE "http://localhost:3000/api/v1/collection/9f4dd347-2e7a-4a82-9e43-646c8d425d5a" \
  -H "Authorization: Bearer pk_xxxxx"
```

Sample Success Response (200)
```json
{
  "success": true,
  "id": "9f4dd347-2e7a-4a82-9e43-646c8d425d5a",
  "name": "pets",
  "deletedImages": 12
}
```

## 5) Delete An Image

Endpoint
- DELETE /api/v1/image/{id}

Headers
- Authorization: Bearer pk_xxxxx

Path Params
- id: image id

Behavior
- Deletes the image record.
- Attempts to delete the image object from R2 when key is available.

Sample Request (curl)
```bash
curl -X DELETE "http://localhost:3000/api/v1/image/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer pk_xxxxx"
```

Sample Success Response (200)
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "img_mcxhuz9k7e2a4b6c8d0f1g2h"
}
```

Sample Not Found Response (404)
```json
{ "error": "Image not found" }
```

## 6) Get Image (Redirect & Variants)

Endpoint
- GET /api/v1/image/{slug.ext}

Path Params
- slug.ext: The 24-character slug + file extension (e.g. `myphotoname8P9sr7Hc6rpg.jpg`).

Query Params (optional)
- fmt: Convert the image to a target format (`webp`, `png`, `jpg`, `jpeg`, `avif`, `tiff`).
- size: Resize the image to a target width (`sm` = 320px, `md` = 640px, `lg` = 1280px). Resizes maintaining aspect ratio (without enlargement).

Behavior
- If query parameters are provided and the variant does not exist yet:
  - Downloads the original image from R2.
  - Dynamically resizes/converts it using Sharp.
  - Uploads the variant back to R2 as `{slug}_{size}.{fmt}`.
  - Caches the variant metadata in the database.
- Redirects (302) the client to the R2 public URL of the requested image or variant.
- Returns `404 Not Found` if the original image is missing, the requested format/size is unsupported, or the request lacks an extension.

Sample Request (curl)
```bash
curl -I "http://localhost:3000/api/v1/image/myphotoname8P9sr7Hc6rpg.jpg?fmt=webp&size=sm"
```

Sample Success Response (302 Redirect)
```http
HTTP/1.1 302 Found
Location: https://pub-xxx.r2.dev/myphotoname8P9sr7Hc6rpg_sm.webp
```

Sample Validation Error (400)
```json
{ "error": "Unsupported image format requested" }
```
