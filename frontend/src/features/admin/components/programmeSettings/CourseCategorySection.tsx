import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { programmeSettingsService } from "@/features/admin/services/programmeSettingsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MoreHorizontal, ShieldAlert, RefreshCw, FileEdit } from "lucide-react";
import EditCourseModal from "./EditCourseModal";

interface CourseCategorySectionProps {
    title: string;
    courses: any[] | undefined;
    type: "COMPULSORY" | "REQUIRED" | "ELECTIVE";
    programmeTypeId: number;
    onRefresh?: () => void;
}

const CourseCategorySection = ({ title, courses, type, programmeTypeId, onRefresh }: CourseCategorySectionProps) => {
    const { toast } = useToast();
    const { hasRole } = useAuth();
    const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
    const [courseToForceDelete, setCourseToForceDelete] = useState<any | null>(null);
    const [courseToEdit, setCourseToEdit] = useState<any | null>(null);
    const badgeColors: Record<string, string> = {
        COMPULSORY: "bg-rose-500",
        REQUIRED: "bg-blue-500",
        ELECTIVE: "bg-emerald-500",
    };

    const deleteMutation = useMutation({
        mutationFn: (id: number) => programmeSettingsService.deleteCourseFromProgramme(id),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course removed/disabled from programme successfully.",
            });
            setCourseToDelete(null);
            if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let description = "Failed to delete/disable course.";
            if (status === 404) description = "Course configuration not found.";
            else if (status === 400) description = error?.response?.data?.message || "Invalid request.";

            toast({
                variant: "destructive",
                title: "Error",
                description,
            });
        }
    });

    const forceDeleteMutation = useMutation({
        mutationFn: (id: number) => programmeSettingsService.deleteCourseFromProgrammeAdmin(id),
        onSuccess: () => {
            toast({
                title: "Force Delete Success",
                description: "Course PERMANENTLY deleted from programme.",
            });
            setCourseToForceDelete(null);
            if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let description = "Failed to force delete course.";
            if (status === 403) description = "Access Denied. Admin privileges required.";
            else if (status === 404) description = "Course configuration not found.";
            else description = error?.response?.data?.message || "Invalid request.";

            toast({
                variant: "destructive",
                title: "Force Delete Failed",
                description,
            });
        }
    });

    const reEnableMutation = useMutation({
        mutationFn: (id: number) => programmeSettingsService.reEnableCourseForProgramme(id),
        onSuccess: () => {
            toast({
                title: "Course Re-enabled",
                description: "The course is now active and available for registration.",
            });
            if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let description = "Failed to re-enable course.";
            if (status === 404) description = "Course configuration not found.";
            else if (status === 400) description = error?.response?.data?.message || "Course is not disabled.";

            toast({
                variant: "destructive",
                title: "Re-enable Failed",
                description,
            });
        }
    });

    const handleDelete = () => {
        if (courseToDelete) {
            deleteMutation.mutate(courseToDelete.id);
        }
    };

    const handleForceDelete = () => {
        if (courseToForceDelete) {
            forceDeleteMutation.mutate(courseToForceDelete.id);
        }
    };

    return (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/40 border-b border-slate-100/50 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${badgeColors[type]}`} />
                        <CardTitle className="text-lg font-black tracking-tight text-slate-800">{title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="rounded-full font-bold text-[10px] px-2.5 bg-slate-100 text-slate-600">
                        {courses?.length || 0}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                {!courses?.length ? (
                    <div className="p-8 text-center text-muted-foreground italic text-sm font-medium">
                        No courses configured.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-50 bg-slate-50/30">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10 px-6">Code</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10">Title</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10 text-center">Units</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10 text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((c: any) => (
                                    <TableRow key={c.id} className="border-slate-50 group transition-all hover:bg-slate-50/50">
                                        <TableCell className="font-bold py-3.5 px-6">
                                            <span className="text-[#01402c] text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/50">
                                                {c.course.courseCode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-700 text-xs py-3.5 max-w-[200px] truncate">
                                            {c.course.title}
                                        </TableCell>
                                        <TableCell className="text-center py-3.5">
                                            <span className="font-black text-xs text-slate-500">{c.creditUnit}</span>
                                        </TableCell>
                                        <TableCell className="text-right py-3.5 pr-6">
                                            <div className="flex items-center justify-end gap-3">
                                                <div title={c.disabled ? "Disabled" : "Active"} className={`h-1.5 w-1.5 rounded-full ${c.disabled ? 'bg-rose-400' : 'bg-emerald-400'}`} />

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {c.disabled ? (
                                                            <DropdownMenuItem
                                                                onClick={() => reEnableMutation.mutate(c.id)}
                                                                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 font-bold cursor-pointer"
                                                            >
                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                <span>Re-enable Course</span>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => setCourseToDelete(c)}
                                                                className="text-slate-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Remove/Disable</span>
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuItem
                                                            onClick={() => setCourseToEdit(c)}
                                                            className="text-slate-600 focus:text-primary focus:bg-primary/10 cursor-pointer"
                                                        >
                                                            <FileEdit className="mr-2 h-4 w-4" />
                                                            <span>Edit Configuration</span>
                                                        </DropdownMenuItem>

                                                        {hasRole("RESULT_ADMIN") && (
                                                            <DropdownMenuItem
                                                                onClick={() => setCourseToForceDelete(c)}
                                                                className="text-red-600 focus:text-red-700 focus:bg-red-50 font-bold cursor-pointer"
                                                            >
                                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                                <span>Force Delete</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Remove Course
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <span className="font-bold text-foreground">{courseToDelete?.course?.courseCode}</span> from this programme?
                            <br /><br />
                            If the course has existing registration records, it will be <strong>disabled</strong> instead of deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {deleteMutation.isPending ? "Processing..." : "Remove Course"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!courseToForceDelete} onOpenChange={(open) => !open && setCourseToForceDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive font-black">
                            <ShieldAlert className="h-5 w-5" />
                            FORCE DELETE COURSE
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <strong>FORCE DELETE</strong> <span className="font-bold text-foreground">{courseToForceDelete?.course?.courseCode}</span>?
                            <br /><br />
                            <span className="text-red-600 font-bold bg-red-50 p-1 rounded">WARNING:</span> This is an administrative action. It will completely remove the course from this programme configuration even if there are associated records. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={forceDeleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleForceDelete}
                            disabled={forceDeleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-white font-bold"
                        >
                            {forceDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {forceDeleteMutation.isPending ? "DELETING..." : "CONFIRM FORCE DELETE"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditCourseModal
                open={!!courseToEdit}
                onOpenChange={(open) => !open && setCourseToEdit(null)}
                course={courseToEdit}
                programmeTypeId={programmeTypeId}
                availableAliases={courses}
                onSuccess={() => {
                    setCourseToEdit(null);
                    if (onRefresh) onRefresh();
                }}
            />
        </Card>
    );
};

export default CourseCategorySection;
