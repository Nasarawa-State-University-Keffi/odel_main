import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/features/admin/services/departmentService";
import { admissionService } from "@/features/admin/services/admissionService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Calendar, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ViewSemesterSettingsModalProps } from "@/features/admin/types/department";


const ViewSemesterSettingsModal = ({ isOpen, onClose, departmentId }: ViewSemesterSettingsModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [semester, setSemester] = useState<string>("");

    // Fetch Active Admission for Semester Auto-fill
    const { data: activeAdmission } = useQuery({
        queryKey: ["activeAdmission"],
        queryFn: admissionService.getActiveAdmission,
    });

    useEffect(() => {
        if (activeAdmission?.semester?.id) {
            setSemester(activeAdmission.semester.id.toString());
        }
    }, [activeAdmission]);

    // Query for Settings
    const { data: settings, isLoading, isError, error } = useQuery({
        queryKey: ["semesterSettings", departmentId, semester],
        queryFn: async () => {
            if (!departmentId || !semester) return null;
            return await departmentService.getSemesterSettings(departmentId, parseInt(semester));
        },
        enabled: isOpen && !!departmentId && !!semester,
        retry: false,
    });

    const toggleMutation = useMutation({
        mutationFn: async () => {
            if (!settings || !departmentId || !semester) return;
            return await departmentService.toggleResultUpload(departmentId, parseInt(semester));
        },
        onSuccess: (data) => {
            // Optimistic update or refetch
            queryClient.setQueryData(["semesterSettings", departmentId, semester], (old: any) => ({
                ...old,
                resultUploadEnabled: data.resultUploadEnabled
            }));

            toast({
                title: "Settings Updated",
                description: `Result upload is now ${data.resultUploadEnabled ? "enabled" : "disabled"}.`,
            });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Department or Semester not found."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to toggle result upload."
                });
            }
        }
    });

    const toggleCheckingMutation = useMutation({
        mutationFn: async () => {
            if (!settings || !departmentId || !semester) return;
            return await departmentService.toggleResultChecking(departmentId, parseInt(semester));
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["semesterSettings", departmentId, semester], (old: any) => ({
                ...old,
                resultCheckingEnabled: data.resultCheckingEnabled
            }));

            toast({
                title: "Settings Updated",
                description: `Result checking is now ${data.resultCheckingEnabled ? "enabled" : "disabled"}.`,
            });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Department or Semester not found."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to toggle result checking."
                });
            }
        }
    });

    // Handle Fetch Errors
    // Handle Fetch Errors
    useEffect(() => {
        if (isError && error) {
            const status = (error as any)?.response?.status;
            let msg = "Failed to fetch settings.";
            if (status === 404) msg = "Department or Semester not found.";

            toast({
                variant: "destructive",
                title: "Error fetching settings",
                description: msg
            });
        }
    }, [isError, error, toast]);

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Semester Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Current settings for Department ID: {departmentId}, Semester ID: {semester}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="mb-4">
                        <Label htmlFor="semInput" className="text-xs text-muted-foreground">Viewing for Semester ID</Label>
                        <Input
                            id="semInput"
                            value={semester}
                            readOnly
                            disabled
                            className="bg-slate-50 h-8 text-sm mt-1"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : settings ? (
                        <div className="space-y-4">
                            <Card className="bg-slate-50/50">
                                <CardContent className="p-4 grid gap-4">
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <div className="flex items-center gap-2">
                                            <UploadCloud className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Result Upload Status</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Allow lecturers to upload results
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold ${settings.resultUploadEnabled ? "text-green-600" : "text-slate-500"}`}>
                                                {settings.resultUploadEnabled ? "ON" : "OFF"}
                                            </span>
                                            <Switch
                                                checked={settings.resultUploadEnabled}
                                                onCheckedChange={() => toggleMutation.mutate()}
                                                disabled={toggleMutation.isPending}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-b pb-3">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Result Checking</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold ${settings.resultCheckingEnabled ? "text-green-600" : "text-slate-500"}`}>
                                                {settings.resultCheckingEnabled ? "ON" : "OFF"}
                                            </span>
                                            <Switch
                                                checked={settings.resultCheckingEnabled}
                                                onCheckedChange={() => toggleCheckingMutation.mutate()}
                                                disabled={toggleCheckingMutation.isPending}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Scheduled Closing</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">
                                            {settings.scheduledCloseDate || "Not Scheduled"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                            No settings found or an error occurred.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ViewSemesterSettingsModal;
