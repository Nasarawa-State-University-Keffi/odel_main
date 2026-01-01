import { useState, useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { UserCog } from "lucide-react";

// New Modular Components
import StaffHeader from "./StaffHeader";
import StaffFilters from "./StaffFilters";
import StaffTable from "./StaffTable";
import LevelAdviserTable from "./LevelAdviserTable";
import StaffPagination from "./StaffPagination";
import StaffModals from "./StaffModals";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Staff } from "../../types/staff";
import { staffService } from "../../services/staffService";
import { staffRoleService } from "../../services/staffRoleService";
import { facultyService } from "../../services/facultyService";
import { departmentService } from "../../services/departmentService";


const ITEMS_PER_PAGE = 10;

const StaffList = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isViewCoursesModalOpen, setIsViewCoursesModalOpen] = useState(false);
    const [isViewCourseApprovalsModalOpen, setIsViewCourseApprovalsModalOpen] = useState(false);
    const [isMakeLevelAdviserModalOpen, setIsMakeLevelAdviserModalOpen] = useState(false);
    const [isMakeDepartmentExamOfficerModalOpen, setIsMakeDepartmentExamOfficerModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
    const [faculties, setFaculties] = useState<any[]>([]);

    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [departments, setDepartments] = useState<any[]>([]);

    const [showLevelAdvisers, setShowLevelAdvisers] = useState(false);
    const [showSenateMembers, setShowSenateMembers] = useState(false);

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { hasAnyRole, hasRole } = useAuth();

    // Role-Based Permissions
    const canCreateStaff = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const canUpdateStaff = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const canMakeFacultyExamOfficer = hasAnyRole(["ADMIN", "DEAN"]);
    const canMakeDepartmentExamOfficer = hasRole("HOD");
    const canMakeDean = hasRole("ADMIN");
    const canMakeHOD = hasRole("ADMIN");
    const canMakeSenate = hasRole("ADMIN");
    const canMakeVC = hasRole("ADMIN");
    const canMakeDvcAcademic = hasRole("ADMIN");
    const canMakeDvcAdministration = hasRole("ADMIN");
    const canMakeBursar = hasRole("ADMIN");
    const canMakeRegistrar = hasRole("ADMIN");
    const canMakeAcademicSecretary = hasRole("ADMIN");

    // Fetch Faculties & Departments on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [facultiesData, departmentsData] = await Promise.all([
                    facultyService.getAllFaculties(),
                    departmentService.getAllDepartments()
                ]);
                setFaculties(facultiesData);
                setDepartments(departmentsData);

                const defaultFaculty = facultiesData.find((f: any) => f.name.toLowerCase() === "directorate of open distance and elearning");
                if (defaultFaculty) {
                    setSelectedFaculty(String(defaultFaculty.id));
                }
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            }
        };
        fetchMetadata();
    }, []);

    // Filter Departments based on Selected Faculty
    const filteredDepartments = selectedFaculty === "all"
        ? departments
        : departments.filter(d => d.faculty?.id === Number(selectedFaculty));

    // Reset department filter & level adviser toggle when faculty changes
    useEffect(() => {
        setSelectedDepartment("all");
        setShowLevelAdvisers(false);
        setShowSenateMembers(false);
    }, [selectedFaculty]);

    // Reset level adviser toggle when department changes to "all"
    useEffect(() => {
        if (selectedDepartment === "all") {
            setShowLevelAdvisers(false);
        }
    }, [selectedDepartment]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchStaffs = async (page: number, size: number) => {
        // Ensure faculties are available to find ODEL ID
        let currentFaculties = faculties;
        if (currentFaculties.length === 0) {
            try {
                currentFaculties = await facultyService.getAllFaculties();
                setFaculties(currentFaculties); // Sync state
            } catch (e) {
                console.error("Error fetching faculties for default ODEL check", e);
            }
        }

        // Find ODEL Faculty ID
        const odelFaculty = currentFaculties.find((f: any) =>
            f.code?.toLowerCase() === 'odel' ||
            f.name?.toLowerCase().includes('open distance')
        );

        if (odelFaculty) {
            try {
                // Determine 'selectedFaculty' only if it's still 'all' (initial load scenario)
                if (selectedFaculty === 'all') {
                    // We don't set state here to avoid loop/race, just use the ID for this fetch
                }

                const staffList = await staffService.getLecturersByFaculty(odelFaculty.id);
                // Handle client-side pagination mimic
                return {
                    content: staffList,
                    totalPages: 1,
                    totalElements: staffList.length,
                    last: true,
                    size: staffList.length,
                    number: 0,
                    first: true,
                    empty: staffList.length === 0,
                };
            } catch (error) {
                console.error("Failed to fetch ODEL staff", error);
                return { content: [], totalPages: 0, totalElements: 0, last: true, size: 0, number: 0, first: true, empty: true };
            }
        }

        if (showSenateMembers) {
            try {
                const staffList = await staffService.getSenateMembers();
                return {
                    content: staffList,
                    totalPages: 1,
                    totalElements: staffList.length,
                    last: true,
                    size: staffList.length,
                    number: 0,
                    sort: {},
                    first: true,
                    numberOfElements: staffList.length,
                    empty: staffList.length === 0
                };
            } catch (error) {
                console.error("Error fetching Senate members:", error);
                return { content: [], totalPages: 0, totalElements: 0, last: true, size: 0, number: 0, sort: {}, first: true, numberOfElements: 0, empty: true };
            }
        }

        // Fallback if ODEL faculty not found (though it should be)
        const data = await staffService.getAllStaffPaginated(page - 1, size);
        return data;
    };

    const fetchStaffById = async (staffId: string) => {
        try {
            const staff = await staffService.getStaffById(staffId);
            return {
                content: [staff],
                totalPages: 1,
                totalElements: 1,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: false,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast({
                    title: "Not Found",
                    description: "Staff not found",
                    variant: "destructive",
                });
                return {
                    content: [],
                    totalPages: 0,
                    totalElements: 0,
                    last: true,
                    size: 1,
                    number: 0,
                    first: true,
                    empty: true,
                };
            }
            throw error;
        }
    };

    const fetchStaffByEmail = async (email: string) => {
        try {
            const staff = await staffService.getStaffByEmail(email);
            return {
                content: [staff],
                totalPages: 1,
                totalElements: 1,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: false,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast({
                    title: "Not Found",
                    description: "Staff with this email not found",
                    variant: "destructive",
                });
                return {
                    content: [],
                    totalPages: 0,
                    totalElements: 0,
                    last: true,
                    size: 1,
                    number: 0,
                    first: true,
                    empty: true,
                };
            }
            throw error;
        }
    };

    const fetchLecturersByFaculty = async (facultyId: number) => {
        try {
            const staffList = await staffService.getLecturersByFaculty(facultyId);
            return {
                content: staffList,
                totalPages: 1,
                totalElements: staffList.length,
                last: true,
                size: staffList.length,
                number: 0,
                first: true,
                empty: staffList.length === 0,
            };
        } catch (error) {
            console.error(error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: true,
            };
        }
    };

    const fetchLecturersByDepartment = async (departmentId: number) => {
        try {
            const staffList = await staffService.getLecturersByDepartment(departmentId);
            return {
                content: staffList,
                totalPages: 1,
                totalElements: staffList.length,
                last: true,
                size: staffList.length,
                number: 0,
                first: true,
                empty: staffList.length === 0,
            };
        } catch (error) {
            console.error(error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: true,
            };
        }
    };

    const fetchLevelAdvisers = async (departmentId: number) => {
        try {
            const staffList = await staffRoleService.getLevelAdvisers(departmentId);
            return {
                content: staffList,
                totalPages: 1,
                totalElements: staffList.length,
                last: true,
                size: staffList.length,
                number: 0,
                first: true,
                empty: staffList.length === 0,
            };
        } catch (error) {
            console.error(error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: true,
            };
        }
    };

    const isEmail = (query: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    };

    const {
        data,
        isPending: isLoading,
        isError,
        error,
        isPlaceholderData,
    } = useQuery({
        queryKey: debouncedSearch
            ? ["staffs", "search", debouncedSearch, selectedDepartment]
            : selectedDepartment !== "all"
                ? ["staffs", "department", selectedDepartment, showLevelAdvisers]
                : showSenateMembers
                    ? ["staffs", "senate"]
                    : selectedFaculty !== "all"
                        ? ["staffs", "faculty", selectedFaculty]
                        : ["staffs", currentPage, ITEMS_PER_PAGE],
        queryFn: async () => {
            if (debouncedSearch) {
                if (isEmail(debouncedSearch)) {
                    return fetchStaffByEmail(debouncedSearch);
                }
                const searchResults = await staffService.searchStaff(
                    debouncedSearch,
                    selectedDepartment !== "all" ? Number(selectedDepartment) : undefined
                );
                return {
                    content: searchResults,
                    totalPages: 1,
                    totalElements: searchResults.length,
                    last: true,
                    size: searchResults.length,
                    number: 0,
                    first: true,
                    empty: searchResults.length === 0,
                };
            }

            if (selectedDepartment !== "all") {
                if (showLevelAdvisers) {
                    return fetchLevelAdvisers(Number(selectedDepartment));
                }
                return fetchLecturersByDepartment(Number(selectedDepartment));
            }

            if (showSenateMembers) {
                return fetchStaffs(currentPage, ITEMS_PER_PAGE);
            }

            if (selectedFaculty !== "all") {
                return fetchLecturersByFaculty(Number(selectedFaculty));
            }

            return fetchStaffs(currentPage, ITEMS_PER_PAGE);
        },
        placeholderData: (debouncedSearch || selectedFaculty !== "all" || selectedDepartment !== "all" || showSenateMembers) ? undefined : keepPreviousData,
        staleTime: 60000,
    });

    const staffs = data?.content.map((item: any) => {
        // Resolve the primary object (either direct item, item.user, or item.staff)
        let primaryObj = item.user || item.staff || item || {};

        // If the primary object itself has a 'user' property, that's likely where the details are
        // This handles cases like: item.staff = { user: { ...details... } }
        const user = primaryObj.user || primaryObj;

        const roles = Array.isArray(user.roles)
            ? user.roles.map((role: any) => typeof role === 'string' ? role : role?.name || 'Unknown')
            : [];

        // Provide fallbacks for title and ID
        // Title might be on item, primaryObj (staff), or user
        const titleObj = item.title || primaryObj.title || user.title;
        const title = titleObj?.title || titleObj || "N/A";

        // ID might be on item (Staff ID), primaryObj (Staff ID), or user (User ID)
        const id = item.id || primaryObj.id || user.id;

        return {
            id: id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            userId: user.userId || primaryObj.userId,
            email: user.email,
            roles: roles,
            enabled: user.enabled ?? false,
            senate: item.senate || primaryObj.senate || user.senate,
            title: title
        } as Staff & { senate?: string, title?: string };
    }) || [];

    const totalPages = data?.totalPages || 0;

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleStaffCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["staffs"] });
    };

    return (
        <div className="flex flex-col space-y-4 p-2 md:p-4 lg:p-6 h-full min-h-0">
            {/* Only pass onAddStaff if user has permission. StaffHeader needs to handle undefined onAddStaff or we wrap it */}
            <StaffHeader onAddStaff={canCreateStaff ? () => setIsCreateModalOpen(true) : undefined} />

            <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden min-h-0">
                <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <UserCog className="h-6 w-6 text-primary" />
                                Official Registry
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                Comprehensive list of registered ODEL personnel
                            </CardDescription>
                        </div>
                        <StaffFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            debouncedSearch={debouncedSearch}
                            isLoading={isLoading}
                            faculties={faculties}
                            selectedFaculty={selectedFaculty}
                            onFacultyChange={setSelectedFaculty}
                            departments={filteredDepartments}
                            selectedDepartment={selectedDepartment}
                            onDepartmentChange={setSelectedDepartment}
                            showLevelAdvisers={showLevelAdvisers}
                            onShowLevelAdvisersChange={setShowLevelAdvisers}
                            showSenateMembers={showSenateMembers}
                            onShowSenateMembersChange={setShowSenateMembers}
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-auto flex-1 min-h-0">
                    <div className="min-w-[900px]">
                        {showLevelAdvisers ? (
                            <LevelAdviserTable
                                advisers={(data?.content as any) || []}
                                isLoading={isLoading}
                                isError={isError}
                                error={error}
                                onRemove={async (id) => {

                                }}
                            />
                        ) : (
                            <StaffTable
                                staffs={staffs}
                                isLoading={isLoading}
                                isError={isError}
                                error={error}
                                isPlaceholderData={isPlaceholderData}
                                currentPage={currentPage}
                                itemsPerPage={ITEMS_PER_PAGE}
                                canUpdateStaff={canUpdateStaff}
                                canMakeFacultyExamOfficer={canMakeFacultyExamOfficer}
                                canMakeDepartmentExamOfficer={canMakeDepartmentExamOfficer}
                                canMakeDean={canMakeDean}
                                canMakeHOD={canMakeHOD}
                                canMakeSenate={canMakeSenate}
                                canMakeVC={canMakeVC}
                                canMakeDvcAcademic={canMakeDvcAcademic}
                                canMakeDvcAdministration={canMakeDvcAdministration}
                                canMakeBursar={canMakeBursar}
                                canMakeRegistrar={canMakeRegistrar}
                                canMakeAcademicSecretary={canMakeAcademicSecretary}
                                onEditStaff={(staff) => {
                                    setSelectedStaff(staff);
                                    setIsUpdateModalOpen(true);
                                }}
                                onViewCourses={(staff) => {
                                    setSelectedStaff(staff);
                                    setIsViewCoursesModalOpen(true);
                                }}
                                onViewApprovals={(staff) => {
                                    setSelectedStaff(staff);
                                    setIsViewCourseApprovalsModalOpen(true);
                                }}
                                onMakeLevelAdviser={(staff) => {
                                    setSelectedStaff(staff);
                                    setIsMakeLevelAdviserModalOpen(true);
                                }}
                                onMakeHod={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as HOD?`)) {
                                        try {
                                            await staffRoleService.makeHod(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as HOD.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to make HOD.",
                                            });
                                        }
                                    }
                                }}
                                onUnmakeHod={async (staff) => {
                                    if (window.confirm(`Are you sure you want to remove HOD role from ${staff.name}?`)) {
                                        try {
                                            await staffRoleService.unmakeHod(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully removed as HOD.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to remove HOD role.",
                                            });
                                        }
                                    }
                                }}
                                onMakeVC={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as Vice Chancellor?`)) {
                                        try {
                                            await staffRoleService.makeVC(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Vice Chancellor.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to appoint VC.",
                                            });
                                        }
                                    }
                                }}
                                onMakeDvcAcademic={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as DVC (Academics)?`)) {
                                        try {
                                            await staffRoleService.makeDvcAcademic(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as DVC (Academics).",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to appoint DVC (Academics).",
                                            });
                                        }
                                    }
                                }}
                                onMakeDvcAdministration={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as DVC (Administration)?`)) {
                                        try {
                                            await staffRoleService.makeDvcAdministration(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as DVC (Administration).",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to appoint DVC (Administration).",
                                            });
                                        }
                                    }
                                }}
                                onMakeBursar={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as Bursar?`)) {
                                        try {
                                            await staffRoleService.makeBursar(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Bursar.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to appoint Bursar.",
                                            });
                                        }
                                    }
                                }}
                                onMakeAcademicSecretary={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as Academic Secretary?`)) {
                                        try {
                                            await staffRoleService.makeAcademicSecretary(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Academic Secretary.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to appoint Academic Secretary.",
                                            });
                                        }
                                    }
                                }}
                                onMakeSenate={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as a Senate Member?`)) {
                                        try {
                                            await staffRoleService.makeSenate(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Senate Member.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to make Senate Member.",
                                            });
                                        }
                                    }
                                }}
                                onUnmakeSenate={async (staff) => {
                                    if (window.confirm(`Are you sure you want to remove Senate role from ${staff.name}?`)) {
                                        try {
                                            await staffRoleService.unmakeSenate(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully removed from Senate.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to remove Senate role.",
                                            });
                                        }
                                    }
                                }}
                                onMakeRegistrar={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as Registrar?`)) {
                                        try {
                                            await staffRoleService.makeRegistrar(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Registrar.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error?.response?.data?.message || "Failed to make Registrar.",
                                            });
                                        }
                                    }
                                }}
                                onMakeFacultyExamOfficer={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as Faculty Exam Officer?`)) {
                                        try {
                                            await staffRoleService.makeFacultyExamOfficer(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Faculty Exam Officer.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to make Faculty Exam Officer.",
                                            });
                                        }
                                    }
                                }}
                                onMakeDean={async (staff) => {
                                    if (window.confirm(`Are you sure you want to appoint ${staff.name} as Faculty Dean?`)) {
                                        try {
                                            await staffRoleService.makeDean(staff.userId);
                                            toast({
                                                title: "Success",
                                                description: "Staff has been successfully appointed as Faculty Dean.",
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["staffs"] });
                                        } catch (error: any) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error",
                                                description: error.message || "Failed to make Faculty Dean.",
                                            });
                                        }
                                    }
                                }}
                                onMakeDepartmentExamOfficer={(staff) => {
                                    setSelectedStaff(staff);
                                    setIsMakeDepartmentExamOfficerModalOpen(true);
                                }}
                            />
                        )}
                    </div>
                </CardContent>

                <StaffPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </Card>

            <StaffModals
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                isUpdateModalOpen={isUpdateModalOpen}
                setIsUpdateModalOpen={setIsUpdateModalOpen}
                isViewCoursesModalOpen={isViewCoursesModalOpen}
                setIsViewCoursesModalOpen={setIsViewCoursesModalOpen}
                isViewCourseApprovalsModalOpen={isViewCourseApprovalsModalOpen}
                setIsViewCourseApprovalsModalOpen={setIsViewCourseApprovalsModalOpen}
                isMakeLevelAdviserModalOpen={isMakeLevelAdviserModalOpen}
                setIsMakeLevelAdviserModalOpen={setIsMakeLevelAdviserModalOpen}
                isMakeDepartmentExamOfficerModalOpen={isMakeDepartmentExamOfficerModalOpen}
                setIsMakeDepartmentExamOfficerModalOpen={setIsMakeDepartmentExamOfficerModalOpen}
                selectedStaff={selectedStaff}
                onRefresh={handleStaffCreated}
            />
        </div>
    );
};

export default StaffList;
