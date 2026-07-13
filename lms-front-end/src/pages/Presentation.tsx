import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import ApplicationLayout from "./ApplicationLayout";
import StudentDashboard from "./StudentDashboard";
import Courses from "./Course";
import CourseDetail from "./CourseDetail";
import CentralDashboard from "./CentralDashboard";
import AdminDashboard from "./AdminDashboard";
import AcademicSetup from "./AcademicSetup";

const Presentation = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<CentralDashboard />} />

                <Route path="/student/dashboard" element={<ApplicationLayout />} >
                    <Route index element={<StudentDashboard />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
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
            </Routes>
        </div>
    );
};

export default Presentation;