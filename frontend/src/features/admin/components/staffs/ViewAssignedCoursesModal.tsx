import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import { programmeTypeService } from "../../services/programmeTypeService";
import { staffService } from "../../services/staffService";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ViewAssignedCoursesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: any | null;
}

const ViewAssignedCoursesModal = ({ open, onOpenChange, staff }: ViewAssignedCoursesModalProps) => {
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");

    // Fetch Programme Types
    const { data: programmeTypes = [], isLoading: isLoadingTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
        enabled: open,
    });

    // Fetch Courses when Programme Type is selected
    const {
        data: courses = [],
        isLoading: isLoadingCourses,
        isError,
        error
    } = useQuery({
        queryKey: ["assignedCourses", staff?.id, selectedProgrammeType],
        queryFn: () => staffService.getAssignedCourses(Number(selectedProgrammeType), staff.id),
        enabled: !!selectedProgrammeType && !!staff?.id,
    });

    // Reset selection when modal closes or staff changes
    useEffect(() => {
        if (!open) {
            setSelectedProgrammeType("");
        }
    }, [open, staff]);

    // Select first programme type automatically if available
    useEffect(() => {
        if (programmeTypes.length > 0 && !selectedProgrammeType) {
        }
    }, [programmeTypes]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl duration-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Assigned Courses
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        View courses assigned to {staff?.name || staff?.firstName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Programme Type Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Select Programme Type</Label>
                        <Select
                            value={selectedProgrammeType}
                            onValueChange={setSelectedProgrammeType}
                            disabled={isLoadingTypes}
                        >
                            <SelectTrigger className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-xl text-xs font-bold">
                                <SelectValue placeholder={isLoadingTypes ? "Loading..." : "Choose Programme Type"} />
                            </SelectTrigger>
                            <SelectContent>
                                {programmeTypes.map((type: any) => (
                                    <SelectItem key={type.id} value={type.id.toString()} className="text-xs font-bold">
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Courses Display */}
                    <div className="min-h-[200px] rounded-xl border border-border/50 bg-muted/20 p-4">
                        {!selectedProgrammeType ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10 opacity-60">
                                <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm font-bold text-muted-foreground">Select a programme type to view courses</p>
                            </div>
                        ) : isLoadingCourses ? (
                            <div className="h-full flex items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : isError ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
                                <AlertCircle className="h-10 w-10 text-destructive/50" />
                                <p className="text-sm font-bold text-destructive">Failed to load courses</p>
                                <p className="text-xs text-muted-foreground max-w-[250px]">
                                    {(() => {
                                        const err = error as any;
                                        if (err?.response?.status === 422) {
                                            return "Lecturer does not exist or Programme type does not exist";
                                        }
                                        return err?.response?.data?.message || err?.message || "Please try again later";
                                    })()}
                                </p>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10 opacity-60">
                                <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm font-bold text-muted-foreground">No courses assigned yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {courses.map((course: any, idx: number) => (
                                    <div
                                        key={course.id || idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-foreground/90">
                                                {course.courseCode}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {course.title}
                                            </span>
                                        </div>
                                        {course.alias && (
                                            <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                                                {course.alias}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-xs h-10 px-6">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewAssignedCoursesModal;
