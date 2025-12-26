import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserX } from "lucide-react";

interface AdmissionResultsTableProps {
    students: any[];
    loading: boolean;
    hasSearched: boolean;
}

const AdmissionResultsTable = ({ students, loading, hasSearched }: AdmissionResultsTableProps) => {
    return (
        <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="font-bold whitespace-nowrap">Name</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">Reg. No</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">Faculty</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">Department</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">Level</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">Gender</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            </TableRow>
                        ))
                    ) : students.length > 0 ? (
                        students.map((student, idx) => (
                            <TableRow key={student.id || idx} className="hover:bg-muted/5">
                                <TableCell className="font-bold">
                                    <div className="flex flex-col">
                                        <span>{student.firstName} {student.surname}</span>
                                        <span className="text-[10px] text-muted-foreground">{student.otherName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{student.registrationNumber || student.jambNumber || "N/A"}</TableCell>
                                <TableCell className="text-xs">{student.faculty?.name || "N/A"}</TableCell>
                                <TableCell className="text-xs">{student.department?.name || "N/A"}</TableCell>
                                <TableCell className="text-xs">{student.level || "N/A"}</TableCell>
                                <TableCell className="text-xs">{student.gender || "N/A"}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                        <UserX className="h-6 w-6" />
                                    </div>
                                    <p className="font-bold text-lg text-foreground/80">
                                        {hasSearched ? "No matching students found" : "No students loaded"}
                                    </p>
                                    <p className="text-sm max-w-sm mx-auto">
                                        {hasSearched
                                            ? "Try adjusting your filters or search criteria to find who you're looking for."
                                            : "Use the Quick Search or Advanced Filter tabs above to fetch student records."}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default AdmissionResultsTable;
