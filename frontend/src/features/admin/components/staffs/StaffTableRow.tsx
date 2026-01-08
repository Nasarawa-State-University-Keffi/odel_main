import { MoreHorizontal, Edit, User, Mail, BookOpen, GraduationCap, Crown, Landmark, Scroll, Briefcase, ClipboardCheck, School, BookCheck, X } from "lucide-react";
import { TableRow, TableCell } from "@/features/admin/components/admission/components/ui/table";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/features/admin/components/admission/components/ui/dropdown-menu";
import { Staff } from "../../types/staff";

interface StaffTableRowProps {
    staff: Staff & { senate?: string; title?: string };
    index: number;
    isPlaceholderData: boolean;
    currentPage: number;
    itemsPerPage: number;

    onEditStaff: (staff: Staff) => void;
    onViewCourses?: (staff: Staff) => void;
    onViewApprovals?: (staff: Staff) => void;
    onMakeLevelAdviser?: (staff: Staff) => void;
    onUnmakeHod?: (staff: Staff) => void;
    onMakeHod?: (staff: Staff) => void;
    onMakeVC?: (staff: Staff) => void;
    onMakeDvcAcademic?: (staff: Staff) => void;
    onMakeDvcAdministration?: (staff: Staff) => void;
    onMakeBursar?: (staff: Staff) => void;
    onMakeSenate?: (staff: Staff) => void;
    onUnmakeSenate?: (staff: Staff) => void;
    onMakeRegistrar?: (staff: Staff) => void;
    onMakeFacultyExamOfficer?: (staff: Staff) => void;
    onMakeDean?: (staff: Staff) => void;
    onMakeDepartmentExamOfficer?: (staff: Staff) => void;
    onMakeAcademicSecretary?: (staff: Staff) => void;
    canUpdateStaff?: boolean;
    canMakeFacultyExamOfficer?: boolean;
    canMakeDepartmentExamOfficer?: boolean;
    canMakeDean?: boolean;
    canMakeHOD?: boolean;
    canMakeVC?: boolean;
    canMakeDvcAcademic?: boolean;
    canMakeDvcAdministration?: boolean;
    canMakeBursar?: boolean;
    canMakeSenate?: boolean;
    canMakeRegistrar?: boolean;
    canMakeAcademicSecretary?: boolean;
}

