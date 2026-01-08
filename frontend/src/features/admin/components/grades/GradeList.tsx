import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/admin/components/admission/components/ui/table";
import { Grade } from "@/features/admin/types/grade";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import UpdateGradeModal from "./UpdateGradeModal";
import DeleteGradeButton from "./DeleteGradeButton";

interface GradeListProps {
    grades: Grade[];
    isLoading: boolean;
    programmeTypeId: string;
}

const GradeList = ({ grades, isLoading, programmeTypeId }: GradeListProps) => {
    return (
        <div className="rounded-xl overflow-hidden border border-border/40 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-md">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-border/40">
                            <TableHead className="w-[100px] font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 px-6 text-center">Grade</TableHead>
                            <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4">Score Range</TableHead>
                            <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 text-center">Credit Value</TableHead>
                            <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 text-center">Status</TableHead>
                            <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-b border-border/20">
                                    <TableCell className="py-6 px-6 text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-16 rounded-full mx-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : grades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                            <GraduationCap className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="font-medium text-muted-foreground italic">No grade scale found for this programme type</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            grades.sort((a, b) => a.gradeOrder - b.gradeOrder).map((grade) => (
                                <TableRow key={grade.id} className="group hover:bg-slate-50/80 transition-colors border-b border-border/20">
                                    <TableCell className="py-6 px-6 text-center">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center mx-auto text-sm font-black shadow-sm transition-transform group-hover:scale-110",
                                            grade.title === 'F' ? "bg-red-50 text-red-600 border border-red-100" :
                                                grade.title === 'A' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    "bg-white text-slate-700 border border-slate-200"
                                        )}>
                                            {grade.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-foreground">{grade.range}%</span>
                                            <span className="text-[10px] font-medium text-muted-foreground">Limit: {grade.gradeLimit}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-sm font-bold text-slate-700">{grade.creditValue}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm",
                                            !grade.disabled
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-slate-50 text-slate-500 border-slate-200"
                                        )}>
                                            {!grade.disabled ? "Active" : "Disabled"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <UpdateGradeModal grade={grade} programmeTypeId={programmeTypeId} />
                                            {!grade.disabled && (
                                                <DeleteGradeButton
                                                    gradeId={grade.id}
                                                    gradeTitle={grade.title}
                                                    programmeTypeId={programmeTypeId}
                                                />
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default GradeList;
