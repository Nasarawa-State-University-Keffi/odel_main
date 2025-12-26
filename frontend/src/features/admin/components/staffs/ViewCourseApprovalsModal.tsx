import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { staffService } from "../../services/staffService";
import { admissionService } from "../../services/admissionService";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ViewCourseApprovalsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: any | null;
}

const ViewCourseApprovalsModal = ({ open, onOpenChange, staff }: ViewCourseApprovalsModalProps) => {
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("");

    // Fetch Programme Types
    const { data: programmeTypes = [], isLoading: isLoadingTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: staffService.getAllProgrammeTypes,
        enabled: open,
    });

    // Fetch Sessions
    const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions,
        enabled: open,
    });

    // Fetch Semesters when Session is selected
    const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
        queryKey: ["semesters", selectedSession],
        queryFn: () => admissionService.getSemestersBySession(Number(selectedSession)),
        enabled: !!selectedSession,
    });

    // Fetch Courses when all filters are selected
    const {
        data: courses = [],
        isLoading: isLoadingCourses,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ["assignedCoursesApprovals", staff?.userId, selectedProgrammeType, selectedSession, selectedSemester],
        queryFn: () => staffService.getAssignedCoursesWithApprovals(
            Number(selectedProgrammeType),
            Number(selectedSession),
            Number(selectedSemester),
            staff?.userId
        ),
        enabled: !!selectedProgrammeType && !!selectedSession && !!selectedSemester && !!staff?.userId,
        retry: false
    });

    // Reset selection when modal closes or staff changes
    useEffect(() => {
        if (!open) {
            setSelectedProgrammeType("");
            setSelectedSession("");
            setSelectedSemester("");
        }
    }, [open, staff]);

    // Auto-select latest session if available
    useEffect(() => {
        if (sessions.length > 0 && !selectedSession) {
            // sessions[sessions.length - 1] is typically the latest
            // Or whatever logic fits app; usually users want latest
        }
    }, [sessions]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl duration-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Course Approvals
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        View assigned courses approval status for {staff?.name || staff?.firstName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Filters Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Programme Type</Label>
                            <Select value={selectedProgrammeType} onValueChange={setSelectedProgrammeType} disabled={isLoadingTypes}>
                                <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-xs font-bold">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programmeTypes.map((type: any) => (
                                        <SelectItem key={type.id} value={type.id.toString()} className="text-xs font-bold">{type.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Session</Label>
                            <Select value={selectedSession} onValueChange={setSelectedSession} disabled={isLoadingSessions}>
                                <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-xs font-bold">
                                    <SelectValue placeholder="Select Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-bold">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Semester</Label>
                            <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedSession || isLoadingSemesters}>
                                <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-xs font-bold">
                                    <SelectValue placeholder="Select Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {semesters.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-bold">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Courses Display */}
                    <div className="min-h-[250px] rounded-xl border border-border/50 bg-muted/20 p-4 relative">
                        {(!selectedProgrammeType || !selectedSession || !selectedSemester) ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-16 opacity-60">
                                <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm font-bold text-muted-foreground">Select all filters to view courses</p>
                            </div>
                        ) : isLoadingCourses ? (
                            <div className="h-full flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : isError ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-16">
                                <AlertCircle className="h-10 w-10 text-destructive/50" />
                                <p className="text-sm font-bold text-destructive">Failed to load courses</p>
                                <p className="text-xs text-muted-foreground max-w-[300px]">
                                    {(() => {
                                        const err = error as any;
                                        if (err?.response?.status === 422) {
                                            return "Semester not found, Lecturer does not exist, or Programme type does not exist";
                                        }
                                        if (err?.response?.status === 404) {
                                            return "Session not found";
                                        }
                                        return err?.response?.data?.message || err?.message || "Please try again later";
                                    })()}
                                </p>
                                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 h-8 text-xs">Try Again</Button>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-16 opacity-60">
                                <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm font-bold text-muted-foreground">No assigned courses found for this selection</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {courses.map((course: any, idx: number) => (
                                    <div
                                        key={course.id || idx}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-all gap-4 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-foreground">{course.courseCode}</span>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                                                    ID: {course.id}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium line-clamp-1" title={course.title}>
                                                {course.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {course.currentApprovalInformation ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge
                                                        variant={course.currentApprovalInformation.approved ? "default" : "secondary"}
                                                        className={`text-[10px] font-bold px-2 py-0.5 h-6 ${course.currentApprovalInformation.approved ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20" : "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-500/20"}`}
                                                    >
                                                        {course.currentApprovalInformation.approved ? (
                                                            <><CheckCircle className="w-3 h-3 mr-1" /> APPROVED</>
                                                        ) : (
                                                            <><Clock className="w-3 h-3 mr-1" /> PENDING</>
                                                        )}
                                                    </Badge>
                                                    <div className="flex flex-col items-end text-[10px] text-muted-foreground font-medium">
                                                        <span>By: {course.currentApprovalInformation.approvalLevel}</span>
                                                        {course.currentApprovalInformation.approvedAt && (
                                                            <span>{format(new Date(course.currentApprovalInformation.approvedAt), "MMM d, yyyy")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] font-bold">No Info</Badge>
                                            )}
                                        </div>
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

export default ViewCourseApprovalsModal;