const StaffTableRow = ({
    staff,
    index,
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
    canMakeVC,
    canMakeDvcAcademic,
    canMakeDvcAdministration,
    canMakeBursar,
    canMakeSenate,
    canMakeRegistrar,
    canMakeAcademicSecretary
}: StaffTableRowProps) => {
    return (
        <TableRow
            className={`group hover:bg-primary/5 transition-colors border-b-border/30 ${isPlaceholderData ? 'opacity-50' : ''}`}
        >
            <TableCell className="px-6 py-5 font-mono text-[10px] font-bold text-muted-foreground/60">
                {(currentPage - 1) * itemsPerPage + index + 1}
            </TableCell>

            <TableCell className="px-6 py-5">
                <Badge variant="outline" className="font-bold text-[10px] bg-muted/50 border-border/50">
                    {staff.title || "N/A"}
                </Badge>
            </TableCell>

            <TableCell className="px-6 py-5">
                <div className="flex flex-col">
                    <span className="font-black text-sm text-foreground/90 group-hover:text-primary transition-colors">
                        {staff.name || `${staff.firstName} ${staff.lastName}`}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                        <User className="h-2.5 w-2.5" />
                        {staff.userId || "No ID Recorded"}
                    </span>
                </div>
            </TableCell>

            <TableCell className="px-6 py-5">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 lowercase">
                    <Mail className="h-3 w-3 opacity-40 shrink-0" />
                    <span className="truncate max-w-[180px]" title={staff.email}>{staff.email || "N/A"}</span>
                </div>
            </TableCell>

            <TableCell className="px-6 py-5">
                {staff.roles && staff.roles.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg shadow-sm">
                            {staff.roles[0].replace("_", " ")}
                        </Badge>
                        {staff.roles.length > 1 && (
                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground border-border/50 px-1.5 py-0.5">
                                +{staff.roles.length - 1} more
                            </Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">No Access Level</span>
                )}
            </TableCell>

            <TableCell className="text-right px-6 py-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm border opacity-0 group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-border/50 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-1.5">Administration</DropdownMenuLabel>
                        {canUpdateStaff && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onEditStaff(staff)}
                            >
                                <Edit className="h-3.5 w-3.5" />
                                Modify Profile
                            </DropdownMenuItem>
                        )}
                        {onViewCourses && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onViewCourses(staff)}
                            >
                                <BookOpen className="h-3.5 w-3.5" />
                                View Assigned Courses
                            </DropdownMenuItem>
                        )}
                        {onViewApprovals && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onViewApprovals(staff)}
                            >
                                <BookCheck className="h-3.5 w-3.5" />
                                View Course Approvals
                            </DropdownMenuItem>
                        )}
                        {onMakeLevelAdviser && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeLevelAdviser(staff)}
                            >
                                <GraduationCap className="h-3.5 w-3.5" />
                                Make Level Adviser
                            </DropdownMenuItem>
                        )}
                        {onMakeHod && canMakeHOD && (!staff.roles || !staff.roles.some((role: any) => role === "HOD")) && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeHod(staff)}
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                Make HOD
                            </DropdownMenuItem>
                        )}
                        {onUnmakeHod && canMakeHOD && staff.roles && staff.roles.some((role: any) => role === "HOD") && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-destructive cursor-pointer text-destructive/80 hover:text-destructive"
                                onClick={() => onUnmakeHod(staff)}
                            >
                                <X className="h-3.5 w-3.5" />
                                Unmake HOD
                            </DropdownMenuItem>
                        )}
                        {onMakeVC && canMakeVC && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeVC(staff)}
                            >
                                <Crown className="h-3.5 w-3.5" />
                                Make Vice Chancellor
                            </DropdownMenuItem>
                        )}
                        {onMakeDvcAcademic && canMakeDvcAcademic && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeDvcAcademic(staff)}
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                Make DVC (Academics)
                            </DropdownMenuItem>
                        )}
                        {onMakeDvcAdministration && canMakeDvcAdministration && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeDvcAdministration(staff)}
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                Make DVC (Administration)
                            </DropdownMenuItem>
                        )}
                        {onMakeBursar && canMakeBursar && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeBursar(staff)}
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                Make Bursar
                            </DropdownMenuItem>
                        )}
                        {onMakeSenate && canMakeSenate && (!staff.roles || !staff.roles.some((role: any) => role === "SENATE")) && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeSenate(staff)}
                            >
                                <Landmark className="h-3.5 w-3.5" />
                                Make Senate Member
                            </DropdownMenuItem>
                        )}
                        {onUnmakeSenate && canMakeSenate && staff.roles && staff.roles.some((role: any) => role === "SENATE") && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-destructive cursor-pointer text-destructive/80 hover:text-destructive"
                                onClick={() => onUnmakeSenate(staff)}
                            >
                                <X className="h-3.5 w-3.5" />
                                Unmake Senate
                            </DropdownMenuItem>
                        )}
                        {onMakeRegistrar && canMakeRegistrar && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeRegistrar(staff)}
                            >
                                <Scroll className="h-3.5 w-3.5" />
                                Make Registrar
                            </DropdownMenuItem>
                        )}
                        {onMakeFacultyExamOfficer && canMakeFacultyExamOfficer && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeFacultyExamOfficer(staff)}
                            >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Make Exam Officer
                            </DropdownMenuItem>
                        )}
                        {onMakeDean && canMakeDean && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeDean(staff)}
                            >
                                <School className="h-3.5 w-3.5" />
                                Make Faculty Dean
                            </DropdownMenuItem>
                        )}
                        {onMakeDepartmentExamOfficer && canMakeDepartmentExamOfficer && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeDepartmentExamOfficer(staff)}
                            >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Make Department Exam Officer
                            </DropdownMenuItem>
                        )}
                        {onMakeAcademicSecretary && canMakeAcademicSecretary && (
                            <DropdownMenuItem
                                className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                onClick={() => onMakeAcademicSecretary(staff)}
                            >
                                <BookCheck className="h-3.5 w-3.5" />
                                Make Academic Secretary
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow >
    );
};

export default StaffTableRow;
