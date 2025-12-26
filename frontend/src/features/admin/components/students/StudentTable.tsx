import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { User } from "lucide-react";
import { Student } from "@/features/admin/types/student";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import StudentRegistryHeader from "./StudentRegistryHeader";
import StudentTableRow from "./StudentTableRow";

interface StudentTableProps {
    students: Student[];
    isLoading: boolean;
    isFetching?: boolean;
    onViewDetails: (student: Student) => void;
    onSuspend?: (student: Student) => void;
    onRusticate?: (student: Student) => void;
    onWithdraw?: (student: Student) => void;
    onRegenerateMatric?: (student: Student) => void;
    onProbate?: (student: Student) => void;
    onDowngrade?: (student: Student) => void;
    onUpgrade?: (student: Student) => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    filterAction?: React.ReactNode;
}

const StudentTable = ({
    students,
    isLoading,
    isFetching,
    onViewDetails,
    onSuspend,
    onRusticate,
    onWithdraw,
    onRegenerateMatric,
    onProbate,
    onDowngrade,
    onUpgrade,
    searchQuery,
    onSearchChange,
    filterAction,
}: StudentTableProps) => {
    return (
        <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden w-full max-w-full">
            <StudentRegistryHeader
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                isLoading={isFetching || isLoading}
                filterAction={filterAction}
            />

            <CardContent className="p-0 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/95 backdrop-blur hover:bg-muted/95 border-b-border/50 sticky top-0 z-20 shadow-sm">
                            <TableHead className="w-[60px] md:w-[80px] font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">S/N</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Student Info</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Matric No.</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14 hidden md:table-cell">Academic Level</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Status</TableHead>
                            <TableHead className="text-right px-3 md:px-6 h-14">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell className="px-6 py-5"><Skeleton className="h-4 w-8" /></TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell className="px-6 py-5"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center px-6">
                                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                            <User className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground">No student records</p>
                                            <p className="text-xs text-muted-foreground font-medium">Try adjusting your search criteria.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student, idx) => (
                                <StudentTableRow
                                    key={student.id}
                                    student={student}
                                    index={idx}
                                    onViewDetails={onViewDetails}
                                    onSuspend={onSuspend}
                                    onRusticate={onRusticate}
                                    onWithdraw={onWithdraw}
                                    onRegenerateMatric={onRegenerateMatric}
                                    onProbate={onProbate}
                                    onDowngrade={onDowngrade}
                                    onUpgrade={onUpgrade}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default StudentTable;
