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

All student routes require an authenticated portal user whose roles include the portal role `PORTAL_STUDENTS`. The normalized OIDC alias `STUDENT` is also accepted.

### 2.1 Registered Courses

Use the student dashboard endpoint to synchronize and fetch the authenticated student's courses for one academic period:

```http
GET /api/dashboard/students/?session=2025%2F2026&semester=First%20Semester
Authorization: Bearer <portal_token>
```

Both `session` and `semester` are required. The response is not paginated and has this shape:

```json
{
  "user": {
    "full_name": "Student One",
    "email": "student@example.edu.ng",
    "level": "400",
    "roles": ["PORTAL_STUDENTS"],
    "profile_picture": null
  },
  "courses": [
    {
      "course_external_id": 101,
      "course_code": "CSC401",
      "course_title": "Software Engineering"
    }
  ],
  "course_count": 1,
  "pending_quizzes": [],
  "upcoming_assignments": []
}
```

The LMS refreshes the student's registrations from the portal before producing this response. `GET /api/courses/` must not be used as a "my courses" endpoint because it returns the global course cache.

The portal integration used internally is:

```http
GET {PORTAL_SYNC_BASE_URL}/api/lms/students/{encoded_student_external_id}/courses
    ?session=2025/2026
    &semester=First Semester
```

This upstream request uses the configured LMS `Identity` and `Secret` headers; frontend clients should call the LMS dashboard endpoint instead of calling it directly.

### 2.2 Course Content
For a student to study materials:
1.  **View All Course Content:** `GET /api/content/content/course/<course_id>/`
    - `<course_id>` can be the UUID or the `course_external_id`.
    - Returns list of PDFs, Videos, YouTube links, etc.
2.  **View Specific Content Detail:** `GET /api/content/content/<uuid:pk>/`
3.  **Log Access (Optional/Analytics):** `POST /api/content/content/<uuid:pk>/log_access/`
    - **Body:** `{ "action": "view" }` (or `"download"`)

### 2.3 Assignments Flow
1.  **List Assignments:** `GET /api/student/assessment/assignments/?session=2025%2F2026&semester=First%20Semester`
    - `session` and `semester` are required.
    - Results contain only published assignments from courses registered in that academic period.
    - Only published assignment content files are returned to students.
2.  **Assignment Detail:** `GET /api/student/assessment/assignments/<uuid:pk>/?session=2025%2F2026&semester=First%20Semester`
    - Returns `404 Not Found` when the assignment is unpublished or outside the student's registrations for the selected period.
3.  **Create Submission:** `POST /api/student/assessment/submissions/create/`
    - **Content-Type:** `multipart/form-data`
    - **Body:** `assignment_id` (UUID), `session`, `semester`, and optional `files` (array of binaries).
    - Enrollment, publication status, opening time, deadline, hard close time, and maximum attempts are enforced server-side.
4.  **Submit (Finalize):** `POST /api/student/assessment/submissions/<uuid:pk>/submit/`
    - **Body:** `{ "confirm": true, "session": "2025/2026", "semester": "First Semester" }`
    - Ownership, current-period enrollment, publication status, and submission deadlines are checked again before finalization.

### 2.4 Quizzes Flow (Moodle-style)
1.  **List Quizzes:** `GET /api/student/assessment/quizzes/?session=2025%2F2026&semester=First%20Semester`
2.  **Quiz Detail:** `GET /api/student/assessment/quizzes/<uuid:pk>/?session=2025%2F2026&semester=First%20Semester`
3.  **Start Quiz Attempt:** `POST /api/student/assessment/quizzes/<uuid:pk>/start/`
    - **Body:** `{ "session": "2025/2026", "semester": "First Semester" }`
    - The user identity always comes from the authenticated portal token; clients cannot start attempts for another external ID.
4.  **Submit Question Responses:** `POST /api/student/assessment/quizzes/<uuid:pk>/attempts/<uuid:attempt_id>/submit/`
    - **Body:** `{ "question_id": "...", "response": { ... } }`
    - *Note: Supports interactive grading/feedback per question.*
