import { useState, useEffect } from "react";
import { admissionService } from "@/features/admin/services/admissionService";
import { useAuth } from "@/contexts/AuthContext";
import {
    Session,
    Semester,
    Admission,
    ApplicationType
} from "@/features/admin/types/admission";
import { staffService } from "@/features/admin/services/staffService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// New Modular Components
import ApplicationsHeader from "@/features/admin/components/admissions/applications/ApplicationsHeader";
import ApplicationsFilters from "@/features/admin/components/admissions/applications/ApplicationsFilters";
import ApplicationsStats from "@/features/admin/components/admissions/applications/ApplicationsStats";
import ApplicationsTable from "@/features/admin/components/admissions/applications/ApplicationsTable";
import CreateAdmissionModal from "@/features/admin/components/admissions/application-types/CreateAdmissionModal";
import AdmissionDetailsModal from "@/features/admin/components/admissions/applications/AdmissionDetailsModal";
import UpdateApplicationTypeModal from "@/features/admin/components/admissions/application-types/UpdateApplicationTypeModal";
import ApplicationTypesTable from "@/features/admin/components/admissions/application-types/ApplicationTypesTable";
import AdmissionBulkList from "@/features/admin/components/admissions/bulk-list/AdmissionBulkList";
import { LayoutGrid, ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Placeholder interface for Faculty
interface Faculty {
    id: number;
    name: string;
}

const Applications = () => {
    const { toast } = useToast();
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<"admissions" | "types" | "bulk">("admissions");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Edit Application Type State
    const [selectedAppType, setSelectedAppType] = useState<ApplicationType | null>(null);
    const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);

    // Filter State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);

    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isSemestersLoading, setIsSemestersLoading] = useState(false);

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isFacultiesLoading, setIsFacultiesLoading] = useState(false);

    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [selectedFaculty, setSelectedFaculty] = useState<string>("");

    // Active Admission State
    const [activeAdmission, setActiveAdmission] = useState<any>(null);
    const [isLoadingActive, setIsLoadingActive] = useState(false);

    // Stats State
    const [stats, setStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    const [applications, setApplications] = useState<any[]>([]);
    const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);

    // Application Types & Programme Types Filter
    const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
    const [programmeTypes, setProgrammeTypes] = useState<any[]>([]);
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("all");
    const [isTypesLoading, setIsTypesLoading] = useState(false);

    // Details Modal State
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const handleAdmissionCreated = () => {
        fetchMetadata();
    };

    const fetchMetadata = async () => {
        setIsSessionsLoading(true);
        setIsFacultiesLoading(true);
        setIsLoadingActive(true);
        try {
            const [sessionsData, facultiesData, activeData, programmeTypesData] = await Promise.all([
                admissionService.getAllSessions(),
                staffService.getAllFaculties(),
                admissionService.getActiveAdmission(),
                staffService.getAllProgrammeTypes()
            ]);

            setSessions(sessionsData);
            setFaculties(facultiesData);
            setActiveAdmission(activeData);
            setProgrammeTypes(programmeTypesData);

            // AUTO-INITIALIZE FILTERS BASED ON ACTIVE ADMISSION OR DEFAULTS
            if (activeData) {
                if (activeData.session?.id) setSelectedSession(activeData.session.id.toString());
                if (activeData.semester?.id) setSelectedSemester(activeData.semester.id.toString());
                const odelFaculty = facultiesData.find(f => f.name.toLowerCase().includes("directorate of open distance and elearning")) || facultiesData[0];
                if (odelFaculty) setSelectedFaculty(odelFaculty.id.toString());
            } else {
                const lastSession = sessionsData.length > 0 ? sessionsData[sessionsData.length - 1] : null;
                const odelFaculty = facultiesData.find(f => f.name.toLowerCase().includes("directorate of open distance and elearning")) || facultiesData[0];
                if (lastSession) setSelectedSession(lastSession.id.toString());
                if (odelFaculty) setSelectedFaculty(odelFaculty.id.toString());
            }

            // Set Default Programme Type to ODEL
            const odelProgrammeType = programmeTypesData.find((pt: any) =>
                pt.code?.toLowerCase() === 'odel' ||
                pt.name?.toLowerCase().includes('open distance')
            );
            if (odelProgrammeType) {
                setSelectedProgrammeType(odelProgrammeType.id.toString());
            }

        } catch (error) {
            console.error("Failed to fetch initial metadata", error);
        } finally {
            setIsSessionsLoading(false);
            setIsFacultiesLoading(false);
            setIsLoadingActive(false);
        }
    };

    // 1. Initial Load
    useEffect(() => {
        fetchMetadata();
    }, []);

    // 2. Fetch Semesters when Session Changes
    useEffect(() => {
        const fetchSemesters = async () => {
            if (!selectedSession) {
                setSemesters([]);
                return;
            }
            setIsSemestersLoading(true);
            try {
                const data = await admissionService.getSemestersBySession(Number(selectedSession));
                setSemesters(data);
                if (data.length > 0 && !selectedSemester) {
                    setSelectedSemester(data[0].id.toString());
                }
            } catch (error) {
                console.error("Failed to load semesters", error);
            } finally {
                setIsSemestersLoading(false);
            }
        };
        fetchSemesters();
    }, [selectedSession]);

    // 3. Fetch Stats when Filters Change
    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedSession || !selectedFaculty || !isAdmin) return;

            setIsLoadingStats(true);
            try {
                const data = await admissionService.getAdmissionStats({
                    session: Number(selectedSession),
                    faculty: Number(selectedFaculty),
                    semester: selectedSemester ? Number(selectedSemester) : undefined
                });

                let totalReg = 0;
                let totalUnreg = 0;
                if (data && typeof data === 'object') {
                    Object.values(data).forEach((val: any) => {
                        totalReg += Number(val.registered || 0);
                        totalUnreg += Number(val.unregistered || 0);
                    });
                }

                setStats({
                    registered: totalReg,
                    unregistered: totalUnreg,
                    total: totalReg + totalUnreg
                });

            } catch (error: any) {
                console.error("Failed to load stats", error);
                if (error.response?.status === 403) {
                    toast({
                        title: "Access Denied",
                        description: "You do not have permission to view admission statistics.",
                        variant: "destructive"
                    });
                }
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [selectedSession, selectedSemester, selectedFaculty, isAdmin]);

    // 4. Fetch Applications when Session Changes
    useEffect(() => {
        const fetchApplications = async () => {
            if (!selectedSession) return;

            setIsApplicationsLoading(true);
            try {
                const data = await admissionService.getAdmissionsBySession(Number(selectedSession));
                setApplications(data);
            } catch (error) {
                console.error("Failed to load applications", error);
                setApplications([]);
            } finally {
                setIsApplicationsLoading(false);
            }
        };
        fetchApplications();
    }, [selectedSession]);

    // 5. Fetch Application Types with Programme Type Filter
    const fetchTypes = async () => {
        setIsTypesLoading(true);
        try {
            let data: ApplicationType[] = [];

            if (selectedProgrammeType && selectedProgrammeType !== "all") {
                data = await admissionService.getApplicationTypesFor(Number(selectedProgrammeType));
            } else {
                data = await admissionService.getApplicationTypes();
            }

            // Always sort by name for consistency
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
            setApplicationTypes(sortedData);
        } catch (error) {
            console.error("Failed to load application types", error);
            setApplicationTypes([]);
        } finally {
            setIsTypesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "types") {
            fetchTypes();
        }
    }, [activeTab, selectedProgrammeType]);

    const resetToActive = () => {
        if (activeAdmission) {
            if (activeAdmission.session?.id) setSelectedSession(activeAdmission.session.id.toString());
            if (activeAdmission.semester?.id) setSelectedSemester(activeAdmission.semester.id.toString());
        }
    };

    const resetFilters = () => {
        setSelectedSemester("");
        setSelectedSession(sessions[sessions.length - 1]?.id.toString() || "");
    };

    const [isEnableLoading, setIsEnableLoading] = useState(false);

    const handleEnableAdmission = async () => {
        if (!selectedSession) {
            toast({
                title: "Validation Error",
                description: "Please select a session to enable.",
                variant: "destructive"
            });
            return;
        };

        setIsEnableLoading(true);
        try {
            await admissionService.enableAdmission(Number(selectedSession));
            toast({
                title: "Success",
                description: "Admission session enabled successfully.",
            });
            fetchMetadata(); // Refresh state
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to enable admission session.",
                variant: "destructive"
            });
        } finally {
            setIsEnableLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto space-y-12 p-4 md:p-6 lg:p-8 pb-24 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20">
            <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <ApplicationsHeader
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    onEnableAdmission={handleEnableAdmission}
                    isEnableLoading={isEnableLoading}
                />

                <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50 overflow-x-auto max-w-full">
                    <Button
                        variant={activeTab === "admissions" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("admissions")}
                        className="h-7 text-xs font-bold gap-1.5 shrink-0"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Admission Tracks
                    </Button>
                    <Button
                        variant={activeTab === "types" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("types")}
                        className="h-7 text-xs font-bold gap-1.5 shrink-0"
                    >
                        <ListChecks className="h-3.5 w-3.5" />
                        Application Categories
                    </Button>
                    <Button
                        variant={activeTab === "bulk" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("bulk")}
                        className="h-7 text-xs font-bold gap-1.5 shrink-0"
                    >
                        <Users className="h-3.5 w-3.5" />
                        Admission List
                    </Button>
                </div>
            </div>

            {activeTab === "admissions" ? (
                <>
                    <div className="shrink-0">
                        <ApplicationsFilters
                            sessions={sessions}
                            isSessionsLoading={isSessionsLoading}
                            selectedSession={selectedSession}
                            onSessionChange={setSelectedSession}
                            semesters={semesters}
                            isSemestersLoading={isSemestersLoading}
                            selectedSemester={selectedSemester}
                            onSemesterChange={setSelectedSemester}
                            faculties={faculties}
                            isFacultiesLoading={isFacultiesLoading}
                            selectedFaculty={selectedFaculty}
                            onFacultyChange={setSelectedFaculty}
                            activeAdmission={activeAdmission}
                            onResetToActive={resetToActive}
                            onResetFilters={resetFilters}
                        />
                    </div>

                    <div className="shrink-0">
                        {isAdmin && <ApplicationsStats stats={stats} isLoadingStats={isLoadingStats} />}
                    </div>

                    <div className="shrink-0">
                        <ApplicationsTable
                            applications={applications}
                            isApplicationsLoading={isApplicationsLoading}
                            onViewDetails={(app) => {
                                setSelectedAdmission(app);
                                setIsDetailsModalOpen(true);
                            }}
                        />
                    </div>
                </>
            ) : activeTab === "types" ? (
                <div className="space-y-6 shrink-0">
                    <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Filter Categories</h3>
                        </div>
                        <div className="w-[200px]">
                            <Select value={selectedProgrammeType} onValueChange={setSelectedProgrammeType}>
                                <SelectTrigger className="h-9 w-full bg-background border-border/50 text-xs font-bold uppercase tracking-wider">
                                    <SelectValue placeholder="All Programme Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider">All Programme Types</SelectItem>
                                    {programmeTypes.map((pt) => (
                                        <SelectItem key={pt.id} value={pt.id.toString()} className="text-xs font-bold uppercase tracking-wider">
                                            {pt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ApplicationTypesTable
                        types={applicationTypes}
                        isLoading={isTypesLoading}
                        onEdit={(type) => {
                            setSelectedAppType(type);
                            setIsEditTypeModalOpen(true);
                        }}
                    />
                </div>
            ) : (
                <div className="shrink-0">
                    <AdmissionBulkList />
                </div>
            )}

            <CreateAdmissionModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={handleAdmissionCreated}
            />

            <AdmissionDetailsModal
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                admission={selectedAdmission}
            />

            <UpdateApplicationTypeModal
                open={isEditTypeModalOpen}
                onOpenChange={setIsEditTypeModalOpen}
                applicationType={selectedAppType}
                onSuccess={() => {
                    fetchTypes();
                }}
            />
        </div >
    );
};

export default Applications;
