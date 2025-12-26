
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Calendar, User } from "lucide-react";
import { Deferment } from "../../types/student";
import { format } from "date-fns";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, XCircle } from "lucide-react";

interface DefermentTableProps {
    deferments: Deferment[];
    isLoading: boolean;
    isFetching: boolean;
    onViewDetails?: (deferment: Deferment) => void;
    onCancelDeferment?: (deferment: Deferment) => void;
}

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { PauseCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DefermentTable = ({ deferments, isLoading, isFetching, onViewDetails, onCancelDeferment }: DefermentTableProps) => {
    return (
        <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden w-full max-w-full">
            <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <PauseCircle className="h-6 w-6 text-primary" />
                            Deferment Registry
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Manage student deferment requests
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 overflow-auto">
                <div className="rounded-md border-0 relative h-full">
                    {isFetching && (
                        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}

                    {isLoading ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/95 backdrop-blur hover:bg-muted/95 border-b-border/50 sticky top-0 z-20 shadow-sm">
                                    <TableHead className="w-[60px] md:w-[80px] font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">#</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14 min-w-[200px]">Student Info</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Matric No.</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14 hidden md:table-cell">Department</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Status</TableHead>
                                    <TableHead className="text-right px-3 md:px-6 h-14">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b-border/50">
                                        <TableCell className="px-6 py-5"><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="px-6 py-5 hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="px-6 py-5"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell className="px-6 py-5"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : !deferments || deferments.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-muted-foreground">
                            <Calendar className="h-10 w-10 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No Deferments Found</p>
                            <p className="text-sm">There are no deferment requests to display.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/95 backdrop-blur hover:bg-muted/95 border-b-border/50 sticky top-0 z-20 shadow-sm">
                                    <TableHead className="w-[60px] md:w-[80px] font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">#</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14 min-w-[200px]">Student Info</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Matric No.</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14 hidden md:table-cell">Department</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-3 md:px-6 h-14">Status</TableHead>
                                    <TableHead className="text-right px-3 md:px-6 h-14">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deferments.map((deferment, index) => (
                                    <TableRow key={deferment.id} className="group hover:bg-muted/50 border-b-border/50">
                                        <TableCell className="px-6 py-4 font-medium text-muted-foreground text-xs">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-sm">
                                                    {deferment.student?.firstName} {deferment.student?.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{deferment.student?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                                            {deferment.student?.registrationNumber || deferment.student?.matricNumber || "N/A"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-xs font-medium hidden md:table-cell">
                                            {deferment.student?.department?.name || deferment.student?.programme?.department?.name || "N/A"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge variant={
                                                deferment.approvalStatus === 'APPROVED' ? 'default' :
                                                    deferment.approvalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                                            } className="text-[10px] font-bold px-2 py-0.5 h-5">
                                                {deferment.approvalStatus || 'PENDING'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
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
                                                    {onCancelDeferment && (
                                                        <DropdownMenuItem
                                                            onClick={() => onCancelDeferment(deferment)}
                                                            className="group flex items-center gap-2 text-[11px] font-bold text-muted-foreground focus:text-destructive focus:bg-destructive/5 cursor-pointer py-2 rounded-lg"
                                                        >
                                                            <div className="h-6 w-6 rounded-md bg-muted group-focus:bg-destructive/20 flex items-center justify-center transition-colors">
                                                                <XCircle className="h-3.5 w-3.5" />
                                                            </div>
                                                            Cancel Deferment
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DefermentTable;
