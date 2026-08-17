import { z } from "zod";

// export const ContentItemSchema = z.object({
//   id: z.string().uuid(),
//   component: z.string().nullable().optional(),
//   content_type: z.string(),
//   course_external_id: z.union([z.string(), z.number()]).optional(),
//   course_title: z.string().nullable().optional(),
//   title: z.string(),
//   description: z.string().nullable().optional(),
//   original_filename: z.string(),
//   file_size: z.number(),
//   mime_type: z.string(),
//   storage_backend: z.string().nullable().optional(),
//   url: z.string().url(),
//   file_extension: z.string(),
//   is_video: z.boolean().default(false),
//   is_document: z.boolean().default(false),
//   uploaded_by: z.number().optional(),
//   uploaded_by_name: z.string().nullable().optional(),
//   uploaded_by_external_id: z.string().nullable().optional(),
//   is_published: z.boolean().default(true),
//   download_count: z.number().default(0),
//   created_at: z.string(),
//   updated_at: z.string(),
// });
export const ContentItemSchema = z.object({
  id: z.string().uuid(),
  component: z.string().nullable().optional(),
  content_type: z.string(),
  course_external_id: z.union([z.string(), z.number()]).nullable().optional(),
  course_title: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  original_filename: z.string().nullable().optional(),
  file_size: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  storage_backend: z.string().nullable().optional(),
  url: z.string(),
  file_extension: z.string().nullable().optional(),
  is_video: z.boolean().default(false),
  is_document: z.boolean().default(false),
  uploaded_by: z.number().nullable().optional(),
  uploaded_by_name: z.string().nullable().optional(),
  uploaded_by_external_id: z.string().nullable().optional(),
  is_published: z.boolean().default(true),
  download_count: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ContentPaginationSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(ContentItemSchema),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;
export type ContentPagination = z.infer<typeof ContentPaginationSchema>;