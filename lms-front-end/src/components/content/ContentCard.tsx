// src/components/content/ContentCard.tsx
import React, { useState } from "react";
import { 
    FileText, 
    Video, 
    Download, 
    User, 
    HardDrive,
    PlayCircle
} from "lucide-react";
import type { ContentItem } from "../../types/content.types";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface ContentCardProps {
    item: ContentItem;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Safe formatter
    const formatBytes = (bytes?: number | null) => {
        if (bytes == null || bytes === 0) return "N/A";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    };

    const isVideo = item.is_video || item.mime_type?.startsWith("video/") || item.storage_backend === "youtube";

    const handleActionClick = (e: React.MouseEvent) => {
        if (isVideo) {
            e.preventDefault();
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div className="group relative flex flex-col md:flex-row items-stretch rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 overflow-hidden">
                
                {/* Left Thumbnail / Icon Block */}
                <div 
                    onClick={handleActionClick}
                    className={`flex md:w-64 shrink-0 h-40 md:h-auto items-center justify-center cursor-pointer transition-colors relative ${
                        isVideo 
                            ? "bg-slate-900 text-indigo-400" 
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                    }`}
                >
                    {isVideo ? (
                        <div className="relative flex items-center justify-center w-full h-full">
                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity group-hover:bg-slate-950/20" />
                            <PlayCircle className="relative z-10 h-14 w-14 text-white drop-shadow-md transition-transform group-hover:scale-110" />
                            <span className="absolute bottom-3 left-3 z-10 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                                Video Lesson
                            </span>
                        </div>
                    ) : (
                        <FileText className="h-14 w-14 stroke-[1.5]" />
                    )}
                    
                    <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-sm dark:bg-slate-800/90 dark:text-slate-200">
                        {item.course_title || `Course ID: ${item.course_external_id || "CSC 111"}`}
                    </div>
                </div>

                {/* Right Details Block */}
                <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                Modified {formatDate(item.updated_at || item.created_at)}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                isVideo 
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900" 
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900"
                            }`}>
                                {item.content_type}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                        </h3>

                        {item.description && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                {item.description}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                <span>{item.uploaded_by_name || "Instructor"}</span>
                            </div>
                            {!isVideo && (
                                <div className="flex items-center gap-1.5">
                                    <HardDrive className="h-3.5 w-3.5" />
                                    <span>{formatBytes(item.file_size)} • {item.file_extension || "file"}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            {isVideo ? (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                                >
                                    <Video className="h-4 w-4" /> Watch In-App
                                </button>
                            ) : (
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                    <Download className="h-4 w-4" /> Download File
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <VideoPlayerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                url={item.url}
                title={item.title}
            />
        </>
    );
};

export const ContentCardSkeleton = () => (
    <div className="flex flex-col md:flex-row items-stretch animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden h-44">
        <div className="md:w-64 h-32 md:h-auto bg-slate-200 dark:bg-slate-800 shrink-0"></div>
        <div className="flex flex-1 flex-col justify-between p-6">
            <div>
                <div className="mb-3 h-4 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="mb-2 h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            </div>
        </div>
    </div>
);