import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, GraduationCap, ShieldCheck } from "lucide-react";

import { useUserContext } from "@/context/UserProvider";
import { AnimateIn } from "@/components/ui/animate-in";
import { ROLES } from "@/types/user.types";

const CentralDashboard = () => {
    const { user, isLoading } = useUserContext();
    const navigate = useNavigate();

    const [loadingText, setLoadingText] = useState("Verifying session...");

    useEffect(() => {
        const messages = [
            "Verifying session...",
            "Authenticating credentials...",
            "Securing workspace...",
            "Loading your dashboard..."
        ];
        let tick = 0;
        const interval = setInterval(() => {
            tick = (tick + 1) % messages.length;
            setLoadingText(messages[tick]);
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isLoading) {

            if (!user) {
                navigate("/", { replace: true });
                return;
            }

            const isAdmin = user.roles?.includes(ROLES.ADMIN);
            const isStaff = user.roles?.includes(ROLES.STAFF);

            let targetRoute = "/student";
            if (isAdmin) {
                targetRoute = "/admin/dashboard";
            } else if (isStaff) {
                targetRoute = "/staff/dashboard";
            }


            navigate(targetRoute, { replace: true });
        }
    }, [isLoading, user, navigate]);

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0f172a]">

            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary-500/10 dark:bg-secondary-500/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Central Glass Card */}
            <AnimateIn direction="up" delay={0.1} className="relative z-10 w-full max-w-md p-6 sm:p-10">
                <div className="flex flex-col items-center justify-center rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-10 text-center shadow-2xl shadow-primary-900/5 backdrop-blur-xl transition-all">

                    {/* Animated Logo Container */}
                    <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary-100 dark:bg-primary-900/30 opacity-75 duration-1000" />
                        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30">
                            <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                    </div>

                    <h1 className="font-heading mb-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        LMS Portal
                    </h1>

                    <div className="mb-8 flex h-6 items-center justify-center overflow-hidden">
                        <p className="animate-pulse text-sm font-medium text-slate-500 dark:text-slate-400">
                            {loadingText}
                        </p>
                    </div>

                    {/* Security Badge */}
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary-100 bg-secondary-50 p-3 text-xs font-medium text-secondary-600 dark:border-secondary-900/30 dark:bg-secondary-900/10 dark:text-secondary-500">
                        <ShieldCheck className="h-4 w-4" />
                        End-to-End Encrypted Session
                    </div>
                </div>
            </AnimateIn>

            {/* Bottom Loader */}
            <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Nasarawa State University, Keffi
                </span>
            </div>
        </div>
    );
};

export default CentralDashboard;