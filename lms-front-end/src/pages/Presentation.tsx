import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import ApplicationLayout from "./ApplicationLayout";
import ProfilePage from "./ProfilePage";
import Courses from "./Course";
import CourseDetail from "./CourseDetail";
import CentralDashboard from "./CentralDashboard";
import AdminDashboard from "./AdminDashboard";
import AcademicSetup from "./AcademicSetup";
import StaffDashboard from "./StaffDashboard";
import StaffAssignmentPage from "./StaffAssignmentPage";
import CreateAssignment from "./CreateAssignment";
import StaffAssessmentSubmissionsPage from "./StaffAssessmentSubmissionsPage";
import EditAssignmentPage from "./EditAssignmentPage";
import StaffQuizPage from "./StaffQuizPage";
import CreateQuizPage from "./CreateQuizPage";
import EditQuizPage from "./EditQuizPage";
import ViewQuizPage from "./ViewQuizPage";
import AddQuestionPage from "./AddQuestionPage";
import QuestionBankCategoriesPage from "./QuestionBankCategoriesPage";
import CreateQuestionBankCategoryPage from "./CreateQuestionBankCategoryPage";
import EditQuestionBankCategoryPage from "./EditQuestionBankCategoryPage";
import ViewQuestionBankCategoryPage from "./ViewQuestionBankCategoryPage";
import StaffQuestionListPage from "./StaffQuestionListPage";
import StaffCreateQuestionPage from "./StaffCreateQuestionPage";
import StaffEditQuestionPage from "./StaffEditQuestionPage";
import StudentDashboardPage from "./StudentDashboardPage";
import StudentAssignmentPage from "./StudentAssignmentPage";
import StudentAssignmentDetailPage from "./StudentAssignmentDetailPage";
import AssignmentSubmissionPage from "./AssignmentSubmission";
import StaffAssignmentSubmissionReviewPage from "./StaffAssignmentSubmissionReviewPage";

const Presentation = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<CentralDashboard />} />

                <Route path="/student" element={<ApplicationLayout />} >
                    <Route index element={<StudentDashboardPage />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="dashboard" element={<StudentDashboardPage />} />
                    <Route path="assignments" element={<StudentAssignmentPage />} />
                    <Route path="assignments/:id" element={<StudentAssignmentDetailPage />} />
                    <Route path="assignments/:id/submit" element={<AssignmentSubmissionPage />} />

                </Route>
                <Route path="/profile" element={<ApplicationLayout />} >
                    <Route index element={<ProfilePage />} />
                </Route>


                /**
                * Admin Dashboard
                */

                <Route path="/admin/dashboard" element={<ApplicationLayout />} >
                    <Route index element={<AdminDashboard />} />
                    <Route path="academic-setup" element={<AcademicSetup />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                </Route>

                /**
                * Staff Dashboard
                */

                <Route path="/staff/dashboard" element={<ApplicationLayout />} >
                    <Route index element={<AdminDashboard />} />
                    <Route path="assignments" element={<StaffAssignmentPage />} />
                    <Route path="assignments/create" element={<CreateAssignment />} />
                    <Route path="assignments/edit/:id" element={<EditAssignmentPage />} />
                    <Route path="assessment-submissions/submissions" element={<StaffAssessmentSubmissionsPage />} />
                    <Route path="assessment-submissions/submissions/:id" element={<StaffAssignmentSubmissionReviewPage />} />
                    <Route path="quizzes" element={<StaffQuizPage />} />
                    <Route path="quizzes/create" element={<CreateQuizPage />} />
                    <Route path="quizzes/edit/:id" element={<EditQuizPage />} />
                    <Route path="quizzes/view/:id" element={<ViewQuizPage />} />
                    <Route path="quizzes/questions/create/:id" element={<AddQuestionPage />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="dashboard" element={<StaffDashboard />} />

                    <Route path="question-bank/categories" element={<QuestionBankCategoriesPage />} />
                    <Route path="question-bank/categories/create" element={<CreateQuestionBankCategoryPage />} />
                    <Route path="question-bank/categories/edit/:id" element={<EditQuestionBankCategoryPage />} />
                    <Route path="question-bank/categories/view/:id" element={<ViewQuestionBankCategoryPage />} />
                    <Route path="question-bank/questions" element={<StaffQuestionListPage />} />
                    <Route path="question-bank/questions/create" element={<StaffCreateQuestionPage />} />
                    <Route path="question-bank/questions/edit/:id" element={<StaffEditQuestionPage />} />
                </Route>
            </Routes>
        </div>
    );
};

export default Presentation;