# Course Learning Content API

This document defines the module-based course learning-content API for staff setup and student consumption.

## Base URL and authentication

All routes are relative to:

```text
/api/content/
```

Send either the authenticated portal session cookie or a bearer token:

```http
Authorization: Bearer <access-token>
```

Module management, content uploads, content updates, and content deletion require a portal staff user (`is_staff=true`). Student consumption requires authentication and an active `StudentRegisteredCourse` record for the requested course.

List endpoints use page-number pagination with 20 records per page:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": []
}
```

Validation and permission errors use:

```json
{
  "status": "error",
  "detail": "Human-readable error message"
}
```

## Data structure

```text
CourseCache
└── CourseModule (ordered, publishable, optionally scheduled)
    └── LearningContent (ordered, publishable file or YouTube item)
```

Existing content remains valid with `module=null`. It continues to appear in the legacy flat content APIs, but it does not appear in the structured student module response until assigned to a module.

### CourseModule fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Read-only |
| `course_id` | string/integer | Write-only external course ID or internal database ID |
| `course_external_id` | integer | Read-only |
| `course_title` | string | Read-only |
| `title` | string | Maximum 255 characters |
| `description` | string | Optional |
| `order` | non-negative integer | Display order within the course |
| `is_published` | boolean | Defaults to `false` |
| `available_from` | ISO-8601 datetime/null | Optional opening time |
| `available_until` | ISO-8601 datetime/null | Optional closing time; must be later than `available_from` |
| `is_available` | boolean | Read-only computed publication/schedule state |
| `content_count` | integer | Read-only |
| `created_by` | integer/null | Read-only portal-user primary key |
| `created_by_name` | string/null | Read-only |
| `created_at` | ISO-8601 datetime | Read-only |
| `updated_at` | ISO-8601 datetime | Read-only |

### LearningContent fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Read-only |
| `component` | string | Read-only; currently `learning_content` |
| `content_type` | enum | `note`, `video`, `resource`, or `assignment` |
| `course_external_id` | integer | Read-only |
| `course_title` | string | Read-only |
| `module` | UUID/null | Module assignment; writable through the content update API |
| `module_title` | string/null | Read-only |
| `order` | non-negative integer | Display order within the module |
| `title` | string | Maximum 512 characters |
| `description` | string | Optional |
| `original_filename` | string | Read-only after upload |
| `file_size` | integer/null | Read-only bytes |
| `mime_type` | string | Read-only |
| `storage_backend` | string | Read-only after upload: `local`, `s3`, `cloudinary`, or `youtube` |
| `url` | URL/string | Resolved storage URL |
| `file_extension` | string | Read-only |
| `is_video` | boolean | Read-only |
| `is_document` | boolean | Read-only |
| `uploaded_by` | integer/null | Read-only portal-user primary key |
| `uploaded_by_name` | string/null | Read-only |
| `uploaded_by_external_id` | string/null | Read-only |
| `is_published` | boolean | Content visibility |
| `download_count` | integer | Read-only |
| `created_at` | ISO-8601 datetime | Read-only |
| `updated_at` | ISO-8601 datetime | Read-only |

## Staff setup workflow

The recommended setup order is:

1. Create draft modules.
2. Upload files or register YouTube videos against each module.
3. Review and reorder module content.
4. Publish individual content items.
5. Publish the module and optionally set its availability window.

Students see an item only when the module is published and currently available, and the item itself is published.

### 1. List modules

```http
GET /api/content/modules/?course_id=501&page=1
```

Staff-only. `course_id` is optional and accepts an external course ID or internal database ID.

### 2. Create a module

```http
POST /api/content/modules/
Content-Type: application/json

{
  "course_id": 501,
  "title": "Module 1: Foundations",
  "description": "Start with the foundational concepts.",
  "order": 1,
  "is_published": false,
  "available_from": "2026-09-01T08:00:00Z",
  "available_until": null
}
```

Successful response: `201 Created` with the `CourseModule` object.

### 3. Retrieve a module and its content

```http
GET /api/content/modules/{module_uuid}/
```

Staff-only. The response includes a `contents` array ordered by `order`, then `created_at`.

### 4. Update, reorder, or publish a module

```http
PATCH /api/content/modules/{module_uuid}/
Content-Type: application/json

{
  "order": 2,
  "is_published": true
}
```

Successful response: `200 OK`.

Use `PUT` for a complete replacement or `PATCH` for a partial update.

### 5. Delete a module

```http
DELETE /api/content/modules/{module_uuid}/
```

Successful response: `204 No Content`. Deleting a module does not delete its stored learning content; those items become legacy ungrouped content with `module=null`.

### 6. Upload a file into a module

```http
POST /api/content/upload/
Content-Type: multipart/form-data

file=<binary>
course_id=501
module_id=77bb1e77-0c0c-4bb3-8335-fd8d4b3d267b
content_type=note
title=Week One Lecture Note
description=Introduction to the course
order=1
is_published=true
storage_backend=s3
```

Required fields are `file`, `course_id`, and `content_type`. `module_id` remains optional for backward compatibility, but should be supplied for module-based courses. The module must belong to the supplied course.

Successful response: `201 Created` with the `LearningContent` object.

### 7. Add a YouTube video into a module

```http
POST /api/content/add-youtube/
Content-Type: application/json

