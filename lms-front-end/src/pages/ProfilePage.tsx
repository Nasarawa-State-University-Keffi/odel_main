import { useUserContext } from "@/context/UserProvider";
import { AnimateIn } from "@/components/ui/animate-in";
import {
    User,
    Mail,
    Fingerprint,
    Activity,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";

const ProfilePage = () => {
    const { user, isLoading } = useUserContext();

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-lg shadow-emerald-500/20" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="mx-auto max-w-5xl space-y-8">

                {/* PAGE HEADER */}
                <AnimateIn direction="down" delay={0.1}>
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
                            Account Profile
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage your personal details, academic identification, and security preferences.
                        </p>
                    </div>
                </AnimateIn>

                {/* PROFILE & ACCOUNT STATUS GRID */}
                <div className="grid gap-6 md:grid-cols-3">

                    {/* Main Identity Card */}
                    <AnimateIn direction="up" delay={0.2} className="md:col-span-2">
                        <div className="h-full rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <User className="h-5 w-5" />
                                </div>
                                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">
                                    Student Profile
                                </h3>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                                        Full Name
                                    </label>
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{user?.full_name}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                                        Student ID / Username
                                    </label>
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3">
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-bold">{user?.username}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                                        School Email Address
                                    </label>
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{user?.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimateIn>

                    {/* Account Status Card */}
                    <AnimateIn direction="up" delay={0.3}>
                        <div className="h-full rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">
                                    Account Status
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-950/50 p-3.5">
                                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                                        <Fingerprint className="h-4 w-4 text-slate-400" />
                                        <span>Reference ID</span>
                                    </div>
                                    <span className="font-mono text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-200 shadow-sm">
                                        {user?.external_id || "N/A"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-950/50 p-3.5">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Access Level</span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${user?.is_active
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                        : "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                        }`}>
                                        {user?.is_active && <CheckCircle2 className="h-3.5 w-3.5" />}
                                        {user?.is_active ? "Active" : "Suspended"}
                                    </span>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                                        Account Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {user?.roles?.map((role) => (
                                            <span
                                                key={role}
                                                className="rounded-lg border border-emerald-200/60 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm capitalize"
                                            >
                                                {role.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimateIn>
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;