import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { admissionService } from "../../services/admissionService";
import { sessionService } from "@/features/admin/services/sessionService";
import { departmentService } from "@/features/admin/services/departmentService";
import { programmeTypeService } from "@/features/admin/services/programmeTypeService";
import { staffService } from "@/features/admin/services/staffService";
import { programmeService } from "@/features/admin/services/programmeService";

interface CourseApprovalFiltersProps {
    onFilterChange: (filters: { sessionId: number; semesterId: number; departmentId?: number; programmeTypeId?: number; programmeId?: number; approvalLevel: string } | null) => void;
}

const CourseApprovalFilters = ({ onFilterChange }: CourseApprovalFiltersProps) => {
    const [sessionId, setSessionId] = useState<string>("");
    const [semesterId, setSemesterId] = useState<string>("");
    const [departmentId, setDepartmentId] = useState<string>("");
    const [approvalLevel, setApprovalLevel] = useState<string>("department");

    // Fetch Sessions
    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    // Fetch Semesters (Dependent on Session)
    const { data: semesters = [] } = useQuery({
        queryKey: ["semesters", sessionId],
        queryFn: () => sessionService.getSemestersBySession(Number(sessionId)),
        enabled: !!sessionId,
    });

    // Fetch Departments
    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: departmentService.getAllDepartments,
    });

    const [programmeTypeId, setProgrammeTypeId] = useState<string>("");
    const [programmeId, setProgrammeId] = useState<string>("");

    // Fetch Programme Types
    const { data: programmeTypes = [] } = useQuery({
        queryKey: ["programme-types"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    // Fetch Programmes (Dependent on Type)
    const { data: programmes = [] } = useQuery({
        queryKey: ["programmes", programmeTypeId],
        queryFn: () => programmeService.getAllProgrammes(Number(programmeTypeId)),
        enabled: !!programmeTypeId,
    });

    // Reset dependents
    useEffect(() => {
        setSemesterId("");
    }, [sessionId]);

    useEffect(() => {
        setProgrammeId("");
    }, [programmeTypeId]);

    // Emit changes when all fields are selected
    useEffect(() => {
        if (!sessionId || !semesterId) {
            onFilterChange(null);
            return;
        }

        if (approvalLevel === 'programme') {
            if (programmeTypeId && programmeId) {
                onFilterChange({
                    sessionId: Number(sessionId),
                    semesterId: Number(semesterId),
                    departmentId: 0, // Not used for programme level
                    programmeTypeId: Number(programmeTypeId),
                    programmeId: Number(programmeId),
                    approvalLevel
                });
            } else {
                onFilterChange(null);
            }
        } else {
            if (departmentId) {
                onFilterChange({
                    sessionId: Number(sessionId),
                    semesterId: Number(semesterId),
                    departmentId: Number(departmentId),
                    approvalLevel
                });
            } else {
                onFilterChange(null);
            }
        }
    }, [sessionId, semesterId, departmentId, approvalLevel, programmeTypeId, programmeId, onFilterChange]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card shadow-sm animate-in fade-in slide-in-from-top-2">

            {/* Session */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Session</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Session" />
                    </SelectTrigger>
                    <SelectContent>
                        {sessions.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Semester */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Semester</Label>
                <Select value={semesterId} onValueChange={setSemesterId} disabled={!sessionId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                        {semesters.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Department (Only for Dept/Faculty Levels) */}
            {approvalLevel !== 'programme' && (
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((d: any) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Programme Level Filters */}
            {approvalLevel === 'programme' && (
                <>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Programme Type</Label>
                        <Select value={programmeTypeId} onValueChange={setProgrammeTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {programmeTypes.map((pt: any) => (
                                    <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Programme</Label>
                        <Select value={programmeId} onValueChange={setProgrammeId} disabled={!programmeTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Programme" />
                            </SelectTrigger>
                            <SelectContent>
                                {programmes.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            {/* Approval Level */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Approval Level</Label>
                <Select value={approvalLevel} onValueChange={setApprovalLevel}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="programme">Programme (Submitted)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default CourseApprovalFilters;
