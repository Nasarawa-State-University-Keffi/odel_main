import FacultyList from "@/features/admin/components/faculties/FacultyList";
import { Building2 } from "lucide-react";

const FacultyManagement = () => {
    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                <div className="space-y-3">
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        FACULTY <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl animate-in slide-in-from-left-10 duration-1000">
                        Manage and monitor academic faculties, specialized configurations, and inter-departmental structures within the ODEL system.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <FacultyList />
        </div>
    );
};

export default FacultyManagement;
