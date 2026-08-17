import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUserContext } from "@/context/UserProvider";
import { AlertCircle } from "lucide-react";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, isLoading } = useUserContext();

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent shadow-lg shadow-primary-500/20" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Check role-based permissions if roles are specified
    if (allowedRoles && allowedRoles.length > 0) {
        const hasRequiredRole = user.roles?.some((role: string) => allowedRoles.includes(role));

        if (!hasRequiredRole) {
            return (
                <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 px-4 text-center">
                    <div className="max-w-md space-y-6 rounded-3xl border border-red-200/60 dark:border-red-900/50 bg-white dark:bg-slate-900 p-8 shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">Access Denied</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                You do not possess the necessary institutional privileges or security mandate to view this portal sector.
                            </p>
                        </div>
                        <Navigate to="/login" replace />
                    </div>
                </div>
            );
        }
    }

    return <Outlet />;
};