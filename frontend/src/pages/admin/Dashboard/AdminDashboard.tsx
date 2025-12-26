import { useCurrentUser } from "@/hooks/useCurrentUser";
import WelcomeSection from "@/features/admin/components/dashboard-components/WelcomeSection";
import StatsGrid from "@/features/admin/components/dashboard-components/StatsGrid";
import ActiveSessionAdmissionStats from "@/features/admin/components/dashboard-components/ActiveSessionAdmissionStats";
import RecentActivityList from "@/features/admin/components/dashboard-components/RecentActivityList";
import UpcomingTasksList from "@/features/admin/components/dashboard-components/UpcomingTasksList";
import QuickActions from "@/features/admin/components/dashboard-components/QuickActions";
import StaffOverviewCards from "@/features/admin/components/dashboard-components/StaffOverviewCards";
import RecentStaffOverview from "@/features/admin/components/dashboard-components/RecentStaffOverview";

const AdminDashboard = () => {
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

    const displayName = currentUser?.fullName || currentUser?.firstName || currentUser?.username || "Admin";

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <WelcomeSection displayName={displayName} isLoading={isLoadingUser} />

            {/* Staff Overview Stats */}
            <StaffOverviewCards />

            {/* Active Session Admission Stats */}
            <ActiveSessionAdmissionStats />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Recent Activity - Takes 4 columns */}
                <div className="lg:col-span-4">
                    <RecentActivityList />
                </div>

                {/* Recent Staff - Takes 3 columns */}
                <div className="lg:col-span-3">
                    <RecentStaffOverview />
                </div>
            </div>

            {/* Upcoming Tasks - Full width for now, or could be grid */}
            <div className="grid gap-6 lg:grid-cols-1">
                <UpcomingTasksList />
            </div>

            {/* Quick Actions */}
            <QuickActions />
        </div>
    );
};

export default AdminDashboard;
