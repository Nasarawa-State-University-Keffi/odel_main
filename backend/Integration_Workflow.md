# Odel LMS - Frontend Integration Workflow

This document provides a technical guide for integrating the frontend application with the Odel LMS backend. 

---

## 1. Authentication Flow

Authentication is **not** handled by this API directly. Tokens must be obtained from the **Main Portal**.

- **Header Requirement:** All requests to the LMS API must include the portal token in the following format:
  ```http
  Authorization: Bearer <portal_token>
  ```
- **Internal Logic:** The backend uses `PortalJWTAuthentication` to validate this token against the main portal and synchronize user roles (Student vs Staff).

---

## 2. Student Workflow: Learning & Assessments

### 2.1 Course Content
For a student to study materials:
1.  **View All Course Content:** `GET /api/content/content/course/<course_id>/`
    - `<course_id>` can be the UUID or the `course_external_id`.
    - Returns list of PDFs, Videos, YouTube links, etc.
2.  **View Specific Content Detail:** `GET /api/content/content/<uuid:pk>/`
3.  **Log Access (Optional/Analytics):** `POST /api/content/content/<uuid:pk>/log_access/`
    - **Body:** `{ "action": "view" }` (or `"download"`)

### 2.2 Assignments Flow
1.  **List Assignments:** `GET /api/student/assessment/assignments/`
2.  **Create Submission:** `POST /api/student/assessment/submissions/create/`
    - **Content-Type:** `multipart/form-data`
    - **Body:** `assignment_id` (UUID), `files` (Array of binaries).
3.  **Submit (Finalize):** `POST /api/student/assessment/submissions/<uuid:pk>/submit/`
    - **Body:** `{ "confirm": true }`

### 2.3 Quizzes Flow (Moodle-style)
1.  **Start Quiz Attempt:** `POST /api/student/assessment/quizzes/<uuid:pk>/start/`
2.  **Submit Question Responses:** `POST /api/student/assessment/quizzes/<uuid:pk>/attempts/<uuid:attempt_id>/submit/`
    - **Body:** `{ "question_id": "...", "response": { ... } }`
    - *Note: Supports interactive grading/feedback per question.*
3.  **Finish Quiz:** `POST /api/student/assessment/quizzes/<uuid:pk>/attempts/<uuid:attempt_id>/finish/`

---

## 3. Staff Workflow: Management & Grading

### 3.1 Course Content Management
- **List All Content (Filtered):** `GET /api/content/content/`
- **Upload Content:** `POST /api/content/content/upload/`
  - **Content-Type:** `multipart/form-data`
- **YouTube Integration:** `POST /api/content/content/add_youtube/`
- **Delete Content:** `DELETE /api/content/content/<uuid:pk>/`

### 3.2 Assignment Management
- **Create Assignment:** `POST /api/staff/assessment/assignments/`
  - Supports `multipart/form-data` for creating the assignment and uploading instruction files (`files`) simultaneously.
- **Update / Extend / Reopen:** `PATCH /api/staff/assessment/assignments/<uuid:pk>/`
  - To **extend** a deadline, update `due_at`.
  - To **reopen** a closed assignment, update `close_at` or `due_at` to a future date.
  - **Body Example:** `{ "due_at": "2024-12-31T23:59:59Z" }`
- **Grade Submission:** `POST /api/staff/assessment/submissions/<uuid:pk>/grade/`
  - **Body:** `{ "marks": 85.50 }`

### 3.3 Question Bank & Quizzes
- **Categories:** `GET/POST /api/staff/assessment/question-bank/categories/`
- **Questions:** `GET/POST /api/staff/assessment/question-bank/questions/`
- **Quiz Setup:** `POST /api/staff/assessment/quizzes/`
- **Manual Grading (Quizzes):** `POST /api/staff/assessment/attempts/<pk>/questions/<q_attempt_id>/grade/`
  - **Body:** `{ "fraction": 1.0, "feedback": "Excellent work" }`

---

## 4. Dashboard & Metrics

Retrieve real-time metrics for the user's dashboard.

- **Student Dashboard:** `GET /api/dashboard/students/`
- **Instructor Dashboard:** `GET /api/dashboard/instructors/`

---

## 5. Course Management

- **List All Courses:** `GET /api/courses/` (Cached from Portal)
- **View Specific Course Detail:** `GET /api/courses/<uuid:pk>/`

---

## 6. General Patterns

### Pagination
Most list endpoints use standard DRF `PageNumberPagination`:
- **Params:** `page`, `page_size` (default 20).
- **Response Shape:**
  ```json
  {
    "count": 100,
    "next": "...",
    "previous": null,
    "results": [...]
  }
  ```

### Error Handling
Check for `error` or specific field validation keys in the response body during `400 Bad Request` or `401 Unauthorized`.

---

## 7. Technical References
- **API Docs:** `/api/docs/` (Swagger)
- **Settings:** `portal_auth/authentication.py` for token handling logic.
