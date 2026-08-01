import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    User,
    Clock,
    FileText,
    DownloadCloud,
    CheckCircle2,
    Award,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { useStaffSubmission } from "@/service/useStaffSubmission";
import { useNavigate, useParams } from "react-router-dom";

export default function StaffAssignmentSubmissionReviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate()
    const submissionId = id as string;

    const {
        isLoading,
        isGrading,
        error,
        submission,
        fetchSubmission,
        submitGrade
    } = useStaffSubmission();

    const [marksInput, setMarksInput] = useState<string>("");
    const [gradeSuccess, setGradeSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (submissionId) {
            fetchSubmission(submissionId);
        }
    }, [submissionId, fetchSubmission]);

    // Pre-fill input if already graded
    useEffect(() => {
        if (submission?.marks) {
            setMarksInput(submission.marks.toString());
        }
    }, [submission]);

    const handleGradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marksInput || isNaN(Number(marksInput))) return;

        try {
            await submitGrade(submissionId, marksInput);
            setGradeSuccess(true);
            setTimeout(() => setGradeSuccess(false), 3000); // hide success message after 3s
        } catch (err) {
            // Error is handled in hook
        }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <p className="text-sm font-medium text-text-muted">Loading submission data...</p>
            </div>
        );
    }

    if (!submission && !isLoading) {
        return (
            <div className="p-8 text-center max-w-md mx-auto mt-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-text-main mb-2">Submission Not Found</h2>
                <p className="text-sm text-text-muted mb-6">{error || "The requested submission could not be found."}</p>
                <button onClick={() => navigate(-1)} className="text-sm font-medium text-primary-600 hover:underline">
                    &larr; Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-base pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full text-text-muted hover:bg-surface-hover transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-lg font-heading text-text-main">Review Submission</h1>
                    <p className="text-xs text-text-muted">ID: {submissionId.split('-')[0]}...</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {error && (
                    <AnimateIn direction="down" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-medium">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </AnimateIn>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Student Meta & Files */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Student Info Card */}
                        <AnimateIn direction="up" delay={0.1}>
                            <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                                <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-text-muted" /> Student Details
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-bg-base border border-border-subtle/50">
                                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Student ID</p>
                                        <p className="text-sm font-semibold text-text-main">{submission?.student_external_id || "Unknown"}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-bg-base border border-border-subtle/50">
                                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Attempt</p>
                                        <p className="text-sm font-semibold text-text-main">#{submission?.attempt_number || 1}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-bg-base border border-border-subtle/50">
                                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Submitted On</p>
                                        <p className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-primary-500" />
                                            {formatDate(submission?.submitted_at)}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-bg-base border border-border-subtle/50">
                                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Status</p>
                                        <div className="flex items-center mt-0.5">
                                            {submission?.status.toLowerCase() === 'graded' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Graded
                                                </span>
                                            ) : submission?.status.toLowerCase() === 'draft' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    Draft Mode
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                                    Needs Grading
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimateIn>

                        {/* Submitted Files Card */}
                        <AnimateIn direction="up" delay={0.2}>
                            <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                                <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-text-muted" /> Submitted Files
                                </h2>

                                {submission?.files.length === 0 ? (
                                    <div className="text-center py-8 rounded-xl bg-bg-base border border-dashed border-border-subtle">
                                        <p className="text-sm text-text-muted">No files attached to this submission.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {submission?.files.map((file) => (
                                            <div key={file.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border-subtle bg-bg-base p-4 hover:border-primary-200 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-text-main">{file.original_filename}</p>
                                                        <p className="text-xs text-text-muted mt-0.5">{formatFileSize(file.file_size)} &bull; {file.mime_type}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={file.url}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-surface border border-border-subtle px-4 py-2 text-sm font-medium text-text-main hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all w-full sm:w-auto"
                                                >
                                                    <DownloadCloud className="h-4 w-4" /> Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AnimateIn>
                    </div>

                    {/* RIGHT COLUMN: Grading Panel */}
                    <div className="lg:col-span-1">
                        <AnimateIn direction="left" delay={0.3} className="sticky top-24">
                            <div className="rounded-2xl border border-primary-200 bg-primary-50/30 p-6 shadow-sm">
                                <h2 className="text-lg font-heading text-text-main mb-2 flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary-600" /> Grade Assignment
                                </h2>
                                <p className="text-sm text-text-muted mb-6">Evaluate the files and assign a final score.</p>

                                <form onSubmit={handleGradeSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="marks" className="block text-sm font-bold text-text-main mb-1.5">Score / Marks</label>
                                        <div className="relative">
                                            <input
                                                id="marks"
                                                type="number"
                                                step="0.01"
                                                value={marksInput}
                                                onChange={(e) => setMarksInput(e.target.value)}
                                                placeholder="e.g. 85"
                                                required
                                                disabled={isGrading || submission?.status === 'draft'}
                                                className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-lg font-semibold text-text-main placeholder:text-text-muted/50 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isGrading || submission?.status === 'draft' || !marksInput}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-md shadow-primary-600/20"
                                    >
                                        {isGrading ? (
                                            <><Loader2 className="h-5 w-5 animate-spin" /> Saving Grade...</>
                                        ) : (
                                            "Submit Grade"
                                        )}
                                    </button>
                                </form>

                                {/* Grade Success Feedback */}
                                {gradeSuccess && (
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary-50 border border-secondary-200 p-3 text-secondary-700 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Grade saved successfully!
                                    </div>
                                )}

                                {/* Draft Warning */}
                                {submission?.status === 'draft' && (
                                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-700 text-sm">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p>This submission is currently in draft mode. The student has not finalized it yet.</p>
                                    </div>
                                )}
                            </div>
                        </AnimateIn>
                    </div>
                </div>
            </div>
        </div>
    );
}