import { z } from "zod";

export const ContentResponseSchema = z.object({
  id: z.string().uuid(),
  component: z.string().nullable().optional(),
  content_type: z.string(),
  course_external_id: z.union([z.string(), z.number()]).optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  original_filename: z.string().nullable().optional(),
  url: z.string(), 
  is_video: z.boolean().default(false),
  created_at: z.string(),
});

export type ContentResponse = z.infer<typeof ContentResponseSchema>;

// Form Data Types
export type ContentType = "note" | "video" | "resource" | "assignment";

export interface FileUploadPayload {
  file: File;
  course_id: string;
  content_type: ContentType;
  title?: string;
  description?: string;
  storage_backend?: "local" | "s3" | "cloudinary" | "youtube";
}

export interface YouTubeUploadPayload {
  video_url: string;
  course_id: string;
  title?: string;
  description?: string;
}