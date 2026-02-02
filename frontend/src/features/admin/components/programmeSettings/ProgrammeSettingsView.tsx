import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { programmeSettingsService } from "../../services/programmeSettingsService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/admin/components/admission/components/ui/tabs";
import { Card, CardContent } from "@/features/admin/components/admission/components/ui/card";
import { programmeService } from "../../services/programmeService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { levelService } from "../../services/levelService";
import { staffService } from "@/features/admin/services/staffService";
import { admissionService } from "@/features/admin/services/admissionService";
import { sessionService } from "@/features/admin/services/sessionService";
import { courseService } from "@/features/admin/services/courseService";
import { Loader2, Settings, Filter, AlertCircle, Book, TrendingDown, Layers, Target, Settings2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/features/admin/components/admission/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/features/admin/components/admission/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";

// Refactored Components
import ConfigurationFilters from "./ConfigurationFilters";
import ParameterCard from "./ParameterCard";
import CourseCategorySection from "./CourseCategorySection";
import EditSemesterSettingsModal from "./EditSemesterSettingsModal";
import AcademicSummaryCard from "./AcademicSummaryCard";
import AvailableCoursesSection from "./AvailableCoursesSection";

const ProgrammeSettingsView = () => {
    const { hasAnyRole, hasRole } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [showAvailableCourses, setShowAvailableCourses] = useState<boolean>(false);
    const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);

    // Fetch Programme Types for ODEL filtering
    const { data: programmeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    // Set default ODEL programme type when loaded
    useEffect(() => {
        if (programmeTypes && programmeTypes.length > 0 && !selectedProgrammeType) {
            const odelTypes = programmeTypes.filter((pt: any) =>
                pt.name.toLowerCase().includes('odel') ||
                pt.modeOfStudy?.toLowerCase().includes('distance') ||
                pt.school?.shortName?.toLowerCase().includes('odel')
            );

            if (odelTypes.length > 0) {
                setSelectedProgrammeType(odelTypes[0].id.toString());
            } else {
                setSelectedProgrammeType(programmeTypes[0].id.toString());
            }
        }
    }, [programmeTypes, selectedProgrammeType]);

    // Fetch Programmes based on selected type
    const { data: programmes } = useQuery({
        queryKey: ["programmes-by-type", selectedProgrammeType],
        queryFn: () => programmeService.getAllProgrammes(Number(selectedProgrammeType)),
        enabled: !!selectedProgrammeType
    });

    const refetchSettings = () => {
        queryClient.invalidateQueries({ queryKey: ["programme-settings"] });
    };

    const syncMutation = useMutation({
        mutationFn: (semesterId: number) => programmeSettingsService.syncOptionalSemester(semesterId),
        onSuccess: () => {
            toast({
                title: "Synchronization Complete",
                description: "Courses have been synchronized from the main semester.",
            });
            setIsSyncDialogOpen(false);
            refetchSettings();
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Synchronization Failed",
                description: error?.response?.data?.message || "Failed to sync optional semester.",
            });
            setIsSyncDialogOpen(false);
        }
    });

    const handleSync = () => {
        console.log("Handle Sync called. Selected Semester:", selectedSemester);
        if (selectedSemester) {
            syncMutation.mutate(Number(selectedSemester));
        }
    };

    const downloadReportMutation = useMutation({
        mutationFn: ({ semesterId, programmeId }: { semesterId: number, programmeId: number }) =>
            programmeSettingsService.downloadCourseReport(semesterId, 'programme', programmeId),
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `courses_report_prog_${selectedProgramme}_sem_${selectedSemester}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast({
                title: "Report Downloaded",
                description: "Course report has been downloaded successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: error?.response?.data?.message || "Failed to download course report.",
            });
        }
    });

    const handleDownloadReport = () => {
        if (selectedSemester && selectedProgramme) {
            downloadReportMutation.mutate({
                semesterId: Number(selectedSemester),
                programmeId: Number(selectedProgramme)
            });
        }
    };

    // Fetch Levels based on selected type
    const { data: levels } = useQuery({
        queryKey: ["levels-by-type", selectedProgrammeType],
        queryFn: () => levelService.getAllLevels(Number(selectedProgrammeType)),
        enabled: !!selectedProgrammeType
    });

    // Fetch Sessions (needed for semesters)
    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    // Fetch Semesters based on session
    const { data: semesters = [] } = useQuery({
        queryKey: ["semesters", selectedSession],
        queryFn: () => sessionService.getSemestersBySession(Number(selectedSession)),
        enabled: !!selectedSession
    });

    // Set default session if available
    useEffect(() => {
        if (sessions && sessions.length > 0 && !selectedSession) {
            const activeSession = sessions.find(s => s.isActive) || sessions[0];
            setSelectedSession(activeSession.id.toString());
        }
    }, [sessions]);

    // Fetch Settings
    const { data: settings, isPending: isLoadingSettings, error: settingsError } = useQuery({
        queryKey: ["programme-settings", selectedProgramme, selectedLevel, selectedSemester],
        queryFn: () => programmeSettingsService.fetchProgrammeSettings({
            programme: Number(selectedProgramme),
            level: Number(selectedLevel),
            semester: Number(selectedSemester)
        }),
        enabled: !!selectedProgramme && !!selectedLevel && !!selectedSemester
    });

    const isFilterIncomplete = !selectedProgramme || !selectedLevel || !selectedSemester;

    return (
        <div className="flex flex-col space-y-6 p-4 md:p-8 w-full bg-slate-50/50">
            {/* Header Area */}
            <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        PROGRAMMES <span className="text-primary">SETTINGS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-lg">
                        Configure course requirements and semester parameters.
                    </p>
                </motion.div>

                {/* Session Choice */}
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-border/50 flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-primary/10 rounded-xl">
                            <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider">Session</span>
                        </div>
                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="bg-transparent border-0 focus:ring-0 font-bold text-xs md:text-sm px-4 outline-none"
                        >
                            {sessions?.map(s => (
                                <option key={s.id} value={s.id.toString()}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Filter Card Component */}
            <ConfigurationFilters
                selectedProgramme={selectedProgramme}
                setSelectedProgramme={setSelectedProgramme}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                programmes={programmes}
                levels={levels}
                semesters={semesters}
                showAvailableCourses={showAvailableCourses}
                setShowAvailableCourses={setShowAvailableCourses}
            />

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {isFilterIncomplete ? (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center p-12 bg-white/40 rounded-3xl border-2 border-dashed border-slate-200 min-h-[400px]"
                    >
                        <div className="bg-primary/5 p-6 rounded-full mb-6 text-center">
                            <Filter className="h-12 w-12 text-primary/30 mx-auto" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Configuration View</h3>
                        <p className="text-muted-foreground text-center mt-2 max-w-sm font-medium">
                            Select a programme, level, and semester to view the academic configuration.
                        </p>
                    </motion.div>
                ) : isLoadingSettings ? (
                    <motion.div
                        key="loading"
                        className="flex flex-col items-center justify-center p-12 min-h-[400px]"
                    >
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="mt-4 font-bold text-slate-600 animate-pulse uppercase tracking-widest text-xs">Loading Settings...</p>
                    </motion.div>
                ) : settingsError ? (
                    <motion.div key="error" className="w-full">
                        <Alert variant="destructive" className="rounded-3xl border-2 shadow-lg">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle className="text-lg font-black tracking-tight">Request Failed</AlertTitle>
                            <AlertDescription className="font-medium mt-1">
                                {(() => {
                                    const error = settingsError as any;
                                    const status = error?.response?.status;
                                    const message = error?.response?.data?.message || error?.response?.data;

                                    if (status === 400) {
                                        if (message?.toLowerCase().includes("level")) return "The selected Level could not be found.";
                                        if (message?.toLowerCase().includes("programme")) return "The selected Programme could not be found.";
                                        return message || "Invalid request parameters.";
                                    }
                                    if (status === 404) return "The selected Semester could not be found.";
                                    if (status === 403) return "Access denied. You do not have permission to view these settings.";

                                    return message || error?.message || "An unexpected error occurred.";
                                })()}
                            </AlertDescription>
                            <Button variant="outline" className="mt-4 bg-white/20 border-white/40 font-bold" onClick={() => refetchSettings()}>
                                Retry Request
                            </Button>
                        </Alert>
                    </motion.div>
                ) : showAvailableCourses ? (
                    <motion.div
                        key="available-courses"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <AvailableCoursesSection
                            selectedProgramme={selectedProgramme}
                            selectedLevel={selectedLevel}
                            selectedSemester={selectedSemester}
                            selectedProgrammeType={selectedProgrammeType}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8 pb-12"
                    >
                        {/* Semester Parameters Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ParameterCard label="Max Units" value={settings?.semesterSettings?.totalCreditUnit} icon={Book} color="blue" />
                            <ParameterCard label="Min Units" value={settings?.semesterSettings?.minimumCreditUnit} icon={TrendingDown} color="amber" />
                            <ParameterCard label="Electives Required" value={settings?.semesterSettings?.numberOfElectives} icon={Layers} color="purple" />
                            <ParameterCard label="Pass Mark" value={`${settings?.semesterSettings?.passMark}% `} icon={Target} color="emerald" />
                        </div>

                        {/* Edit Button */}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadReport}
                                disabled={downloadReportMutation.isPending}
                                className="gap-2 font-bold text-slate-500 hover:text-emerald-600"
                            >
                                {downloadReportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Download Report
                            </Button>

                            {(hasRole("ADMIN") || hasRole("SUPER_ADMIN")) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSyncDialogOpen(true)}
                                    className="gap-2 font-bold text-slate-500 hover:text-indigo-600"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Sync Courses
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditSettingsModalOpen(true)}
                                className="gap-2 font-bold text-slate-500 hover:text-primary"
                            >
                                <Settings2 className="h-4 w-4" />
                                Edit Configuration
                            </Button>
                        </div>

                        {/* Courses Grid Layout */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <CourseCategorySection
                                    title="Compulsory Courses"
                                    courses={settings?.compulsoryCourses}
                                    type="COMPULSORY"
                                    programmeTypeId={Number(selectedProgrammeType)}
                                    onRefresh={refetchSettings}
                                />
                                <CourseCategorySection
                                    title="Required Courses"
                                    courses={settings?.requiredCourses}
                                    type="REQUIRED"
                                    programmeTypeId={Number(selectedProgrammeType)}
                                    onRefresh={refetchSettings}
                                />
                            </div>
                            <div className="space-y-6">
                                <CourseCategorySection
                                    title="Elective Courses"
                                    courses={settings?.electiveCourses}
                                    type="ELECTIVE"
                                    programmeTypeId={Number(selectedProgrammeType)}
                                    onRefresh={refetchSettings}
                                />

                                <AcademicSummaryCard
                                    totalCourses={(settings?.compulsoryCourses?.length || 0) + (settings?.requiredCourses?.length || 0) + (settings?.electiveCourses?.length || 0)}
                                    totalCreditUnits={settings?.semesterSettings?.totalCreditUnit}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <EditSemesterSettingsModal
                open={isEditSettingsModalOpen}
                onOpenChange={setIsEditSettingsModalOpen}
                settings={settings?.semesterSettings || null}
                onSuccess={() => refetchSettings()}
            />

            <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                            <RefreshCw className="h-5 w-5 text-indigo-600" />
                            Sync Optional Semester
                        </DialogTitle>
                        <DialogDescription>
                            Confirm synchronization of courses from the main semester.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6">
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">
                            This action will synchronize courses from the main semester to this optional semester.
                            Existing courses might be updated.
                        </p>
                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-amber-800">Warning</h4>
                                <p className="text-xs text-amber-700 font-medium">
                                    Are you sure you want to proceed? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 pt-0">
                        <Button variant="ghost" onClick={() => setIsSyncDialogOpen(false)} disabled={syncMutation.isPending} className="font-bold text-slate-500 hover:text-slate-700">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSync}
                            disabled={syncMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200"
                        >
                            {syncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {syncMutation.isPending ? "Syncing..." : "Confirm Sync"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProgrammeSettingsView;
