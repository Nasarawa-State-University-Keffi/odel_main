import { useCurrentUser } from "@/hooks/useCurrentUser";
import WelcomeSection from "@/features/admin/components/WelcomeSection";
import StatsGrid from "@/features/admin/components/StatsGrid";
import ApplicationStatusOverview from "@/features/admin/components/ApplicationStatusOverview";
import RecentActivityList from "@/features/admin/components/RecentActivityList";
import UpcomingTasksList from "@/features/admin/components/UpcomingTasksList";
import QuickActions from "@/features/admin/components/QuickActions";

const AdminDashboard = () => {
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

    const displayName = currentUser?.fullName || currentUser?.firstName || currentUser?.username || "Admin";

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <WelcomeSection displayName={displayName} isLoading={isLoadingUser} />

            {/* Stats Grid */}
            <StatsGrid />

            {/* Application Status Summary */}
            <ApplicationStatusOverview />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity - Takes 2 columns */}
                <RecentActivityList />

                {/* Upcoming Tasks - Takes 1 column */}
                <UpcomingTasksList />
            </div>

            {/* Quick Actions */}
            <QuickActions />
        </div>
    );
};

export default AdminDashboard;
