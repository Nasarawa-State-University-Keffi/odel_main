import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/admin/components/admission/components/ui/table";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/features/admin/components/admission/components/ui/card";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";

interface SuspensionTableProps {
    data: any[];
    isLoading: boolean;
    isFetching: boolean;
    onCancelSuspension?: (suspension: any) => void;
}

const SuspensionTable = ({ data, isLoading, isFetching, onCancelSuspension }: SuspensionTableProps) => {
    return (
        <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden w-full max-w-full">
            <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            Suspensions & Extensions
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Registry of Student Suspensions and Program Extensions
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] font-bold">
                        {data?.length || 0} Records
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden relative">
                <div className="rounded-md border-0 relative h-full">
                    {isFetching && (
                        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}

                    <div className="absolute inset-0 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur shadow-sm">
                                <TableRow className="hover:bg-transparent border-b-border/50">
                                    <TableHead className="w-[50px] font-bold text-[10px] uppercase tracking-widest px-4 h-11">S/N</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4 h-11">Student</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4 h-11">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4 h-11">Reason</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4 h-11">Date</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4 h-11 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse border-b-border/50">
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-6" /></TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : !data || data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs font-medium">
                                            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                                                <Calendar className="h-10 w-10 mb-4 opacity-50" />
                                                <p className="text-lg font-medium">No Records Found</p>
                                                <p className="text-sm">No suspensions or extensions found for this selection.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item, idx) => {
                                        // Normalize data for display
                                        const studentName = item.name || item.studentName || (item.firstName ? `${item.firstName} ${item.lastName}` : "Unknown");
                                        const matricNumber = item.matricNumber || item.registrationNumber || item.userId || "No Matric";
                                        const type = item.type || item.studentStatus || "Unknown";
                                        const reason = item.reason || (item.suspend ? item.suspend.reason : null) || (item.information ? item.information.reason : null) || "No reason provided";
                                        const date = item.createdAt || item.creationTime || new Date().toISOString();

                                        // Determine if it looks like a suspension for the badge/action
                                        const isSuspension = type === 'SUSPENSION' || type === 'SUSPENDED';
                                        const isExtension = type === 'EXTENSION' || type === 'DEFERRED'; // Assuming DEFERRED might relate to extensions/deferments

                                        return (
                                            <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors border-b-border/40">
                                                <TableCell className="px-4 py-3 font-mono text-[10px] text-muted-foreground font-bold">{idx + 1}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-foreground/90">{studentName}</span>
                                                        <span className="text-[10px] font-mono text-muted-foreground">{matricNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge
                                                        variant={isSuspension ? 'destructive' : 'default'}
                                                        className="text-[10px] font-bold uppercase tracking-wider scale-90 origin-left"
                                                    >
                                                        {type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <span className="text-xs font-medium text-muted-foreground line-clamp-1 max-w-[200px]" title={reason}>
                                                        {reason}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <span className="text-[10px] font-medium text-muted-foreground">
                                                        {new Date(date).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right">
                                                    {isSuspension && onCancelSuspension && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onCancelSuspension(item)}
                                                            className="h-7 px-2 text-[10px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SuspensionTable;
