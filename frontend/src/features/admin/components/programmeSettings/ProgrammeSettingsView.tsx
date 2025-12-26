import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { programmeSettingsService } from "../../services/programmeSettingsService";
import { programmeService } from "../../services/programmeService";
import { staffService } from "../../services/staffService";
import { admissionService } from "../../services/admissionService";
import { Loader2, Settings, Filter, AlertCircle, Book, TrendingDown, Layers, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Refactored Components
import ConfigurationFilters from "./ConfigurationFilters";
import ParameterCard from "./ParameterCard";
import CourseCategorySection from "./CourseCategorySection";
import AcademicSummaryCard from "./AcademicSummaryCard";
import AvailableCoursesSection from "./AvailableCoursesSection";

const ProgrammeSettingsView = () => {
    const { hasAnyRole } = useAuth();
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [showAvailableCourses, setShowAvailableCourses] = useState<boolean>(false);

    // Fetch Programme Types for ODEL filtering
    const { data: programmeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: staffService.getAllProgrammeTypes,
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

    // Fetch Levels based on selected type
    const { data: levels } = useQuery({
        queryKey: ["levels-by-type", selectedProgrammeType],
        queryFn: () => staffService.getLevelsByProgrammeType(Number(selectedProgrammeType)),
        enabled: !!selectedProgrammeType
    });

    // Fetch Sessions (needed for semesters)
    const { data: sessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions
    });

    // Fetch Semesters based on session
    const { data: semesters } = useQuery({
        queryKey: ["semesters", selectedSession],
        queryFn: () => admissionService.getSemestersBySession(Number(selectedSession)),
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
    const { data: settings, isPending: isLoadingSettings, error: settingsError, refetch } = useQuery({
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
                    <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">
                        Programme Settings
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
                            <Button variant="outline" className="mt-4 bg-white/20 border-white/40 font-bold" onClick={() => refetch()}>
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
                            <ParameterCard label="Pass Mark" value={`${settings?.semesterSettings?.passMark}%`} icon={Target} color="emerald" />
                        </div>

                        {/* Courses Grid Layout */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <CourseCategorySection title="Compulsory Courses" courses={settings?.compulsoryCourses} type="COMPULSORY" />
                                <CourseCategorySection title="Required Courses" courses={settings?.requiredCourses} type="REQUIRED" />
                            </div>
                            <div className="space-y-6">
                                <CourseCategorySection title="Elective Courses" courses={settings?.electiveCourses} type="ELECTIVE" />

                                <AcademicSummaryCard
                                    totalCourses={(settings?.compulsoryCourses?.length || 0) + (settings?.requiredCourses?.length || 0) + (settings?.electiveCourses?.length || 0)}
                                    totalCreditUnits={settings?.semesterSettings?.totalCreditUnit}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProgrammeSettingsView;
