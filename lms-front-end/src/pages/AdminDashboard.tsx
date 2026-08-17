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
  Loader2,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/service/useAuth";
import { useStaffDashboard } from "@/service/useStaffDashboard";
import { useEffect, useState } from "react";
import { useAdminDashboard } from "@/service/useAdminDashboard";
import { useAcademicSetup } from "@/service/useAcademicSetup";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const { user, isLoading } = useUserContext();
  const { handleLogout, isPending } = useAuth();
  const { fetchStaffData} = useStaffDashboard();
  const { syncAll, isLoading: isLoadingSync } = useAdminDashboard();

  // Academic setup hook
  const {
    fetchSemester,
    fetchSession,
    semester,
    session,
    isPending: isAcademicPending
  } = useAcademicSetup();

  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Local state for term selection
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [isTermSelected, setIsTermSelected] = useState<boolean>(false);
  const [isSetupPending, setIsSetupPending] = useState<boolean>(false);

  // Fetch session, semester, and sync on mount
  useEffect(() => {
    if (user?.external_id) {
      syncAll();
    }
    fetchSession();
    fetchSemester();
  }, [user?.external_id]);

  const handleTermSubmit = async () => {
    if (!selectedSession || !selectedSemester || !user?.external_id) return;

    setIsSetupPending(true);
    await fetchStaffData(user.external_id, selectedSession, selectedSemester);
    setIsSetupPending(false);
    setIsTermSelected(true);
  };

  const handleManualSync = async () => {
    try {
      await syncAll();
      setShowSyncSuccess(true);
      setTimeout(() => {
        setShowSyncSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Synchronization failed", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent shadow-lg shadow-primary-500/20" />
      </div>
    );
  }

  // ==========================================
  //  ACADEMIC TERM SELECTOR
  // ==========================================
  if (!isTermSelected) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 dark:bg-slate-950 px-4 py-12 transition-colors duration-200">
        <div className="w-full max-w-md sm:min-w-112.5">
          <AnimateIn direction="up">
            <Card className="w-full shadow-2xl shadow-slate-200/50 dark:shadow-none border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-primary-500/5 dark:bg-primary-500/10 p-8 flex justify-center border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <GraduationCap className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Select Academic Term
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                  Please specify the session and semester to initialize your administrative workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8 pt-2">

                {/* SESSION SELECT */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                    Academic Session
                  </label>
                  <Select
                    value={selectedSession}
                    onValueChange={(value: string | null) => setSelectedSession(value || "")}
                    disabled={isSetupPending || isAcademicPending}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder={isAcademicPending ? "Loading sessions..." : "Select a session"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(session as any)?.results?.map((s: any) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SEMESTER SELECT */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block ml-1">
                    Semester
                  </label>
                  <Select
                    value={selectedSemester}
                    onValueChange={(value: string | null) => setSelectedSemester(value || "")}
                    disabled={isSetupPending || isAcademicPending}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder={isAcademicPending ? "Loading semesters..." : "Select a semester"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(semester as any)?.results?.map((s: any) => (
                        <SelectItem key={s.id} value={s.name}>{s.name} Semester</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  onClick={handleTermSubmit}
                  disabled={!selectedSession || !selectedSemester || isSetupPending || isAcademicPending}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white transition-all shadow-md hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSetupPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initializing Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Terminal</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </CardContent>
            </Card>
          </AnimateIn>
        </div>
      </div>
    );
  }

  const formattedSyncTime = user?.last_synced_at
    ? new Date(user.last_synced_at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "Never";

  // ==========================================
  //  MAIN ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* TOP BAR / NAVIGATION HEADER */}
        <AnimateIn direction="down" delay={0.1}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-50">Administrative Terminal</h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {selectedSession} • {selectedSemester} Semester
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {/* Change Term Button */}
              <button
                onClick={() => setIsTermSelected(false)}
                className="group relative flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              >
                Change Term
              </button>

              {/* Synchronize Button */}
              <button
                onClick={handleManualSync}
                disabled={isLoadingSync}
                className={`group relative flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all shadow-sm ${isLoadingSync
                    ? "border-primary-200/50 bg-primary-50/50 text-primary-400 cursor-not-allowed dark:border-primary-900/10 dark:bg-primary-500/5 dark:text-primary-500/50"
                    : "border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800/60 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                  }`}
              >
                {isLoadingSync ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="animate-pulse">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                    <span>Synchronize</span>
                  </>
                )}
                {isLoadingSync && (
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent" />
                )}
              </button>

              {/* Terminate Session Button */}
              <button
                onClick={handleLogout}
                disabled={isPending}
                className={`group relative flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all shadow-sm ${isPending
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
                    <span>Terminate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </AnimateIn>

        {/* BEAUTIFUL SUCCESS MESSAGE BANNER */}
        {showSyncSuccess && (
          <AnimateIn direction="down" delay={0}>
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-6 py-4 text-emerald-800 shadow-sm backdrop-blur-md dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Synchronization Complete</h4>
                <p className="text-xs font-medium opacity-90">All central directories, external endpoints, and user metrics have been successfully updated.</p>
              </div>
            </div>
          </AnimateIn>
        )}

        {/* HERO WELCOME BANNER */}
        <AnimateIn direction="up" delay={0.2}>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-600 via-primary-700 to-indigo-900 p-8 sm:p-10 text-white shadow-xl shadow-primary-900/20 dark:shadow-none border border-primary-500/20">
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
              <span>Session Initialized Securely for Term: {selectedSession}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <RefreshCw className={`h-3.5 w-3.5 text-teal-500 ${isLoadingSync ? "animate-spin" : ""}`} />
              <span>Central Directory Sync: <strong className="text-slate-700 dark:text-slate-300">{formattedSyncTime}</strong></span>
            </div>
          </div>
        </AnimateIn>

      </div>
    </div>
  );
};

export default AdminDashboard;