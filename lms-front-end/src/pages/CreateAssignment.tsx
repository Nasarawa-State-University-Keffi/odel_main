import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify"; // Assuming you use this based on package.json

import { useStaffAccessment } from "@/service/useStaffAssignment";
import { CreateAssignmentSchema, type CreateAssignmentPayload } from "@/types/assignment.types";
import { AnimateIn } from "@/components/ui/animate-in";
import { useStaffDashboard } from "@/service/useStaffDashboard";
import { useUserContext } from "@/context/UserProvider";

const CreateAssignment = () => {
    const navigate = useNavigate();
    const { createAssignment, isPending } = useStaffAccessment();
    const { fetchStaffData, isPending: pendingStaff, dashboardData } = useStaffDashboard()
    const { user } = useUserContext()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateAssignmentPayload>({
        resolver: zodResolver(CreateAssignmentSchema),
        defaultValues: {
            allow_late_submission: false,
            is_published: false,
            max_attempts: 1,
        },
    });

    const onSubmit = async (data: CreateAssignmentPayload) => {
        try {
            const formattedData = {
                ...data,
                open_at: new Date(data.open_at).toISOString(),
                due_at: new Date(data.due_at).toISOString(),
                close_at: new Date(data.close_at).toISOString(),
            };

            await createAssignment(formattedData);
            toast.success("Assignment created successfully!");
            navigate("/assignments");
        } catch (error: any) {
            toast.error(error || "An error occurred while creating the assignment.");
        }
    };

    useEffect(() => {
        if (user) {
            fetchStaffData(user.external_id)
        }
    }, []);

    return (
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimateIn className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading text-text-main">Create Assignment</h1>
                    <p className="text-text-muted text-sm mt-1">Configure a new assessment for your course.</p>
                </div>
            </AnimateIn>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Details Column */}
                    <AnimateIn direction="up" delay={0.1} className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-heading text-text-main mb-4">General Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Assignment Title *</label>
                                    <input
                                        {...register("title")}
                                        className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                        placeholder="e.g. Midterm Project Phase 1"
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Description</label>
                                    <textarea
                                        {...register("description")}
                                        rows={5}
                                        className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                                        placeholder="Provide instructions and context..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Course *</label>
                                    <div className="relative">
                                        <select
                                            defaultValue=""
                                            {...register("course", { valueAsNumber: true })}
                                            disabled={pendingStaff}
                                            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="" disabled>
                                                {pendingStaff ? "Loading courses..." : "Select a course"}
                                            </option>

                                            {/* Safely map over the courses, checking for data wrapper if present */}
                                            {(dashboardData?.total_courses || []).map((course: any) => (
                                                <option
                                                    key={course.course_external_id}
                                                    value={course.course_external_id}
                                                >
                                                    {course.course_code} - {course.course_title}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Optional: Add a custom dropdown arrow if you want to hide the default browser one */}
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            {pendingStaff ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
                                </div>
                            </div>
                        </div>
                    </AnimateIn>

                    {/* Configuration Column */}
                    <AnimateIn direction="up" delay={0.2} className="space-y-6">
                        <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-heading text-text-main mb-4">Timeline</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Open At *</label>
                                    <input
                                        type="datetime-local"
                                        {...register("open_at")}
                                        className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    {errors.open_at && <p className="text-red-500 text-xs mt-1">{errors.open_at.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Due At *</label>
                                    <input
                                        type="datetime-local"
                                        {...register("due_at")}
                                        className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    {errors.due_at && <p className="text-red-500 text-xs mt-1">{errors.due_at.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Close At *</label>
                                    <input
                                        type="datetime-local"
                                        {...register("close_at")}
                                        className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    {errors.close_at && <p className="text-red-500 text-xs mt-1">{errors.close_at.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-heading text-text-main mb-4">Grading & Rules</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Max Marks *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register("max_marks")}
                                            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g. 100"
                                        />
                                        {errors.max_marks && <p className="text-red-500 text-xs mt-1">{errors.max_marks.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">Max Attempts *</label>
                                        <input
                                            type="number"
                                            {...register("max_attempts", { valueAsNumber: true })}
                                            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        {errors.max_attempts && <p className="text-red-500 text-xs mt-1">{errors.max_attempts.message}</p>}
                                    </div>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register("allow_late_submission")}
                                            className="w-5 h-5 rounded border-border-subtle text-primary-500 focus:ring-primary-500 bg-bg-base"
                                        />
                                        <span className="text-sm text-text-main">Allow Late Submissions</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register("is_published")}
                                            className="w-5 h-5 rounded border-border-subtle text-primary-500 focus:ring-primary-500 bg-bg-base"
                                        />
                                        <span className="text-sm text-text-main">Publish immediately</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </AnimateIn>
                </div>

                {/* Form Actions */}
                <AnimateIn direction="none" delay={0.3} className="mt-8 flex justify-end gap-4 border-t border-border-subtle pt-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 rounded-lg font-medium text-text-main bg-surface hover:bg-surface-hover border border-border-subtle transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isPending ? "Saving..." : "Save Assignment"}</span>
                    </button>
                </AnimateIn>
            </form>
        </main>
    );
};

export default CreateAssignment;