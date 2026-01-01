import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, CalendarDays, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
// Removed AlertDialog imports

import { admissionService } from "../../services/admissionService";
import { Admission } from "../../types/admission";
import AdmissionForm from "../admission/AdmissionForm";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sessionService } from "../../services/sessionService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdmissionList = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();

    // Allow ADMISSION_OFFICER only
    const canManageAdmission = hasRole("ADMISSION_OFFICER");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
    const [enablingSessionId, setEnablingSessionId] = useState<number | null>(null);

    // Filter State
    const [filterMode, setFilterMode] = useState<"PROGRAMME" | "SESSION">("PROGRAMME");
    const [selectedProgrammeTypeId, setSelectedProgrammeTypeId] = useState<string>("");
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");

    // Fetch Programme Types
    const { data: programmeTypes, isLoading: isLoadingProgrammeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    // Fetch Sessions
    const { data: sessions, isLoading: isLoadingSessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    // Auto-select first items
    if (filterMode === "PROGRAMME" && programmeTypes && programmeTypes.length > 0 && !selectedProgrammeTypeId) {
        setSelectedProgrammeTypeId(programmeTypes[0].id.toString());
    }
    if (filterMode === "SESSION" && sessions && sessions.length > 0 && !selectedSessionId) {
        // Sort sessions by name/id desc if needed, but default first is fine
        setSelectedSessionId(sessions[sessions.length - 1].id.toString());
    }

    const { data: allAdmissions, isLoading: isLoadingAdmissions, isError } = useQuery({
        queryKey: ["admissions", filterMode, filterMode === "PROGRAMME" ? selectedProgrammeTypeId : selectedSessionId],
        queryFn: () => {
            if (filterMode === "PROGRAMME") {
                return admissionService.getAdmissions(Number(selectedProgrammeTypeId));
            } else {
                return admissionService.getAdmissionsBySession(Number(selectedSessionId));
            }
        },
        enabled: filterMode === "PROGRAMME" ? !!selectedProgrammeTypeId : !!selectedSessionId,
    });

    // filtering strictly to show ODEL related admissions only
    const admissions = allAdmissions?.filter(adm => {
        const progName = adm.applicationType?.programmeType?.name?.toLowerCase() || "";
        return progName.includes("odel") || progName.includes("distance");
    });

    const isLoading = (filterMode === "PROGRAMME" && isLoadingProgrammeTypes) ||
        (filterMode === "SESSION" && isLoadingSessions) ||
        isLoadingAdmissions;


    const enableSessionMutation = useMutation({
        mutationFn: admissionService.enableAdmission,
        onSuccess: () => {
            toast({ title: "Success", description: "Admission enabled for session successfully" });
            setEnablingSessionId(null);
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to enable admission for session",
            });
            setEnablingSessionId(null);
        },
    });



    const handleEdit = (admission: Admission) => {
        setEditingAdmission(admission);
        setIsCreateOpen(true);
    };

    const handleEnableSession = (sessionId: number) => {
        setEnablingSessionId(sessionId);
        enableSessionMutation.mutate(sessionId);
    };

    const closeForm = () => {
        setIsCreateOpen(false);
        setEditingAdmission(null);
    };

    if (isLoading) {
        return <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="rounded-md border">
                <div className="h-12 border-b bg-muted/50" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
                        <Skeleton className="h-4 w-full" />
                    </div>
                ))}
            </div>
        </div>;
    }

    if (isError) {
        return (
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Admissions</CardTitle>
                    <CardDescription>
                        Failed to load admission data. Please check your connection and try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admissions"] })}>
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Admission Windows</h2>
                    <p className="text-muted-foreground text-sm">
                        Manage active and upcoming admission intakes.
                    </p>
                </div>
                {canManageAdmission && (
                    <div className="flex flex-wrap gap-2">
                        {filterMode === "SESSION" && (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleEnableSession(Number(selectedSessionId))}
                                disabled={enableSessionMutation.isPending || !selectedSessionId}
                            >
                                {enableSessionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Open Admission
                            </Button>
                        )}
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> Create Admission
                        </Button>
                    </div>
                )}
            </div>

            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as any)} className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="PROGRAMME">Programme</TabsTrigger>
                        <TabsTrigger value="SESSION">Session</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="w-full sm:w-[300px]">
                    {filterMode === "PROGRAMME" ? (
                        <Select value={selectedProgrammeTypeId} onValueChange={setSelectedProgrammeTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Programme Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {programmeTypes?.map((pt) => (
                                    <SelectItem key={pt.id} value={pt.id.toString()}>
                                        {pt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                {sessions?.map((session) => (
                                    <SelectItem key={session.id} value={session.id.toString()}>
                                        {session.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    {/* ... Header ... */}
                    <TableHeader>
                        <TableRow>
                            <TableHead>Session</TableHead>
                            <TableHead>Programme Type</TableHead>
                            <TableHead>Application Type</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Status</TableHead>
                            {canManageAdmission && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admissions?.length === 0 ? (

                            <TableRow>
                                <TableCell colSpan={canManageAdmission ? 6 : 5} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <CalendarDays className="h-8 w-8 opacity-20" />
                                        <p>No admissions found for ODEL.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            admissions?.map((admission) => {
                                // ... DATE LOGIC ...
                                const today = new Date();
                                const start = new Date(admission.startDate);
                                const end = new Date(admission.endDate);
                                const isActive = today >= start && today <= end;

                                return (
                                    <TableRow key={admission.id}>
                                        <TableCell className="font-medium">
                                            {admission.session?.name}
                                        </TableCell>
                                        <TableCell>
                                            {admission.applicationType?.programmeType?.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{admission.applicationType?.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Fee: ₦{admission.applicationType?.applicationFee}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="text-muted-foreground">Start: <span className="text-foreground">{format(start, "MMM d, yyyy")}</span></span>
                                                <span className="text-muted-foreground">End: <span className="text-foreground">{format(end, "MMM d, yyyy")}</span></span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isActive ? "default" : "secondary"}>
                                                {isActive ? "Active" : "Closed"}
                                            </Badge>
                                        </TableCell>

                                        {canManageAdmission && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(admission)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* ... Modals ... */}


            <AdmissionForm
                open={isCreateOpen}
                onClose={closeForm}
                initialData={editingAdmission}
            />

            {/* Removed AlertDialog for deletion */}
        </div>
    );
};

export default AdmissionList;
