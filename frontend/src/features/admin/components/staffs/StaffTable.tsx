import { ShieldCheck, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StaffTableRow from "./StaffTableRow";
import { Staff } from "../../types/staff";

interface StaffTableProps {
    staffs: (Staff & { senate?: string; title?: string })[];
    isLoading: boolean;
    isError: boolean;
    error: any;
    isPlaceholderData: boolean;
    currentPage: number;
    itemsPerPage: number;
    onEditStaff: (staff: Staff) => void;

    // View Courses Action
    onViewCourses?: (staff: Staff) => void;
    // View Course Approvals Action
    onViewApprovals?: (staff: Staff) => void;
    // Make Level Adviser Action
    onMakeLevelAdviser?: (staff: Staff) => void;
    // Unmake HOD Action
    onUnmakeHod?: (staff: Staff) => void;
    // Make HOD Action
    onMakeHod?: (staff: Staff) => void;
    // Make VC Action
    onMakeVC?: (staff: Staff) => void;
    // Make DVC (Academic) Action
    onMakeDvcAcademic?: (staff: Staff) => void;
    // Make DVC (Administration) Action
    onMakeDvcAdministration?: (staff: Staff) => void;
    // Make Bursar Action
    onMakeBursar?: (staff: Staff) => void;
    // Make Senate Action
    onMakeSenate?: (staff: Staff) => void;
    // Unmake Senate Action
    onUnmakeSenate?: (staff: Staff) => void;
    // Make Registrar Action
    onMakeRegistrar?: (staff: Staff) => void;
    // Make Faculty Exam Officer Action
    onMakeFacultyExamOfficer?: (staff: Staff) => void;
    // Make Dean Action
    onMakeDean?: (staff: Staff) => void;
    // Make Department Exam Officer Action
    onMakeDepartmentExamOfficer?: (staff: Staff) => void;
    // Make Academic Secretary Action
    onMakeAcademicSecretary?: (staff: Staff) => void;

    // Role-Based Permissions
    canUpdateStaff?: boolean;
    canMakeFacultyExamOfficer?: boolean;
    canMakeDepartmentExamOfficer?: boolean;
    canMakeDean?: boolean;
    canMakeHOD?: boolean;
    canMakeSenate?: boolean;
    canMakeVC?: boolean;
    canMakeDvcAcademic?: boolean;
    canMakeDvcAdministration?: boolean;
    canMakeBursar?: boolean;
    canMakeRegistrar?: boolean;
    canMakeAcademicSecretary?: boolean;
}

const StaffTable = ({
    staffs,
    isLoading,
    isError,
    error,
    isPlaceholderData,
    currentPage,
    itemsPerPage,
    onEditStaff,
    onViewCourses,
    onViewApprovals,
    onMakeLevelAdviser,
    onUnmakeHod,
    onMakeHod,
    onMakeVC,
    onMakeDvcAcademic,
    onMakeDvcAdministration,
    onMakeBursar,
    onMakeSenate,
    onUnmakeSenate,
    onMakeRegistrar,
    onMakeFacultyExamOfficer,
    onMakeDean,
    onMakeDepartmentExamOfficer,
    onMakeAcademicSecretary,
    canUpdateStaff,
    canMakeFacultyExamOfficer,
    canMakeDepartmentExamOfficer,
    canMakeDean,
    canMakeHOD,
    canMakeSenate,
    canMakeVC,
    canMakeDvcAcademic,
    canMakeDvcAdministration,
    canMakeBursar,
    canMakeRegistrar,
    canMakeAcademicSecretary
}: StaffTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/95 backdrop-blur hover:bg-muted/95 border-b-border/50 sticky top-0 z-20 shadow-sm">
                    <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest px-6 h-14">S/N</TableHead>
                    <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest px-6 h-14">Title</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-14">Personal Info</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-14">Access Email</TableHead>
                    <TableHead className="w-[220px] font-bold text-[10px] uppercase tracking-widest px-6 h-14">Assigned Roles</TableHead>
                    <TableHead className="text-right px-6 h-14">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                            <TableCell className="px-6 py-5"><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell className="px-6 py-5"><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell className="px-6 py-5">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5"><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell className="px-6 py-5"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell className="px-6 py-5"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                        </TableRow>
                    ))
                ) : isError ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center px-6">
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="h-8 w-8 text-rose-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-rose-600">Error retrieving data</p>
                                    <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">
                                        {error?.message || "An unexpected error occurred. Please try again later."}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : staffs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center px-6">
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                    <User className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground">No personnel records</p>
                                    <p className="text-xs text-muted-foreground font-medium">Try adjusting your search criteria.</p>
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    staffs.map((staff, idx) => (
                        <StaffTableRow
                            key={staff.id}
                            staff={staff}
                            index={idx}
                            isPlaceholderData={isPlaceholderData}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            onEditStaff={onEditStaff}
                            onViewCourses={onViewCourses}
                            onViewApprovals={onViewApprovals}
                            onMakeLevelAdviser={onMakeLevelAdviser}
                            onUnmakeHod={onUnmakeHod}
                            onMakeHod={onMakeHod}
                            onMakeVC={onMakeVC}
                            onMakeDvcAcademic={onMakeDvcAcademic}
                            onMakeDvcAdministration={onMakeDvcAdministration}
                            onMakeBursar={onMakeBursar}
                            onMakeSenate={onMakeSenate}
                            onUnmakeSenate={onUnmakeSenate}
                            onMakeRegistrar={onMakeRegistrar}
                            onMakeFacultyExamOfficer={onMakeFacultyExamOfficer}
                            onMakeDean={onMakeDean}
                            onMakeDepartmentExamOfficer={onMakeDepartmentExamOfficer}
                            onMakeAcademicSecretary={onMakeAcademicSecretary}
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
                        />
                    ))
                )}
            </TableBody>
        </Table>
    );
};

export default StaffTable;
