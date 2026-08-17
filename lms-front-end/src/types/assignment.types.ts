import { z } from "zod";

export const CourseSchema = z.object({
  course_external_id: z.number(),
  course_title: z.string(),
  course_code: z.string(),
  department_name: z.string(),
  updated_at: z.string().datetime(),
});

export const ContentFileSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content_type: z.string(),
  url: z.string().url().or(z.string()),
  created_at: z.string().datetime(),
});

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  course: CourseSchema,
  content_files: z.array(ContentFileSchema),
  title: z.string(),
  description: z.string(),
  open_at: z.string().datetime(),
  due_at: z.string().datetime(),
  close_at: z.string().datetime(),
  max_attempts: z.number(),
  allow_late_submission: z.boolean(),
  is_published: z.boolean(),
  max_marks: z.string(),
  created_at: z.string().datetime(),
  created_by: z.number(),
});

export const PaginatedAssignmentSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(AssignmentSchema),
});


// Add this below your existing schemas

export const CreateAssignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  open_at: z.string().min(1, "Open date is required"),
  due_at: z.string().min(1, "Due date is required"),
  close_at: z.string().min(1, "Close date is required"),
  max_attempts: z.number().int().positive("Must be at least 1 attempt"),
  allow_late_submission: z.boolean(),
  is_published: z.boolean(),
  max_marks: z.string().min(1, "Max marks is required"),
  course: z.number().int().positive("Please select a valid course"),
});

// export const SubmissionFileSchema = z.object({
//   id: z.string().uuid(),
//   url: z.string().url().or(z.string()),
//   storage_path: z.string(),
//   original_filename: z.string(),
//   file_size: z.number(),
//   mime_type: z.string(),
//   storage_backend: z.string(),
//   content_hash: z.string(),
//   created_at: z.string().datetime(),
//   submission: z.string().uuid(),
// });







export interface SubmissionQueryParams {
  page?: number;
  search?: string;
  ordering?: string;
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  open_at?: string;
  due_at?: string;
  close_at?: string;
  max_attempts?: number;
  allow_late_submission?: boolean;
  is_published?: boolean;
  max_marks?: string | number;
  course?: number;
}


export const SubmissionFileSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  storage_path: z.string().optional(),
  original_filename: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  storage_backend: z.string().optional(),
  content_hash: z.string().optional(),
  created_at: z.string(),
  submission: z.string().uuid().optional(),
});

export const SubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignment: z.string().uuid(),
  student_external_id: z.string().optional(),
  attempt_number: z.number(),
  status: z.string(),
  submitted_at: z.string().nullable().optional(),
  graded_at: z.string().nullable().optional(),
  marks: z.string().nullable().optional(),
  created_at: z.string(),
  files: z.array(SubmissionFileSchema).default([]),
});


export const PaginatedSubmissionsSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(SubmissionResponseSchema),
});

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  files: z.array(SubmissionFileSchema),
  student_external_id: z.string(),
  attempt_number: z.number(),
  status: z.string(), // e.g., "draft", "submitted", "graded"
  submitted_at: z.string().datetime().nullable().optional(),
  graded_at: z.string().datetime().nullable().optional(),
  marks: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  assignment: z.string().uuid(),
});


// Export inferred TypeScript types
export type Course = z.infer<typeof CourseSchema>;
export type ContentFile = z.infer<typeof ContentFileSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type PaginatedAssignments = z.infer<typeof PaginatedAssignmentSchema>;
export type CreateAssignmentPayload = z.infer<typeof CreateAssignmentSchema>;

export type SubmissionFile = z.infer<typeof SubmissionFileSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type PaginatedSubmissions = z.infer<typeof PaginatedSubmissionsSchema>;