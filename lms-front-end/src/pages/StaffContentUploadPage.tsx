import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    UploadCloud,
    MonitorPlay,
    FileText,
    AlertCircle,
    CheckCircle2,
    Loader2,
    X,
    Plus,
    BookOpen
} from "lucide-react";
import type { ContentType } from "../types/content.upload.types";
import { useContentUpload } from "@/service/useContentUpload";
import { useStaffDashboard } from "@/service/useStaffDashboard";
import { useUserContext } from "@/context/UserProvider";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Helper function to auto-detect content type based on file name or MIME type
const detectContentType = (file: File): ContentType => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    if (type.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".avi") || name.endsWith(".mkv") || name.endsWith(".webm")) {
        return "video";
    }
    if (name.includes("assignment") || name.includes("homework") || name.includes("hw") || name.endsWith(".zip") || name.endsWith(".rar")) {
        return "assignment";
    }
    if (name.endsWith(".pdf") || name.endsWith(".ppt") || name.endsWith(".pptx") || name.endsWith(".doc") || name.endsWith(".docx") || name.includes("slide") || name.includes("note")) {
        return "note";
    }
    return "resource";
};

export const StaffContentUploadPage: React.FC = () => {
    const { isUploading, error: apiError, successData, uploadFile, uploadYouTubeLink, resetState } = useContentUpload();
    const { fetchStaffData, dashboardData } = useStaffDashboard();
    const { user } = useUserContext();

    // UI State
    const [activeTab, setActiveTab] = useState<"file" | "youtube">("file");
    const [isDragging, setIsDragging] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Form State - Shared
    const [courseId, setCourseId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Form State - File specific
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [contentType, setContentType] = useState<ContentType>("note");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State - YouTube specific
    const [youtubeUrl, setYoutubeUrl] = useState("");

    // -- File Handling with Auto-Detection & Size Validation --
    const handleFileSelection = (file: File) => {
        const MAX_FILE_SIZE_MB = 50;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFormError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        setFormError(null);
        setSelectedFile(file);
        
        // Automatically detect and set the appropriate content type
        const detectedType = detectContentType(file);
        setContentType(detectedType);
    };

    // -- Drag & Drop Handlers --
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleReset = () => {
        setCourseId("");
        setTitle("");
        setDescription("");
        setSelectedFile(null);
        setYoutubeUrl("");
        setFormError(null);
        resetState();
    };

    // -- Submit Handlers with Robust Validation --
    const onSubmitFile = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Pre-flight validation checks
        if (!selectedFile) {
            setFormError("Please attach a file before uploading.");
            return;
        }
        if (!courseId) {
            setFormError("Please select a course for this content.");
            return;
        }
        if (!contentType) {
            setFormError("Please select a valid content type.");
            return;
        }

        await uploadFile({
            file: selectedFile,
            course_id: courseId,
            content_type: contentType,
            title: title.trim() || undefined,
            description: description.trim() || undefined
        });
    };

    const onSubmitYouTube = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!youtubeUrl.trim()) {
            setFormError("Please enter a valid YouTube video URL.");
            return;
        }
        if (!courseId) {
            setFormError("Please select a course for this video.");
            return;
        }

        // Validate YouTube URL structure
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!ytRegex.test(youtubeUrl.trim())) {
            setFormError("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...).");
            return;
        }

        await uploadYouTubeLink({
            video_url: youtubeUrl.trim(),
            course_id: courseId,
            title: title.trim() || undefined,
            description: description.trim() || undefined
        });
    };

    useEffect(() => {
        if (user) {
            fetchStaffData(user.external_id);
        }
    }, [user]);

    // Find the currently selected course
    const selectedCourse = dashboardData?.total_courses?.find(
        (c) => String(c.course_external_id) === String(courseId)
    );

    // -- Success View --
    if (successData) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Content Added!</h2>
                    <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
                        "{successData.title || successData.original_filename}" has been successfully published to course {successData.course_external_id}.
                    </p>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <Plus className="h-4 w-4" /> Upload Another
                    </button>
                </div>
            </div>
        );
    }

    const displayError = formError || apiError;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Add Learning Content</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Upload course materials, videos, and assignments to your classes.</p>
                </div>

                {/* Error Banner */}
                {displayError && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium leading-relaxed">{displayError}</p>
                    </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">

                    {/* Custom Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => { setActiveTab("file"); setFormError(null); resetState(); }}
                            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === "file"
                                ? "border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/50"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
                                }`}
                        >
                            <UploadCloud className="h-5 w-5" /> Direct File Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab("youtube"); setFormError(null); resetState(); }}
                            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === "youtube"
                                ? "border-b-2 border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 bg-slate-50 dark:bg-slate-800/50"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
                                }`}
                        >
                            <MonitorPlay className="h-5 w-5" /> YouTube Link
                        </button>
                    </div>

                    <div className="p-6 sm:p-8">

                        {/* FILE UPLOAD FORM */}
                        {activeTab === "file" && (
                            <form onSubmit={onSubmitFile} className="space-y-6">

                                {/* Drag & Drop Zone */}
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">File Attachment <span className="text-red-500">*</span></label>
                                    {!selectedFile ? (
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all ${isDragging
                                                ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10 scale-[1.01]"
                                                : "border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800/50"
                                                }`}
                                        >
                                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isDragging ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                                <UploadCloud className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 dark:text-white">Click or drag file to upload</p>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">MP4, PDF, DOCX, ZIP (Max 50MB)</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-900 dark:text-white">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setFormError(null); }}
                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Type Selector (Auto-detected + Overridable) */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <FileText size={16} className="text-indigo-500" />
                                            Content Type <span className="text-red-500">*</span>
                                        </span>
                                        <span className="text-xs text-zinc-400 font-normal">Auto-detected from file name/extension</span>
                                    </label>
                                    <Select
                                        value={contentType}
                                        onValueChange={(val) => setContentType(val as ContentType)}
                                    >
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-indigo-500/50">
                                            <SelectValue placeholder="Select content type..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                            <SelectItem value="note" className="cursor-pointer">Note / Lecture Slides</SelectItem>
                                            <SelectItem value="video" className="cursor-pointer">Video Recording</SelectItem>
                                            <SelectItem value="assignment" className="cursor-pointer">Assignment File</SelectItem>
                                            <SelectItem value="resource" className="cursor-pointer">Extra Resource</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Course Selection */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                        <BookOpen size={16} className="text-emerald-500" />
                                        Course <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        key={`course-select-${courseId}`}
                                        value={courseId}
                                        onValueChange={(val: string | null) => {
                                            setCourseId(val || '');
                                            setFormError(null);
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-emerald-500/50">
                                            {selectedCourse ? (
                                                <div className="truncate text-left">
                                                    <span className="font-semibold">{selectedCourse.course_code}</span> - {selectedCourse.course_title}
                                                </div>
                                            ) : (
                                                <SelectValue placeholder="Select a course..." />
                                            )}
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                            {dashboardData?.total_courses?.map((course) => (
                                                <SelectItem
                                                    key={course.course_external_id}
                                                    value={String(course.course_external_id)}
                                                    className="focus:bg-emerald-50 focus:text-emerald-900 dark:focus:bg-emerald-500/10 dark:focus:text-emerald-300 cursor-pointer"
                                                >
                                                    <span className="font-semibold">{course.course_code}</span> - {course.course_title}
                                                </SelectItem>
                                            ))}
                                            {(!dashboardData?.total_courses || dashboardData.total_courses.length === 0) && (
                                                <div className="px-2 py-3 text-sm text-zinc-500 text-center">
                                                    No courses available.
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Title <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Overrides the original file name"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <textarea
                                        rows={3}
                                        placeholder="Provide context for the students..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={isUploading || !selectedFile || !courseId}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                                    >
                                        {isUploading ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</> : "Upload Content"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* YOUTUBE LINK FORM */}
                        {activeTab === "youtube" && (
                            <form onSubmit={onSubmitYouTube} className="space-y-6">

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">YouTube Video URL <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MonitorPlay className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="url"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={youtubeUrl}
                                            onChange={(e) => {
                                                setYoutubeUrl(e.target.value);
                                                setFormError(null);
                                            }}
                                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-red-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                        <BookOpen size={16} className="text-emerald-500" />
                                        Course <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        key={`course-select-${courseId}`}
                                        value={courseId}
                                        onValueChange={(val) => {
                                            setCourseId(val || '');
                                            setFormError(null);
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm focus:ring-emerald-500/50">
                                            {selectedCourse ? (
                                                <div className="truncate text-left">
                                                    <span className="font-semibold">{selectedCourse.course_code}</span> - {selectedCourse.course_title}
                                                </div>
                                            ) : (
                                                <SelectValue placeholder="Select a course..." />
                                            )}
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                            {dashboardData?.total_courses?.map((course) => (
                                                <SelectItem
                                                    key={course.course_external_id}
                                                    value={String(course.course_external_id)}
                                                    className="focus:bg-emerald-50 focus:text-emerald-900 dark:focus:bg-emerald-500/10 dark:focus:text-emerald-300 cursor-pointer"
                                                >
                                                    <span className="font-semibold">{course.course_code}</span> - {course.course_title}
                                                </SelectItem>
                                            ))}
                                            {(!dashboardData?.total_courses || dashboardData.total_courses.length === 0) && (
                                                <div className="px-2 py-3 text-sm text-zinc-500 text-center">
                                                    No courses available.
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Title <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Title for the video"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-red-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <textarea
                                        rows={3}
                                        placeholder="What will the students learn in this video?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-red-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={isUploading || !youtubeUrl || !courseId}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-4 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/20"
                                    >
                                        {isUploading ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving Link...</> : "Add YouTube Video"}
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
};