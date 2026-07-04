import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import ApplicationLayout from "./ApplicationLayout";
import StudentDashboard from "./StudentDashboard";
import Courses from "./Course";
import CourseDetail from "./CourseDetail";

const Presentation = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route path="/application" element={<ApplicationLayout />} >
                    <Route index element={<StudentDashboard />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
                </Route>
            </Routes>
        </div>
    );
};

export default Presentation;