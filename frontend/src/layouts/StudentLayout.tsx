import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from "@/features/student/components/layout/StudentSidebar";
import StudentHeader from "@/features/student/components/layout/StudentHeader";

const StudentLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex fixed inset-0 w-full bg-background overflow-hidden">
            <StudentSidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <StudentHeader
                    onMenuClick={() => setSidebarOpen(true)}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    isCollapsed={sidebarCollapsed}
                />

                <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-muted/30">
                    <div className="p-6 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