{
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "course_id": 501,
  "module_id": "77bb1e77-0c0c-4bb3-8335-fd8d4b3d267b",
  "title": "Foundation Video",
  "description": "Watch before reading the notes.",
  "order": 2,
  "is_published": true
}
```

Successful response: `201 Created` with the `LearningContent` object.

### 8. Move, reorder, edit, or publish content

```http
PATCH /api/content/{content_uuid}/
Content-Type: application/json

{
  "module": "77bb1e77-0c0c-4bb3-8335-fd8d4b3d267b",
  "order": 3,
  "title": "Updated title",
  "description": "Updated description",
  "is_published": true
}
```

The selected module must belong to the content's course. Set `module` to `null` to return an item to the legacy ungrouped state.

### 9. Delete content

```http
DELETE /api/content/{content_uuid}/
```

Successful response: `204 No Content`. This also attempts to delete the underlying file from its configured storage backend.

## Student consumption workflow

### Discover the student's courses

The frontend should first load the student's enrolled courses from the dashboard endpoint:

```http
GET /api/dashboard/students/?session=2025/2026&semester=First
Authorization: Bearer <access-token>
```

This endpoint requires an authenticated portal student. It synchronizes the student's registrations for the requested academic period and returns the enrolled courses together with dashboard summaries.

The relevant response fields are:

```json
{
  "courses": [
    {
      "course_external_id": 501,
      "course_code": "CSC501",
      "course_title": "Advanced Computing"
    }
  ],
  "course_count": 1,
  "pending_quizzes": [],
  "upcoming_assignments": []
}
```

For each item in `courses`, use `course_external_id` with the structured content endpoint below:

```text
GET /api/content/course/{course_external_id}/modules/
```

Frontend sequence:

1. Request `/api/dashboard/students/` with the selected `session` and `semester`.
2. Render the returned `courses` array.
3. When a course is opened, request `/api/content/course/{course_external_id}/modules/`.
4. Render `results` as ordered modules and each module's `contents` as ordered learning items.
5. Use each content item's `url` to open the file/video and call the access-log endpoint when it is viewed or downloaded.

The generic course catalog is also available to any authenticated user:

```http
GET /api/courses/?page=1
```

That endpoint returns all cached courses and is not filtered to the current student's enrolments. Its response is paginated and contains `course_external_id`, `course_title`, `course_code`, `department_name`, and `updated_at`.

### Get the course module structure

```http
GET /api/content/course/{course_id}/modules/?page=1
```

`course_id` accepts an external course ID or internal database ID. A non-staff user must be enrolled in the course. The response excludes:

- draft modules;
- modules that have not opened yet;
- modules whose availability window has closed;
- unpublished content;
- legacy content with no module.

Modules and their content are returned in ascending `order`.

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "77bb1e77-0c0c-4bb3-8335-fd8d4b3d267b",
      "course_external_id": 501,
      "course_title": "Introduction to Computing",
      "title": "Module 1: Foundations",
      "description": "Start with the foundational concepts.",
      "order": 1,
      "available_from": "2026-09-01T08:00:00Z",
      "available_until": null,
      "contents": [
        {
          "id": "84bbf68c-19cf-4e1c-b1ed-3a42257d826c",
          "component": "learning_content",
          "content_type": "note",
          "course_external_id": 501,
          "course_title": "Introduction to Computing",
          "module": "77bb1e77-0c0c-4bb3-8335-fd8d4b3d267b",
          "module_title": "Module 1: Foundations",
          "order": 1,
          "title": "Week One Lecture Note",
          "description": "Introduction to the course",
          "original_filename": "week-one.pdf",
          "file_size": 204800,
          "mime_type": "application/pdf",
          "storage_backend": "s3",
          "url": "https://storage.example.com/courses/501/note/week-one.pdf",
          "file_extension": "pdf",
          "is_video": false,
          "is_document": true,
          "uploaded_by": 42,
          "uploaded_by_name": "Course Instructor",
          "uploaded_by_external_id": "STAFF-001",
          "is_published": true,
          "download_count": 12,
          "created_at": "2026-08-17T12:00:00Z",
          "updated_at": "2026-08-17T12:00:00Z"
        }
      ]
    }
  ]
}
```

### Open or download content

The student uses the content's `url` to open or download it. The frontend should then record the action for analytics:

```http
POST /api/content/{content_uuid}/log-access/
Content-Type: application/json

{
  "action": "view"
}
```

or:

```json
{
  "action": "download"
}
```

Successful response:

```json
{
  "status": "logged"
}
```

A `download` action increments `download_count`.

## Legacy flat-content endpoints

These remain available for compatibility:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/content/` | Paginated global content list |
| `GET` | `/api/content/?course_id=501` | Filter by external or internal course ID |
| `GET` | `/api/content/?module_id={uuid}` | Filter by module |
| `GET` | `/api/content/?content_type=video` | Filter by content type |
| `GET` | `/api/content/?search=lecture` | Search title, description, or filename |
| `GET` | `/api/content/course/{course_id}/` | Flat content list for one course |
| `GET` | `/api/content/{content_uuid}/` | Retrieve one content item |

New student interfaces should use `/api/content/course/{course_id}/modules/` so publication schedules and module ordering are applied consistently.

## Common status codes

| Status | Meaning |
| --- | --- |
| `200` | Successful read or update |
| `201` | Module/content created |
| `204` | Module/content deleted |
| `400` | Invalid fields, schedule, module, or course/module mismatch |
| `401` | Missing or invalid authentication |
| `403` | Not staff for setup operations, or student not enrolled |
| `404` | Resource not found |
