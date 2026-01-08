import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/admin/components/admission/components/ui/table";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";
import { User, ShieldCheck, GraduationCap, X, Layers } from "lucide-react";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { LevelAdviser } from "../../types/staff";

interface LevelAdviserTableProps {
    advisers: LevelAdviser[];
    isLoading: boolean;
    isError: boolean;
    error: any;
    onRemove?: (staffId: string) => void;
}

const LevelAdviserTable = ({
    advisers,
    isLoading,
    isError,
    error,
    onRemove
}: LevelAdviserTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/95 backdrop-blur hover:bg-muted/95 border-b-border/50 sticky top-0 z-20 shadow-sm">
                    <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest px-6 h-14">S/N</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-14">Staff Info</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-14">Department</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-14">Assigned Levels</TableHead>
                    <TableHead className="text-right px-6 h-14">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                            <TableCell className="px-6 py-5"><Skeleton className="h-4 w-8" /></TableCell>
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
                        <TableCell colSpan={5} className="h-48 text-center px-6">
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
                ) : advisers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center px-6">
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                    <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground">No Level Advisers Found</p>
                                    <p className="text-xs text-muted-foreground font-medium">There are no level advisers for this department yet.</p>
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    advisers.map((adviser, idx) => (
                        <TableRow key={adviser.id} className="group hover:bg-primary/5 transition-colors border-b-border/30">
                            <TableCell className="px-6 py-5 font-mono text-[10px] font-bold text-muted-foreground/60">
                                {idx + 1}
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <div className="flex flex-col">
                                    <span className="font-black text-sm text-foreground/90 group-hover:text-primary transition-colors">
                                        {adviser.name}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                                        <User className="h-2.5 w-2.5" />
                                        {adviser.userId}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {adviser.department?.name || "N/A"}
                                </span>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                {adviser.levels && adviser.levels.length > 0 ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {adviser.levels.map((level, i) => (
                                            <Badge key={i} variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold text-[10px]">
                                                {level.name || level.title || level}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase italic flex items-center gap-1">
                                        <Layers className="h-3 w-3" /> No Levels Assigned
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-right px-6 py-5">
                                {onRemove && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                                        onClick={() => onRemove(adviser.userId)}
                                        title="Remove as Level Adviser"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};

export default LevelAdviserTable;
