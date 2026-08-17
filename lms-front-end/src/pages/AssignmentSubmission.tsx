
import React, { useState, useRef, useCallback } from "react";
import { 
    UploadCloud, 
    FileText, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    Trash2,
    ArrowLeft
} from "lucide-react";
import { useStudentSubmission } from "@/service/useStudentSubmission";
import { useNavigate, useParams } from "react-router-dom";

export default function AssignmentSubmissionPage() {
    const { id } = useParams<{ id: string }>();

    const { isLoading, error, submission, createDraftSubmission, finalizeSubmission } = useStudentSubmission();
    
    // UI States
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate()
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // -- Drag and Drop Handlers --
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
            const newFiles = Array.from(e.dataTransfer.files);
            setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
    }, []);

    // -- Standard File Selection --
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
        // Reset input so the same file can be selected again if removed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // -- File Size Formatter --
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // -- API Flow Handlers --
    const handleUploadDraft = async () => {
        if (selectedFiles.length === 0) return;
        try {
            await createDraftSubmission(id!, selectedFiles);
        } catch (err) {
            // Error handled by hook
        }
    };

    const handleFinalSubmit = async () => {
        if (!submission?.id) return;
        try {
            await finalizeSubmission(submission.id);
            setIsModalOpen(false);
            setIsSuccess(true);
        } catch (err) {
            setIsModalOpen(false);
        }
    };

    // 1. SUCCESS STATE
    if (isSuccess || submission?.status === "submitted") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-8 shadow-sm text-center space-y-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Successfully Submitted!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Your work has been securely recorded and locked for grading.</p>
                    </div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3.5 text-sm font-bold transition-all hover:bg-slate-800 dark:hover:bg-slate-200"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submit Assignment</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-6 sm:mt-10 space-y-6">
                {/* ERROR BANNER */}
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{error}</p>
                    </div>
                )}

                {/* STEP 1: UPLOAD DRAFT UI */}
                {!submission && (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upload your work</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select or drag and drop your files below.</p>
                        </div>
                        
                        <input 
                            type="file" 
                            multiple 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                        />
                        
                        {/* Shadcn-style Advanced Dropzone */}
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all p-10 sm:p-14 cursor-pointer text-center
                                ${isDragging 
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 scale-[1.02]' 
                                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }
                            `}
                        >
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isDragging ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                <UploadCloud className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    {isDragging ? 'Drop files now' : 'Tap or drag files here'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Supports PDF, DOCX, ZIP, and Images
                                </p>
                            </div>
                        </div>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-8 space-y-4 animate-in fade-in">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Selected Files ({selectedFiles.length})</h4>
                                <div className="space-y-2">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{file.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                <button 
                                    onClick={handleUploadDraft}
                                    disabled={isLoading}
                                    className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-4 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg shadow-slate-900/10"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><UploadCloud className="h-5 w-5" /> Save as Draft</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: REVIEW & FINALIZE UI */}
                {submission && submission.status === "draft" && (
                    <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-sm overflow-hidden relative animate-in fade-in slide-in-from-bottom-4">
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">Draft Saved</div>
                        
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Review Your Submission</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Your files are uploaded to the server but <strong className="text-slate-700 dark:text-slate-200 font-semibold">have not been submitted for grading yet</strong>. Please review your files and confirm below.</p>
                        
                        <div className="space-y-3 mb-8">
                            {submission.files.map((file) => (
                                <div key={file.id} className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">{file.original_filename}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(file.file_size)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-4 text-sm font-bold transition-all shadow-lg shadow-emerald-600/20"
                        >
                            Confirm Final Submission
                        </button>
                    </div>
                )}
            </div>

            {/* SHADCN-STYLE ALERT DIALOG (MODAL) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 text-left align-middle shadow-2xl transition-all animate-in zoom-in-95 duration-200">
                        
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-500">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div className="mt-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Confirm Submission</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        You are about to finalize this assignment. Once submitted, it will be locked for grading and <strong className="text-slate-700 dark:text-slate-200">you cannot undo this action or upload new files.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
                            <button
                                type="button"
                                disabled={isLoading}
                                className="w-full justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                onClick={handleFinalSubmit}
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Assignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}