5.  **Finish Quiz:** `POST /api/student/assessment/quizzes/<uuid:pk>/attempts/<uuid:attempt_id>/finish/`

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

### 3.4 Score Exports (CSV Downloads)

Both endpoints return a `text/csv` file download. The staff member must be assigned to the course the assessment belongs to, otherwise a `403 Forbidden` is returned.

#### Export Assignment Scores
```
GET /api/staff/assessment/assignments/<uuid:pk>/export/
```
- **Permission:** Staff assigned to the assignment's course only.
- **Response:** CSV file download — `attachment; filename="assignment_<Title>_scores.csv"`
- **CSV Columns:**

  | Column | Description |
  |--------|-------------|
  | Student ID | Portal external ID |
  | Student Name | Full name from portal |
  | Student Email | Email from portal |
  | Submission Status | `No Submission`, `Draft`, `Submitted`, `Graded`, etc. |
  | Attempt Number | Which attempt this row represents |
  | Submitted At | `YYYY-MM-DD HH:MM:SS` or `N/A` |
  | Score | Numeric marks awarded or `N/A` |
  | Max Marks | The assignment's maximum possible marks |
  | Percentage | `(Score / Max Marks) * 100` or `N/A` |

- **Row Selection:** One row per enrolled student. If a student has multiple submissions, the **highest graded** attempt is used; for ungraded submissions, the latest attempt is shown.

#### Export Quiz Scores
```
GET /api/staff/assessment/quizzes/<uuid:pk>/export/
```
- **Permission:** Staff assigned to the quiz's course only.
- **Response:** CSV file download — `attachment; filename="quiz_<Name>_scores.csv"`
- **CSV Columns:**

  | Column | Description |
  |--------|-------------|
  | Student ID | Portal external ID |
  | Student Name | Full name from portal |
  | Student Email | Email from portal |
  | Attempt State | `No Attempt`, `In Progress`, `Finished`, etc. |
  | Total Attempts | Number of attempts made |
  | Best Attempt Number | Attempt number with the highest score |
  | Score | Best attempt's `total_score` or `N/A` |
  | Max Grade | The quiz's maximum possible grade |
  | Percentage | `(Score / Max Grade) * 100` or `N/A` |
  | Finished At | `YYYY-MM-DD HH:MM:SS` of best attempt or `N/A` |

- **Row Selection:** One row per enrolled student. The **best attempt** (highest `total_score`) is reported; if scores are equal, the latest attempt number wins.

---


## 4. Dashboard & Metrics

Retrieve real-time metrics for the user's dashboard.

- **Student Dashboard:** `GET /api/dashboard/students/?session=<session>&semester=<semester>`
- **Staff View of a Student:** `GET /api/dashboard/students/<external_id>/?session=<session>&semester=<semester>`
- **Instructor Dashboard:** `GET /api/dashboard/instructors/?programme_type_code=<code>&session=<session>&semester=<semester>`

The student dashboard is the student-scoped course API. The `<external_id>` variant is staff-only.

---

## 5. Course Management

- **List All Courses:** `GET /api/courses/` (global cache, not student-scoped)
- **View Specific Course Detail:** `GET /api/courses/<int:pk>/`

Student registrations are stored per `(student, course, session, semester)`. Registrations and assignment submissions have database-enforced foreign keys to the portal user identified by `external_id`; legacy orphan identifiers are backfilled as inactive placeholder portal users during migration.

---

## 6. Email System Management (Staff Only)

Manage the active email delivery backend and its configuration directly via the API.

- **List All Configurations:** `GET /api/notifications/settings/`
- **Create New Configuration:** `POST /api/notifications/settings/`
  - **Body Example:**
    ```json
    {
      "backend_choice": "resend",
      "is_active": true,
      "config": {
        "from_email": "notifications@yourdomain.com"
      }
    }
    ```
- **Update Configuration:** `PATCH /api/notifications/settings/<uuid:pk>/`
- **Delete Configuration:** `DELETE /api/notifications/settings/<uuid:pk>/`

---

## 7. General Patterns

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

## 8. Technical References
- **API Docs:** `/api/docs/` (Swagger)
- **Settings:** `portal_auth/authentication.py` for token handling logic.
