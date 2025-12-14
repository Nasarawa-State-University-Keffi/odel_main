import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/loader';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string[];
    requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({
    children,
    requiredRoles = ['ADMIN', 'SUPER_ADMIN'],
    requireSuperAdmin = false
}: ProtectedRouteProps) => {
    const { isAuthenticated, hasAnyRole, isSuperAdmin, checkAuth, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    // Check if user is authenticated
    if (!checkAuth()) {
        // Not authenticated, redirect to the admin login
        return <Navigate to="/api/auth/admin/login" replace />;
    }

    // If super admin is required
    if (requireSuperAdmin && !isSuperAdmin) {
        // User is not super admin, show access denied or redirect
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8 bg-card rounded-xl border shadow-lg max-w-md">
                    <div className="text-6xl">🚫</div>
                    <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                    <p className="text-muted-foreground">
                        This area requires Super Admin privileges.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="text-primary hover:underline"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Check if user has required roles
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        // User doesn't have required role
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8 bg-card rounded-xl border shadow-lg max-w-md">
                    <div className="text-6xl">🚫</div>
                    <h1 className="text-2xl font-bold text-destructive">Insufficient Permissions</h1>
                    <p className="text-muted-foreground">
                        You don't have the required permissions to access this page.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="text-primary hover:underline"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    // If loading state is needed
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    // User is authenticated and has required permissions
    return <>{children}</>;
};
