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
- Object path in R2: {tenantId}/{imageUuid}.{extension}

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

Sample Request (curl)
```bash
curl -X GET "http://localhost:3000/api/v1/collections" \
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
  ]
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
