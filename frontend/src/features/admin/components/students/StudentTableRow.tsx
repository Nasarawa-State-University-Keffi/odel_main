import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    FileText,
    Ban,
    AlertTriangle,
    Mail,
    MoreVertical,
    ArrowUp
} from "lucide-react";
import { Student } from "@/features/admin/types/student";


interface StudentTableRowProps {
    student: Student;
    index: number;
    onViewDetails: (student: Student) => void;
    onSuspend?: (student: Student) => void;
    onRusticate?: (student: Student) => void;
    onWithdraw?: (student: Student) => void;
    onRegenerateMatric?: (student: Student) => void;
    onProbate?: (student: Student) => void;
    onDowngrade?: (student: Student) => void;
    onUpgrade?: (student: Student) => void;
}

const StudentTableRow = ({
    student,
    index,
    onViewDetails,
    onSuspend,
    onRusticate,
    onWithdraw,
    onRegenerateMatric,
    onProbate,
    onDowngrade,
    onUpgrade,
}: StudentTableRowProps) => {
    return (
        <TableRow
            className="group hover:bg-primary/5 transition-colors border-b-border/30"
        >
            <TableCell className="px-3 md:px-6 py-5 font-mono text-[10px] font-bold text-muted-foreground/60">
                {index + 1}
            </TableCell>

            <TableCell className="px-3 md:px-6 py-5">
                <div className="flex flex-col">
                    <span className="font-black text-sm text-foreground/90 group-hover:text-primary transition-colors">
                        {student.lastName} {student.firstName} {student.middleName}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 mt-0.5">
                        <Mail className="h-2.5 w-2.5" />
                        <span className="lowercase">{student.email}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-3 md:px-6 py-5">
                <span className="font-mono text-xs font-bold text-foreground/80">
                    {student.userId || "N/A"}
                </span>
            </TableCell>

            <TableCell className="px-3 md:px-6 py-5 hidden md:table-cell">
                <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit text-[10px] font-bold bg-muted/50">
                        {student.level?.title || "N/A"}
                    </Badge>
                    <span className="text-[10px] font-medium text-muted-foreground">
                        {student.programme?.programmeType?.name || "N/A"}
                    </span>
                </div>
            </TableCell>

            <TableCell className="px-3 md:px-6 py-5">
                <Badge
                    variant={student.user?.enabled ? "default" : "secondary"}
                    className={`text-[10px] font-black uppercase tracking-wider ${!student.user?.enabled ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20"
                        }`}
                >
                    {student.user?.enabled ? "Active" : "Inactive"}
                </Badge>
            </TableCell>

            <TableCell className="px-3 md:px-6 py-5 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            <MoreVertical className="h-3.5 w-3.5" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-border/50">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-1.5">Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => onViewDetails(student)}
                            className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            View Details
                        </DropdownMenuItem>
                        {(onSuspend || onRusticate || onWithdraw) && (
                            <>
                                {onSuspend && (
                                    <DropdownMenuItem
                                        className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-destructive cursor-pointer text-destructive/80 hover:text-destructive"
                                        onClick={() => onSuspend(student)}
                                    >
                                        <Ban className="h-3.5 w-3.5" />
                                        Suspend Student
                                    </DropdownMenuItem>
                                )}
                                {onRusticate && (
                                    <DropdownMenuItem
                                        className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-destructive cursor-pointer text-destructive/80 hover:text-destructive"
                                        onClick={() => onRusticate(student)}
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Rusticate Student
                                    </DropdownMenuItem>
                                )}
                                {onRegenerateMatric && (
                                    <DropdownMenuItem
                                        onClick={() => onRegenerateMatric(student)}
                                        className="group flex items-center gap-2 text-[11px] font-bold text-muted-foreground focus:text-primary focus:bg-primary/5 cursor-pointer py-2 rounded-lg"
                                    >
                                        <div className="h-6 w-6 rounded-md bg-muted group-focus:bg-primary/20 flex items-center justify-center transition-colors">
                                            <FileText className="h-3.5 w-3.5" />
                                        </div>
                                        Regenerate Matric
                                    </DropdownMenuItem>
                                )}
                                {onProbate && (
                                    <DropdownMenuItem
                                        onClick={() => onProbate(student)}
                                        className="group flex items-center gap-2 text-[11px] font-bold text-muted-foreground focus:text-destructive focus:bg-destructive/5 cursor-pointer py-2 rounded-lg"
                                    >
                                        <div className="h-6 w-6 rounded-md bg-muted group-focus:bg-destructive/20 flex items-center justify-center transition-colors">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                        </div>
                                        Probate Student
                                    </DropdownMenuItem>
                                )}
                                {onDowngrade && (
                                    <DropdownMenuItem
                                        onClick={() => onDowngrade(student)}
                                        className="group flex items-center gap-2 text-[11px] font-bold text-muted-foreground focus:text-destructive focus:bg-destructive/5 cursor-pointer py-2 rounded-lg"
                                    >
                                        <div className="h-6 w-6 rounded-md bg-muted group-focus:bg-destructive/20 flex items-center justify-center transition-colors">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                        </div>
                                        Downgrade Level
                                    </DropdownMenuItem>
                                )}
                                {onUpgrade && (
                                    <DropdownMenuItem
                                        onClick={() => onUpgrade(student)}
                                        className="group flex items-center gap-2 text-[11px] font-bold text-muted-foreground focus:text-primary focus:bg-primary/5 cursor-pointer py-2 rounded-lg"
                                    >
                                        <div className="h-6 w-6 rounded-md bg-muted group-focus:bg-primary/20 flex items-center justify-center transition-colors">
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </div>
                                        Upgrade Level
                                    </DropdownMenuItem>
                                )}
                                {onWithdraw && (
                                    <DropdownMenuItem
                                        className="rounded-lg h-9 font-bold text-xs gap-2 focus:bg-primary/10 focus:text-destructive cursor-pointer text-destructive/80 hover:text-destructive"
                                        onClick={() => onWithdraw(student)}
                                    >
                                        <Ban className="h-3.5 w-3.5" />
                                        Withdraw Student
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell >
        </TableRow >
    );
};

export default StudentTableRow;
