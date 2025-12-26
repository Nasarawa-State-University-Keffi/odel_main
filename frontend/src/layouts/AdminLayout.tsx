import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/features/admin/components/dashboard-components/Sidebar";
import AdminHeader from "@/features/admin/components/dashboard-components/AdminHeader";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex fixed inset-0 w-full bg-background overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <AdminHeader
                    onMenuClick={() => setSidebarOpen(true)}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    isCollapsed={sidebarCollapsed}
                />

                <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
