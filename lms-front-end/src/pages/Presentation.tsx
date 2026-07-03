import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import ApplicationLayout from "./ApplicationLayout";
import StudentDashboard from "./StudentDashboard";

const Presentation = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route path="/application" element={<ApplicationLayout />} >
                    <Route index element={<StudentDashboard />} />
                </Route>
            </Routes>
        </div>
    );
};

export default Presentation;