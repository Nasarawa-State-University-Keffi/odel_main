import { useUserContext } from "@/context/UserProvider";
import { AnimateIn } from "@/components/ui/animate-in";
import {
  Shield,
  User,
  Mail,
  Fingerprint,
  RefreshCw,
  Activity,
  Clock,
  LayoutDashboard,
  LogOut,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useAuth } from "@/service/useAuth";
import { useStaffDashboard } from "@/service/useStaffDashboard";
import { useEffect } from "react";
import { useProgrammeType } from "@/service/useProgrammeType";
import { useAdminDashboard } from "@/service/useAdminDashboard";

const AdminDashboard = () => {
  const { user, isLoading } = useUserContext();
  const { handleLogout, isPending } = useAuth()
  const {fetchProgrammeType, isPending: isProgrammeTypePending} = useProgrammeType()
  const {fetchStaffData, isPending: isStaffPending} = useStaffDashboard()
  const {syncAll} = useAdminDashboard()

  useEffect(() => {
  if(user?.external_id){
    //syncAll()
   //fetchProgrammeType()
   fetchStaffData(user.external_id)
  }
  }, [])


  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent shadow-lg shadow-primary-500/20" />
      </div>
    );
  }

  const formattedSyncTime = user?.last_synced_at
    ? new Date(user.last_synced_at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "Never";

  return (
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* TOP BAR / NAVIGATION HEADER */}
        <AnimateIn direction="down" delay={0.1}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-50">Administrative Terminal</h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Control Center & System Governance</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isPending}
              className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all shadow-sm ${isPending
                ? "border-red-200/50 bg-red-50/50 text-red-400 cursor-not-allowed dark:border-red-900/10 dark:bg-red-500/5 dark:text-red-500/50"
                : "border-red-200 bg-red-50 text-red-600 hover:border-transparent hover:bg-red-600 hover:text-white dark:border-red-900/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="animate-pulse">Terminating...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span>Terminate Session</span>
                </>
              )}

              {/* Subtle background loading sweep effect */}
              {isPending && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent" />
              )}
            </button>
          </div>
        </AnimateIn>

        {/* HERO WELCOME BANNER */}
        <AnimateIn direction="up" delay={0.2}>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-600 via-primary-700 to-indigo-900 p-8 sm:p-10 text-white shadow-xl shadow-primary-900/20 dark:shadow-none border border-primary-500/20">
            {/* Structural Vector Accents */}
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay" />
            <div className="absolute -bottom-20 right-40 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl mix-blend-overlay" />

            <div className="relative z-10 space-y-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md shadow-sm">
                <Shield className="h-3.5 w-3.5 text-emerald-300" />
                Root Administrative Privileges Active
              </span>
              <div className="space-y-2 max-w-2xl">
                <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-linear-to-r from-white to-primary-100">
                  Welcome back, {user?.first_name || "Administrator"}
                </h2>
                <p className="text-sm sm:text-base text-primary-100/90 leading-relaxed">
                  System core status is optimal. You possess complete access metrics for directories, automated integrations, and database endpoints.
                </p>
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* PROFILE METRICS GRID */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Main Account Identity Card */}
          <AnimateIn direction="up" delay={0.3} className="md:col-span-2">
            <div className="h-full rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Identity Parameters
                </h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                    Legal Full Name
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3 shadow-inner shadow-slate-100 dark:shadow-none">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{user?.full_name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                    System Alias (Username)
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3 shadow-inner shadow-slate-100 dark:shadow-none">
                    <span className="font-mono text-primary-600 dark:text-primary-400 text-sm font-bold">{user?.username}</span>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                    Institutional Electronic Mail
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3 shadow-inner shadow-slate-100 dark:shadow-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimateIn>

          {/* System Access & Security State */}
          <AnimateIn direction="up" delay={0.4}>
            <div className="h-full rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Security Mandate
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-950/50 p-3.5 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Fingerprint className="h-4 w-4 text-slate-400" />
                    <span>External Ref ID</span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-200 shadow-sm">
                    {user?.external_id}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-950/50 p-3.5 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Account Status</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${user?.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                    : "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                    }`}>
                    {user?.is_active && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {user?.is_active ? "Operational" : "Deactivated"}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                    Assigned Security Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles?.map((role) => (
                      <span
                        key={role}
                        className="rounded-lg border border-primary-200/60 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300 shadow-sm"
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

        {/* METRIC UPDATES FOOTER BANNER */}
        <AnimateIn direction="up" delay={0.5}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary-500" />
              <span>Session Initialized Securely</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <RefreshCw className="h-3.5 w-3.5 text-teal-500" />
              <span>Central Directory Sync: <strong className="text-slate-700 dark:text-slate-300">{formattedSyncTime}</strong></span>
            </div>
          </div>
        </AnimateIn>

      </div>
    </div>
  );
};

export default AdminDashboard;