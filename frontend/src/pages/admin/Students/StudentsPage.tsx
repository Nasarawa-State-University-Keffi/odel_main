import { useState, useEffect } from "react";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { studentService } from "@/features/admin/services/studentService";
import { admissionService } from "@/features/admin/services/admissionService";
import { sessionService } from "@/features/admin/services/sessionService";
import { Student, Deferment } from "@/features/admin/types/student";
import { Session } from "@/features/admin/types/session";
import StudentTable from "@/features/admin/components/students/StudentTable";
import StudentPagination from "@/features/admin/components/students/StudentPagination";
import StudentStatsCards from "@/features/admin/components/students/StudentStatsCards";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Calendar } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/admin/components/admission/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/features/admin/components/admission/components/ui/popover";
import { Filter, PauseCircle, ChevronDown, Download, Plus, BarChart3, AlertTriangle } from "lucide-react";
import DefermentTable from "@/features/admin/components/students/DefermentTable";
import SuspensionTable from "@/features/admin/components/students/SuspensionTable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/features/admin/components/admission/components/ui/dropdown-menu";

// Placeholder for Detail Modal - to be implemented next
import StudentDetailsModal from "@/features/admin/components/students/StudentDetailsModal";
import { StudentReportModal } from "@/features/admin/components/students/StudentReportModal";
import { SuspendStudentModal } from "@/features/admin/components/students/SuspendStudentModal";
import { facultyService } from "@/features/admin/services/facultyService";
import { programmeTypeService } from "@/features/admin/services/programmeTypeService";
import { programmeService } from "@/features/admin/services/programmeService";
import { levelService } from "@/features/admin/services/levelService";
import { staffService } from "@/features/admin/services/staffService";
import { Programme } from "@/features/admin/types/programme";
import { Level } from "@/features/admin/types/level";
import { Label } from "@/features/admin/components/admission/components/ui/label";

