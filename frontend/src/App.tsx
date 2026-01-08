import { Toaster } from "@/features/admin/components/admission/components/ui/toaster";
import { Toaster as Sonner } from "@/features/admin/components/admission/components/ui/sonner";
import { TooltipProvider } from "@/features/admin/components/admission/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader } from "./features/admin/components/admission/components/ui/loader";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./features/admin/components/admission/components/auth/ProtectedRoute";


// GENERAL
const Index = lazy(() => import("./pages/General/Index"));
const NotFound = lazy(() => import("./pages/General/NotFound"));

// AUTH
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const MFAVerification = lazy(() => import("./pages/Auth/MFAVerification"));

// STUDENT
const Application = lazy(() => import("./pages/student/Application"));
const Dashboard = lazy(() => import("./pages/student/Dashboard"));
const DataCorrection = lazy(() => import("./pages/student/DataCorrection"));

// ADMIN
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard/AdminDashboard"));
const AdminStaffs = lazy(() => import("./pages/admin/Staffs/Staffs"));
const AdminStudents = lazy(() => import("./pages/admin/Students/StudentsPage"));
const AdminCourseRegistration = lazy(() => import("./pages/admin/CourseRegistration/CourseRegistrationPage"));
const AdminCourses = lazy(() => import("./pages/admin/Courses/CoursesPage"));
const AdminDepartments = lazy(() => import("./pages/admin/Departments/DepartmentManagement"));
const AdminFaculties = lazy(() => import("./pages/admin/Faculties/FacultyManagement"));
const AdminGrades = lazy(() => import("./pages/admin/Grades/GradeManagement"));
const AdminLevels = lazy(() => import("./features/admin/components/levels/LevelList"));
const AdminModeOfEntries = lazy(() => import("./features/admin/components/mode-of-entry/ModeOfEntryList"));
const AdminProgrammes = lazy(() => import("./features/admin/components/programmes/ProgrammeList"));
const AdminProgrammeTypes = lazy(() => import("./features/admin/components/programmeType/ProgrammeTypeManagement"));
const AdminProgrammeSettings = lazy(() => import("./pages/admin/ProgrammeSettings/AdminProgrammeSettings"));
const AdminSchools = lazy(() => import("./features/admin/components/school/SchoolManagement"));
const AdminSessions = lazy(() => import("./features/admin/components/session/SessionManagement"));
const AdminAdmissionManagement = lazy(() => import("./pages/admin/Admission/AdmissionManagement"));


const queryClient = new QueryClient();

import OfflineBanner from "./features/admin/components/admission/components/OfflineBanner";

import { OnlineStatusProvider } from "./contexts/OnlineStatusContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OnlineStatusProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<Loader fullscreen size="lg" text="Getting Ready..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/api/auth/login" element={<Login />} />
                <Route path="/api/auth/register" element={<Register />} />
                <Route path="/api/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/application" element={<Application />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/data-correction" element={<DataCorrection />} />

                {/* Admin Login (not protected) */}
                <Route path="/api/auth/login" element={<Login />} />
                <Route path="/api/auth/admin/verify-mfa" element={<MFAVerification />} />

                {/* Protected Admin Routes */}
                <Route
                  path="/api/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="staffs" element={<AdminStaffs />} />
                  <Route path="students" element={<AdminStudents />} />

                  <Route
                    path="course-registration"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminCourseRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="courses"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminCourses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="departments"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminDepartments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="faculties"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminFaculties />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="grades"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminGrades />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="levels"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER']}>
                        <AdminLevels />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="programmes"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER']}>
                        <AdminProgrammes />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="programme-types"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER']}>
                        <AdminProgrammeTypes />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="programme-settings"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER']}>
                        <AdminProgrammeSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="schools"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminSchools />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="sessions"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminSessions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="mode-of-entries"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER']}>
                        <AdminModeOfEntries />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="admissions"
                    element={
                      <ProtectedRoute requiredRoles={['ADMISSION_OFFICER', 'ADMIN', 'SUPER_ADMIN']}>
                        <AdminAdmissionManagement />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </OnlineStatusProvider>
  </QueryClientProvider >
);

export default App;
