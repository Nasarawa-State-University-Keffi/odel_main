import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/features/admin/services/departmentService";
import { facultyService } from "@/features/admin/services/facultyService";
import { staffService } from "@/features/admin/services/staffService";
import { Department, DepartmentWithHod, Hod } from "@/features/admin/types/department";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/admin/components/admission/components/ui/table";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";
import { Card } from "@/features/admin/components/admission/components/ui/card";
import { User, Users, Plus, Search, Filter, Settings2, Building2, Trash2, Loader2, AlertTriangle, MoreHorizontal, X, Lock, Unlock, CalendarClock, GraduationCap, BookOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/features/admin/components/admission/components/ui/alert";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Switch } from "@/features/admin/components/admission/components/ui/switch";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import CreateDepartmentModal from "./CreateDepartmentModal";
import SetSignatureModal from "./SetSignatureModal";
import ScheduleUploadClosingModal from "./ScheduleUploadClosingModal";
import RunGraduationModal from "./RunGraduationModal";
import ViewSemesterSettingsModal from "./ViewSemesterSettingsModal";
import ManageSSCESubjectsModal from "./ManageSSCESubjectsModal";
import ManageQualificationsModal from "./ManageQualificationsModal";
import { PenTool } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/features/admin/components/admission/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/admin/components/admission/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/features/admin/components/admission/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/features/admin/components/admission/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/admin/components/admission/components/ui/select";




const ITEMS_PER_PAGE = 10;





const DepartmentList = () => {
    const { hasRole, user } = useAuth();
    const [showHods, setShowHods] = useState(false);
    const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [deletingDept, setDeletingDept] = useState<Department | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedHodId, setSelectedHodId] = useState<string>("all");
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [schedulingDeptId, setSchedulingDeptId] = useState<number | null>(null);
    const [isGraduationModalOpen, setIsGraduationModalOpen] = useState(false);
    const [graduationDeptId, setGraduationDeptId] = useState<number | null>(null);
    const [isViewSettingsModalOpen, setIsViewSettingsModalOpen] = useState(false);
    const [viewSettingsDeptId, setViewSettingsDeptId] = useState<number | null>(null);
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
    const [subjectsDeptId, setSubjectsDeptId] = useState<number | null>(null);

    const [isQualificationsModalOpen, setIsQualificationsModalOpen] = useState(false);
    const [qualificationsDept, setQualificationsDept] = useState<Department | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const openResultAccessMutation = useMutation({
        mutationFn: (id: number) => departmentService.openResultAccess(id),
        onSuccess: () => {
            toast({ title: "Success", description: "Result access opened for moderation." });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 403) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You do not have permission to perform this action. Only the HOD of this department can open result access."
                });
            } else if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Department not found."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to open result access. Please try again."
                });
            }
        }
    });

    const handleOpenResultAccess = (id: number) => {
        if (window.confirm("Are you sure you want to open result access for all lecturers in this department?")) {
            openResultAccessMutation.mutate(id);
        }
    };

    const closeResultAccessMutation = useMutation({
        mutationFn: (id: number) => departmentService.closeResultAccess(id),
        onSuccess: () => {
            toast({ title: "Success", description: "Result access closed." });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 403) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You do not have permission to perform this action. Only the HOD of this department can close result access."
                });
            } else if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Department not found."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to close result access. Please try again."
                });
            }
        }
    });

    const handleCloseResultAccess = (id: number) => {
        if (window.confirm("Are you sure you want to close result access explicitly for all lecturers in this department?")) {
            closeResultAccessMutation.mutate(id);
        }
    };

    const _ignore = [AlertCircle, Users, Filter, Trash2, Loader2, AlertTriangle];

    const { data: faculties } = useQuery({
        queryKey: ["faculties"],
        queryFn: facultyService.getAllFaculties,
        staleTime: 10 * 60 * 1000,
    });

    const odelFacultyId = useMemo(() => {
        if (!faculties) return null;
        return faculties.find(f =>
            f.name.toLowerCase().includes("odel") ||
            f.name.toLowerCase().includes("open") ||
            f.name.toLowerCase().includes("distance")
        )?.id;
    }, [faculties]);

    const { data, isLoading, isError, error, isFetching } = useQuery<(Department | DepartmentWithHod)[], Error>({
        queryKey: ["departments", { withHods: showHods, accessibleOnly: showAccessibleOnly, userId: user?.userId, facultyId: odelFacultyId }],
        queryFn: async () => {
            if (showAccessibleOnly && user?.userId) {
                if (odelFacultyId) {
                    return await departmentService.getDepartmentsForCurrentUserByFaculty(user.userId, odelFacultyId);
                }
                return await departmentService.getDepartmentsForCurrentUser(user.userId);
            }
            return showHods
                ? await departmentService.getAllDepartmentsWithHods()
                : await departmentService.getAllDepartments();
        },
    });

    const { data: hods } = useQuery<Hod[], Error>({
        queryKey: ["hods"],
        queryFn: departmentService.getHODs,
        staleTime: 5 * 60 * 1000,
    });

    const filteredDepartments = useMemo(() => {
        if (!data) return [];
        let items = data as (Department | DepartmentWithHod)[];

        // HOD Filter
        if (selectedHodId && selectedHodId !== "all") {
            items = items.filter((item) => {
                const dept = 'department' in item ? (item as DepartmentWithHod).department : (item as Department);
                if (!dept) return false;

                const relevantHod = hods?.find(h => h.id.toString() === selectedHodId);
                return dept.id === relevantHod?.department.id;
            });
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            items = items.filter((item) => {
                const dept = 'department' in item ? (item as DepartmentWithHod).department : (item as Department);

                return (
                    dept?.name.toLowerCase().includes(lowerQuery) ||
                    dept?.code.toLowerCase().includes(lowerQuery) ||
                    dept?.faculty?.name?.toLowerCase().includes(lowerQuery) ||
                    false
                );
            });
        }


        if (!showAccessibleOnly) {
            items = items.filter((item) => {
                const dept = 'department' in item ? (item as DepartmentWithHod).department : (item as Department);
                if (!dept) return false;

                const facultyName = dept.faculty?.name?.toLowerCase() || "";
                const deptName = dept.name.toLowerCase();

                return facultyName.includes("odel") || deptName.includes("odel");
            });
        }

        return items;
    }, [data, searchQuery, selectedHodId, hods, showAccessibleOnly]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedHodId !== "all") count++;
        if (showAccessibleOnly) count++;
        if (showHods) count++;
        return count;
    }, [selectedHodId, showAccessibleOnly, showHods]);

    const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
    const paginatedDepartments = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDepartments.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredDepartments, currentPage]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleCreate = () => {
        setEditingDepartment(null);
        setIsCreateModalOpen(true);
    };

    const handleEdit = (dept: Department) => {
        setEditingDepartment(dept);
        setIsCreateModalOpen(true);
    };

    // DELETE LOGIC
    const confirmDelete = (dept: Department) => {
        setDeletingDept(dept);
        setIsDeleteDialogOpen(true);
    };

    const deleteMutation = useMutation({
        mutationFn: (id: number) => departmentService.deleteDepartment(id),
        onSuccess: () => {
            toast({ title: "Success", description: "Department deleted successfully." });
            setIsDeleteDialogOpen(false);
            setDeletingDept(null);
            queryClient.invalidateQueries({ queryKey: ["departments"] });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 422) {
                toast({
                    variant: "destructive",
                    title: "Cannot Delete",
                    description: "This department has registered students. Please remove them first."
                });
            } else if (status === 403) {
                toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to delete departments." });
            } else if (status === 404) {
                toast({ variant: "destructive", title: "Not Found", description: "Department already deleted or not found." });
            } else {
                toast({ variant: "destructive", title: "Error", description: "Failed to delete department. Please try again." });
            }
        }
    });

    const handleDelete = () => {
        if (deletingDept) {
            deleteMutation.mutate(deletingDept.id);
        }
    };

    if (isError) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {(error as any)?.response?.data?.message || (error as any)?.message || "Failed to fetch departments."}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        DEPARTMENT <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage ODEL departments, codes, and head of departments.</p>
                </div>
                <div className="flex items-center gap-2">
                    {hasRole('HOD') && (
                        <Button
                            variant="outline"
                            onClick={() => setIsSignatureModalOpen(true)}
                            className="bg-white border-dashed text-slate-700 hover:text-slate-900"
                        >
                            <PenTool className="h-4 w-4 mr-2" />
                            Set Signature
                        </Button>
                    )}
                    <Button
                        onClick={handleCreate}
                        className="bg-[#8cc63f] hover:bg-[#7ab62f] text-white font-bold shadow-md hover:shadow-lg transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Department
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-border/40 shadow-sm bg-white overflow-hidden">
                {/* Registry Header */}
                <div className="p-4 md:p-6 border-b border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-[#8cc63f]" />
                            <h2 className="text-lg font-bold text-foreground">Official Registry</h2>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Comprehensive list of registered ODEL departments
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        {/* Search Group */}
                        <div className="relative flex-1 md:w-64 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search departments..."
                                className="pl-9 h-10 bg-slate-50 border-border/50 focus:bg-white transition-all w-full"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        {/* Filters Group */}
                        {/* Filters Group Consolidation */}
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-10 px-4 border-dashed bg-slate-50/50 hover:bg-slate-100 flex items-center gap-2 font-bold text-xs transition-all relative"
                                    >
                                        <Filter className="h-4 w-4 text-[#8cc63f]" />
                                        <span>Filters</span>
                                        {activeFiltersCount > 0 && (
                                            <Badge
                                                className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-[#8cc63f] text-white border-0 text-[10px] animate-in zoom-in-50"
                                            >
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-5" align="end">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <h4 className="font-black text-sm text-[#0F3F2A] uppercase tracking-wider">Refine Directory</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold">Filter by HOD, accessibility, or view details</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* HOD Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="hod-filter" className="text-[10px] font-black uppercase text-muted-foreground/70">Head of Department</Label>
                                                <div className="flex gap-2">
                                                    <Select value={selectedHodId} onValueChange={setSelectedHodId}>
                                                        <SelectTrigger id="hod-filter" className="h-9 text-xs bg-slate-50/50">
                                                            <SelectValue placeholder="All HODs" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All HODs</SelectItem>
                                                            {hods?.filter(h => h.department.name.toLowerCase().includes("odel")).map((hod) => (
                                                                <SelectItem key={hod.id} value={hod.id.toString()}>
                                                                    {hod.user.firstName} {hod.user.lastName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {selectedHodId !== "all" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 shrink-0 hover:bg-red-50 hover:text-red-500"
                                                            onClick={() => setSelectedHodId("all")}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <DropdownMenuSeparator className="bg-slate-100" />

                                            {/* Toggles */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between group/toggle">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="accessible-only-popover" className="text-xs font-bold cursor-pointer">My Departments</Label>
                                                        <p className="text-[10px] text-muted-foreground font-medium">Show only your assigned units</p>
                                                    </div>
                                                    <Switch
                                                        id="accessible-only-popover"
                                                        checked={showAccessibleOnly}
                                                        onCheckedChange={(checked) => {
                                                            setShowAccessibleOnly(checked);
                                                            setCurrentPage(1);
                                                        }}
                                                        className="data-[state=checked]:bg-[#8cc63f]"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between group/toggle">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="show-hods-popover" className="text-xs font-bold cursor-pointer">Show HOD Details</Label>
                                                        <p className="text-[10px] text-muted-foreground font-medium">Display HOD name in table</p>
                                                    </div>
                                                    <Switch
                                                        id="show-hods-popover"
                                                        checked={showHods}
                                                        onCheckedChange={setShowHods}
                                                        className="data-[state=checked]:bg-[#8cc63f]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {(selectedHodId !== "all" || showAccessibleOnly || showHods) && (
                                            <Button
                                                variant="ghost"
                                                className="w-full h-8 text-[11px] font-black uppercase tracking-widest text-[#8cc63f] hover:text-[#7ab62f] hover:bg-[#8cc63f]/5 border border-dashed border-[#8cc63f]/20"
                                                onClick={() => {
                                                    setSelectedHodId("all");
                                                    setShowAccessibleOnly(false);
                                                    setShowHods(false);
                                                }}
                                            >
                                                Reset All Filters
                                            </Button>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-auto relative h-[65vh]">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 shadow-sm">
                            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border/40">
                                <TableHead className="w-[80px] font-bold text-[11px] uppercase tracking-widest text-muted-foreground h-12">S/N</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground h-12">Department Name</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground h-12">Code</TableHead>
                                {showHods ? (
                                    <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground h-12">Head of Department</TableHead>
                                ) : (
                                    <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground h-12">Faculty</TableHead>
                                )}
                                <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-muted-foreground h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="h-16"><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedDepartments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-96 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                                <Building2 className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="font-medium text-muted-foreground">No departments found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDepartments.map((item: Department | DepartmentWithHod, index: number) => {
                                    const isWithHod = 'hod' in item || 'department' in item;
                                    const dept = isWithHod ? (item as DepartmentWithHod).department : (item as Department);
                                    const hod = isWithHod ? (item as DepartmentWithHod).hod : null;

                                    if (!dept) return null;

                                    const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                                    return (
                                        <TableRow key={dept.id || index} className="group hover:bg-slate-50/50">
                                            <TableCell className="font-medium text-xs text-muted-foreground py-6 pl-4">
                                                {serialNumber}
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground mb-0.5">{dept.name}</span>
                                                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        ID: {dept.id}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                                    {dept.code}
                                                </span>
                                            </TableCell>
                                            {showHods ? (
                                                <TableCell className="py-6">
                                                    {hod ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-[#8cc63f]/10 flex items-center justify-center text-[#8cc63f] font-bold text-xs ring-2 ring-white shadow-sm">
                                                                {hod.user.firstName[0]}{hod.user.lastName[0]}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold">{hod.user.firstName} {hod.user.lastName}</span>
                                                                <span className="text-[11px] text-muted-foreground">{hod.user.email}</span>
                                                                {hod.user.roles && hod.user.roles.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {hod.user.roles.map((role, rIndex) => (
                                                                            <span key={rIndex} className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                                                                {role}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                            Not Assigned
                                                        </span>
                                                    )}
                                                </TableCell>
                                            ) : (
                                                <TableCell className="py-6 text-sm font-medium text-muted-foreground">
                                                    {dept.faculty?.name || "N/A"}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-right py-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {hasRole('HOD') && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleOpenResultAccess(dept.id)} className="cursor-pointer">
                                                                    <Unlock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                    <span>Open Result Access</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleCloseResultAccess(dept.id)} className="cursor-pointer">
                                                                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                    <span>Close Result Access</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    setSchedulingDeptId(dept.id);
                                                                    setIsScheduleModalOpen(true);
                                                                }} className="cursor-pointer">
                                                                    <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                    <span>Schedule Closing</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    setGraduationDeptId(dept.id);
                                                                    setIsGraduationModalOpen(true);
                                                                }} className="cursor-pointer">
                                                                    <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                    <span>Run Graduation</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem onClick={() => {
                                                            setViewSettingsDeptId(dept.id);
                                                            setIsViewSettingsModalOpen(true);
                                                        }} className="cursor-pointer">
                                                            <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <span>View Configuration</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setSubjectsDeptId(dept.id);
                                                            setIsSubjectsModalOpen(true);
                                                        }} className="cursor-pointer">
                                                            <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <span>Add SSCE Requirement</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setQualificationsDept(dept);
                                                            setIsQualificationsModalOpen(true);
                                                        }} className="cursor-pointer">
                                                            <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <span>Allowed Qualifications</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(dept)} className="cursor-pointer">
                                                            <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <span>Edit Department</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                confirmDelete(dept);
                                                            }}
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete Department</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Stats inside Card */}
                {totalPages > 0 && (
                    <div className="border-t border-border/40 p-4 bg-slate-50/30 flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredDepartments.length)} of {filteredDepartments.length} departments
                        </p>
                        <Pagination className="justify-end w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className={`h-8 w-8 p-0 rounded-lg border bg-white ${currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-50"}`}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className={`h-8 w-8 p-0 rounded-lg border bg-white ${currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-50"}`}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Card>

            <CreateDepartmentModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                departmentToEdit={editingDepartment}
            />

            <SetSignatureModal
                open={isSignatureModalOpen}
                onOpenChange={setIsSignatureModalOpen}
            />

            <ScheduleUploadClosingModal
                isOpen={isScheduleModalOpen}
                onClose={() => {
                    setIsScheduleModalOpen(false);
                    setSchedulingDeptId(null);
                }}
                departmentId={schedulingDeptId}
            />

            <RunGraduationModal
                isOpen={isGraduationModalOpen}
                onClose={() => {
                    setIsGraduationModalOpen(false);
                    setGraduationDeptId(null);
                }}
                departmentId={graduationDeptId}
            />

            <ViewSemesterSettingsModal
                isOpen={isViewSettingsModalOpen}
                onClose={() => {
                    setIsViewSettingsModalOpen(false);
                    setViewSettingsDeptId(null);
                }}
                departmentId={viewSettingsDeptId}
            />

            <ManageSSCESubjectsModal
                isOpen={isSubjectsModalOpen}
                onClose={() => {
                    setIsSubjectsModalOpen(false);
                    setSubjectsDeptId(null);
                }}
                departmentId={subjectsDeptId}
            />

            <ManageQualificationsModal
                isOpen={isQualificationsModalOpen}
                onClose={() => {
                    setIsQualificationsModalOpen(false);
                    setQualificationsDept(null);
                }}
                department={qualificationsDept}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Department
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-bold text-foreground">{deletingDept?.name}</span>?
                            This action cannot be undone. You cannot delete a department if it has registered students.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default DepartmentList;

function AlertCircle(props: any) {
    return <User {...props} />;
}