const StudentsPage = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [currentSession, setCurrentSession] = useState<number>(0);
    const [viewMode, setViewMode] = useState<'stats' | 'list' | 'deferments' | 'suspensions'>('list');
    // Filter State
    const [showProgrammeFilter, setShowProgrammeFilter] = useState(false);
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedFaculty, setSelectedFaculty] = useState<string>("");
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    // Ideally we should import Faculty type, but using any for now to avoid large import changes if not exported commonly
    const [faculties, setFaculties] = useState<any[]>([]);

    const [defaultProgrammeTypeId, setDefaultProgrammeTypeId] = useState<number | undefined>(undefined);

    const [programmeTypes, setProgrammeTypes] = useState<any[]>([]);
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Metadata (Programmes & Faculties) on Load
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [progsData, facultiesData, progTypesData] = await Promise.all([
                    programmeService.getAllProgrammes(),
                    facultyService.getAllFaculties(),
                    programmeTypeService.getAllProgrammeTypes()
                ]);
                setProgrammes(progsData);
                setFaculties(facultiesData);
                setProgrammeTypes(progTypesData);

                // Set Default Faculty Filter
                const targetFaculty = facultiesData.find((f: any) =>
                    f.name.toLowerCase().includes("directorate of open distance") ||
                    f.name.toLowerCase().includes("odel")
                );

                if (targetFaculty) {
                    setSelectedFaculty(targetFaculty.id.toString());
                }

                // Determine Default Programme Type for Search (Prefer Part Time/ODEL)
                const targetProgType = progTypesData.find((pt: any) =>
                    pt.name.toLowerCase().includes("part") ||
                    pt.name.toLowerCase().includes("distance") ||
                    pt.name.toLowerCase().includes("odel")
                ) || progTypesData.find((pt: any) => pt.name.toLowerCase().includes("full")) || progTypesData[0];

                if (targetProgType) {
                    setDefaultProgrammeTypeId(targetProgType.id);
                    setSelectedProgrammeType(targetProgType.id.toString());
                }
            } catch (error) {
                console.error("Failed to load metadata", error);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch Levels when Programme changes
    useEffect(() => {
        // Reset page when filters change
        setCurrentPage(1);

        const fetchLevels = async () => {
            if (!selectedProgramme) {
                setLevels([]);
                setSelectedLevel("");
                return;
            }
            try {
                // Find the selected programme to get its type
                const prog = programmes.find(p => p.id.toString() === selectedProgramme);
                // Default to empty or some logic if not found, but should work.
                // Assuming we want levels for that Programme Type (e.g. Undergraduate levels for B.Sc. CS)
                if (prog && prog.programmeType) {
                    const data = await levelService.getAllLevels(prog.programmeType.id);
                    setLevels(data);
                } else {
                    // Fallback or verify usage
                    setLevels([]);
                }
            } catch (error) {
                console.error("Failed to load levels", error);
                setLevels([]);
            }
        };
        fetchLevels();
    }, [selectedProgramme, programmes]); // Added programmes to dependency

    // Query for sessions
    const { data: sessions = [], isSuccess: sessionsLoaded } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    // Auto-select latest session
    useEffect(() => {
        if (sessionsLoaded && sessions.length > 0 && currentSession === 0) {
            // Assuming the last one is the latest (based on ID or order from backend)
            setCurrentSession(sessions[sessions.length - 1].id);
        }
    }, [sessions, sessionsLoaded, currentSession]);

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Helper to deduplicate students
    const uniqueStudents = (students: Student[]) => {
        const seen = new Set();
        return students.filter(student => {
            const duplicate = seen.has(student.id);
            seen.add(student.id);
            return !duplicate;
        });
    };

    // Query for students
    const {
        data,
        isLoading,
        isFetching,
        isError,
        error
    } = useQuery({
        queryKey: ["students", debouncedSearch, showProgrammeFilter, selectedProgramme, selectedLevel, selectedFaculty, currentSession, currentPage, defaultProgrammeTypeId],
        queryFn: async () => {
            if (showProgrammeFilter && selectedProgramme && selectedLevel) {
                const prog = programmes.find(p => p.id.toString() === selectedProgramme);
                if (prog && prog.department) {
                    // Use getStudentsByDepartment for pagination support
                    return await studentService.getStudentsByDepartment(
                        prog.department.id,
                        Number(selectedLevel),
                        currentPage - 1,
                        ITEMS_PER_PAGE
                    );
                } else {
                    // Fallback to legacy or if department missing (unlikely)
                    const sessionToUse = currentSession || (sessions.length > 0 ? sessions[sessions.length - 1].id : 0);
                    if (sessionToUse) {
                        const result = await studentService.getAllStudentsAt(sessionToUse, Number(selectedProgramme), Number(selectedLevel));

                        const totalItems = Array.isArray(result) ? result.length : 0;
                        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
                        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                        const paginatedResults = Array.isArray(result) ? result.slice(startIndex, startIndex + ITEMS_PER_PAGE) : [];

                        return {
                            content: paginatedResults,
                            totalPages: totalPages
                        };
                    }
                }
            }

            if (debouncedSearch) {
                let results: Student[] = [];
                // Check if query is numeric (for ID lookup)
                if (/^\d+$/.test(debouncedSearch)) {
                    try {
                        const student = await studentService.getStudentById(Number(debouncedSearch));
                        if (student) {
                            results.push(student);
                        }
                    } catch (error) {
                        // If ID lookup fails (e.g. 404), continue
                    }
                }

                // Parallel search: Find Students + Extension Search (Prioritizing Extension) + Matric
                try {
                    const [extResults, findResults, matricResult] = await Promise.all([
                        studentService.searchStudentExtension(debouncedSearch).catch(() => []),
                        studentService.findStudents(debouncedSearch, defaultProgrammeTypeId).catch(() => []),
                        studentService.getStudentByMatric(debouncedSearch).catch(() => null)
                    ]);

                    results = [...results, ...extResults, ...findResults];
                    if (matricResult) {
                        results.push(matricResult);
                    }
                } catch (e) {
                    console.error("Search error", e);
                }

                let uniqueResults = uniqueStudents(results);

                // Apply Filters to Search Results (Client-Side)
                if (selectedFaculty) {
                    uniqueResults = uniqueResults.filter(student => {
                        const facId = student.faculty?.id ||
                            student.programme?.department?.faculty?.id ||
                            (student as any).faculty_id;
                        return facId && facId.toString() === selectedFaculty;
                    });
                }
                if (selectedProgramme) {
                    uniqueResults = uniqueResults.filter(student =>
                        (student.programme && student.programme.id.toString() === selectedProgramme) ||
                        (student.programmeType && student.programmeType.id.toString() === selectedProgramme)
                    );
                }
                if (selectedLevel) {
                    uniqueResults = uniqueResults.filter(student =>
                        (student.level && student.level.id.toString() === selectedLevel)
                    );
                }

                // Client-side Pagination
                const totalItems = uniqueResults.length;
                const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const paginatedResults = uniqueResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                return {
                    content: paginatedResults,
                    totalPages: totalPages
                };
            }

            // Pass faculty filter if set
            const queryParams: any = {
                page: currentPage - 1,
                size: ITEMS_PER_PAGE
            };

            if (selectedFaculty) {
                queryParams.faculty = Number(selectedFaculty);
            }

            const response = await studentService.getAllStudents(queryParams);
            return response;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        // Only run query if NOT in filter mode OR (in filter mode AND both selected)
        enabled: !showProgrammeFilter || (showProgrammeFilter && !!selectedProgramme && !!selectedLevel)
    });

    const studentsData = data?.content || [];
    const totalPages = data?.totalPages || 1;

    // Use all students without filtering by programme type
    const students = Array.isArray(studentsData) ? studentsData : [];

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Query for student stats
    const {
        data: stats,
        isLoading: statsLoading
    } = useQuery({
        queryKey: ["student-stats", currentSession],
        queryFn: async () => {
            if (!currentSession) return null;
            return await studentService.getStudentStats(currentSession);
        },
        enabled: !!currentSession,
        staleTime: 1000 * 60 * 5,
    });

    // Query for deferments
    const {
        data: defermentsData,
        isLoading: defermentsLoading,
        isFetching: defermentsFetching
    } = useQuery({
        queryKey: ["deferments", currentPage],
        queryFn: async () => {
            return await studentService.getAllDeferments(currentPage - 1, ITEMS_PER_PAGE);
        },
        enabled: viewMode === 'deferments',
        placeholderData: keepPreviousData,
    });

    // Query for Suspensions and Extensions
    const {
        data: suspensionsData,
        isLoading: suspensionsLoading,
        isFetching: suspensionsFetching
    } = useQuery({
        queryKey: ["suspensions", selectedProgramme, selectedProgrammeType],
        queryFn: async () => {
            // Priority 1: Specific Programme Selected
            if (selectedProgramme) {
                const prog = programmes.find(p => p.id.toString() === selectedProgramme);
                if (prog && prog.programmeType && prog.department) {
                    return await studentService.getSuspensionsAndExtensions(prog.programmeType.id, prog.department.id);
                }
            }

            // Priority 2: Use Selected Programme Type
            if (selectedProgrammeType) {
                return await studentService.getSuspensionsAndExtensionsByType(Number(selectedProgrammeType));
            }

            return [];
        },
        enabled: viewMode === 'suspensions' && (!!selectedProgramme || !!selectedProgrammeType),
        placeholderData: keepPreviousData,
    });

    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [studentToSuspend, setStudentToSuspend] = useState<Student | null>(null);

    const queryClient = useQueryClient();

    const handleViewDetails = (student: Student) => {
        setSelectedStudent(student);
        setIsDetailsModalOpen(true);
    };

    const handleSuspend = (student: Student) => {
        setStudentToSuspend(student);
        setIsSuspendModalOpen(true);
    };

    const handleConfirmSuspend = async (reason: string) => {
        if (!studentToSuspend || !currentSession) return;

        // Use userId as requested
        const studentId = studentToSuspend.userId;

        if (!studentId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Student does not have a valid User ID."
            });
            return;
        }

        try {
            await studentService.suspendStudentWithReason(currentSession, studentId, reason);
            toast({
                title: "Success",
                description: `${studentToSuspend.firstName} has been suspended.`
            });
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setIsSuspendModalOpen(false);
            setStudentToSuspend(null);
        } catch (error: any) {
            let title = "Error";
            let description = "Failed to suspend student.";

            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        title = "Not Found";
                        description = "Student or Session information not found.";
                        break;
                    case 400:
                        title = "Bad Request";
                        description = error.response.data?.message || "Invalid request parameters.";
                        break;
                    case 500:
                        title = "Server Error";
                        description = "An internal server error occurred.";
                        break;
                    default:
                        description = error.response.data?.message || "An unexpected error occurred.";
                }
            }

            toast({
                variant: "destructive",
                title,
                description
            });
        }
    };

    const handleRusticate = async (student: Student) => {
        const studentId = student.userId;
        if (!studentId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Student does not have a valid User ID."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to rusticate ${student.firstName} ${student.lastName}?`)) {
            try {
                await studentService.rusticateStudent(studentId);
                toast({
                    title: "Success",
                    description: `${student.firstName} has been rusticated.`
                });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = "Error";
                let description = "Failed to rusticate student.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Student information not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }

                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };

    const handleWithdraw = async (student: Student) => {
        const studentId = student.userId;
        if (!studentId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Student does not have a valid User ID."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to withdraw ${student.firstName} ${student.lastName}?`)) {
            try {
                await studentService.withdrawStudent(studentId);
                toast({
                    title: "Success",
                    description: `${student.firstName} has been withdrawn.`
                });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = "Error";
                let description = "Failed to withdraw student.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Student information not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }

                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };



    const handleCancelSuspension = async (suspension: any) => {
        if (!currentSession) return;

        const studentName = suspension.name || suspension.studentName || "Student";

        if (window.confirm(`Are you sure you want to cancel the suspension for ${studentName} ? `)) {
            try {
                await studentService.cancelSuspension(suspension.id, currentSession);
                toast({
                    title: "Success",
                    description: "Suspension has been cancelled."
                });
                queryClient.invalidateQueries({ queryKey: ["suspensions"] });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = "Error";
                let description = "Failed to cancel suspension.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Suspension or Session not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }

                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };

    const handleRegenerateMatric = async (student: Student) => {
        const studentId = student.userId;
        if (!studentId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Student ID is missing."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to regenerate matric number for ${student.firstName} ${student.lastName}?`)) {
            try {
                await studentService.regenerateMatric(studentId);
                toast({
                    title: "Success",
                    description: "Matric number regeneration initiated successfully."
                });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = "Error";
                let description = "Failed to regenerate matric number.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Student not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }
                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };

    const handleProbate = async (student: Student) => {
        const userId = student.userId;

        if (!userId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Student User ID is missing."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to probate ${student.firstName} ${student.lastName}?`)) {
            try {
                await studentService.probateStudent(userId);
                toast({
                    title: "Success",
                    description: `${student.firstName} has been put on probation.`
                });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = "Error";
                let description = "Failed to probate student.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Student not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }
                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };

    const handleDowngrade = async (student: Student) => {
        const userId = student.userId;

        if (!userId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Student User ID is missing."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to downgrade level for ${student.firstName} ${student.lastName}?`)) {
            try {
                // Assuming maintainPromotion=true for now as per requirement snippet
                await studentService.downgradeStudentLevel(userId, true);
                toast({
                    title: "Success",
                    description: `${student.firstName} has been downgraded.`
                });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = "Error";
                let description = "Failed to downgrade student.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Student not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }
                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };

    const handleCancelDeferment = async (deferment: Deferment) => {
        if (!deferment.id || !deferment.student?.id) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Deferment ID or Student ID is missing."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to cancel deferment for ${deferment.student.firstName} ${deferment.student.lastName}?`)) {
            try {
                // Endpoint expects: /api/students/defer/cancel/{defermentId}/{id}
                // 'id' usually refers to student ID or user ID. Based on prompt "id * integer($int64)", it likely matches student.id (PK).
                // Let's assume student.id (number) based on typical REST patterns for "id", but verify if it could be userId.
                // The prompt says "id * integer($int64)", usually mapped to DB ID. student.id is likely the DB ID.
                await studentService.cancelDeferment(deferment.id, deferment.student.id);
                toast({
                    title: "Success",
                    description: "Deferment cancelled successfully."
                });
                queryClient.invalidateQueries({ queryKey: ["deferments"] }); // Assuming deferments are fetched with this key
            } catch (error: any) {
                let title = error.response?.statusText || "Error";
                let description = "Failed to cancel deferment.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Deferment or Student not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }

                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    }

    const handleUpgrade = async (student: Student) => {
        let sessionIdToUse = currentSession;

        if (!sessionIdToUse) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select an active session in the Stats/Filter view to upgrade the student to."
            });
            return;
        }

        if (window.confirm(`Are you sure you want to upgrade level for ${student.firstName} ${student.lastName}?`)) {
            try {
                await studentService.upgradeStudentLevel(student.id, sessionIdToUse);
                toast({
                    title: "Success",
                    description: `${student.firstName} has been upgraded successfully.`
                });
                queryClient.invalidateQueries({ queryKey: ["students"] });
            } catch (error: any) {
                let title = error.response?.statusText || "Error";
                let description = "Failed to upgrade student.";

                if (error.response) {
                    switch (error.response.status) {
                        case 404:
                            title = "Not Found";
                            description = "Student or Session not found.";
                            break;
                        case 400:
                            title = "Bad Request";
                            description = error.response.data?.message || "Invalid request parameters.";
                            break;
                        case 401:
                            title = "Unauthorized";
                            description = "Please log in to continue.";
                            break;
                        case 403:
                            title = "Forbidden";
                            description = error.response.data?.message || "You do not have permission to perform this action.";
                            break;
                        case 500:
                            title = "Server Error";
                            description = "An internal server error occurred.";
                            break;
                        default:
                            description = error.response.data?.message || "An unexpected error occurred.";
                    }
                }
                toast({
                    variant: "destructive",
                    title,
                    description
                });
            }
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 md:space-y-6 p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        STUDENT <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">Manage student records, admissions, and academic status.</p>
                </div>

                <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                    {/* View Switcher */}
                    <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-7 text-xs font-bold"
                        >
                            List
                        </Button>
                        <Button
                            variant={viewMode === 'deferments' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('deferments')}
                            className="h-7 text-xs font-bold gap-1.5"
                        >
                            <PauseCircle className="h-3.5 w-3.5" />
                            Deferments
                        </Button>
                        <Button
                            variant={viewMode === 'suspensions' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('suspensions')}
                            className="h-7 text-xs font-bold gap-1.5"
                        >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Sus/Ext
                        </Button>
                        <Button
                            variant={viewMode === 'stats' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('stats')}
                            className="h-7 text-xs font-bold gap-1.5"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Stats
                        </Button>
                    </div>

                    {/* Session Selector (Only visible in Stats) */}
                    {viewMode === 'stats' && (
                        <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-1.5 shadow-sm h-9">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Select
                                value={currentSession ? currentSession.toString() : ""}
                                onValueChange={(val) => setCurrentSession(Number(val))}
                            >
                                <SelectTrigger className="h-6 w-[140px] border-0 bg-transparent focus:ring-0 px-2 font-bold text-primary text-xs">
                                    <SelectValue placeholder="Select Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(session => (
                                        <SelectItem key={session.id} value={session.id.toString()}>
                                            {session.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Actions Dropdown */}
                    {viewMode === 'list' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2 font-bold">
                                    Actions
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Manage Students</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="gap-2 cursor-pointer">
                                    <Download className="h-4 w-4" />
                                    Download Report
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {viewMode === 'stats' && (
                <StudentStatsCards stats={stats} isLoading={statsLoading} />
            )}

            {viewMode === 'list' && (
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <StudentTable
                        students={students}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        onViewDetails={handleViewDetails}
                        onSuspend={handleSuspend}
                        onRusticate={handleRusticate}
                        onWithdraw={handleWithdraw}
                        onRegenerateMatric={handleRegenerateMatric}
                        onProbate={handleProbate}
                        onDowngrade={handleDowngrade}
                        onUpgrade={handleUpgrade}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filterAction={
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-auto gap-2 font-bold tracking-wide relative">
                                        <Filter className="h-3.5 w-3.5" />
                                        FILTERS
                                        {(selectedFaculty || selectedProgramme || selectedLevel) && (
                                            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full ml-1 absolute -top-1 -right-1">
                                                {(selectedFaculty ? 1 : 0) + (selectedProgramme ? 1 : 0) + (selectedLevel ? 1 : 0)}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[calc(100vw-2.5rem)] sm:w-80 p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20" align="end">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Filter Student List</h4>
                                            {(selectedFaculty || selectedProgramme || selectedLevel) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        setSelectedFaculty("");
                                                        setSelectedProgramme("");
                                                        setSelectedLevel("");
                                                        setShowProgrammeFilter(false);
                                                    }}
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Faculty</Label>
                                            <Select
                                                value={selectedFaculty}
                                                onValueChange={setSelectedFaculty}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Faculty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {faculties.map((fac: any) => (
                                                        <SelectItem key={fac.id} value={fac.id.toString()}>
                                                            {fac.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Programme</Label>
                                            <Select
                                                value={selectedProgramme}
                                                onValueChange={(val) => {
                                                    setSelectedProgramme(val);
                                                    setShowProgrammeFilter(true);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Programme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {programmes.map(prog => (
                                                        <SelectItem key={prog.id} value={prog.id.toString()}>
                                                            {prog.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Level</Label>
                                            <Select
                                                value={selectedLevel}
                                                onValueChange={setSelectedLevel}
                                                disabled={!selectedProgramme}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {levels.map(lvl => (
                                                        <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                                            {lvl.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        }
                    />
                    <StudentPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {viewMode === 'deferments' && (
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <DefermentTable
                        deferments={defermentsData?.content || []}
                        isLoading={defermentsLoading}
                        isFetching={defermentsFetching}
                        onCancelDeferment={handleCancelDeferment}
                    />
                    <div className="mt-4">
                        <StudentPagination
                            currentPage={currentPage}
                            totalPages={defermentsData?.totalPages || 1}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            )}

            {viewMode === 'suspensions' && (
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <div className="flex flex-col h-full space-y-4">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-muted/30 p-2 rounded-lg border border-border/40">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">Type:</span>
                                    <Select
                                        value={selectedProgrammeType}
                                        onValueChange={setSelectedProgrammeType}
                                    >
                                        <SelectTrigger className="h-7 w-[160px] text-xs font-bold bg-background border-border/60">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {programmeTypes.map((type: any) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedProgramme && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prog:</span>
                                        <Badge variant="secondary" className="font-bold text-xs text-primary bg-primary/10 border-primary/20 line-clamp-1 max-w-[200px]">
                                            {programmes.find(p => p.id.toString() === selectedProgramme)?.name}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {selectedProgramme && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProgramme("")}
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 self-end lg:self-auto"
                                >
                                    Clear Details
                                </Button>
                            )}
                        </div>
                        <SuspensionTable
                            data={suspensionsData || []}
                            isLoading={suspensionsLoading}
                            isFetching={suspensionsFetching}
                            onCancelSuspension={handleCancelSuspension}
                        />
                    </div>
                </div>
            )}

            <StudentReportModal
                open={isReportModalOpen}
                onOpenChange={setIsReportModalOpen}
            />

            <SuspendStudentModal
                open={isSuspendModalOpen}
                onOpenChange={setIsSuspendModalOpen}
                onConfirm={handleConfirmSuspend}
                studentName={studentToSuspend ? `${studentToSuspend.firstName} ${studentToSuspend.lastName} ` : ""}
            />

            {selectedStudent && (
                <StudentDetailsModal
                    student={selectedStudent}
                    open={isDetailsModalOpen}
                    onOpenChange={setIsDetailsModalOpen}
                    currentSessionId={currentSession}
                />
            )}
        </div>
    );
};

export default StudentsPage;
