import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ROLES } from "@/types/user.types";

// 1. Lazy load default exports
const Login = lazy(() => import("./Login"));
const ApplicationLayout = lazy(() => import("./ApplicationLayout"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const Courses = lazy(() => import("./Course"));
const CourseDetail = lazy(() => import("./CourseDetail"));
const CentralDashboard = lazy(() => import("./CentralDashboard"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const AcademicSetup = lazy(() => import("./AcademicSetup"));
const StaffDashboard = lazy(() => import("./StaffDashboard"));
const StaffAssignmentPage = lazy(() => import("./StaffAssignmentPage"));
const CreateAssignment = lazy(() => import("./CreateAssignment"));
const StaffAssessmentSubmissionsPage = lazy(() => import("./StaffAssessmentSubmissionsPage"));
const EditAssignmentPage = lazy(() => import("./EditAssignmentPage"));
const StaffQuizPage = lazy(() => import("./StaffQuizPage"));
const CreateQuizPage = lazy(() => import("./CreateQuizPage"));
const EditQuizPage = lazy(() => import("./EditQuizPage"));
const ViewQuizPage = lazy(() => import("./ViewQuizPage"));
const AddQuestionPage = lazy(() => import("./AddQuestionPage"));
const QuestionBankCategoriesPage = lazy(() => import("./QuestionBankCategoriesPage"));
const CreateQuestionBankCategoryPage = lazy(() => import("./CreateQuestionBankCategoryPage"));
const EditQuestionBankCategoryPage = lazy(() => import("./EditQuestionBankCategoryPage"));
const ViewQuestionBankCategoryPage = lazy(() => import("./ViewQuestionBankCategoryPage"));
const StaffQuestionListPage = lazy(() => import("./StaffQuestionListPage"));
const StaffCreateQuestionPage = lazy(() => import("./StaffCreateQuestionPage"));
const StaffEditQuestionPage = lazy(() => import("./StaffEditQuestionPage"));
const StudentDashboardPage = lazy(() => import("./StudentDashboardPage"));
const StudentAssignmentPage = lazy(() => import("./StudentAssignmentPage"));
const StudentAssignmentDetailPage = lazy(() => import("./StudentAssignmentDetailPage"));
const AssignmentSubmissionPage = lazy(() => import("./AssignmentSubmission"));
const StaffAssignmentSubmissionReviewPage = lazy(() => import("./StaffAssignmentSubmissionReviewPage"));
const NotFoundPage = lazy(() => import("./NotFoundPage"));
const AdminNotificationSettingsPage = lazy(() => import("./AdminNotificationSettingsPage"));
const AdminCreateNotificationSettingPage = lazy(() => import("./AdminCreateNotificationSettingPage"));
const AdminNotificationSettingDetailPage = lazy(() => import("./AdminNotificationSettingDetailPage"));
const AdminNotificationLogsPage = lazy(() => import("./AdminNotificationLogsPage"));

// 2. Lazy load named exports using .then()
const LearningContentPage = lazy(() => import("./LearningContentPage").then(mod => ({ default: mod.LearningContentPage })));
const StaffContentUploadPage = lazy(() => import("./StaffContentUploadPage").then(mod => ({ default: mod.StaffContentUploadPage })));
const AdminStorageSettingsPage = lazy(() => import("./AdminStorageSettingsPage").then(mod => ({ default: mod.AdminStorageSettingsPage })));
const AdminCreateStorageSettingPage = lazy(() => import("./AdminCreateStorageSettingPage").then(mod => ({ default: mod.AdminCreateStorageSettingPage })));


/**
 * 1. Chunk Loading Error Boundary Component
 */
class ChunkErrorBoundary extends React.Component<React.PropsWithChildren<{}>> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Chunk loading error caught:", error, errorInfo);
        if (error?.message?.includes("Failed to fetch dynamically imported module") || error?.message?.includes("Loading chunk")) {
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
                    <div className="max-w-md space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-50">Application Update Detected</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            A fresh version of this application is available. Please reload the page to apply changes.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-all"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}


const PageSkeletonLoader = () => (
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2">
                        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
                <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-48 w-full rounded-3xl bg-slate-200 dark:bg-slate-800 shadow-sm" />
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 shadow-sm" />
                <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 shadow-sm" />
            </div>
        </div>
    </div>
);




const Presentation = () => {
    return (
        <div>
            <ChunkErrorBoundary>
                <Suspense fallback={<PageSkeletonLoader />}>
                    <Routes>
                        {/* Public / Auth Routes */}
                        <Route path="/" element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<CentralDashboard />} />

                        {/* Application Layout Wrapper */}
                        <Route element={<ApplicationLayout />}>


                            {/* Student Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
                                <Route path="/student">
                                    <Route index element={<StudentDashboardPage />} />
                                    <Route path="courses" element={<Courses />} />
                                    <Route path="courses/:id" element={<CourseDetail />} />
                                    <Route path="assignments" element={<StudentAssignmentPage />} />
                                    <Route path="assignments/:id" element={<StudentAssignmentDetailPage />} />
                                    <Route path="assignments/:id/submit" element={<AssignmentSubmissionPage />} />
                                </Route>
                            </Route>

                            {/* Shared Profile & Content Routes */}
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/learning-content" element={<LearningContentPage />} />

                            {/* Admin Dashboard */}
                            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                                <Route path="/admin/dashboard">
                                    <Route index element={<AdminDashboard />} />
                                    <Route path="academic-setup" element={<AcademicSetup />} />
                                    <Route path="courses" element={<Courses />} />
                                    <Route path="courses/:id" element={<CourseDetail />} />
                                    <Route path="storage-settings" element={<AdminStorageSettingsPage />} />
                                    <Route path="storage-settings/create" element={<AdminCreateStorageSettingPage />} />
                                    <Route path="notifications/settings" element={<AdminNotificationSettingsPage />} />
                                    <Route path="notifications/settings/create" element={<AdminCreateNotificationSettingPage />} />
                                    <Route path="notifications/settings/:id" element={<AdminNotificationSettingDetailPage />} />
                                    <Route path="notifications/logs" element={<AdminNotificationLogsPage />} />
                                </Route>
                            </Route>

                            {/* Staff Dashboard */}
                            <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF]} />}>
                                <Route path="/staff/dashboard">
                                    <Route index element={<StaffDashboard />} />
                                    <Route path="assignments" element={<StaffAssignmentPage />} />
                                    <Route path="assignments/create" element={<CreateAssignment />} />
                                    <Route path="assignments/edit/:id" element={<EditAssignmentPage />} />
                                    <Route path="assessment-submissions/submissions" element={<StaffAssessmentSubmissionsPage />} />
                                    <Route path="assessment-submissions/submissions/:id" element={<StaffAssignmentSubmissionReviewPage />} />

                                    {/* Quizzes */}
                                    <Route path="quizzes" element={<StaffQuizPage />} />
                                    <Route path="quizzes/create" element={<CreateQuizPage />} />
                                    <Route path="quizzes/edit/:id" element={<EditQuizPage />} />
                                    <Route path="quizzes/view/:id" element={<ViewQuizPage />} />
                                    <Route path="quizzes/questions/create/:id" element={<AddQuestionPage />} />

                                    {/* Courses */}
                                    <Route path="courses" element={<Courses />} />
                                    <Route path="courses/:id" element={<CourseDetail />} />

                                    {/* Question Bank */}
                                    <Route path="question-bank/categories" element={<QuestionBankCategoriesPage />} />
                                    <Route path="question-bank/categories/create" element={<CreateQuestionBankCategoryPage />} />
                                    <Route path="question-bank/categories/edit/:id" element={<EditQuestionBankCategoryPage />} />
                                    <Route path="question-bank/categories/view/:id" element={<ViewQuestionBankCategoryPage />} />
                                    <Route path="question-bank/questions" element={<StaffQuestionListPage />} />
                                    <Route path="question-bank/questions/create" element={<StaffCreateQuestionPage />} />
                                    <Route path="question-bank/questions/edit/:id" element={<StaffEditQuestionPage />} />

                                    {/* Content */}
                                    <Route path="content/upload" element={<StaffContentUploadPage />} />
                                </Route>
                            </Route>


                        </Route>

                        {/* 404 Fallback Catch-all Route */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </ChunkErrorBoundary>
        </div>
    );
};

export default Presentation;