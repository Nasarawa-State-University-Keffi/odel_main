import { useCurrentUser } from "@/hooks/useCurrentUser";
import WelcomeSection from "@/features/admin/components/dashboard-components/WelcomeSection";
import StaffOverviewCards from "@/features/admin/components/dashboard-components/StaffOverviewCards";
import DashboardModulesOverview from "@/features/admin/components/dashboard-components/DashboardModulesOverview";

const AdminDashboard = () => {
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

    const displayName = currentUser?.fullName || currentUser?.firstName || currentUser?.username || "Admin";

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <WelcomeSection displayName={displayName} isLoading={isLoadingUser} />

            {/* Modules Overview */}
            <DashboardModulesOverview />

            {/* Staff Overview Stats */}
            <StaffOverviewCards />

        </div>
    );
};

export default AdminDashboard;
